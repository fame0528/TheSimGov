/**
 * @fileoverview Base URL Utility for Vercel Deployment
 * @module lib/utils/getBaseUrl
 *
 * OVERVIEW:
 * Provides consistent base URL resolution for server-side operations.
 * Handles Vercel deployment URLs automatically.
 *
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

/**
 * Get the base URL for API calls from server components/actions.
 * 
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit production URL)
 * 2. VERCEL_URL (auto-set by Vercel for preview/production)
 * 3. localhost fallback for development
 *
 * @example
 * ```ts
 * // In server action or server component
 * const url = `${getBaseUrl()}/api/some-endpoint`;
 * const response = await fetch(url);
 * ```
 */
export function getBaseUrl(): string {
  // Explicit app URL takes priority (set in Vercel env vars)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel sets VERCEL_URL for deployments (without protocol)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // NEXTAUTH_URL fallback for backwards compatibility
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Get base URL for client-side operations.
 * On client, returns empty string for relative URLs.
 * On server, returns full base URL.
 */
export function getClientBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return ''; // Use relative URLs on client
  }
  return getBaseUrl();
}

export default getBaseUrl;
