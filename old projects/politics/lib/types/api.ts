/**
 * @file lib/types/api.ts
 * @description Shared API type helpers for type-safe operations
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Type utilities for API routes to avoid 'as any' violations.
 * Provides proper type assertions for common patterns.
 */

import { Types } from 'mongoose';
import { Session } from 'next-auth';

/**
 * Type-safe session with user ID
 */
export type AuthSession = Session & {
  user: {
    id: string;
  };
};

/**
 * Type-safe ObjectId with toString method
 */
export type ObjectIdString = Types.ObjectId & {
  toString(): string;
};

/**
 * Type-safe company reference with _id
 */
export type CompanyRef = {
  _id: ObjectIdString;
  [key: string]: unknown;
};

/**
 * Cast ObjectId to string safely
 */
export function objectIdToString(id: Types.ObjectId | unknown): string {
  if (typeof id === 'object' && id !== null && 'toString' in id) {
    return (id as { toString(): string }).toString();
  }
  return String(id);
}

/**
 * Type guard for checking if value is ObjectId-like
 */
export function isObjectIdLike(value: unknown): value is { toString(): string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof (value as { toString: unknown }).toString === 'function'
  );
}
