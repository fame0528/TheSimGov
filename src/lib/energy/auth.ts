/**
 * @fileoverview Energy Domain Authentication & Authorization Utilities
 * @module lib/energy/auth
 * 
 * OVERVIEW:
 * Shared authentication and authorization helpers for energy domain endpoints.
 * Provides DRY utilities for session validation, ownership verification,
 * and role-based access control across all energy action endpoints.
 * 
 * UTILITIES:
 * - verifyOwnership: Validates resource belongs to user's company
 * - requireRole: Checks user has required role for operation
 * - requireOperationalStatus: Validates resource status allows operation
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

import { Session } from 'next-auth';

/**
 * Verify resource ownership matches user's company
 * 
 * @param session - NextAuth session object
 * @param resourceCompanyId - Resource's company ID to verify
 * @returns True if ownership verified
 * 
 * @example
 * const isOwner = verifyOwnership(session, turbine.company.toString());
 * if (!isOwner) throw new Error('Unauthorized');
 */
export function verifyOwnership(
  session: Session | null,
  resourceCompanyId: string
): boolean {
  if (!session?.user?.companyId) {
    return false;
  }
  return session.user.companyId === resourceCompanyId;
}

/**
 * Check if user has required role
 * 
 * @param session - NextAuth session object
 * @param allowedRoles - Array of role names that can perform action
 * @returns True if user has any of the allowed roles
 * 
 * @example
 * if (!requireRole(session, ['OpsEngineer', 'MaintenancePlanner'])) {
 *   throw new Error('Insufficient permissions');
 * }
 */
export function requireRole(
  session: Session | null,
  allowedRoles: string[]
): boolean {
  if (!session?.user) return false;
  const user = session.user as (typeof session.user & { role?: string }) | undefined;
  const role = user?.role;
  if (!role) {
    return false;
  }
  return allowedRoles.includes(role);
}

/**
 * Validate resource status allows operation
 * 
 * @param currentStatus - Current status of resource
 * @param allowedStatuses - Array of statuses that permit operation
 * @param resourceType - Type of resource for error messaging
 * @returns Object with validation result and error message if invalid
 * 
 * @example
 * const check = requireOperationalStatus(
 *   turbine.status,
 *   ['Operational', 'StormShutdown'],
 *   'wind turbine'
 * );
 * if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });
 */
export function requireOperationalStatus(
  currentStatus: string,
  allowedStatuses: string[],
  resourceType: string = 'resource'
): { valid: boolean; error?: string } {
  if (!allowedStatuses.includes(currentStatus)) {
    return {
      valid: false,
      error: `Cannot perform operation on ${resourceType} with status: ${currentStatus}. Allowed: ${allowedStatuses.join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Validate maintenance not overdue before operation
 * 
 * @param maintenanceOverdue - Whether resource has overdue maintenance
 * @param resourceType - Type of resource for error messaging
 * @returns Object with validation result and error message if invalid
 * 
 * @example
 * const check = requireMaintenanceCurrent(well.maintenanceOverdue, 'oil well');
 * if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });
 */
export function requireMaintenanceCurrent(
  maintenanceOverdue: boolean,
  resourceType: string = 'resource'
): { valid: boolean; error?: string } {
  if (maintenanceOverdue) {
    return {
      valid: false,
      error: `${resourceType} requires maintenance before operation can continue`
    };
  }
  return { valid: true };
}
