import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromHeaders } from '@/lib/auth';

// DELETE /api/notifications/clear-all
// Deletes all activities for the authenticated user
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUserFromHeaders(req.headers);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.activity.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}


