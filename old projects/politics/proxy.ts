/**
 * @file proxy.ts
 * @description Next.js Proxy (replaces Middleware) for protected routes
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Runs before routes and enforces authentication for protected paths.
 * Redirects unauthenticated users to login with a callback to the original URL.
 * Redirects authenticated users away from auth pages to the dashboard.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Proxy function (formerly `middleware`)
 *
 * @param request Incoming Next.js request
 * @returns NextResponse (redirect/next)
 */
export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isAuthenticated = !!token;

  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Protected: everything except public and API routes
  const isProtectedRoute = !isPublicRoute && !pathname.startsWith('/api');

  // Authenticated users shouldn't see auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated users are redirected from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Proxy configuration
 *
 * Define matchers for paths this proxy should run on.
 * Excludes Next internals, static assets, and common image/file types.
 */
export const config = {
  matcher: [
    // Run for all paths except Next internals and static assets/images
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
