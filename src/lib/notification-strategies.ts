import { sendEmail } from './email';
import { triggerGlobalUpdate } from './pusher';

export interface NotificationStrategy {
  sendNotification(userId: string, message: string, userEmail?: string): Promise<void>;
}

export class RealTimeNotification implements NotificationStrategy {
  async sendNotification(userId: string, message: string): Promise<void> {
    triggerGlobalUpdate('notification', { userId, message, timestamp: new Date().toISOString() });
  }
}

export class EmailNotification implements NotificationStrategy {
  private normalizeEmail(email: string): string {
    // If it's a valid email, return as is
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return email;
    }
    // If it's just a username without @, assume it's a Gmail address
    if (!email.includes('@')) {
      return `${email}@gmail.com`;
    }
    return email;
  }

  async sendNotification(userId: string, message: string, userEmail?: string): Promise<void> {
    if (!userEmail) {
      console.warn('No email provided for email notification');
      return;
    }

    const normalizedEmail = this.normalizeEmail(userEmail);
    
    try {
      // Only send emails to Gmail in development, or any email in production
      if (process.env.NODE_ENV === 'production' || normalizedEmail.endsWith('@gmail.com')) {
        console.log(`Sending email to: ${normalizedEmail}`);
        await sendEmail({
          to: normalizedEmail,
          subject: 'Ticket Dashboard Update',
          content: `<p>${message}</p>`,
          text: message
        });
        console.log('Email sent successfully');
      } else {
        console.log(`Skipping email to ${normalizedEmail} - Gmail addresses only in development`);
      }
    } catch (error) {
      console.error('Email notification error:', error);
      // Don't throw the error to prevent breaking the notification flow
    }
  }
}

export class HybridNotification implements NotificationStrategy {
  private realTime = new RealTimeNotification();
  private email = new EmailNotification();

  async sendNotification(userId: string, message: string, userEmail?: string): Promise<void> {
    // Always try real-time first
    await this.realTime.sendNotification(userId, message);
    
    // Also send email for offline users
    if (userEmail) {
      try {
        await this.email.sendNotification(userId, message, userEmail);
      } catch (error) {
        console.error('Email notification failed:', error);
      }
    }
  }
}

export function getNotificationStrategy(): NotificationStrategy {
  return new HybridNotification();
}
