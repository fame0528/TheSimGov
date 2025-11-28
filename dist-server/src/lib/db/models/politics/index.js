"use strict";
/**
 * @fileoverview Political Models Index
 * @module lib/db/models/politics
 *
 * OVERVIEW:
 * Clean barrel export for all Mongoose political engagement models.
 * Provides centralized access to persistence layer.
 *
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementEvent = exports.EndorsementRecord = exports.ScandalRecord = exports.DebatePerformance = exports.PollingSnapshot = exports.CampaignPhaseState = void 0;
var CampaignPhaseState_1 = require("./CampaignPhaseState");
Object.defineProperty(exports, "CampaignPhaseState", { enumerable: true, get: function () { return __importDefault(CampaignPhaseState_1).default; } });
var PollingSnapshot_1 = require("./PollingSnapshot");
Object.defineProperty(exports, "PollingSnapshot", { enumerable: true, get: function () { return __importDefault(PollingSnapshot_1).default; } });
var DebatePerformance_1 = require("./DebatePerformance");
Object.defineProperty(exports, "DebatePerformance", { enumerable: true, get: function () { return __importDefault(DebatePerformance_1).default; } });
var ScandalRecord_1 = require("./ScandalRecord");
Object.defineProperty(exports, "ScandalRecord", { enumerable: true, get: function () { return __importDefault(ScandalRecord_1).default; } });
var EndorsementRecord_1 = require("./EndorsementRecord");
Object.defineProperty(exports, "EndorsementRecord", { enumerable: true, get: function () { return __importDefault(EndorsementRecord_1).default; } });
var AchievementEvent_1 = require("./AchievementEvent");
Object.defineProperty(exports, "AchievementEvent", { enumerable: true, get: function () { return __importDefault(AchievementEvent_1).default; } });
//# sourceMappingURL=index.js.map