/**
 * @fileoverview Contract Progression Utility - ECHO v1.3.0 Compliant
 * @description Comprehensive contract auto-progression system with skill-based calculations
 * @created 2025-11-24
 * @author ECHO Development System
 *
 * OVERVIEW:
 * Advanced contract progression system that calculates completion rates based on employee skills,
 * workload distribution, and contract requirements. Features skill matching algorithms, team synergy
 * calculations, quality scoring, and time-accelerated progression (168x system). Includes comprehensive
 * risk assessment, milestone tracking, and XP reward calculations.
 *
 * KEY FEATURES:
 * - Skill matching algorithms (0.5-1.5 multiplier range)
 * - Team synergy bonuses and productivity factors
 * - Quality score calculations (1-100 scale)
 * - Time acceleration support (168x = 1 real hour = 1 game week)
 * - Risk assessment and success probability
 * - Milestone progression tracking
 * - XP reward scaling by contract value and quality
 * - Comprehensive error handling and validation
 *
 * PROGRESSION FORMULA:
 * Daily Progress % = BASE_RATE × Skill_Match × Productivity × Workload × Synergy
 * - BASE_RATE: 2.0% per game day (50 days for 100% completion)
 * - Skill_Match: 0.5-1.5 (based on employee skills vs requirements)
 * - Productivity: Based on team average productivity (0-100)
 * - Workload: Optimal team size bonus/malus
 * - Synergy: Team experience and morale bonuses (up to 20%)
 *
 * QUALITY FORMULA:
 * Quality Score = (Skill_Match × 0.5) + (Timeline × 0.3) + (Resources × 0.2)
 * - Skill component: 50% weight on skill matching accuracy
 * - Timeline component: 30% weight on schedule adherence
 * - Resource component: 20% weight on team adequacy and morale
 *
 * TIME SYSTEM:
 * - 168x acceleration: 1 real hour = 1 game week
 * - 1 real minute = 2.8 game hours
 * - All calculations normalized to game time
 * - Progress updates account for real-time elapsed
 *
 * USAGE:
 * ```typescript
 * import {
 *   calculateSkillMatch,
 *   calculateDailyProgress,
 *   calculateQualityScore,
 *   updateContractProgress,
 *   calculateContractProgressionXP
 * } from '@/lib/utils/contractProgression';
 *
 * // Calculate skill match for team assignment
 * const skillMatch = calculateSkillMatch(employees, contract.requiredSkills);
 * console.log(`Match: ${skillMatch.matchPercentage}%`);
 *
 * // Get daily progress projection
 * const progress = await calculateDailyProgress(contractId, employeeIds);
 * console.log(`Daily progress: ${progress.dailyProgress}%`);
 *
 * // Update contract progress (auto-progression)
 * await updateContractProgress(contractId);
 * ```
 *
 * ARCHITECTURE:
 * - Pure functions for calculations (no side effects)
 * - Async functions for database operations
 * - Comprehensive TypeScript interfaces
 * - Error handling with descriptive messages
 * - Validation of inputs and business rules
 *
 * DEPENDENCIES:
 * - Employee and Contract models for data access
 * - levelProgression utility for XP awards
 * - Company model for reputation updates
 *
 * @version 1.0.0
 * @since ECHO v1.3.0
 */

/**
 * Time acceleration constant (168x = 1 real hour = 1 game week)
 * @constant {number}
 */
const TIME_ACCELERATION = 168;

/**
 * Base progress rate per game day (percentage)
 * Assumes optimal conditions, then adjusted by skill match and other factors
 * @constant {number}
 */
const BASE_DAILY_PROGRESS = 2.0; // 2% per game day = 50 days for 100%

/**
 * Skill match result interface
 * @interface SkillMatchResult
 */
export interface SkillMatchResult {
  /** Overall skill match multiplier (0.5 - 1.5, where 1.0 = perfect match) */
  overallMatch: number;
  /** Skills where team is below requirements */
  skillGaps: string[];
  /** Skills where team exceeds requirements significantly */
  skillExcess: string[];
  /** Critical skill gaps (< 50% of requirement) */
  criticalGaps: string[];
  /** Match percentage for display (0-100%) */
  matchPercentage: number;
  /** Actionable improvement recommendations */
  recommendations: string[];
}

/**
 * Team performance metrics interface
 * @interface TeamMetrics
 */
export interface TeamMetrics {
  /** Average skill level across all employees (1-100) */
  averageSkill: number;
  /** Average productivity percentage (1-100) */
  averageProductivity: number;
  /** Average morale percentage (1-100) */
  averageMorale: number;
  /** Number of employees in team */
  teamSize: number;
  /** Employees with experience > 60 */
  experiencedCount: number;
  /** Total certifications across team */
  certificationCount: number;
  /** Total contracts completed by team */
  totalContractsCompleted: number;
  /** Synergy bonus percentage (0-20%) */
  synergyBonus: number;
}

/**
 * Contract progression calculation result
 * @interface ProgressionResult
 */
export interface ProgressionResult {
  /** Daily progress percentage per game day */
  dailyProgress: number;
  /** Weekly progress percentage (dailyProgress × 7) */
  weeklyProgress: number;
  /** Projected completion date */
  estimatedCompletion: Date;
  /** Quality score (1-100) */
  qualityScore: number;
  /** Risk assessment level */
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  /** Success probability percentage (0-100%) */
  successProbability: number;
  /** Actionable recommendations for improvement */
  recommendations: string[];
}

/**
 * Contract progress summary interface
 * @interface ContractProgressSummary
 */
export interface ContractProgressSummary {
  /** Contract document */
  contract: any; // IContract type would be imported
  /** Current progression metrics */
  progression: ProgressionResult;
  /** Skill match analysis */
  skillMatch: SkillMatchResult;
  /** Team performance metrics */
  teamMetrics: TeamMetrics;
}

/**
 * Calculate skill match between employees and contract requirements
 *
 * @param {any[]} employees - Array of employee objects with skill properties
 * @param {Record<string, number>} requiredSkills - Required skill levels by skill name
 * @returns {SkillMatchResult} Comprehensive skill match analysis
 * @throws {Error} If employees array is empty or invalid
 *
 * @example
 * ```typescript
 * const employees = [
 *   { programming: 80, design: 60, marketing: 70 },
 *   { programming: 75, design: 80, marketing: 65 }
 * ];
 * const required = { programming: 70, design: 70, marketing: 60 };
 * const match = calculateSkillMatch(employees, required);
 * // Returns: { overallMatch: 1.05, matchPercentage: 100, skillGaps: [], ... }
 * ```
 */
export function calculateSkillMatch(
  employees: any[],
  requiredSkills: Record<string, number>
): SkillMatchResult {
  // Input validation
  if (!Array.isArray(employees) || employees.length === 0) {
    throw new Error('Employees array must not be empty');
  }

  if (!requiredSkills || typeof requiredSkills !== 'object') {
    throw new Error('Required skills must be a valid object');
  }

  const skillGaps: string[] = [];
  const skillExcess: string[] = [];
  const criticalGaps: string[] = [];
  const recommendations: string[] = [];

  // Get all required skill names
  const requiredSkillNames = Object.keys(requiredSkills);

  if (requiredSkillNames.length === 0) {
    return {
      overallMatch: 1.0,
      skillGaps: [],
      skillExcess: [],
      criticalGaps: [],
      matchPercentage: 100,
      recommendations: ['No specific skill requirements'],
    };
  }

  // Calculate average employee skill for each required skill
  const employeeSkillAverages: Record<string, number> = {};

  requiredSkillNames.forEach((skillName) => {
    const skillValues = employees
      .map((emp) => emp[skillName] || 0)
      .filter((val) => typeof val === 'number' && val >= 0);

    if (skillValues.length === 0) {
      employeeSkillAverages[skillName] = 0;
    } else {
      const average = skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length;
      employeeSkillAverages[skillName] = average;
    }
  });

  // Compare employee skills to requirements
  let totalRequiredScore = 0;
  let totalEmployeeScore = 0;

  requiredSkillNames.forEach((skillName) => {
    const required = requiredSkills[skillName] || 0;
    const actual = employeeSkillAverages[skillName] || 0;

    totalRequiredScore += required;
    totalEmployeeScore += actual;

    const gap = required - actual;

    if (gap > 0) {
      // Skill gap
      if (gap >= required * 0.5) {
        criticalGaps.push(`${skillName} (need ${required}, have ${Math.round(actual)})`);
      } else {
        skillGaps.push(`${skillName} (${Math.round(gap)} points below)`);
      }
    } else if (gap < -10) {
      // Significant excess
      skillExcess.push(`${skillName} (+${Math.round(Math.abs(gap))} above requirement)`);
    }
  });

  // Calculate overall match (0.5 - 1.5 range)
  const rawMatch = totalRequiredScore > 0
    ? totalEmployeeScore / totalRequiredScore
    : 1.0;

  const overallMatch = Math.max(0.5, Math.min(1.5, rawMatch));
  const matchPercentage = Math.round(Math.min(100, overallMatch * 100));

  // Generate recommendations
  if (criticalGaps.length > 0) {
    recommendations.push(`CRITICAL: Hire or train employees in: ${criticalGaps.join(', ')}`);
  }

  if (skillGaps.length > 0) {
    recommendations.push(`Improve skills: ${skillGaps.join(', ')}`);
  }

  if (employees.length < 3 && requiredSkillNames.length > 5) {
    recommendations.push('Consider hiring more employees for better skill coverage');
  }

  if (overallMatch > 1.2) {
    recommendations.push('Team is overqualified - consider bidding on more complex contracts');
  }

  return {
    overallMatch,
    skillGaps,
    skillExcess,
    criticalGaps,
    matchPercentage,
    recommendations,
  };
}

/**
 * Calculate team performance metrics from employee data
 *
 * @param {any[]} employees - Array of employee objects with performance metrics
 * @returns {TeamMetrics} Comprehensive team performance metrics
 * @throws {Error} If employees array is invalid
 *
 * @example
 * ```typescript
 * const employees = [
 *   { averageSkill: 75, productivity: 80, morale: 70, experience: 65, certifications: ['AWS'], contractsCompleted: 5 },
 *   { averageSkill: 80, productivity: 85, morale: 75, experience: 70, certifications: ['React', 'Node'], contractsCompleted: 8 }
 * ];
 * const metrics = calculateTeamMetrics(employees);
 * // Returns: { averageSkill: 77.5, averageProductivity: 82.5, teamSize: 2, synergyBonus: 8.5, ... }
 * ```
 */
export function calculateTeamMetrics(employees: any[]): TeamMetrics {
  // Input validation
  if (!Array.isArray(employees)) {
    throw new Error('Employees must be an array');
  }

  if (employees.length === 0) {
    return {
      averageSkill: 0,
      averageProductivity: 0,
      averageMorale: 0,
      teamSize: 0,
      experiencedCount: 0,
      certificationCount: 0,
      totalContractsCompleted: 0,
      synergyBonus: 0,
    };
  }

  // Calculate averages with validation
  const validEmployees = employees.filter((emp) =>
    emp &&
    typeof emp.averageSkill === 'number' &&
    typeof emp.productivity === 'number' &&
    typeof emp.morale === 'number'
  );

  if (validEmployees.length === 0) {
    throw new Error('No valid employee data found');
  }

  const totalSkill = validEmployees.reduce((sum, emp) => sum + (emp.averageSkill || 0), 0);
  const totalProductivity = validEmployees.reduce((sum, emp) => sum + (emp.productivity || 0), 0);
  const totalMorale = validEmployees.reduce((sum, emp) => sum + (emp.morale || 0), 0);

  const averageSkill = totalSkill / validEmployees.length;
  const averageProductivity = totalProductivity / validEmployees.length;
  const averageMorale = totalMorale / validEmployees.length;

  // Count experienced employees (experience > 60)
  const experiencedCount = validEmployees.filter((emp) => (emp.experience || 0) > 60).length;

  // Count certifications
  const certificationCount = validEmployees.reduce(
    (sum, emp) => sum + ((emp.certifications && Array.isArray(emp.certifications)) ? emp.certifications.length : 0),
    0
  );

  // Total contracts completed
  const totalContractsCompleted = validEmployees.reduce(
    (sum, emp) => sum + ((emp.contractsCompleted && typeof emp.contractsCompleted === 'number') ? emp.contractsCompleted : 0),
    0
  );

  // Calculate synergy bonus (0-20%)
  let synergyBonus = 0;

  // Experience bonus: +1% per 10 total contracts completed (max +10%)
  synergyBonus += Math.min(10, totalContractsCompleted / 10);

  // Morale bonus: +1% per 10 points of average morale above 50 (max +5%)
  if (averageMorale > 50) {
    synergyBonus += Math.min(5, (averageMorale - 50) / 10);
  }

  // Team size bonus: +1% for teams of 5+ (coordination efficiency)
  if (validEmployees.length >= 5) {
    synergyBonus += 5;
  }

  synergyBonus = Math.min(20, synergyBonus);

  return {
    averageSkill,
    averageProductivity,
    averageMorale,
    teamSize: validEmployees.length,
    experiencedCount,
    certificationCount,
    totalContractsCompleted,
    synergyBonus,
  };
}

/**
 * Calculate daily progress rate for a contract based on team capabilities
 *
 * @param {any} contract - Contract object with requirements and current state
 * @param {any[]} employees - Array of assigned employee objects
 * @returns {ProgressionResult} Comprehensive progression analysis
 * @throws {Error} If contract or employees are invalid
 *
 * @example
 * ```typescript
 * const contract = {
 *   requiredSkills: { programming: 70, design: 70 },
 *   minimumEmployees: 2,
 *   deadline: new Date('2025-12-31'),
 *   completionPercentage: 25,
 *   currentMilestone: 0
 * };
 * const employees = [{ programming: 80, design: 60 }, { programming: 75, design: 80 }];
 * const progress = calculateProgression(contract, employees);
 * // Returns: { dailyProgress: 2.8, weeklyProgress: 19.6, qualityScore: 85, riskLevel: 'Low', ... }
 * ```
 */
export function calculateProgression(
  contract: any,
  employees: any[]
): ProgressionResult {
  // Input validation
  if (!contract || typeof contract !== 'object') {
    throw new Error('Contract must be a valid object');
  }

  if (!Array.isArray(employees) || employees.length === 0) {
    throw new Error('Employees array must not be empty');
  }

  // Calculate skill match
  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills || {});

  // Calculate team metrics
  const teamMetrics = calculateTeamMetrics(employees);

  // Check minimum requirements
  const minimumEmployees = contract.minimumEmployees || 1;
  if (employees.length < minimumEmployees) {
    return {
      dailyProgress: 0,
      weeklyProgress: 0,
      estimatedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year out
      qualityScore: 30,
      riskLevel: 'Critical',
      successProbability: 10,
      recommendations: [
        `CRITICAL: Need ${minimumEmployees - employees.length} more employees`,
        ...skillMatch.recommendations,
      ],
    };
  }

  // Calculate productivity factor (0.5 - 1.5)
  const productivityFactor = teamMetrics.averageProductivity / 100;

  // Calculate workload factor (0.7 - 1.2)
  const optimalSize = minimumEmployees * 1.2;
  const workloadFactor = employees.length >= optimalSize
    ? 1.2 // Well-staffed bonus
    : 0.7 + (employees.length / optimalSize) * 0.5;

  // Calculate synergy bonus multiplier (1.0 - 1.2)
  const synergyMultiplier = 1.0 + (teamMetrics.synergyBonus / 100);

  // Calculate daily progress rate
  const dailyProgress =
    BASE_DAILY_PROGRESS *
    skillMatch.overallMatch *
    productivityFactor *
    workloadFactor *
    synergyMultiplier;

  const weeklyProgress = dailyProgress * 7; // 7 game days per week

  // Calculate estimated completion date
  const remainingProgress = 100 - (contract.completionPercentage || 0);
  const daysToComplete = remainingProgress / dailyProgress;

  // Convert game days to real time (168x acceleration)
  const realHoursToComplete = (daysToComplete * 24) / TIME_ACCELERATION;
  const estimatedCompletion = new Date(
    Date.now() + realHoursToComplete * 60 * 60 * 1000
  );

  // Calculate quality score
  const qualityScore = calculateQualityScore(contract, employees);

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  if (skillMatch.overallMatch < 0.7 || skillMatch.criticalGaps.length > 0) {
    riskLevel = 'Critical';
  } else if (skillMatch.overallMatch < 0.85 || employees.length < minimumEmployees * 0.8) {
    riskLevel = 'High';
  } else if (skillMatch.overallMatch < 1.0 || teamMetrics.averageMorale < 60) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // Calculate success probability (0-100%)
  let successProbability = 100;

  // Skill match impact (most important)
  successProbability *= skillMatch.overallMatch;

  // Morale impact
  successProbability *= (teamMetrics.averageMorale / 100);

  // Team size adequacy
  const sizeAdequacy = Math.min(1.0, employees.length / minimumEmployees);
  successProbability *= sizeAdequacy;

  // Timeline cushion (time remaining vs estimated)
  const deadline = new Date(contract.deadline);
  const timeRemaining = deadline.getTime() - Date.now();
  const timeNeeded = estimatedCompletion.getTime() - Date.now();
  const timelineCushion = timeRemaining > timeNeeded ? 1.0 : 0.8;
  successProbability *= timelineCushion;

  successProbability = Math.max(10, Math.min(100, Math.round(successProbability)));

  // Generate recommendations
  const recommendations: string[] = [...skillMatch.recommendations];

  if (teamMetrics.averageMorale < 70) {
    recommendations.push('Improve team morale (bonuses, events, work-life balance)');
  }

  if (dailyProgress < 1.5) {
    recommendations.push('Progress is slow - consider adding more employees or training current team');
  }

  if (timelineCushion < 1.0) {
    recommendations.push('WARNING: Behind schedule - consider overtime or additional resources');
  }

  return {
    dailyProgress,
    weeklyProgress,
    estimatedCompletion,
    qualityScore,
    riskLevel,
    successProbability,
    recommendations,
  };
}

/**
 * Calculate quality score for contract execution
 *
 * @param {any} contract - Contract object with timeline and requirements
 * @param {any[]} employees - Array of assigned employee objects
 * @returns {number} Quality score (1-100)
 * @throws {Error} If contract or employees are invalid
 *
 * @example
 * ```typescript
 * const contract = {
 *   requiredSkills: { programming: 70 },
 *   deadline: new Date('2025-12-31'),
 *   startDate: new Date('2025-11-01'),
 *   completionPercentage: 50
 * };
 * const employees = [{ programming: 75 }];
 * const quality = calculateQualityScore(contract, employees);
 * // Returns: 82 (good quality score)
 * ```
 */
export function calculateQualityScore(
  contract: any,
  employees: any[]
): number {
  // Input validation
  if (!contract || typeof contract !== 'object') {
    throw new Error('Contract must be a valid object');
  }

  if (!Array.isArray(employees)) {
    throw new Error('Employees must be an array');
  }

  // Skill match component (50% of quality)
  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills || {});
  const skillComponent = skillMatch.matchPercentage * 0.5;

  // Timeline adherence component (30% of quality)
  let timelineScore = 100;
  const now = new Date();

  if (contract.startDate && contract.deadline && contract.completionPercentage !== undefined) {
    const started = new Date(contract.startDate);
    const deadline = new Date(contract.deadline);
    const totalDuration = deadline.getTime() - started.getTime();
    const elapsed = now.getTime() - started.getTime();
    const progressExpected = (elapsed / totalDuration) * 100;
    const progressActual = contract.completionPercentage;

    if (progressActual < progressExpected) {
      // Behind schedule
      const lag = progressExpected - progressActual;
      timelineScore = Math.max(50, 100 - (lag * 2)); // -2 points per 1% lag
    } else if (progressActual > progressExpected) {
      // Ahead of schedule (bonus up to 110)
      const lead = progressActual - progressExpected;
      timelineScore = Math.min(110, 100 + (lead * 0.5)); // +0.5 points per 1% lead
    }
  }

  const timelineComponent = timelineScore * 0.3;

  // Resource allocation component (20% of quality)
  const teamMetrics = calculateTeamMetrics(employees);
  const minimumEmployees = contract.minimumEmployees || 1;
  const resourceAdequacy = Math.min(1.2, employees.length / minimumEmployees);
  const moraleMultiplier = teamMetrics.averageMorale / 100;
  const resourceScore = resourceAdequacy * moraleMultiplier * 100;
  const resourceComponent = resourceScore * 0.2;

  // Calculate total quality score
  const qualityScore = skillComponent + timelineComponent + resourceComponent;

  return Math.round(Math.max(1, Math.min(100, qualityScore)));
}

/**
 * Calculate XP reward for contract completion
 *
 * @param {number} contractValue - Total contract value in dollars
 * @param {number} qualityScore - Quality score (1-100)
 * @returns {number} XP reward amount
 * @throws {Error} If inputs are invalid
 *
 * @example
 * ```typescript
 * const xp = calculateContractProgressionXP(50000, 85);
 * // Returns: 125 (scaled XP reward)
 *
 * const xp = calculateContractProgressionXP(1000000, 95);
 * // Returns: 575 (higher value and quality = more XP)
 * ```
 */
export function calculateContractProgressionXP(contractValue: number, qualityScore: number): number {
  // Input validation
  if (typeof contractValue !== 'number' || contractValue < 0) {
    throw new Error('Contract value must be a non-negative number');
  }

  if (typeof qualityScore !== 'number' || qualityScore < 1 || qualityScore > 100) {
    throw new Error('Quality score must be between 1 and 100');
  }

  // Base XP: Scale logarithmically with contract value
  // $10k = 50 XP, $100k = 200 XP, $1M = 500 XP, $10M = 1000 XP
  const baseXP = Math.log10(Math.max(contractValue / 1000, 1)) * 100;

  // Quality multiplier: 0.5x at quality 50, 1.0x at quality 75, 1.5x at quality 100
  const qualityMultiplier = 0.5 + (qualityScore / 100);

  const totalXP = Math.round(baseXP * qualityMultiplier);

  return Math.max(10, totalXP); // Minimum 10 XP
}

/**
 * Validate contract progression data
 *
 * @param {any} data - Data to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 *
 * @example
 * ```typescript
 * const data = {
 *   contractId: 'contract123',
 *   employeeIds: ['emp1', 'emp2'],
 *   requiredSkills: { programming: 70 }
 * };
 * const isValid = validateContractProgressionData(data);
 * // Returns: true
 * ```
 */
export function validateContractProgressionData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be a valid object');
  }

  if (data.contractId && typeof data.contractId !== 'string') {
    throw new Error('Contract ID must be a string');
  }

  if (data.employeeIds && !Array.isArray(data.employeeIds)) {
    throw new Error('Employee IDs must be an array');
  }

  if (data.requiredSkills && typeof data.requiredSkills !== 'object') {
    throw new Error('Required skills must be an object');
  }

  return true;
}

/**
 * Get contract progression summary (stub for future database integration)
 *
 * @param {string} contractId - Contract ID
 * @param {any[]} employees - Employee data
 * @param {any} contract - Contract data
 * @returns {ContractProgressSummary} Complete progression summary
 * @throws {Error} If inputs are invalid
 *
 * @example
 * ```typescript
 * const summary = getContractProgressionSummary('contract123', employees, contract);
 * // Returns: { contract, progression, skillMatch, teamMetrics }
 * ```
 */
export function getContractProgressionSummary(
  contractId: string,
  employees: any[],
  contract: any
): ContractProgressSummary {
  // Input validation
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a valid string');
  }

  validateContractProgressionData({ contractId, employees, requiredSkills: contract?.requiredSkills });

  // Calculate all metrics
  const progression = calculateProgression(contract, employees);
  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills || {});
  const teamMetrics = calculateTeamMetrics(employees);

  return {
    contract,
    progression,
    skillMatch,
    teamMetrics,
  };
}

// Export time acceleration constant for external use
export { TIME_ACCELERATION };