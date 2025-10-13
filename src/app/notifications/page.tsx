"use client";
import { useEffect, useState } from 'react';
import { usePusher } from '@/hooks/useSocket';

// Utility function to validate date strings
const isValidDate = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

// Simple time ago function
const formatDistanceToNow = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
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

  const markAsRead = async (activityId: string) => {
    try {
      await fetch(`/api/notifications/${activityId}/read`, {
        method: 'POST',
      });
      
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

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
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

  useEffect(() => {
    if (!pusher || !connected) return;

    const channel = pusher.subscribe('global');
    
    const handleNotification = () => {
      // Always refetch from server to include others' updates
      void fetchActivities();
    };

    channel.bind('notification', handleNotification);

    return () => {
      channel.unbind('notification', handleNotification);
      pusher.unsubscribe('global');
    };
  }, [pusher, connected]);

  const validActivities = activities.filter(activity => {
    if (!activity.expiresAt) return true;
    
    try {
      const expiresAt = new Date(activity.expiresAt);
      const now = new Date();
      return expiresAt > now;
    } catch (error) {
      console.error('Error processing activity:', activity, error);
      return false;
    }
  });

  const unreadCount = validActivities.filter(a => !a.isRead).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            {validActivities.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all border-2 border-blue-200 hover:border-blue-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark all read
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notifications/clear-all', {
                        method: 'DELETE',
                      });
                      
                      if (response.ok) {
                        setActivities([]);
                      }
                    } catch (error) {
                      console.error('Error clearing notifications:', error);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all border-2 border-red-200 hover:border-red-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {validActivities.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h3>
            <p className="text-gray-500">Your updates will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => !activity.isRead && markAsRead(activity.id)}
                className={`group relative bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
                  activity.isRead 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-blue-300 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:border-blue-400'
                }`}
              >
                {!activity.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                )}
                
                <div className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md ${
                      activity.isRead 
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      🔔
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className={`font-medium leading-relaxed ${activity.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                          <span className={activity.isRead ? 'text-gray-500' : 'text-gray-700'}>
                            {activity.message}
                          </span>
                        </p>
                        {!activity.isRead && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm flex-shrink-0">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span title={isValidDate(activity.createdAt) ? new Date(activity.createdAt).toLocaleString() : 'Invalid date'}>
                            {isValidDate(activity.createdAt) 
                              ? formatDistanceToNow(new Date(activity.createdAt))
                              : 'recently'}
                          </span>
                        </div>
                        {activity.expiresAt && (
                          <>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                Expires {isValidDate(activity.expiresAt) 
                                  ? formatDistanceToNow(new Date(activity.expiresAt))
                                  : 'soon'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!activity.isRead && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 pointer-events-none transition-all"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}