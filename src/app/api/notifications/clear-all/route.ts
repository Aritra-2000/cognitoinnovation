import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE() {
  try {
    // Delete all notifications
    await prisma.activity.deleteMany({});
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
