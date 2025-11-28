"use strict";
/**
 * @fileoverview Enumeration Type Definitions
 * @module lib/types/enums
 *
 * OVERVIEW:
 * Enumerated types for domain models.
 * Industry types, loan types, contract types, status values.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentType = exports.LoanStatus = exports.ContractStatus = exports.ContractType = exports.LoanType = exports.IndustryType = void 0;
/**
 * Industry types for companies
 */
var IndustryType;
(function (IndustryType) {
    IndustryType["TECH"] = "TECH";
    IndustryType["Technology"] = "Technology";
    IndustryType["FINANCE"] = "FINANCE";
    IndustryType["HEALTHCARE"] = "HEALTHCARE";
    IndustryType["ENERGY"] = "ENERGY";
    IndustryType["MANUFACTURING"] = "MANUFACTURING";
    IndustryType["RETAIL"] = "RETAIL";
})(IndustryType || (exports.IndustryType = IndustryType = {}));
/**
 * Loan types
 */
var LoanType;
(function (LoanType) {
    LoanType["BUSINESS_LOAN"] = "BUSINESS_LOAN";
    LoanType["LINE_OF_CREDIT"] = "LINE_OF_CREDIT";
    LoanType["EQUIPMENT_FINANCING"] = "EQUIPMENT_FINANCING";
    LoanType["VENTURE_CAPITAL"] = "VENTURE_CAPITAL";
})(LoanType || (exports.LoanType = LoanType = {}));
/**
 * Contract types
 */
var ContractType;
(function (ContractType) {
    ContractType["CONSULTING"] = "CONSULTING";
    ContractType["DEVELOPMENT"] = "DEVELOPMENT";
    ContractType["MANUFACTURING"] = "MANUFACTURING";
    ContractType["SERVICES"] = "SERVICES";
    ContractType["RESEARCH"] = "RESEARCH";
})(ContractType || (exports.ContractType = ContractType = {}));
/**
 * Contract status values
 */
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["AVAILABLE"] = "AVAILABLE";
    ContractStatus["BIDDING"] = "BIDDING";
    ContractStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ContractStatus["COMPLETED"] = "COMPLETED";
    ContractStatus["CANCELLED"] = "CANCELLED";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
/**
 * Loan status values
 */
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["PENDING"] = "PENDING";
    LoanStatus["APPROVED"] = "APPROVED";
    LoanStatus["REJECTED"] = "REJECTED";
    LoanStatus["ACTIVE"] = "ACTIVE";
    LoanStatus["PAID_OFF"] = "PAID_OFF";
    LoanStatus["DEFAULTED"] = "DEFAULTED";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
/**
 * Investment types
 */
var InvestmentType;
(function (InvestmentType) {
    InvestmentType["STOCKS"] = "STOCKS";
    InvestmentType["BONDS"] = "BONDS";
    InvestmentType["REAL_ESTATE"] = "REAL_ESTATE";
    InvestmentType["INDEX_FUNDS"] = "INDEX_FUNDS";
})(InvestmentType || (exports.InvestmentType = InvestmentType = {}));
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Type Safety**: Enum ensures only valid values used
 * 2. **String Enums**: Easier debugging and serialization
 * 3. **Consistency**: Single source of truth for status values
 * 4. **Extensibility**: Easy to add new types/statuses
 * 5. **IDE Support**: Autocomplete for all valid values
 *
 * PREVENTS:
 * - Magic strings for status values
 * - Typos in status comparisons
 * - Invalid state transitions
 */
//# sourceMappingURL=enums.js.map