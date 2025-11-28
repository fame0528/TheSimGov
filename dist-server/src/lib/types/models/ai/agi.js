"use strict";
/**
 * AGI Milestone System Type Definitions
 *
 * Comprehensive type system for AGI (Artificial General Intelligence) milestone progression.
 * Supports 12-milestone tech tree from Advanced Reasoning to Superintelligence with dual
 * capability/alignment metrics, strategic path selection, and risk assessment.
 *
 * @module types/models/ai/agi
 * @category AI Industry
 *
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlignmentStance = exports.MilestoneStatus = exports.MilestoneType = void 0;
// ============================================================================
// ENUMS
// ============================================================================
/**
 * AGI Milestone Types - 12-milestone technology tree
 *
 * Progression paths:
 * - Capability Track: Advanced Reasoning → Strategic Planning → Transfer Learning
 *   → Creative Problem Solving → Meta-Learning → Natural Language Understanding
 *   → Multi-Agent Coordination → Self-Improvement → General Intelligence → Superintelligence
 * - Alignment Track: Value Alignment, Interpretability (can be pursued in parallel)
 *
 * Prerequisites enforce logical progression (cannot skip to AGI without foundations).
 */
var MilestoneType;
(function (MilestoneType) {
    MilestoneType["ADVANCED_REASONING"] = "Advanced Reasoning";
    MilestoneType["STRATEGIC_PLANNING"] = "Strategic Planning";
    MilestoneType["TRANSFER_LEARNING"] = "Transfer Learning";
    MilestoneType["CREATIVE_PROBLEM_SOLVING"] = "Creative Problem Solving";
    MilestoneType["META_LEARNING"] = "Meta-Learning";
    MilestoneType["NATURAL_LANGUAGE_UNDERSTANDING"] = "Natural Language Understanding";
    MilestoneType["MULTI_AGENT_COORDINATION"] = "Multi-Agent Coordination";
    MilestoneType["SELF_IMPROVEMENT"] = "Self-Improvement";
    MilestoneType["GENERAL_INTELLIGENCE"] = "General Intelligence";
    MilestoneType["SUPERINTELLIGENCE"] = "Superintelligence";
    MilestoneType["VALUE_ALIGNMENT"] = "Value Alignment";
    MilestoneType["INTERPRETABILITY"] = "Interpretability";
})(MilestoneType || (exports.MilestoneType = MilestoneType = {}));
/**
 * Milestone Status - Lifecycle states
 *
 * State transitions:
 * - Locked → Available (prerequisites met)
 * - Available → InProgress (first research investment)
 * - InProgress → Achieved (successful attempt) OR Failed (failed attempt)
 * - Failed → Available (retry after cooldown)
 */
var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["LOCKED"] = "Locked";
    MilestoneStatus["AVAILABLE"] = "Available";
    MilestoneStatus["IN_PROGRESS"] = "InProgress";
    MilestoneStatus["ACHIEVED"] = "Achieved";
    MilestoneStatus["FAILED"] = "Failed";
})(MilestoneStatus || (exports.MilestoneStatus = MilestoneStatus = {}));
/**
 * Alignment Stance - Strategic approach to AGI development
 *
 * - SafetyFirst: Prioritize alignment over speed (48mo, 85 align, 5% risk, $800M)
 * - Balanced: Balance safety and capability (36mo, 70 align, 15% risk, $1.2B)
 * - CapabilityFirst: Prioritize capability over safety (24mo, 40 align, 35% risk, $1.8B)
 *   (Requires current alignment >= 60 to prevent critical risk)
 */
var AlignmentStance;
(function (AlignmentStance) {
    AlignmentStance["SAFETY_FIRST"] = "SafetyFirst";
    AlignmentStance["BALANCED"] = "Balanced";
    AlignmentStance["CAPABILITY_FIRST"] = "CapabilityFirst";
})(AlignmentStance || (exports.AlignmentStance = AlignmentStance = {}));
// ============================================================================
// EXPORT ALL TYPES
// ============================================================================
// All types exported via their interface declarations above
//# sourceMappingURL=agi.js.map