"use client";
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { pusherClient } from '@/lib/pusher';

export function usePusher() {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      return;
    }

    const newPusher = pusherClient;
    
    newPusher.connection.bind('connected', () => {
      setConnected(true);
    });

    newPusher.connection.bind('disconnected', () => {
      setConnected(false);
    });

    setPusher(newPusher);

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/last-seen', { method: 'POST' });
      } catch {}
    };
    void sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60_000);

    const sendBeacon = () => {
      try {
        const blob = new Blob([], { type: 'application/json' });
        navigator.sendBeacon('/api/users/last-seen', blob);
      } catch {}
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendBeacon();
    };
    window.addEventListener('beforeunload', sendBeacon);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      newPusher.disconnect();
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', sendBeacon);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return { pusher, connected };
}

export function useProjectPusher(projectId: string) {
  const { pusher, connected } = usePusher();

  useEffect(() => {
    if (pusher && connected && projectId) {
      pusher.subscribe(`project-${projectId}`);
      const sendHeartbeat = async () => {
        try {
          await fetch('/api/users/last-seen', { method: 'POST', credentials: 'include' });
        } catch {}
      };
      void sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 60_000);
      
      return () => {
        pusher.unsubscribe(`project-${projectId}`);
        clearInterval(interval);
      };
    }
  }, [pusher, connected, projectId]);

  return { pusher, connected };
}
