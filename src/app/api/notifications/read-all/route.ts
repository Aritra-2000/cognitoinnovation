import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // Get the current user ID from the session (you'll need to implement this)
    // For now, we'll use a placeholder
    const userId = 'current-user-id';
    
    // Mark all unread notifications as read
    await prisma.activity.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
