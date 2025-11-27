/**
 * @file app/layout.tsx
 * @description Root layout for Next.js 15 App Router
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Root layout component that wraps all pages in the application.
 * Provides Chakra UI theme, global styles, and application providers.
 */

import type { Metadata } from 'next';
import { Providers } from './providers';
import QuickActionsWrapper from '@/components/ui/QuickActionsWrapper';
import { ToastContainer } from 'react-toastify';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business & Politics Simulation MMO',
  description: 'Build companies, influence politics, and dominate a living multiplayer economy.',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    title: 'Business & Politics Simulation MMO',
    description: 'Build companies, influence politics, and dominate a living multiplayer economy.',
    url: 'https://example.com/',
    siteName: 'Business & Politics',
    images: [
      { url: '/images/og-cover.jpg', width: 1200, height: 630, alt: 'Business & Politics Simulation' },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business & Politics Simulation MMO',
    description: 'Build companies, influence politics, and dominate a living multiplayer economy.',
    images: ['/images/og-cover.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
  },
};

// Fonts must be declared at module scope for Next.js font loader
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jbmono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono', display: 'swap' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jbmono.variable}`}>
        <Providers>
          {children}
          <ToastContainer />
          {/* Global QuickActions overlay on all pages */}
          <QuickActionsWrapper />
        </Providers>
      </body>
    </html>
  );
}
