"use strict";
/**
 * @file src/lib/db/models/media/index.ts
 * @description Media industry models index file
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Clean exports for all Media industry models. Provides centralized access
 * to all media-related database schemas and interfaces for consistent
 * importing across the application.
 *
 * EXPORTED MODELS:
 * - Audience: Audience demographics and engagement tracking
 * - MediaContent: Content lifecycle and monetization management
 * - Platform: Distribution platform performance and optimization
 * - AdCampaign: Advertising campaigns with CPC/CPM/CPE bidding
 * - MonetizationSettings: Revenue optimization configuration
 * - InfluencerContract: Influencer marketing contracts
 * - SponsorshipDeal: Brand sponsorship partnerships
 * - ContentPerformance: Content analytics and revenue tracking
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPerformance = exports.SponsorshipDeal = exports.InfluencerContract = exports.MonetizationSettings = exports.AdCampaign = exports.Platform = exports.MediaContent = exports.Audience = void 0;
var Audience_1 = require("./Audience");
Object.defineProperty(exports, "Audience", { enumerable: true, get: function () { return __importDefault(Audience_1).default; } });
var MediaContent_1 = require("./MediaContent");
Object.defineProperty(exports, "MediaContent", { enumerable: true, get: function () { return __importDefault(MediaContent_1).default; } });
var Platform_1 = require("./Platform");
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return __importDefault(Platform_1).default; } });
var AdCampaign_1 = require("./AdCampaign");
Object.defineProperty(exports, "AdCampaign", { enumerable: true, get: function () { return __importDefault(AdCampaign_1).default; } });
var MonetizationSettings_1 = require("./MonetizationSettings");
Object.defineProperty(exports, "MonetizationSettings", { enumerable: true, get: function () { return __importDefault(MonetizationSettings_1).default; } });
var InfluencerContract_1 = require("./InfluencerContract");
Object.defineProperty(exports, "InfluencerContract", { enumerable: true, get: function () { return __importDefault(InfluencerContract_1).default; } });
var SponsorshipDeal_1 = require("./SponsorshipDeal");
Object.defineProperty(exports, "SponsorshipDeal", { enumerable: true, get: function () { return __importDefault(SponsorshipDeal_1).default; } });
var ContentPerformance_1 = require("./ContentPerformance");
Object.defineProperty(exports, "ContentPerformance", { enumerable: true, get: function () { return __importDefault(ContentPerformance_1).default; } });
//# sourceMappingURL=index.js.map