"use client";
import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by making a request to a protected endpoint
    fetch('/api/projects')
      .then(res => {
        if (res.ok) {
          // User is authenticated, try to get user info from response headers or make another request
          return fetch('/api/auth/me').then(res => res.ok ? res.json() : null);
        }
        return null;
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { user, loading, logout };
}
