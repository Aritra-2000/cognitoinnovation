import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', cookie);
  
  return response;
}
