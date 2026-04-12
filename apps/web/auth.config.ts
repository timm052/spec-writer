import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config — no Node.js-only providers (Nodemailer, adapters).
 * Used by middleware which runs in the Edge Runtime.
 * The full config with adapter + Nodemailer provider lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  session: { strategy: 'jwt' },
  providers: [],
} satisfies NextAuthConfig;
