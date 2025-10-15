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
      return;
    }

    const normalizedEmail = this.normalizeEmail(userEmail);
    
    try {
      if (process.env.NODE_ENV === 'production' || normalizedEmail.endsWith('@gmail.com')) {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Ticket Dashboard Update',
          content: `<p>${message}</p>`,
          text: message
        });
      }
    } catch {
    }
  }
}

export class HybridNotification implements NotificationStrategy {
  private realTime = new RealTimeNotification();
  private email = new EmailNotification();

  async sendNotification(userId: string, message: string, userEmail?: string): Promise<void> {
    await this.realTime.sendNotification(userId, message);
    
    if (userEmail) {
      try {
        await this.email.sendNotification(userId, message, userEmail);
      } catch {
      }
    }
  }
}

export function getNotificationStrategy(): NotificationStrategy {
  return new HybridNotification();
}
