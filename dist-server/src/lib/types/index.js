"use strict";
/**
 * @fileoverview TypeScript Types Exports
 * @module lib/types
 *
 * OVERVIEW:
 * Central export point for all TypeScript type definitions.
 * Provides clean imports: import { ApiResponse, User, Company, IndustryType } from '@/lib/types'
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_CONSTRAINTS = exports.AchievementStatus = exports.TelemetryEventType = exports.AchievementRewardType = exports.TrendDirection = exports.LeaderboardMetricType = exports.AchievementCategory = exports.EndorsementTier = exports.EndorsementSourceCategory = exports.ScandalStatus = exports.ScandalCategory = exports.CampaignPhase = exports.DepartmentName = exports.DepartmentType = exports.SkillCategory = exports.InvestmentType = exports.LoanStatus = exports.ContractStatus = exports.ContractType = exports.LoanType = exports.IndustryType = void 0;
// Enumerations
var enums_1 = require("./enums");
Object.defineProperty(exports, "IndustryType", { enumerable: true, get: function () { return enums_1.IndustryType; } });
Object.defineProperty(exports, "LoanType", { enumerable: true, get: function () { return enums_1.LoanType; } });
Object.defineProperty(exports, "ContractType", { enumerable: true, get: function () { return enums_1.ContractType; } });
Object.defineProperty(exports, "ContractStatus", { enumerable: true, get: function () { return enums_1.ContractStatus; } });
Object.defineProperty(exports, "LoanStatus", { enumerable: true, get: function () { return enums_1.LoanStatus; } });
Object.defineProperty(exports, "InvestmentType", { enumerable: true, get: function () { return enums_1.InvestmentType; } });
var game_1 = require("./game");
Object.defineProperty(exports, "SkillCategory", { enumerable: true, get: function () { return game_1.SkillCategory; } });
var department_1 = require("./department");
Object.defineProperty(exports, "DepartmentType", { enumerable: true, get: function () { return department_1.DepartmentType; } });
Object.defineProperty(exports, "DepartmentName", { enumerable: true, get: function () { return department_1.DepartmentName; } });
var politics_1 = require("./politics");
Object.defineProperty(exports, "CampaignPhase", { enumerable: true, get: function () { return politics_1.CampaignPhase; } });
Object.defineProperty(exports, "ScandalCategory", { enumerable: true, get: function () { return politics_1.ScandalCategory; } });
Object.defineProperty(exports, "ScandalStatus", { enumerable: true, get: function () { return politics_1.ScandalStatus; } });
Object.defineProperty(exports, "EndorsementSourceCategory", { enumerable: true, get: function () { return politics_1.EndorsementSourceCategory; } });
Object.defineProperty(exports, "EndorsementTier", { enumerable: true, get: function () { return politics_1.EndorsementTier; } });
Object.defineProperty(exports, "AchievementCategory", { enumerable: true, get: function () { return politics_1.AchievementCategory; } });
Object.defineProperty(exports, "LeaderboardMetricType", { enumerable: true, get: function () { return politics_1.LeaderboardMetricType; } });
Object.defineProperty(exports, "TrendDirection", { enumerable: true, get: function () { return politics_1.TrendDirection; } });
var politicsPhase7_1 = require("./politicsPhase7");
Object.defineProperty(exports, "AchievementRewardType", { enumerable: true, get: function () { return politicsPhase7_1.AchievementRewardType; } });
Object.defineProperty(exports, "TelemetryEventType", { enumerable: true, get: function () { return politicsPhase7_1.TelemetryEventType; } });
Object.defineProperty(exports, "AchievementStatus", { enumerable: true, get: function () { return politicsPhase7_1.AchievementStatus; } });
var portraits_1 = require("./portraits");
Object.defineProperty(exports, "AVATAR_CONSTRAINTS", { enumerable: true, get: function () { return portraits_1.AVATAR_CONSTRAINTS; } });
//# sourceMappingURL=index.js.map