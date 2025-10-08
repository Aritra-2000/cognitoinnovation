import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { socket_id: socketId, channel_name: channel } = data;

    // For now, we'll use a dummy user ID for authentication
    // In a real app, you would get this from your session
    const userId = 'anonymous-user';

    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: userId,
      user_info: {
        name: 'Anonymous User',
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 403 }
    );
  }
}
