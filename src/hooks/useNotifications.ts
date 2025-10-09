import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { pusherClient } from '@/lib/pusher';
import { apiGet, apiPost } from '@/lib/api-client';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function useNotifications(projectId: string) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const count = await apiGet<number>(`/api/notifications/unread/count?projectId=${projectId}`);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !session?.user?.email) return;

    // Initial fetch of unread count
    fetchUnreadCount();

    // Initialize Pusher channel for real-time updates
    const channel = pusherClient.subscribe(`project-${projectId}`);

    const handleTicketUpdated = (data: { id?: string; ticketId?: string; updatedBy?: string }) => {
      if (data.updatedBy === session.user?.email) return; // Don't notify self
      
      const notification: Notification = {
        id: Date.now().toString(),
        message: `Ticket #${data.id || data.ticketId || ''} was updated by ${data.updatedBy || 'someone'}`,
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
    };

    // Backend emits 'ticket:updated' for project-specific updates
    channel.bind('ticket:updated', handleTicketUpdated);

    // Cleanup
    return () => {
      channel.unbind('ticket-updated', handleTicketUpdated);
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, session?.user?.email, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiPost(`/api/notifications/read`, { id });
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiPost(`/api/notifications/read-all`, { projectId });
      
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, [projectId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
