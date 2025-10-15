import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromHeaders } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserFromHeaders(req.headers);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const take = Math.min(Math.max(parseInt(limitParam || '100', 10) || 100, 1), 200);

    const now = new Date();

    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}


