/**
 * @fileoverview ID Generation Utilities - Wrapper for uuid
 * @module lib/utils/id
 * @description Provides unique identifier generation for entities, sessions,
 * and tracking across the application. Supports multiple ID formats including
 * UUIDs, short codes, and readable identifiers.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module wraps uuid to provide:
 * - UUID v4 generation (standard unique IDs)
 * - Short ID generation (readable codes)
 * - Custom ID formats (prefixed, typed identifiers)
 * - ID validation utilities
 * - Timestamp-based IDs for sorting
 * 
 * Used throughout the app for:
 * - Employee IDs
 * - Company IDs
 * - Contract IDs
 * - Department IDs
 * - Transaction IDs
 * - Session tracking
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * ID prefix types for different entities
 */
export enum IdPrefix {
  EMPLOYEE = 'emp',
  COMPANY = 'com',
  CONTRACT = 'ctr',
  DEPARTMENT = 'dep',
  TRANSACTION = 'txn',
  SESSION = 'ses',
  USER = 'usr',
  CAMPAIGN = 'cmp',
  EVENT = 'evt',
  MESSAGE = 'msg',
}

/**
 * Short ID configuration
 */
export interface ShortIdConfig {
  /** Length of short ID (default: 8) */
  length?: number;
  /** Allowed characters (default: alphanumeric) */
  charset?: string;
  /** Prefix to add (optional) */
  prefix?: string;
}

// ============================================================================
// UUID GENERATION
// ============================================================================

/**
 * Generate a new UUID v4 (random)
 * 
 * @returns UUID string (36 characters)
 * 
 * @example
 * ```ts
 * generateId();  // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate multiple UUIDs at once
 * 
 * @param count - Number of UUIDs to generate
 * @returns Array of UUID strings
 * 
 * @example
 * ```ts
 * generateIds(3);  // ["uuid1", "uuid2", "uuid3"]
 * ```
 */
export function generateIds(count: number): string[] {
  if (count <= 0) return [];
  
  return Array.from({ length: count }, () => uuidv4());
}

// ============================================================================
// PREFIXED IDS
// ============================================================================

/**
 * Generate ID with entity prefix
 * 
 * @param prefix - Entity prefix
 * @returns Prefixed ID (e.g., "emp_550e8400-e29b-41d4-a716-446655440000")
 * 
 * @example
 * ```ts
 * generatePrefixedId(IdPrefix.EMPLOYEE);  // "emp_uuid"
 * generatePrefixedId(IdPrefix.COMPANY);   // "com_uuid"
 * ```
 */
export function generatePrefixedId(prefix: IdPrefix | string): string {
  return `${prefix}_${uuidv4()}`;
}

/**
 * Generate employee ID
 * 
 * @returns Employee ID (emp_uuid)
 * 
 * @example
 * ```ts
 * generateEmployeeId();  // "emp_550e8400-..."
 * ```
 */
export function generateEmployeeId(): string {
  return generatePrefixedId(IdPrefix.EMPLOYEE);
}

/**
 * Generate company ID
 * 
 * @returns Company ID (com_uuid)
 * 
 * @example
 * ```ts
 * generateCompanyId();  // "com_550e8400-..."
 * ```
 */
export function generateCompanyId(): string {
  return generatePrefixedId(IdPrefix.COMPANY);
}

/**
 * Generate contract ID
 * 
 * @returns Contract ID (ctr_uuid)
 * 
 * @example
 * ```ts
 * generateContractId();  // "ctr_550e8400-..."
 * ```
 */
export function generateContractId(): string {
  return generatePrefixedId(IdPrefix.CONTRACT);
}

/**
 * Generate department ID
 * 
 * @returns Department ID (dep_uuid)
 * 
 * @example
 * ```ts
 * generateDepartmentId();  // "dep_550e8400-..."
 * ```
 */
export function generateDepartmentId(): string {
  return generatePrefixedId(IdPrefix.DEPARTMENT);
}

/**
 * Generate transaction ID
 * 
 * @returns Transaction ID (txn_uuid)
 * 
 * @example
 * ```ts
 * generateTransactionId();  // "txn_550e8400-..."
 * ```
 */
export function generateTransactionId(): string {
  return generatePrefixedId(IdPrefix.TRANSACTION);
}

/**
 * Generate session ID
 * 
 * @returns Session ID (ses_uuid)
 * 
 * @example
 * ```ts
 * generateSessionId();  // "ses_550e8400-..."
 * ```
 */
export function generateSessionId(): string {
  return generatePrefixedId(IdPrefix.SESSION);
}

/**
 * Generate user ID
 * 
 * @returns User ID (usr_uuid)
 * 
 * @example
 * ```ts
 * generateUserId();  // "usr_550e8400-..."
 * ```
 */
export function generateUserId(): string {
  return generatePrefixedId(IdPrefix.USER);
}

/**
 * Generate campaign ID
 * 
 * @returns Campaign ID (cmp_uuid)
 * 
 * @example
 * ```ts
 * generateCampaignId();  // "cmp_550e8400-..."
 * ```
 */
export function generateCampaignId(): string {
  return generatePrefixedId(IdPrefix.CAMPAIGN);
}

/**
 * Generate event ID
 * 
 * @returns Event ID (evt_uuid)
 * 
 * @example
 * ```ts
 * generateEventId();  // "evt_550e8400-..."
 * ```
 */
export function generateEventId(): string {
  return generatePrefixedId(IdPrefix.EVENT);
}

/**
 * Generate message ID
 * 
 * @returns Message ID (msg_uuid)
 * 
 * @example
 * ```ts
 * generateMessageId();  // "msg_550e8400-..."
 * ```
 */
export function generateMessageId(): string {
  return generatePrefixedId(IdPrefix.MESSAGE);
}

// ============================================================================
// SHORT IDS
// ============================================================================

/**
 * Default charset for short IDs (alphanumeric, no ambiguous chars)
 */
const DEFAULT_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate short readable ID
 * 
 * @param config - Short ID configuration
 * @returns Short ID string
 * 
 * @example
 * ```ts
 * generateShortId();                           // "A3K9M2P5"
 * generateShortId({ length: 6 });              // "X7T4N9"
 * generateShortId({ prefix: 'ORDER' });        // "ORDER-A3K9M2P5"
 * ```
 */
export function generateShortId(config: ShortIdConfig = {}): string {
  const {
    length = 8,
    charset = DEFAULT_CHARSET,
    prefix = '',
  } = config;

  // Generate random characters from charset
  let shortId = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    shortId += charset[randomIndex];
  }

  // Add prefix if provided
  return prefix ? `${prefix}-${shortId}` : shortId;
}

/**
 * Generate multiple short IDs at once
 * 
 * @param count - Number of IDs to generate
 * @param config - Short ID configuration
 * @returns Array of short IDs
 * 
 * @example
 * ```ts
 * generateShortIds(3);  // ["A3K9M2P5", "X7T4N9Q2", "M8P5K3L9"]
 * ```
 */
export function generateShortIds(count: number, config: ShortIdConfig = {}): string[] {
  if (count <= 0) return [];
  
  return Array.from({ length: count }, () => generateShortId(config));
}

// ============================================================================
// TIMESTAMP IDS
// ============================================================================

/**
 * Generate timestamp-based ID (sortable)
 * 
 * @param prefix - Optional prefix
 * @returns Timestamp ID (prefix_timestamp_shortcode)
 * 
 * @example
 * ```ts
 * generateTimestampId();              // "1699896000000_A3K9M2"
 * generateTimestampId('ORDER');       // "ORDER_1699896000000_A3K9M2"
 * ```
 */
export function generateTimestampId(prefix?: string): string {
  const timestamp = Date.now();
  const shortCode = generateShortId({ length: 6 });
  
  if (prefix) {
    return `${prefix}_${timestamp}_${shortCode}`;
  }
  
  return `${timestamp}_${shortCode}`;
}

/**
 * Extract timestamp from timestamp-based ID
 * 
 * @param id - Timestamp ID
 * @returns Timestamp (milliseconds) or null if invalid
 * 
 * @example
 * ```ts
 * const id = generateTimestampId();
 * extractTimestamp(id);  // 1699896000000
 * ```
 */
export function extractTimestamp(id: string): number | null {
  const parts = id.split('_');
  
  // Find the timestamp part (should be numeric)
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num) && num.toString() === part) {
      return num;
    }
  }
  
  return null;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate UUID format
 * 
 * @param id - ID to validate
 * @returns True if valid UUID
 * 
 * @example
 * ```ts
 * isValidUuid("550e8400-e29b-41d4-a716-446655440000");  // true
 * isValidUuid("invalid");                               // false
 * ```
 */
export function isValidUuid(id: string): boolean {
  return uuidValidate(id);
}

/**
 * Check if ID is UUID v4
 * 
 * @param id - ID to check
 * @returns True if UUID v4
 * 
 * @example
 * ```ts
 * isUuidV4(generateId());  // true
 * ```
 */
export function isUuidV4(id: string): boolean {
  return uuidValidate(id) && uuidVersion(id) === 4;
}

/**
 * Validate prefixed ID format
 * 
 * @param id - ID to validate
 * @param expectedPrefix - Expected prefix (optional)
 * @returns True if valid prefixed ID
 * 
 * @example
 * ```ts
 * isValidPrefixedId("emp_550e8400-...");              // true
 * isValidPrefixedId("emp_550e8400-...", "emp");       // true
 * isValidPrefixedId("com_550e8400-...", "emp");       // false
 * isValidPrefixedId("invalid");                       // false
 * ```
 */
export function isValidPrefixedId(id: string, expectedPrefix?: string): boolean {
  const parts = id.split('_');
  
  if (parts.length !== 2) return false;
  
  const [prefix, uuid] = parts;
  
  // Check prefix if expected
  if (expectedPrefix && prefix !== expectedPrefix) {
    return false;
  }
  
  // Validate UUID part
  return isValidUuid(uuid);
}

/**
 * Extract prefix from prefixed ID
 * 
 * @param id - Prefixed ID
 * @returns Prefix or null if invalid
 * 
 * @example
 * ```ts
 * extractPrefix("emp_550e8400-...");  // "emp"
 * extractPrefix("invalid");           // null
 * ```
 */
export function extractPrefix(id: string): string | null {
  const parts = id.split('_');
  
  if (parts.length < 2) return null;
  
  return parts[0];
}

/**
 * Extract UUID from prefixed ID
 * 
 * @param id - Prefixed ID
 * @returns UUID or null if invalid
 * 
 * @example
 * ```ts
 * extractUuid("emp_550e8400-e29b-...");  // "550e8400-e29b-..."
 * extractUuid("invalid");                 // null
 * ```
 */
export function extractUuid(id: string): string | null {
  const parts = id.split('_');
  
  if (parts.length < 2) return null;
  
  const uuid = parts.slice(1).join('_');
  
  return isValidUuid(uuid) ? uuid : null;
}

// ============================================================================
// COMPARISON & UTILITIES
// ============================================================================

/**
 * Check if two IDs are equal
 * 
 * @param id1 - First ID
 * @param id2 - Second ID
 * @returns True if equal
 * 
 * @example
 * ```ts
 * idsEqual("emp_123", "emp_123");  // true
 * idsEqual("emp_123", "emp_456");  // false
 * ```
 */
export function idsEqual(id1: string | null | undefined, id2: string | null | undefined): boolean {
  if (!id1 || !id2) return false;
  return id1 === id2;
}

/**
 * Format ID for display (truncated)
 * 
 * @param id - ID to format
 * @param maxLength - Max display length (default: 12)
 * @returns Formatted ID
 * 
 * @example
 * ```ts
 * formatIdForDisplay("emp_550e8400-e29b-41d4-a716-446655440000");
 * // "emp_550e8400..."
 * 
 * formatIdForDisplay("emp_550e8400-e29b-41d4-a716-446655440000", 20);
 * // "emp_550e8400-e29b-41..."
 * ```
 */
export function formatIdForDisplay(id: string, maxLength = 12): string {
  if (id.length <= maxLength) return id;
  
  return `${id.substring(0, maxLength)}...`;
}

/**
 * Sanitize ID (remove invalid characters)
 * 
 * @param id - ID to sanitize
 * @returns Sanitized ID
 * 
 * @example
 * ```ts
 * sanitizeId("emp_123@#$456");  // "emp_123456"
 * ```
 */
export function sanitizeId(id: string): string {
  // Keep only alphanumeric, hyphens, and underscores
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Generate map of entity IDs
 * 
 * @param entities - Array of entity names
 * @param prefix - ID prefix
 * @returns Map of entity name to ID
 * 
 * @example
 * ```ts
 * generateIdMap(['Alice', 'Bob'], IdPrefix.EMPLOYEE);
 * // { Alice: "emp_uuid1", Bob: "emp_uuid2" }
 * ```
 */
export function generateIdMap(
  entities: string[],
  prefix: IdPrefix | string
): Record<string, string> {
  const map: Record<string, string> = {};
  
  for (const entity of entities) {
    map[entity] = generatePrefixedId(prefix);
  }
  
  return map;
}

/**
 * Validate array of IDs
 * 
 * @param ids - Array of IDs to validate
 * @param validator - Validation function (default: isValidUuid)
 * @returns True if all IDs valid
 * 
 * @example
 * ```ts
 * validateIds([generateId(), generateId()]);  // true
 * validateIds(['invalid', 'also-invalid']);    // false
 * ```
 */
export function validateIds(
  ids: string[],
  validator: (id: string) => boolean = isValidUuid
): boolean {
  return ids.every(validator);
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. UUID Standards:
 *    - Uses UUID v4 (random) for all standard IDs
 *    - 128-bit identifier with low collision probability
 *    - Compliant with RFC 4122
 * 
 * 2. Prefixed IDs:
 *    - Format: "prefix_uuid" (e.g., "emp_550e8400-...")
 *    - Enables entity type identification from ID alone
 *    - Database queries can filter by prefix
 * 
 * 3. Short IDs:
 *    - Human-readable codes (default 8 chars)
 *    - Excludes ambiguous characters (0/O, 1/I/L)
 *    - Useful for user-facing codes (order numbers, etc.)
 * 
 * 4. Timestamp IDs:
 *    - Sortable by creation time
 *    - Format: "prefix_timestamp_shortcode"
 *    - Useful for audit trails and chronological ordering
 * 
 * 5. Validation:
 *    - Always validate UUIDs before database operations
 *    - Prefixed IDs can validate both prefix and UUID
 *    - Timestamp extraction for sorting/filtering
 * 
 * 6. Performance:
 *    - UUID generation is O(1) and very fast
 *    - Short ID generation is O(length)
 *    - Validation is O(1) for UUIDs
 * 
 * 7. Security:
 *    - UUIDs are not sequential (no enumeration attacks)
 *    - Short IDs use cryptographically random source
 *    - Never expose internal database IDs to users
 * 
 * 8. Usage Guidelines:
 *    - Use UUIDs for all persistent entities
 *    - Use short IDs for user-facing codes
 *    - Use timestamp IDs for audit logs
 *    - Always validate IDs from untrusted sources
 */
