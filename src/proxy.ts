/**
 * @fileoverview Next.js 16 Proxy - Route Protection
 * @module proxy
 * 
 * OVERVIEW:
 * Protects all routes except public pages (login, register, homepage).
 * Redirects unauthenticated users to login page.
 * 
 * @created 2025-11-21
 * @updated 2025-11-21 - Migrated from middleware.ts to proxy.ts (Next.js 16)
 * @author ECHO v1.1.0
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Proxy - Authentication gate for protected routes
 * 
 * PUBLIC ROUTES (No auth required):
 * - / (homepage)
 * - /login
 * - /register
 * - /api/auth/* (NextAuth endpoints)
 * 
 * PROTECTED ROUTES (Auth required):
 * - /game/* (all game pages)
 * - /dashboard/* (if exists)
 * - All other routes
 * 
 * BEHAVIOR:
 * - Authenticated users: Allow access to all routes
 * - Unauthenticated users on public routes: Allow access
 * - Unauthenticated users on protected routes: Redirect to /login
 * - Authenticated users on /login or /register: Redirect to /game
 * 
 * @param request - Next.js middleware request
 * @returns Next.js response (allow or redirect)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    '/',
    '/login',
    '/register',
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                        pathname.startsWith('/api/auth');

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/game', req.url));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    // Add callback URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
});

/**
 * Proxy Configuration
 * 
 * Matcher pattern determines which routes run the proxy.
 * 
 * INCLUDED:
 * - All routes except static files
 * - All API routes except /api/auth (handled by NextAuth)
 * 
 * EXCLUDED:
 * - Static files: _next/static, _next/image, favicon.ico
 * - Public assets: images, fonts, etc. in /public
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Next.js 16 Proxy**: Uses auth() proxy helper (replaces middleware)
 * 2. **NextAuth v5**: Compatible with Next.js 16 proxy pattern
 * 3. **Smart Redirects**: Redirects to original page after login via callbackUrl
 * 4. **Performance**: Matcher excludes static assets for efficiency
 * 5. **Security**: Protects all routes by default (whitelist approach)
 * 6. **UX**: Authenticated users can't access login/register pages
 * 
 * ROUTE PROTECTION:
 * - Public: /, /login, /register, /api/auth/*
 * - Protected: Everything else (especially /game/*)
 * 
 * PREVENTS:
 * - Unauthorized access to protected routes
 * - Authenticated users seeing login pages
 * - Infinite redirect loops
 * - Proxy running on static assets
 */
