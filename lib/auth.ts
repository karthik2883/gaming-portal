import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { timingSafeEqual, createHash } from 'crypto';

// Simple in-memory rate limiter (per IP, resets on server restart)
const failMap = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS  = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const entry = failMap.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.until) { failMap.delete(ip); return false; }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = failMap.get(ip) ?? { count: 0, until: Date.now() + LOCKOUT_MS };
  entry.count += 1;
  entry.until  = Date.now() + LOCKOUT_MS;
  failMap.set(ip, entry);
}

function clearFailures(ip: string) {
  failMap.delete(ip);
}

/** Timing-safe string comparison to prevent timing attacks */
function safeEqual(a: string, b: string): boolean {
  try {
    // Hash both so they're always the same byte length
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Derive IP from headers (works behind proxies too)
        const forwarded = (req?.headers?.['x-forwarded-for'] as string) ?? '';
        const ip = forwarded.split(',')[0].trim() || 'unknown';

        if (isRateLimited(ip)) {
          throw new Error('TooManyAttempts');
        }

        const adminUsername = process.env.ADMIN_USERNAME ?? '';
        const adminPassword = process.env.ADMIN_PASSWORD ?? '';

        const usernameOk = safeEqual(credentials?.username ?? '', adminUsername);
        const passwordOk = safeEqual(credentials?.password ?? '', adminPassword);

        if (usernameOk && passwordOk) {
          clearFailures(ip);
          return { id: '1', name: 'Admin', role: 'admin' };
        }

        recordFailure(ip);
        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
