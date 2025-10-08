"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePusher } from '@/hooks/useSocket';

interface Activity {
  id: string;
  message: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { pusher } = usePusher();

  useEffect(() => {
    // Load recent activities
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setActivities(data.slice(0, 5)); // Show last 5
        setUnreadCount(data.length);
      })
      .catch(() => {});
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!pusher) return;

    const channel = pusher.subscribe('global');
    
    const handleNotification = (data: any) => {
      setActivities(prev => [data, ...prev.slice(0, 4)]);
      setUnreadCount(prev => prev + 1);
    };

    channel.bind('notification', handleNotification);

    return () => {
      channel.unbind('notification', handleNotification);
      pusher.unsubscribe('global');
    };
  }, [pusher]);

  return (
    <div className="relative">
      <Link 
        href="/notifications"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 relative"
      >
        <svg 
          className="w-6 h-6 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828zM4 12h16M4 16h16" 
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
