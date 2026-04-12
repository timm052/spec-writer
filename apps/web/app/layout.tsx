import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';
import { AppNav } from '../components/shared/app-nav';
import { Toaster } from '../components/shared';

export const metadata: Metadata = {
  title: 'SpecWriter',
  description: 'Specification authoring tool for architectural practice',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>
          <AppNav />
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
