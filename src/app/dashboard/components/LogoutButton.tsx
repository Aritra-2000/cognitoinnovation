"use client";
import { useAuth } from '@/hooks/useAuth';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="px-3 py-1 rounded border hover:bg-gray-50"
    >
      Logout
    </button>
  );
}
