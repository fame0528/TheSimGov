"use strict";
/**
 * @file src/lib/db/models/index.ts
 * @description Central export file for all Mongoose models
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Clean exports for all database models used in the application.
 * Provides a single import point for all models.
 *
 * USAGE:
 * import { Company, Employee, Contract, Bank, Loan } from '@/lib/db/models';
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.TelemetryAggregate = exports.TelemetryEvent = exports.AchievementUnlock = exports.DebateStatement = exports.LobbyPayment = exports.Bill = exports.LobbyingAction = exports.PoliticalContribution = exports.User = exports.ContentPerformance = exports.SponsorshipDeal = exports.InfluencerContract = exports.MonetizationSettings = exports.AdCampaign = exports.Platform = exports.MediaContent = exports.Audience = exports.AIModel = exports.HealthcareInsurance = exports.ResearchProject = exports.MedicalDevice = exports.Pharmaceutical = exports.Clinic = exports.Hospital = exports.InvestmentPortfolio = exports.Investment = exports.Loan = exports.Bank = exports.Contract = exports.Employee = exports.Company = void 0;
// Core business models
var Company_1 = require("./Company");
Object.defineProperty(exports, "Company", { enumerable: true, get: function () { return __importDefault(Company_1).default; } });
var Employee_1 = require("./Employee");
Object.defineProperty(exports, "Employee", { enumerable: true, get: function () { return __importDefault(Employee_1).default; } });
var Contract_1 = require("./Contract");
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return __importDefault(Contract_1).default; } });
// Banking system models
var Bank_1 = require("./Bank");
Object.defineProperty(exports, "Bank", { enumerable: true, get: function () { return __importDefault(Bank_1).default; } });
var Loan_1 = require("./Loan");
Object.defineProperty(exports, "Loan", { enumerable: true, get: function () { return __importDefault(Loan_1).default; } });
var Investment_1 = require("./Investment");
Object.defineProperty(exports, "Investment", { enumerable: true, get: function () { return __importDefault(Investment_1).default; } });
var InvestmentPortfolio_1 = require("./InvestmentPortfolio");
Object.defineProperty(exports, "InvestmentPortfolio", { enumerable: true, get: function () { return __importDefault(InvestmentPortfolio_1).default; } });
// Healthcare models
var Hospital_1 = require("./healthcare/Hospital");
Object.defineProperty(exports, "Hospital", { enumerable: true, get: function () { return __importDefault(Hospital_1).default; } });
var Clinic_1 = require("./healthcare/Clinic");
Object.defineProperty(exports, "Clinic", { enumerable: true, get: function () { return __importDefault(Clinic_1).default; } });
var Pharmaceutical_1 = require("./healthcare/Pharmaceutical");
Object.defineProperty(exports, "Pharmaceutical", { enumerable: true, get: function () { return __importDefault(Pharmaceutical_1).default; } });
var MedicalDevice_1 = require("./healthcare/MedicalDevice");
Object.defineProperty(exports, "MedicalDevice", { enumerable: true, get: function () { return __importDefault(MedicalDevice_1).default; } });
var ResearchProject_1 = require("./healthcare/ResearchProject");
Object.defineProperty(exports, "ResearchProject", { enumerable: true, get: function () { return __importDefault(ResearchProject_1).default; } });
var HealthcareInsurance_1 = require("./healthcare/HealthcareInsurance");
Object.defineProperty(exports, "HealthcareInsurance", { enumerable: true, get: function () { return __importDefault(HealthcareInsurance_1).default; } });
// AI Industry models
// export { default as AIIndustry } from './AIIndustry'; // TODO: Create when needed
// export { default as AICompany } from './AICompany'; // TODO: Create when needed
var AIModel_1 = require("./AIModel");
Object.defineProperty(exports, "AIModel", { enumerable: true, get: function () { return __importDefault(AIModel_1).default; } });
// export { default as AIResearch } from './AIResearch'; // TODO: Create when needed
// Media models
var Audience_1 = require("./media/Audience");
Object.defineProperty(exports, "Audience", { enumerable: true, get: function () { return __importDefault(Audience_1).default; } });
var MediaContent_1 = require("./media/MediaContent");
Object.defineProperty(exports, "MediaContent", { enumerable: true, get: function () { return __importDefault(MediaContent_1).default; } });
var Platform_1 = require("./media/Platform");
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return __importDefault(Platform_1).default; } });
var AdCampaign_1 = require("./media/AdCampaign");
Object.defineProperty(exports, "AdCampaign", { enumerable: true, get: function () { return __importDefault(AdCampaign_1).default; } });
var MonetizationSettings_1 = require("./media/MonetizationSettings");
Object.defineProperty(exports, "MonetizationSettings", { enumerable: true, get: function () { return __importDefault(MonetizationSettings_1).default; } });
var InfluencerContract_1 = require("./media/InfluencerContract");
Object.defineProperty(exports, "InfluencerContract", { enumerable: true, get: function () { return __importDefault(InfluencerContract_1).default; } });
var SponsorshipDeal_1 = require("./media/SponsorshipDeal");
Object.defineProperty(exports, "SponsorshipDeal", { enumerable: true, get: function () { return __importDefault(SponsorshipDeal_1).default; } });
var ContentPerformance_1 = require("./media/ContentPerformance");
Object.defineProperty(exports, "ContentPerformance", { enumerable: true, get: function () { return __importDefault(ContentPerformance_1).default; } });
// User and authentication models
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(User_1).default; } });
// export { default as Session } from './Session'; // TODO: Create when needed
// Politics models
var PoliticalContribution_1 = require("./PoliticalContribution");
Object.defineProperty(exports, "PoliticalContribution", { enumerable: true, get: function () { return __importDefault(PoliticalContribution_1).default; } });
var LobbyingAction_1 = require("./LobbyingAction");
Object.defineProperty(exports, "LobbyingAction", { enumerable: true, get: function () { return __importDefault(LobbyingAction_1).default; } });
var Bill_1 = require("./Bill");
Object.defineProperty(exports, "Bill", { enumerable: true, get: function () { return __importDefault(Bill_1).default; } });
var LobbyPayment_1 = require("./LobbyPayment");
Object.defineProperty(exports, "LobbyPayment", { enumerable: true, get: function () { return __importDefault(LobbyPayment_1).default; } });
var DebateStatement_1 = require("./DebateStatement");
Object.defineProperty(exports, "DebateStatement", { enumerable: true, get: function () { return __importDefault(DebateStatement_1).default; } });
var AchievementUnlock_1 = require("./AchievementUnlock");
Object.defineProperty(exports, "AchievementUnlock", { enumerable: true, get: function () { return __importDefault(AchievementUnlock_1).default; } });
var TelemetryEvent_1 = require("./TelemetryEvent");
Object.defineProperty(exports, "TelemetryEvent", { enumerable: true, get: function () { return __importDefault(TelemetryEvent_1).default; } });
var TelemetryAggregate_1 = require("./TelemetryAggregate");
Object.defineProperty(exports, "TelemetryAggregate", { enumerable: true, get: function () { return __importDefault(TelemetryAggregate_1).default; } });
var ChatMessage_1 = require("./ChatMessage");
Object.defineProperty(exports, "ChatMessage", { enumerable: true, get: function () { return __importDefault(ChatMessage_1).default; } });
//# sourceMappingURL=index.js.map