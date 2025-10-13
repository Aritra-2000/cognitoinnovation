import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { triggerProjectUpdate, triggerGlobalUpdate } from '@/lib/pusher';
// getNotificationStrategy is imported for future use
import { getCurrentUserFromHeaders } from '@/lib/auth';
import { notifyTicketUpdate } from '@/lib/notification-service';


export async function GET(req: Request) {
  try {
    const projectId = new URL(req.url).searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    const tickets = await prisma.ticket.findMany({ 
      where: { projectId }, 
      orderBy: { updatedAt: 'desc' },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromHeaders(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, title, description, status } = await req.json();
    
    if (!projectId || !title || !status) {
      return NextResponse.json(
        { error: 'Project ID, title, and status are required' }, 
        { status: 400 }
      );
    }

    // Create the ticket with the initial update
    const ticket = await prisma.ticket.create({
      data: {
        projectId,
        title,
        description: description || '',
        status,
        updatedBy: user.email || 'unknown',
        // Create the initial update
        updates: {
          create: {
            userId: user.id,
            changes: JSON.stringify({
              title: { from: '', to: title },
              status: { from: '', to: status },
              ...(description ? { description: { from: '', to: description } } : {})
            } as Record<string, unknown>)
          }
        }
      },
      include: {
        updates: true
      }
    });

    // Create Activity notifications for ALL users so everyone sees the same feed
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const allRecipients = allUsers.map(u => u.id).filter(Boolean) as string[];
    if (allRecipients.length > 0) {
      const actor = (user as { name?: string; email?: string }).name || (user.email ? user.email.split('@')[0] : 'someone');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.activity.createMany({
        data: allRecipients.map(userId => ({
          userId,
          message: `Ticket created by ${actor}: ${title}`,
          expiresAt,
        }))
      });
    }

    // Trigger real-time and email updates
    await triggerProjectUpdate(projectId, 'ticket:created', {});
    await triggerGlobalUpdate('ticket:created', { projectId });
    await triggerGlobalUpdate('notification', {
      type: 'ticket:created',
      projectId,
      timestamp: new Date().toISOString(),
    });
    // Email offline users
    await notifyTicketUpdate(ticket.id, projectId, user.email || 'unknown', 'created', title);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserFromHeaders(req.headers);
    if (!user || !user.id) {
      console.error('Unauthorized: No user ID found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });

    // Get the current ticket to compare changes
    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { Project: true }  // Changed from 'project' to 'Project'
    });

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Prepare the update data
    const updateData: Record<string, unknown> = { ...updates };
    if (status) {
      updateData.status = status;
      updateData.updates = {
        create: {
          changes: {
            status: status,
            updatedAt: new Date().toISOString()
          },
          user: {
            connect: {
              id: user.id
            }
          }
        }
      };
      
      console.log('Updating ticket with data:', JSON.stringify(updateData, null, 2));
    }

    // Update the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        Project: true,
        updates: {  // Changed from updateHistory to updates
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    // Trigger real-time updates
    if (currentTicket.projectId) {
      await triggerProjectUpdate(currentTicket.projectId, 'ticket:updated', {
        ...updatedTicket,
        // Add any additional data you want to send to the client
        updatedBy: user.email
      });
    }

    // Always send a global notification
    await triggerGlobalUpdate('notification', {
      type: status && status !== currentTicket.status ? 'ticket:status-updated' : 'ticket:updated',
      ticketId: updatedTicket.id,
      ticketTitle: updatedTicket.title,
      oldStatus: currentTicket.status,
      newStatus: status ?? currentTicket.status,
      updatedBy: user.email,
      projectId: currentTicket.projectId,
      timestamp: new Date().toISOString()
    });

    // Create Activity notifications for ALL users so everyone sees the same feed
    const allUsersUpdate = await prisma.user.findMany({ select: { id: true } });
    const recipients = allUsersUpdate.map(u => u.id).filter(Boolean) as string[];
    if (recipients.length > 0) {
      const actor = (user as { name?: string; email?: string }).name || (user.email ? user.email.split('@')[0] : 'someone');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.activity.createMany({
        data: recipients.map(userId => ({
          userId,
          message: status && status !== currentTicket.status
            ? `Ticket status updated by ${actor}: ${updatedTicket.title} → ${status}`
            : `Ticket updated by ${actor}: ${updatedTicket.title}`,
          expiresAt,
        }))
      });
    }

    // Email offline users
    const action = status && status !== currentTicket.status ? 'status_changed' : 'updated';
    await notifyTicketUpdate(updatedTicket.id, currentTicket.projectId!, user.email || 'unknown', action, updatedTicket.title, status);

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}