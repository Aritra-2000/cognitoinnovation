import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromHeaders } from '@/lib/auth';

// GET /api/notifications/unread/count
// Returns the number of unread, non-expired activities for the authenticated user.
// Optional: ?projectId=... (ignored for compatibility if Activity lacks projectId in current Prisma client)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUserFromHeaders(req.headers);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read but ignore projectId filter for now to avoid Prisma client incompatibility
    // const { searchParams } = new URL(req.url);
    // const projectId = searchParams.get('projectId') || undefined;

    const now = new Date();
    const count = await prisma.activity.count({
      where: {
        userId: user.id,
        isRead: false,
        expiresAt: { gt: now },
      },
    });

    // Return a plain number to satisfy existing client expectations
    return new NextResponse(JSON.stringify(count), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread notifications count' },
      { status: 500 }
    );
  }
}


