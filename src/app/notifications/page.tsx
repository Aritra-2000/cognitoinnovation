"use client";
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { usePusher } from '@/hooks/useSocket';
import { useSession } from '@/hooks/useSession';

// Utility function to validate date strings
const isValidDate = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

interface Activity {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  expiresAt: string;
  createdAt: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export default function NotificationsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { pusher, connected } = usePusher();
  const { user: currentUser } = useSession();

  // Mark notification as read
  const markAsRead = async (activityId: string) => {
    try {
      await fetch(`/api/notifications/${activityId}/read`, {
        method: 'POST',
      });
      
      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, isRead: true, readAt: new Date().toISOString() }
            : activity
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      // Update local state
      setActivities(prev => 
        prev.map(activity => ({
          ...activity, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Load initial activities
  // Update the fetchActivities function in your notifications page
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setActivities(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchActivities();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!pusher || !connected) return;

    const channel = pusher.subscribe('global');
    
    const handleNotification = (data: Activity) => {
      // Only add if not expired
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt > new Date()) {
        setActivities(prev => [data, ...prev]);
      }
    };

    channel.bind('notification', handleNotification);

    return () => {
      channel.unbind('notification', handleNotification);
      pusher.unsubscribe('global');
    };
  }, [pusher, connected]);

  // Filter out expired notifications
  // Replace the current validActivities calculation with this:
  const validActivities = activities.filter(activity => {
    if (!activity.expiresAt) return true; // Keep if no expiration
    
    try {
      const expiresAt = new Date(activity.expiresAt);
      const now = new Date();
      return expiresAt > now;
    } catch (error) {
      console.error('Error processing activity:', activity, error);
      return false; // Skip if there's an error parsing the date
    }
  });

  if (loading) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-4">
          {validActivities.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
          {validActivities.length > 0 && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/notifications/clear-all', {
                    method: 'DELETE',
                  });
                  
                  if (response.ok) {
                    setActivities([]);
                  } else {
                    console.error('Failed to clear notifications');
                  }
                } catch (error) {
                  console.error('Error clearing notifications:', error);
                }
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {validActivities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No notifications yet. Your updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {validActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => !activity.isRead && markAsRead(activity.id)}
              className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activity.isRead 
                  ? 'bg-gray-50 text-gray-500' 
                  : 'bg-white border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${
                        activity.isRead ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {activity.user?.id === currentUser?.sub ? (
                          <span className="text-blue-600">You</span>
                        ) : activity.user?.name ? (
                          <span className="text-blue-600">{activity.user.name}</span>
                        ) : activity.user?.email ? (
                          <span className="text-blue-600">{activity.user.email.split('@')[0]}</span>
                        ) : null}{' '}
                        {activity.message.replace(/^(\w+\s+)?/, '')}
                      </p>
                    </div>
                    {!activity.isRead && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span title={isValidDate(activity.createdAt) ? new Date(activity.createdAt).toLocaleString() : 'Invalid date'}>
                      {isValidDate(activity.createdAt) 
                        ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                        : 'recently'}
                    </span>
                    {activity.expiresAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-xs text-gray-400">
                          Expires {isValidDate(activity.expiresAt) 
                            ? formatDistanceToNow(new Date(activity.expiresAt), { addSuffix: true })
                            : 'soon'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
