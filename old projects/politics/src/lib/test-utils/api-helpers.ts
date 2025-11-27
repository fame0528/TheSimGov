/**
 * @file src/__tests__/helpers/api-test-utils.ts
 * @description Test utilities for API route testing
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Provides utilities for testing API routes by directly calling route handlers
 * instead of making HTTP requests. This is the proper way to test Next.js API routes.
 * 
 * USAGE:
 * ```typescript
 * import { callRoute } from '@/__tests__/helpers/api-test-utils';
 * import { GET } from '@/app/api/example/route';
 * 
 * const response = await callRoute(GET, { searchParams: { id: '123' } });
 * const data = await response.json();
 * expect(response.status).toBe(200);
 * ```
 */

/**
 * Call an API route handler directly with mocked request parameters
 * 
 * @param handler Route handler function (GET, POST, PUT, DELETE, etc.)
 * @param options Request parameters (searchParams, body, headers)
 * @returns Response from the route handler
 */
export async function callRoute(
  handler: (request: Request, context?: { params: Record<string, string> }) => Promise<Response>,
  options: {
    searchParams?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    method?: string;
  } = {}
): Promise<Response> {
  const {
    searchParams = {},
    body,
    headers = {},
    params = {},
    method = 'GET',
  } = options;

  // Build URL with search params
  const url = new URL('http://localhost:3000/api/test');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Create Request object
  const requestInit: {
    method: string;
    headers: HeadersInit;
    body?: string;
  } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    requestInit.body = JSON.stringify(body);
  }

  const request = new Request(url.toString(), requestInit);
  const context = params ? { params } : undefined;

  return await handler(request, context as never);
}

/**
 * Extract JSON body from Response object
 * 
 * @param response Response object
 * @returns Parsed JSON body
 */
export async function getResponseJSON<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
