import { NextResponse } from 'next/server';
import { getCurrentUser as getCurrentUserFromLib } from '@/lib/auth';

export async function getCurrentUser() {
  return await getCurrentUserFromLib();
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}
