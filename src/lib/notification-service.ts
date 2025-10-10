// src/lib/notification-service.ts
import { pusherServer } from './pusher';
import { prisma } from './db';
import { sendEmail } from './email';
import { ProjectWithMembers } from '@/types/project';

// ... (rest of the imports and interfaces)

export async function notifyTicketUpdate(ticketId: string, projectId: string, updaterEmail: string) {
  try {
    // Get all project members with user details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    }) as unknown as ProjectWithMembers | null;

    if (!project) return;

    // Get online users (simplified for now - in a real app, you'd use Pusher presence)
    // Note: For a complete implementation, you'll need to set up presence channels
    const onlineUserIds: string[] = [];

    // Send real-time notifications to online users
    await pusherServer.trigger(`project-${projectId}`, 'ticket-updated', {
      ticketId,
      updatedBy: updaterEmail,
      timestamp: new Date().toISOString()
    });

    // Send emails to offline users
    const offlineMembers = project.members
      .filter(member => 
        member.user?.email && 
        member.user.email !== updaterEmail &&
        !onlineUserIds.includes(member.user.id)
      )
      .map(member => member.user!);

    for (const member of offlineMembers) {
      await sendEmail({
        to: member.email,
        subject: `Ticket Updated: ${ticketId}`,
        content: `
          <div>
            <h2>Ticket Updated</h2>
            <p>A ticket you're following has been updated by ${updaterEmail}.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/dashboard/${projectId}">View in Dashboard</a></p>
          </div>
        `
      });
    }
  } catch (error) {
    console.error('Error in notification service:', error);
  }
}