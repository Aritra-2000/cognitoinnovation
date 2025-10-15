import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || 'YOUR_PUSHER_KEY',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    forceTLS: true,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    enableStats: true,
    enabledTransports: ['ws', 'wss', 'xhr_streaming', 'xhr_polling'],
    wsHost: `ws-${process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'}.pusher.com`,
    wsPort: 80,
    wssPort: 443,
    disableStats: false,
  }
);

export function triggerProjectUpdate<T = unknown>(projectId: string, event: string, data: T) {
  pusherServer.trigger(`project-${projectId}`, event, data);
}

export function triggerGlobalUpdate<T = unknown>(event: string, data: T) {
  pusherServer.trigger('global', event, data);
}
