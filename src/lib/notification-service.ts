// src/lib/notification-service.ts
import { pusherServer } from './pusher';
import { prisma } from './db';
import { sendEmail } from './email';
import { ProjectWithMembers } from '@/types/project';

// Time window to consider a user as "active" (5 minutes)
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export async function notifyTicketUpdate(ticketId: string, projectId: string, updaterEmail: string, action: 'created' | 'updated' | 'status_changed' = 'updated', ticketTitle?: string, newStatus?: string) {
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

    // Consider users active if they updated in the last 5 minutes
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const activeUsers = await prisma.user.findMany({
      where: { updatedAt: { gte: activeSince } },
      select: { id: true }
    });
    const onlineUserIds: string[] = activeUsers.map(u => u.id);

    // Send real-time notifications to online users
    await pusherServer.trigger(`project-${projectId}`, 'ticket:updated', {
      ticketId,
      updatedBy: updaterEmail,
      timestamp: new Date().toISOString()
    });

    // Also broadcast a global notification so all users (regardless of selected project) get the popup
    await pusherServer.trigger('global', 'notification', {
      type: 'ticket:updated',
      projectId,
      ticketId,
      updatedBy: updaterEmail,
      timestamp: new Date().toISOString()
    });

    // Send emails to offline users who have visited before
    const offlineMembers = project.members
      .filter((member: { user?: { id: string; email?: string | null; updatedAt?: Date } | null }) => 
        !!member.user?.email && 
        member.user.email !== updaterEmail &&
        !onlineUserIds.includes(member.user.id) &&
        member.user.updatedAt && // User has visited before (has a last seen timestamp)
        member.user.updatedAt < activeSince // User is offline (last seen > 5 minutes ago)
      )
      .map((member: { user?: { id: string; email: string; name?: string | null } | null }) => member.user!);

    console.log(`📧 Sending emails to ${offlineMembers.length} offline team members for ${action}`);

    for (const member of offlineMembers) {
      const memberName = member.name || member.email.split('@')[0];
      const updaterName = updaterEmail.split('@')[0];
      
      let subject = '';
      let emailContent = '';
      
      switch (action) {
        case 'created':
          subject = `New Ticket Created: ${ticketTitle || ticketId}`;
          emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🎫 New Ticket Created</h1>
              </div>
              <div style="padding: 20px; background: #f8f9fa;">
                <p style="font-size: 16px; color: #333;">Hi ${memberName},</p>
                <p style="font-size: 16px; color: #333;">A new ticket has been created in your project:</p>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #333;">${ticketTitle || 'Untitled Ticket'}</h3>
                  <p style="margin: 0; color: #666;">Created by: <strong>${updaterName}</strong></p>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                     style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View in Dashboard
                  </a>
                </div>
              </div>
            </div>
          `;
          break;
          
        case 'status_changed':
          subject = `Ticket Status Updated: ${ticketTitle || ticketId}`;
          emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🔄 Status Updated</h1>
              </div>
              <div style="padding: 20px; background: #f8f9fa;">
                <p style="font-size: 16px; color: #333;">Hi ${memberName},</p>
                <p style="font-size: 16px; color: #333;">A ticket status has been updated:</p>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #333;">${ticketTitle || 'Untitled Ticket'}</h3>
                  <p style="margin: 0; color: #666;">Status changed to: <strong style="color: #28a745;">${newStatus}</strong></p>
                  <p style="margin: 5px 0 0 0; color: #666;">Updated by: <strong>${updaterName}</strong></p>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                     style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View in Dashboard
                  </a>
                </div>
              </div>
            </div>
          `;
          break;
          
        default: // 'updated'
          subject = `Ticket Updated: ${ticketTitle || ticketId}`;
          emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">✏️ Ticket Updated</h1>
              </div>
              <div style="padding: 20px; background: #f8f9fa;">
                <p style="font-size: 16px; color: #333;">Hi ${memberName},</p>
                <p style="font-size: 16px; color: #333;">A ticket you're following has been updated:</p>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #333;">${ticketTitle || 'Untitled Ticket'}</h3>
                  <p style="margin: 0; color: #666;">Updated by: <strong>${updaterName}</strong></p>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                     style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View in Dashboard
                  </a>
                </div>
              </div>
            </div>
          `;
      }

      await sendEmail({
        to: member.email,
        subject,
        content: emailContent
      });
    }
  } catch (error) {
    console.error('Error in notification service:', error);
  }
}

// Helper function to trigger project-specific updates
export async function triggerProjectUpdate(projectId: string, event: string, data: Record<string, unknown>) {
  try {
    await pusherServer.trigger(`project-${projectId}`, event, data);
  } catch (error) {
    console.error('Error triggering project update:', error);
  }
}

// Helper function to trigger global updates
export async function triggerGlobalUpdate(event: string, data: Record<string, unknown>) {
  try {
    await pusherServer.trigger('global', event, data);
  } catch (error) {
    console.error('Error triggering global update:', error);
  }
}