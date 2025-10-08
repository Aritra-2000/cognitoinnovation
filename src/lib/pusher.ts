import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

// Client-side Pusher instance with enhanced configuration
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || 'YOUR_PUSHER_KEY', // Fallback for development
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2', // Changed default to ap2
    forceTLS: true,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    // Enable logging for debugging
    enableStats: true,
    // Enable WebSocket transport
    enabledTransports: ['ws', 'wss', 'xhr_streaming', 'xhr_polling'],
    // Additional options for better connectivity
    wsHost: `ws-${process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'}.pusher.com`,
    wsPort: 80,
    wssPort: 443,
    disableStats: false,
  }
);

// Log Pusher connection state changes
pusherClient.connection.bind('state_change', (states: any) => {
  console.log('Pusher connection state changed:', states);
});

pusherClient.connection.bind('error', (err: any) => {
  console.error('Pusher connection error:', err);
});

pusherClient.connection.bind('connected', () => {
  console.log('Pusher connected successfully');});

export function triggerProjectUpdate(projectId: string, event: string, data: any) {
  pusherServer.trigger(`project-${projectId}`, event, data);
}

export function triggerGlobalUpdate(event: string, data: any) {
  pusherServer.trigger('global', event, data);
}
