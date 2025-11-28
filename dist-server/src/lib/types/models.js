"use strict";
/**
 * @fileoverview Domain Model Type Definitions
 * @module lib/types/models
 *
 * OVERVIEW:
 * Core domain models for the game: User, Company, Employee, Contract, Loan, Bank.
 * Complete type definitions for all business entities.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Type Safety**: All models strongly typed with no `any`
 * 2. **Relationships**: ID references for foreign keys
 * 3. **Timestamps**: Date fields for audit trail
 * 4. **Optional Fields**: Proper use of ? for nullable properties
 * 5. **Enums**: References to enum types for consistency
 *
 * PREVENTS:
 * - Type inconsistencies across frontend/backend
 * - Missing required fields in API calls
 * - Runtime errors from wrong data shapes
 */
//# sourceMappingURL=models.js.map