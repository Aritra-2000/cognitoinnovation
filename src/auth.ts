import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  providers: [], // Add providers with an empty array for now
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
