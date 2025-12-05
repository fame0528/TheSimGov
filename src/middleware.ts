/**
 * @fileoverview Next.js Middleware for Auth Protection
 * @module middleware
 * 
 * OVERVIEW:
 * Protects /game/* routes, redirects unauthenticated users to /login.
 * Uses NextAuth v5 auth() for session validation.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Check if accessing protected route
  const isProtectedRoute = pathname.startsWith('/game');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  
  // If not authenticated and trying to access protected route
  if (!req.auth && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If authenticated and trying to access auth routes, redirect to game
  if (req.auth && isAuthRoute) {
    return NextResponse.redirect(new URL('/game', req.url));
  }
  
  return NextResponse.next();
});

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/game/:path*',
    '/login',
    '/register',
  ],
};
