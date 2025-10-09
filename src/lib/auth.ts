import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface JWTPayload {
  sub: string;
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, secret) as JWTPayload & { [key: string]: unknown };

    // Normalize shape: ensure `id` is present, fallback to `sub`
    const normalized: JWTPayload = {
      sub: decoded.sub ?? decoded.id,
      id: decoded.id ?? decoded.sub,
      email: decoded.email,
      name: decoded.name,
      isAdmin: decoded.isAdmin,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    return normalized;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    return verifyToken(sessionCookie.value);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function getCurrentUserFromHeaders(headers: Headers): JWTPayload | null {
  try {
    const sessionCookie = headers.get('x-session-cookie');
    
    if (!sessionCookie) {
      return null;
    }
    
    return verifyToken(sessionCookie);
  } catch (error) {
    console.error('Error getting current user from headers:', error);
    return null;
  }
}

export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Re-export authOptions from the NextAuth route handler
import { authOptions } from '../app/api/auth/[...nextauth]/route';
export { authOptions };
