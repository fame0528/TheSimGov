"use strict";
/**
 * @fileoverview Game Constants
 * @module lib/utils/constants
 *
 * OVERVIEW:
 * Centralized game configuration and constants.
 * Company levels, industry costs, credit score factors, game parameters.
 * Single source of truth for all game balance values.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI_CONSTANTS = exports.API_LIMITS = exports.GAME_TIME = exports.EMPLOYEE_PARAMETERS = exports.CONTRACT_PARAMETERS = exports.LOAN_PARAMETERS = exports.CREDIT_SCORE_FACTORS = exports.INDUSTRY_COSTS = exports.COMPANY_LEVELS = void 0;
/**
 * Company level progression
 */
exports.COMPANY_LEVELS = {
    STARTUP: { level: 1, name: 'Startup', minRevenue: 0, maxEmployees: 5 },
    SMALL: { level: 2, name: 'Small Business', minRevenue: 100000, maxEmployees: 20 },
    MEDIUM: { level: 3, name: 'Medium Enterprise', minRevenue: 500000, maxEmployees: 100 },
    LARGE: { level: 4, name: 'Large Corporation', minRevenue: 5000000, maxEmployees: 500 },
    MEGA: { level: 5, name: 'Mega Corporation', minRevenue: 50000000, maxEmployees: -1 },
};
/**
 * Industry types and base costs
 */
exports.INDUSTRY_COSTS = {
    TECH: {
        name: 'Technology',
        startupCost: 50000,
        avgEmployeeSalary: 80000,
        profitMargin: 0.3,
    },
    FINANCE: {
        name: 'Finance',
        startupCost: 100000,
        avgEmployeeSalary: 90000,
        profitMargin: 0.25,
    },
    HEALTHCARE: {
        name: 'Healthcare',
        startupCost: 200000,
        avgEmployeeSalary: 70000,
        profitMargin: 0.2,
    },
    ENERGY: {
        name: 'Energy',
        startupCost: 500000,
        avgEmployeeSalary: 85000,
        profitMargin: 0.15,
    },
    MANUFACTURING: {
        name: 'Manufacturing',
        startupCost: 300000,
        avgEmployeeSalary: 60000,
        profitMargin: 0.18,
    },
    RETAIL: {
        name: 'Retail',
        startupCost: 75000,
        avgEmployeeSalary: 45000,
        profitMargin: 0.12,
    },
};
/**
 * Credit score calculation factors
 */
exports.CREDIT_SCORE_FACTORS = {
    MIN_SCORE: 300,
    MAX_SCORE: 850,
    PAYMENT_HISTORY_WEIGHT: 0.35,
    DEBT_RATIO_WEIGHT: 0.30,
    CREDIT_AGE_WEIGHT: 0.15,
    CREDIT_MIX_WEIGHT: 0.10,
    NEW_CREDIT_WEIGHT: 0.10,
};
/**
 * Loan parameters
 */
exports.LOAN_PARAMETERS = {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 10000000,
    MIN_TERM_MONTHS: 1,
    MAX_TERM_MONTHS: 360,
    BASE_INTEREST_RATE: 0.05,
    INTEREST_RATE_RANGE: { min: 0.03, max: 0.25 },
};
/**
 * Contract parameters
 */
exports.CONTRACT_PARAMETERS = {
    MIN_VALUE: 1000,
    MAX_VALUE: 5000000,
    MIN_DURATION_DAYS: 1,
    MAX_DURATION_DAYS: 365,
    COMPLETION_BONUS_PERCENT: 0.1,
    LATE_PENALTY_PERCENT: 0.15,
    UPFRONT_COST_PERCENT: 0.10, // 10% upfront to bid
    MARKETPLACE_EXPIRY_DAYS: 7, // Contracts refresh weekly
    /**
     * Contract Difficulty Tiers
     * Scales with company level for balanced progression
     */
    TIERS: {
        TIER_1: {
            difficulty: 1,
            companyLevel: [1, 2],
            valueRange: { min: 1000, max: 10000 },
            durationRange: { min: 1, max: 7 },
            skillRange: { min: 30, max: 50 },
            employeeCount: { min: 1, max: 2 },
            marketplaceCount: 15,
            label: 'Entry-Level',
        },
        TIER_2: {
            difficulty: 2,
            companyLevel: [2, 3],
            valueRange: { min: 10000, max: 50000 },
            durationRange: { min: 7, max: 30 },
            skillRange: { min: 40, max: 60 },
            employeeCount: { min: 2, max: 4 },
            marketplaceCount: 12,
            label: 'Intermediate',
        },
        TIER_3: {
            difficulty: 3,
            companyLevel: [3, 4],
            valueRange: { min: 50000, max: 250000 },
            durationRange: { min: 30, max: 90 },
            skillRange: { min: 50, max: 70 },
            employeeCount: { min: 3, max: 6 },
            marketplaceCount: 10,
            label: 'Advanced',
        },
        TIER_4: {
            difficulty: 4,
            companyLevel: [4, 5],
            valueRange: { min: 250000, max: 1000000 },
            durationRange: { min: 90, max: 180 },
            skillRange: { min: 60, max: 80 },
            employeeCount: { min: 4, max: 8 },
            marketplaceCount: 7,
            label: 'Expert',
        },
        TIER_5: {
            difficulty: 5,
            companyLevel: [5],
            valueRange: { min: 1000000, max: 5000000 },
            durationRange: { min: 180, max: 365 },
            skillRange: { min: 70, max: 90 },
            employeeCount: { min: 6, max: 12 },
            marketplaceCount: 5,
            label: 'Elite',
        },
    },
    /**
     * Success Score Thresholds
     * Determines payment adjustments
     */
    SUCCESS_THRESHOLDS: {
        EXCELLENT: { min: 90, bonus: 0.10, label: 'Excellent' },
        GOOD: { min: 75, bonus: 0.00, label: 'Good' },
        FAIR: { min: 60, bonus: -0.05, label: 'Fair' },
        POOR: { min: 0, bonus: -0.15, label: 'Poor' },
    },
    /**
     * Contract Project Types by Industry
     */
    PROJECT_TYPES: {
        technology: [
            'Web Platform Development',
            'Mobile App Development',
            'AI/ML Integration',
            'Cloud Migration',
            'Cybersecurity Audit',
            'Database Optimization',
        ],
        finance: [
            'Financial System Integration',
            'Risk Assessment Platform',
            'Trading Algorithm Development',
            'Compliance Reporting System',
            'Payment Gateway Integration',
        ],
        healthcare: [
            'Patient Management System',
            'Telemedicine Platform',
            'Medical Records Migration',
            'Healthcare Analytics Dashboard',
            'Appointment Scheduling System',
        ],
        energy: [
            'Smart Grid Implementation',
            'Energy Monitoring System',
            'Renewable Integration Platform',
            'Facility Optimization',
            'Environmental Compliance System',
        ],
        manufacturing: [
            'Production Line Automation',
            'Inventory Management System',
            'Quality Control Platform',
            'Supply Chain Optimization',
            'Predictive Maintenance System',
        ],
        retail: [
            'E-Commerce Platform',
            'Point of Sale System',
            'Customer Loyalty Program',
            'Inventory Tracking System',
            'Marketing Automation Platform',
        ],
    },
};
/**
 * Employee parameters
 */
exports.EMPLOYEE_PARAMETERS = {
    // Salary
    MIN_SALARY: 30000,
    MAX_SALARY: 500000,
    // Training
    TRAINING_COST_PER_HOUR: 100,
    TRAINING_DURATION_HOURS: 40,
    TRAINING_MIN_IMPROVEMENT: 10,
    TRAINING_MAX_IMPROVEMENT: 20,
    // Productivity
    PRODUCTIVITY_BASE: 1.0,
    PRODUCTIVITY_PER_SKILL: 0.1,
    PRODUCTIVITY_MIN: 0.5,
    PRODUCTIVITY_MAX: 2.0,
    // Skills
    SKILL_MIN: 1,
    SKILL_MAX: 100,
    SKILL_DEFAULT: 50,
    SKILL_DECAY_PER_WEEK: 0.01, // 1% decay if not used
    /**
     * 12 Skill Categories
     * Complete employee specialization system
     */
    SKILL_CATEGORIES: [
        'technical', // Coding, engineering, technical execution
        'leadership', // Team management, decision making
        'industry', // Industry-specific knowledge
        'sales', // Revenue generation, client relations
        'marketing', // Brand, campaigns, market analysis
        'finance', // Accounting, budgeting, financial planning
        'operations', // Process optimization, logistics
        'hr', // Recruiting, culture, employee relations
        'legal', // Compliance, contracts, risk
        'rd', // Research, innovation, product development
        'quality', // QA, testing, standards compliance
        'customer', // Support, satisfaction, retention
    ],
    /**
     * Morale System
     * Weighted factors for morale calculation (1-100 scale)
     */
    MORALE: {
        DEFAULT: 70,
        MIN: 1,
        MAX: 100,
        // Weights (total = 1.0)
        SALARY_WEIGHT: 0.4, // 40% - Pay fairness vs market
        WORKLOAD_WEIGHT: 0.3, // 30% - Work/life balance
        COMPANY_PERF_WEIGHT: 0.2, // 20% - Company success
        ENVIRONMENT_WEIGHT: 0.1, // 10% - Culture, office, perks
        // Adjustment triggers
        TRAINING_BOOST: 5, // +5 morale on training completion
        REVIEW_EXCELLENT: 15, // +15 morale for score >= 90
        REVIEW_GOOD: 10, // +10 morale for score >= 75
        REVIEW_FAIR: 5, // +5 morale for score >= 60
        REVIEW_POOR: -10, // -10 morale for score < 50
        RAISE_LARGE: 15, // +15 morale for >= 10% raise
        RAISE_MEDIUM: 10, // +10 morale for >= 5% raise
        RAISE_SMALL: 5, // +5 morale for any raise
        CUT_SMALL: -10, // -10 morale for <= 5% cut
        CUT_LARGE: -20, // -20 morale for > 5% cut
    },
    /**
     * Salary Ranges by Skill Tier
     * Market value calculations for hiring/negotiation
     */
    SALARY_RANGES: {
        JUNIOR: {
            skillMin: 1,
            skillMax: 40,
            salaryMin: 30000,
            salaryMax: 60000,
            label: 'Junior',
        },
        MID: {
            skillMin: 40,
            skillMax: 60,
            salaryMin: 50000,
            salaryMax: 90000,
            label: 'Mid-Level',
        },
        SENIOR: {
            skillMin: 60,
            skillMax: 80,
            salaryMin: 80000,
            salaryMax: 150000,
            label: 'Senior',
        },
        EXPERT: {
            skillMin: 80,
            skillMax: 95,
            salaryMin: 120000,
            salaryMax: 250000,
            label: 'Expert',
        },
        ELITE: {
            skillMin: 95,
            skillMax: 100,
            salaryMin: 200000,
            salaryMax: 500000,
            label: 'Elite',
        },
    },
    /**
     * Retention Risk Thresholds
     * Morale → Quit probability per week
     */
    RETENTION: {
        CRITICAL: {
            moraleMax: 30,
            quitChancePerWeek: 0.80, // 80% quit chance
            label: 'Critical',
            color: 'red.500',
        },
        HIGH: {
            moraleMax: 50,
            quitChancePerWeek: 0.30, // 30% quit chance
            label: 'High',
            color: 'orange.500',
        },
        MODERATE: {
            moraleMax: 70,
            quitChancePerWeek: 0.05, // 5% quit chance
            label: 'Moderate',
            color: 'yellow.500',
        },
        LOW: {
            moraleMax: 85,
            quitChancePerWeek: 0.01, // 1% quit chance
            label: 'Low',
            color: 'green.500',
        },
        MINIMAL: {
            moraleMax: 100,
            quitChancePerWeek: 0.001, // 0.1% quit chance
            label: 'Minimal',
            color: 'blue.500',
        },
    },
    /**
     * Candidate Quality by Company Level
     * NPC employee generation scales with company success
     */
    CANDIDATE_QUALITY: {
        LEVEL_1: { min: 30, max: 50, count: 3 }, // Startup: Limited pool
        LEVEL_2: { min: 40, max: 60, count: 5 }, // Small: Better candidates
        LEVEL_3: { min: 50, max: 70, count: 7 }, // Medium: Quality pool
        LEVEL_4: { min: 60, max: 80, count: 10 }, // Large: Premium talent
        LEVEL_5: { min: 70, max: 90, count: 15 }, // Mega: Elite candidates
    },
    /**
     * Performance Metrics
     */
    PERFORMANCE: {
        PRODUCTIVITY_DEFAULT: 1.0,
        QUALITY_DEFAULT: 75,
        ATTENDANCE_DEFAULT: 0.95,
        PRODUCTIVITY_WEIGHT: 0.5, // 50% of overall score
        QUALITY_WEIGHT: 0.3, // 30% of overall score
        ATTENDANCE_WEIGHT: 0.2, // 20% of overall score
    },
};
/**
 * Game time constants
 */
exports.GAME_TIME = {
    REAL_TO_GAME_MULTIPLIER: 168,
    HOURS_PER_DAY: 24,
    DAYS_PER_WEEK: 7,
    WEEKS_PER_MONTH: 4,
    MONTHS_PER_YEAR: 12,
};
/**
 * API rate limits
 */
exports.API_LIMITS = {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000,
    MAX_PAGINATION_LIMIT: 100,
    DEFAULT_PAGINATION_LIMIT: 20,
};
/**
 * UI constants
 */
exports.UI_CONSTANTS = {
    TOAST_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    POLLING_INTERVAL: 30000,
};
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Type Safety**: All constants use 'as const' for literal types
 * 2. **Centralized**: Single source of truth for all game values
 * 3. **Balance**: Easy to adjust game difficulty from one file
 * 4. **Documentation**: Clear naming and organization
 * 5. **Immutable**: Cannot be modified at runtime
 *
 * PREVENTS:
 * - 89 magic numbers scattered across codebase (legacy build)
 * - Inconsistent game balance values
 * - Difficulty tuning game parameters
 */
//# sourceMappingURL=constants.js.map