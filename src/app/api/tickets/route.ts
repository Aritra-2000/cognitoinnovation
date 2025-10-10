import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { triggerProjectUpdate, triggerGlobalUpdate } from '@/lib/pusher';
// getNotificationStrategy is imported for future use
import { getCurrentUserFromHeaders } from '@/lib/auth';


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

    // Create Activity notifications for all project members except the actor
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });
    // Notify all project members, including the actor, so the user sees their own activity
    const recipients = Array.from(new Set([
      ...projectMembers.map(m => m.userId).filter(Boolean),
      user.id,
    ] as string[]));
    if (recipients.length > 0) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.activity.createMany({
        data: recipients.map(userId => ({
          userId,
          // projectId omitted for compatibility with current Prisma client
          message: `Ticket created: ${title}`,
          expiresAt,
        }))
      });
    }

    // Trigger real-time updates
    await triggerProjectUpdate(projectId, 'ticket:created', {});
    await triggerGlobalUpdate('ticket:created', { projectId });
    await triggerGlobalUpdate('notification', {
      type: 'ticket:created',
      projectId,
      timestamp: new Date().toISOString(),
    });

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

    // Send a global notification for the status change
    if (status && status !== currentTicket.status) {
      await triggerGlobalUpdate('notification', {
        type: 'ticket:status-updated',
        ticketId: updatedTicket.id,
        ticketTitle: updatedTicket.title,
        oldStatus: currentTicket.status,
        newStatus: status,
        updatedBy: user.email,
        projectId: currentTicket.projectId,
        timestamp: new Date().toISOString()
      });

      // Create Activity notifications for all project members except the actor
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: currentTicket.projectId },
        select: { userId: true }
      });
      // Notify all project members, including the actor
      const recipients = Array.from(new Set([
        ...projectMembers.map(m => m.userId).filter(Boolean),
        user.id,
      ] as string[]));
      if (recipients.length > 0) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.activity.createMany({
          data: recipients.map(userId => ({
            userId,
            // projectId omitted for compatibility
            message: `Ticket status updated: ${updatedTicket.title} → ${status}`,
            expiresAt,
          }))
        });
      }
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}