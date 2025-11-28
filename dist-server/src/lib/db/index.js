"use strict";
/**
 * @fileoverview Database Utilities Exports
 * @module lib/db
 *
 * OVERVIEW:
 * Central export point for database utilities.
 * Provides clean imports: import { connectDB } from '@/lib/db'
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentPortfolio = exports.Investment = exports.Loan = exports.Bank = exports.AIResearchProject = exports.AIModel = exports.Department = exports.Contract = exports.Employee = exports.Company = exports.User = exports.disconnectDB = exports.connectDB = void 0;
var mongoose_1 = require("./mongoose");
Object.defineProperty(exports, "connectDB", { enumerable: true, get: function () { return mongoose_1.connectDB; } });
Object.defineProperty(exports, "disconnectDB", { enumerable: true, get: function () { return mongoose_1.disconnectDB; } });
var User_1 = require("./models/User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(User_1).default; } });
var Company_1 = require("./models/Company");
Object.defineProperty(exports, "Company", { enumerable: true, get: function () { return __importDefault(Company_1).default; } });
var Employee_1 = require("./models/Employee");
Object.defineProperty(exports, "Employee", { enumerable: true, get: function () { return __importDefault(Employee_1).default; } });
var Contract_1 = require("./models/Contract");
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return __importDefault(Contract_1).default; } });
var Department_1 = require("./models/Department");
Object.defineProperty(exports, "Department", { enumerable: true, get: function () { return __importDefault(Department_1).default; } });
var AIModel_1 = require("./models/AIModel");
Object.defineProperty(exports, "AIModel", { enumerable: true, get: function () { return __importDefault(AIModel_1).default; } });
var AIResearchProject_1 = require("./models/AIResearchProject");
Object.defineProperty(exports, "AIResearchProject", { enumerable: true, get: function () { return __importDefault(AIResearchProject_1).default; } });
// Banking system models
var Bank_1 = require("./models/Bank");
Object.defineProperty(exports, "Bank", { enumerable: true, get: function () { return __importDefault(Bank_1).default; } });
var Loan_1 = require("./models/Loan");
Object.defineProperty(exports, "Loan", { enumerable: true, get: function () { return __importDefault(Loan_1).default; } });
var Investment_1 = require("./models/Investment");
Object.defineProperty(exports, "Investment", { enumerable: true, get: function () { return __importDefault(Investment_1).default; } });
var InvestmentPortfolio_1 = require("./models/InvestmentPortfolio");
Object.defineProperty(exports, "InvestmentPortfolio", { enumerable: true, get: function () { return __importDefault(InvestmentPortfolio_1).default; } });
//# sourceMappingURL=index.js.map