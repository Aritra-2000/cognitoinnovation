import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// In your notifications API route (src/app/api/notifications/route.ts)
// In src/app/api/notifications/route.ts
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({ 
      orderBy: { createdAt: 'desc' }, 
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the data to ensure user information is included in the response
    const activitiesWithUser = activities.map(activity => ({
      ...activity,
      user: activity.user || { email: 'user@example.com' } // Fallback to default user if not found
    }));
    
    return NextResponse.json(activitiesWithUser);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
	const { userId, message } = await request.json();
	if (!userId || !message) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	const activity = await prisma.activity.create({ data: { userId, message } });
	// TODO: emit realtime notification via pusher/socket
	return NextResponse.json(activity, { status: 201 });
}


