/**
 * @fileoverview Root Layout Component
 * @module app/layout
 * 
 * OVERVIEW:
 * Root layout for Next.js app directory.
 * Configures fonts, metadata, and wraps app with providers.
 * Supports HeroUI dark/light theme via className on <html>.
 * 
 * @created 2025-11-20
 * @updated 2025-11-21 - Added HeroUI theme support
 * @author ECHO v1.1.0
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheSimGov - Government Simulation MMO",
  description: "Build your empire and shape the political landscape in the ultimate government simulation",
};

/**
 * RootLayout - Application root layout
 * 
 * Configures:
 * - HTML lang attribute
 * - Custom fonts (Geist Sans, Geist Mono)
 * - Theme support (light/dark via className)
 * - Provider wrapping (Auth, HeroUI, SWR)
 * 
 * @param children - Page content to render
 * @returns Complete HTML document structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Background Image with Dim Overlay */}
        <div 
          className="fixed inset-0 z-0 opacity-50"
          style={{ 
            backgroundImage: 'url(/bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          aria-hidden="true"
        />
        
        {/* Content Layer */}
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Theme Control**: className="light" on <html> controls HeroUI theme
 * 2. **Dark Mode**: Change to className="dark" for dark theme
 * 3. **Future**: Add theme toggle component to switch dynamically
 * 4. **Fonts**: Geist Sans (body), Geist Mono (code) loaded from Google Fonts
 * 5. **Metadata**: Configured for SEO and browser display
 */
