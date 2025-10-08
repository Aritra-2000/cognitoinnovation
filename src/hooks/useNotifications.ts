import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { pusherClient } from '@/lib/pusher';

export function useNotifications(projectId: string) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>>([]);

  useEffect(() => {
    if (!projectId || !session?.user?.email) return;

    // Initialize Pusher channel for real-time updates
    const channel = pusherClient.subscribe(`project-${projectId}`);
    
    // Handle ticket updates
    channel.bind('ticket-updated', (data: { ticketId: string; updatedBy: string }) => {
      if (data.updatedBy === session.user?.email) return; // Don't notify self
      
      const notification = {
        id: Date.now().toString(),
        message: `Ticket #${data.ticketId} was updated by ${data.updatedBy}`,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast(notification.message, {
        position: 'top-right',
        duration: 5000,
      });
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, session?.user?.email]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
