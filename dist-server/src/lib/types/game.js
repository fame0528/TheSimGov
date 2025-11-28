"use strict";
/**
 * @fileoverview Game Mechanics Type Definitions
 * @module lib/types/game
 *
 * OVERVIEW:
 * Game-specific types for leveling, progression, and mechanics.
 * Company levels, level configs, game time structures.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillCategory = void 0;
/**
 * Skill categories
 */
var SkillCategory;
(function (SkillCategory) {
    SkillCategory["TECHNICAL"] = "TECHNICAL";
    SkillCategory["MANAGEMENT"] = "MANAGEMENT";
    SkillCategory["SALES"] = "SALES";
    SkillCategory["MARKETING"] = "MARKETING";
    SkillCategory["FINANCE"] = "FINANCE";
    SkillCategory["OPERATIONS"] = "OPERATIONS";
})(SkillCategory || (exports.SkillCategory = SkillCategory = {}));
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Level System**: 5-tier progression with clear thresholds
 * 2. **Game Time**: 168x multiplier tracking with real/game times
 * 3. **Skills**: Training system with categories and bonuses
 * 4. **Achievements**: Future gamification system
 * 5. **Type Safety**: Literal types for levels, union types for requirements
 *
 * PREVENTS:
 * - Invalid level assignments
 * - Inconsistent game time calculations
 * - Missing skill/achievement properties
 */
//# sourceMappingURL=game.js.map