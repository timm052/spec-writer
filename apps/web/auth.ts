import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, users, accounts, sessions, verificationTokens } from '@spec-writer/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? 'localhost',
        port: parseInt(process.env.EMAIL_SERVER_PORT ?? '1025'),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? '',
          pass: process.env.EMAIL_SERVER_PASSWORD ?? '',
        },
      },
      from: process.env.EMAIL_FROM ?? 'noreply@specwriter.local',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'database',
  },
});
