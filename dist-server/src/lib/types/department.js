"use strict";
/**
 * @fileoverview Department Type Definitions
 * @module lib/types/department
 *
 * OVERVIEW:
 * TypeScript types and interfaces for company departments (Finance, HR, Marketing, R&D).
 * Provides type safety for department operations, metrics, and department-specific data.
 *
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentName = exports.DepartmentType = void 0;
/**
 * Department type enum
 */
var DepartmentType;
(function (DepartmentType) {
    DepartmentType["FINANCE"] = "finance";
    DepartmentType["HR"] = "hr";
    DepartmentType["MARKETING"] = "marketing";
    DepartmentType["RD"] = "rd";
})(DepartmentType || (exports.DepartmentType = DepartmentType = {}));
/**
 * Department name enum
 */
var DepartmentName;
(function (DepartmentName) {
    DepartmentName["FINANCE"] = "Finance";
    DepartmentName["HR"] = "HR";
    DepartmentName["MARKETING"] = "Marketing";
    DepartmentName["RD"] = "R&D";
})(DepartmentName || (exports.DepartmentName = DepartmentName = {}));
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Type Safety**: Strict TypeScript types prevent runtime errors
 * 2. **Department-Specific Data**: Segregated into separate interfaces
 * 3. **Union Types**: AnyDepartment allows handling all department types
 * 4. **Input Types**: Separate types for creation vs updates
 * 5. **Nested Objects**: Financial tracking, portfolios, forecasts well-structured
 *
 * USAGE:
 * ```ts
 * import { FinanceDepartment, DepartmentType } from '@/lib/types/department';
 *
 * const finance: FinanceDepartment = {
 *   type: DepartmentType.FINANCE,
 *   name: DepartmentName.FINANCE,
 *   financeData: {
 *     creditScore: 720,
 *     cashReserves: 100000,
 *     // ... other fields
 *   },
 *   // ... base department fields
 * };
 * ```
 */
//# sourceMappingURL=department.js.map