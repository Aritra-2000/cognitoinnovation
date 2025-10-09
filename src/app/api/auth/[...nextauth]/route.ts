import NextAuth, { type NextAuthConfig, type Session, type User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyToken } from '@/lib/auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    isAdmin?: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }
        
const token = typeof credentials.token === 'string' ? credentials.token : '';
        const user = verifyToken(token);
        return user ? { 
          id: user.id || user.sub,  // Use id if it exists, otherwise fall back to sub
          email: user.email, 
          name: user.name, 
          isAdmin: user.isAdmin 
        } : null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub || '',
          isAdmin: token.isAdmin,
          name: token.name || null,
          email: token.email || null
        };
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.isAdmin = user.isAdmin || false;
        token.name = user.name || null;
        token.email = user.email || null;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
