"use client";
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { pusherClient } from '@/lib/pusher';

export function usePusher() {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.warn('Pusher key not configured');
      return;
    }

    const newPusher = pusherClient;
    
    newPusher.connection.bind('connected', () => {
      console.log('Connected to Pusher');
      setConnected(true);
    });

    newPusher.connection.bind('disconnected', () => {
      console.log('Disconnected from Pusher');
      setConnected(false);
    });

    setPusher(newPusher);

    return () => {
      newPusher.disconnect();
    };
  }, []);

  return { pusher, connected };
}

export function useProjectPusher(projectId: string) {
  const { pusher, connected } = usePusher();

  useEffect(() => {
    if (pusher && connected && projectId) {
      pusher.subscribe(`project-${projectId}`);
      
      return () => {
        pusher.unsubscribe(`project-${projectId}`);
      };
    }
  }, [pusher, connected, projectId]);

  return { pusher, connected };
}
