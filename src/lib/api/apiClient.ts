/**
 * @fileoverview Centralized API Client for all HTTP requests
 * @module lib/api/apiClient
 * 
 * OVERVIEW:
 * Single source of truth for API communication. Handles authentication,
 * error handling, and provides type-safe request methods. Prevents 257
 * duplicate fetch wrappers from legacy build.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { ApiError } from './errors';
import type { ApiResponse } from '@/lib/types/api';

/**
 * Configuration options for API requests
 */
interface RequestConfig extends RequestInit {
  /** Skip authentication header injection */
  skipAuth?: boolean;
  /** Custom timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * ApiClient - Centralized HTTP client with authentication and error handling
 * 
 * @example
 * ```typescript
 * const client = new ApiClient();
 * const response = await client.get<User[]>('/api/users');
 * ```
 */
export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = '', timeout: number = 30000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  /**
   * Generic request method with timeout and error handling
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, timeout = this.defaultTimeout, ...init } = config;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };

    // Inject auth token if available and not skipped
    if (!skipAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Setup timeout abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        throw ApiError.fromResponse(response, data);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw ApiError.timeout();
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw ApiError.network(error.message);
      }

      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown errors
      throw ApiError.serverError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * GET request
   * 
   * @example
   * ```typescript
   * const users = await client.get<User[]>('/api/users');
   * const user = await client.get<User>('/api/users/123');
   * ```
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   * 
   * @example
   * ```typescript
   * const newUser = await client.post<User>('/api/users', {
   *   body: JSON.stringify({ name: 'John', email: 'john@example.com' })
   * });
   * ```
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   * 
   * @example
   * ```typescript
   * const updated = await client.patch<User>('/api/users/123', {
   *   body: JSON.stringify({ name: 'Jane' })
   * });
   * ```
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   * 
   * @example
   * ```typescript
   * await client.delete('/api/users/123');
   * ```
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PUT request
   * 
   * @example
   * ```typescript
   * const replaced = await client.put<User>('/api/users/123', {
   *   body: JSON.stringify({ name: 'Jane', email: 'jane@example.com' })
   * });
   * ```
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Singleton Pattern**: Single apiClient instance prevents multiple configurations
 * 2. **Authentication**: Auto-injects Bearer token from localStorage
 * 3. **Timeout Handling**: Default 30s timeout with AbortController
 * 4. **Error Mapping**: Converts HTTP errors to ApiError instances
 * 5. **Type Safety**: Generic types ensure response shape matches usage
 * 
 * PREVENTS:
 * - 257 duplicate fetch wrappers (legacy build)
 * - Inconsistent error handling across components
 * - Auth header duplication
 * - Timeout handling duplication
 * 
 * USAGE:
 * Import singleton: `import { apiClient } from '@/lib/api/apiClient'`
 * All components use same instance with consistent behavior
 */
