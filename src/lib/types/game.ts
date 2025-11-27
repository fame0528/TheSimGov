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

/**
 * Company level tier
 */
export type CompanyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Company level configuration
 */
export interface LevelConfig {
  level: CompanyLevel;
  name: string;
  minRevenue: number;
  maxEmployees: number;
  unlocks: string[];
}

/**
 * Game time representation
 */
export interface GameTime {
  realStartTime: Date;
  gameStartTime: Date;
  currentGameTime: Date;
  multiplier: number;
}

/**
 * Skill definition
 */
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  baseCost: number;
  durationHours: number;
  productivityBonus: number;
}

/**
 * Skill categories
 */
export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  MANAGEMENT = 'MANAGEMENT',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  FINANCE = 'FINANCE',
  OPERATIONS = 'OPERATIONS',
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: AchievementRequirement;
  reward?: AchievementReward;
}

/**
 * Achievement requirement
 */
export interface AchievementRequirement {
  type: 'REVENUE' | 'EMPLOYEES' | 'CONTRACTS' | 'LEVEL' | 'LOANS_PAID';
  threshold: number;
}

/**
 * Achievement reward
 */
export interface AchievementReward {
  type: 'CASH' | 'CREDIT_BOOST' | 'UNLOCK_FEATURE';
  value: number | string;
}

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
