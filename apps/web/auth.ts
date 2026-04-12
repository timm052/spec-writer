import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, users, accounts, sessions, verificationTokens } from '@spec-writer/db';
import { authConfig } from './auth.config';

const isDev = process.env.NODE_ENV === 'development';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    // Dev-only: sign in instantly with any email, no email sent
    ...(isDev
      ? [
          Credentials({
            id: 'dev',
            name: 'Dev Login',
            credentials: { email: { label: 'Email', type: 'email' } },
            async authorize(credentials) {
              const email = credentials?.email as string | undefined;
              if (!email) return null;
              return { id: `dev-${email}`, email, name: email.split('@')[0] };
            },
          }),
        ]
      : []),
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
});
