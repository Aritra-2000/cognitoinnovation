import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { triggerProjectUpdate, triggerGlobalUpdate } from '@/lib/pusher';
import { getNotificationStrategy } from '@/lib/notification-strategies';

export async function GET(req: Request) {
  try {
    const projectId = new URL(req.url).searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    const tickets = await prisma.ticket.findMany({ 
      where: { projectId }, 
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        updatedBy: true,
        updatedAt: true,
        updateHistory: true
      }
    });
    
    // Parse updateHistory for each ticket, handling invalid JSON
    const ticketsWithParsedHistory = tickets.map(ticket => {
      let updateHistory = [];
      if (ticket.updateHistory) {
        try {
          updateHistory = JSON.parse(ticket.updateHistory as string);
          // Ensure updateHistory is an array
          if (!Array.isArray(updateHistory)) {
            updateHistory = [];
          }
        } catch (error) {
          console.warn('Failed to parse updateHistory for ticket:', ticket.id, error);
          updateHistory = [];
        }
      }
      return {
        ...ticket,
        updateHistory
      };
    });
    
    return NextResponse.json(ticketsWithParsedHistory);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, updatedBy, status, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    
    // Get the current ticket to preserve update history
    const currentTicket = await prisma.ticket.findUnique({ 
      where: { id },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        updatedBy: true,
        updatedAt: true,
        updateHistory: true
      }
    });
    
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    // Parse existing update history or initialize empty array
    let updateHistory = [];
    if (currentTicket.updateHistory) {
      try {
        updateHistory = typeof currentTicket.updateHistory === 'string' 
          ? JSON.parse(currentTicket.updateHistory)
          : Array.isArray(currentTicket.updateHistory)
            ? currentTicket.updateHistory
            : [];
      } catch (error) {
        console.error('Error parsing updateHistory:', error);
        updateHistory = [];
      }
    }
    
    // Add current update to history if there's an updatedBy
    if (updatedBy) {
      updateHistory.push({
        email: updatedBy,
        timestamp: new Date().toISOString(),
        status: status || currentTicket.status
      });
    }
    
    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedBy: updatedBy || 'Unknown',
      updatedAt: new Date(),
      updateHistory: JSON.stringify(updateHistory)
    };
    
    if (status) {
      updateData.status = status;
    }
    
    // Update the ticket
    const ticket = await prisma.ticket.update({ 
      where: { id }, 
      data: updateData,
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        updatedBy: true,
        updatedAt: true
      }
    });
    
    // Emit real-time update with the full history
    triggerProjectUpdate(ticket.projectId, 'ticket-updated', {
      ...ticket,
      updateHistory
    });
    
    // Save notification to database and trigger real-time updates
    if (status && updatedBy) {
      try {
        // First, get or create a user
        const user = await prisma.user.upsert({
          where: { email: updatedBy },
          update: {},
          create: {
            email: updatedBy,
            name: updatedBy.split('@')[0], // Simple name from email
          },
        });

        // Save to database with the user's ID
        // Get the user's display name (use name if available, otherwise use email username)
        const displayName = user.name || updatedBy.split('@')[0];
        
        // Create a more descriptive message
        const notificationMessage = `${displayName} moved "${ticket.title}" from ${currentTicket.status} to ${status}`;
        
        const activity = await prisma.activity.create({
          data: {
            userId: user.id,
            message: notificationMessage
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        // Get notification strategy and send
        try {
          const notification = getNotificationStrategy();
          await notification.sendNotification(
            updatedBy,
            notificationMessage,
            updatedBy.includes('@') ? updatedBy : undefined
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }

        // Trigger real-time update
        const notificationData = {
          id: activity.id,
          userId: updatedBy,
          message: notificationMessage,
          isRead: false,
          readAt: null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          createdAt: new Date().toISOString(),
          user: {
            name: user.name,
            email: user.email
          }
        };
        
        await triggerGlobalUpdate('notification', notificationData);
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    }
    return NextResponse.json({...ticket, updateHistory});
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}