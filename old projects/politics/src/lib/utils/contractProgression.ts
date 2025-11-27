/**
 * @file src/lib/utils/contractProgression.ts
 * @description Contract auto-progression system based on employee skills
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Automatic contract progression system that calculates completion rates based on
 * assigned employee skills, workload distribution, and contract requirements. Uses
 * skill matching algorithms to determine daily/weekly progress rates, milestone
 * completion probabilities, and quality outcomes. Includes time acceleration support
 * for 168x time system (1 real hour = 1 game week).
 * 
 * KEY FEATURES:
 * - Employee skill → completion rate formulas
 * - Skill matching (required vs actual employee skills)
 * - Workload distribution optimization
 * - Quality score calculation (1-100)
 * - Milestone progression tracking
 * - Time-based auto-advancement (168x system)
 * - Fatigue and productivity factors
 * - Team synergy bonuses
 * - Risk assessment and failure probability
 * 
 * PROGRESSION FORMULA:
 * Daily Progress % = (Team Skill Average / Required Skill Average) × 
 *                     Productivity Factor × 
 *                     Workload Factor × 
 *                     Synergy Bonus × 
 *                     Base Progress Rate
 * 
 * QUALITY FORMULA:
 * Quality Score = (Skill Match × 0.5) + 
 *                 (Timeline Adherence × 0.3) + 
 *                 (Resource Allocation × 0.2)
 * 
 * SKILL MATCH FORMULA:
 * Skill Match = Σ(Employee Skills in Required Areas) / Σ(Required Skills)
 * Range: 0.5 - 1.5 (0.5 = underqualified, 1.0 = perfect match, 1.5 = overqualified)
 * 
 * TIME SYSTEM:
 * - 1 real hour = 1 game week (168 hours)
 * - 168x time acceleration
 * - 1 real minute = 2.8 game hours
 * - Progress calculations normalized to game time
 * 
 * USAGE:
 * ```typescript
 * import { calculateDailyProgress, calculateQualityScore, updateContractProgress } from '@/lib/utils/contractProgression';
 * 
 * // Calculate daily progress rate
 * const progressRate = await calculateDailyProgress(
 *   contractId,
 *   assignedEmployeeIds
 * );
 * 
 * // Calculate quality score
 * const quality = await calculateQualityScore(
 *   contractId,
 *   assignedEmployeeIds,
 *   currentMilestone
 * );
 * 
 * // Auto-update contract (call periodically)
 * await updateContractProgress(contractId);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Skill matching uses weighted averages (primary skills weighted higher)
 * - Productivity factors: morale, fatigue, workload balance
 * - Synergy bonuses: complementary skills, team experience together
 * - Quality degrades with: skill gaps, rushed timelines, insufficient resources
 * - Milestone progression: Each milestone calculates independently
 * - Auto-progression: Triggered by cron job or API calls (168x time-aware)
 * - Failure conditions: Skills < 50% required, team size < 50% minimum
 * - Success probability: Based on skill match + timeline cushion + resource adequacy
 */

import Contract, { type IContract, type SkillRequirements } from '@/lib/db/models/Contract';
import Employee, { type IEmployee } from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import { awardExperience } from '@/lib/utils/levelProgression';

/**
 * Time acceleration constant (168x = 1 real hour = 1 game week)
 */
const TIME_ACCELERATION = 168;

/**
 * Base progress rate per game day (percentage)
 * Assumes optimal conditions, then adjusted by skill match
 */
const BASE_DAILY_PROGRESS = 2.0; // 2% per game day = 50 days for 100%

/**
 * Skill match result interface
 */
export interface SkillMatchResult {
  overallMatch: number;           // 0.5 - 1.5 (1.0 = perfect)
  skillGaps: string[];            // Skills below requirement
  skillExcess: string[];          // Skills above requirement
  criticalGaps: string[];         // Skills < 50% of requirement
  matchPercentage: number;        // 0-100%
  recommendations: string[];      // Improvement suggestions
}

/**
 * Progression calculation result
 */
export interface ProgressionResult {
  dailyProgress: number;          // % per game day
  weeklyProgress: number;         // % per game week
  estimatedCompletion: Date;      // Projected completion date
  qualityScore: number;           // 1-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  successProbability: number;     // 0-100%
  recommendations: string[];
}

/**
 * Team metrics interface
 */
export interface TeamMetrics {
  averageSkill: number;           // 1-100
  averageProductivity: number;    // 1-100
  averageMorale: number;          // 1-100
  teamSize: number;
  experiencedCount: number;       // Employees with experience > 60
  certificationCount: number;
  totalContractsCompleted: number;
  synergyBonus: number;           // 0-20% bonus
}

/**
 * Calculate skill match between employees and contract requirements
 * 
 * @param {IEmployee[]} employees - Assigned employees
 * @param {SkillRequirements} requiredSkills - Contract skill requirements
 * @returns {SkillMatchResult} Skill match analysis
 */
export function calculateSkillMatch(
  employees: IEmployee[],
  requiredSkills: SkillRequirements
): SkillMatchResult {
  const skillGaps: string[] = [];
  const skillExcess: string[] = [];
  const criticalGaps: string[] = [];
  const recommendations: string[] = [];

  // Get all required skill names
  const requiredSkillNames = Object.keys(requiredSkills) as Array<keyof SkillRequirements>;
  
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
    const skillValues = employees.map((emp) => emp[skillName] as number || 0);
    const average = skillValues.reduce((sum, val) => sum + val, 0) / employees.length;
    employeeSkillAverages[skillName] = average;
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
 * Calculate team metrics from assigned employees
 * 
 * @param {IEmployee[]} employees - Assigned employees
 * @returns {TeamMetrics} Team performance metrics
 */
export function calculateTeamMetrics(employees: IEmployee[]): TeamMetrics {
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

  // Calculate averages
  const totalSkill = employees.reduce((sum, emp) => sum + emp.averageSkill, 0);
  const totalProductivity = employees.reduce((sum, emp) => sum + emp.productivity, 0);
  const totalMorale = employees.reduce((sum, emp) => sum + emp.morale, 0);

  const averageSkill = totalSkill / employees.length;
  const averageProductivity = totalProductivity / employees.length;
  const averageMorale = totalMorale / employees.length;

  // Count experienced employees (experience > 60)
  const experiencedCount = employees.filter((emp) => emp.experience > 60).length;

  // Count certifications
  const certificationCount = employees.reduce(
    (sum, emp) => sum + emp.certifications.length,
    0
  );

  // Total contracts completed
  const totalContractsCompleted = employees.reduce(
    (sum, emp) => sum + emp.contractsCompleted,
    0
  );

  // Calculate synergy bonus (0-20%)
  // Factors: team experience together, complementary skills, high morale
  let synergyBonus = 0;
  
  // Experience bonus: +1% per 10 total contracts completed (max +10%)
  synergyBonus += Math.min(10, totalContractsCompleted / 10);
  
  // Morale bonus: +1% per 10 points of average morale above 50 (max +5%)
  if (averageMorale > 50) {
    synergyBonus += Math.min(5, (averageMorale - 50) / 10);
  }
  
  // Team size bonus: +1% for teams of 5+ (coordination efficiency)
  if (employees.length >= 5) {
    synergyBonus += 5;
  }

  synergyBonus = Math.min(20, synergyBonus); // Cap at 20%

  return {
    averageSkill,
    averageProductivity,
    averageMorale,
    teamSize: employees.length,
    experiencedCount,
    certificationCount,
    totalContractsCompleted,
    synergyBonus,
  };
}

/**
 * Calculate daily progress rate for contract
 * 
 * @param {string} contractId - Contract ID
 * @param {string[]} employeeIds - Assigned employee IDs
 * @returns {Promise<ProgressionResult>} Progression calculation
 */
export async function calculateDailyProgress(
  contractId: string,
  employeeIds: string[]
): Promise<ProgressionResult> {
  // Fetch contract
  const contract = await Contract.findById(contractId) as IContract;
  if (!contract) {
    throw new Error('Contract not found');
  }

  // Fetch employees
  const employees = await Employee.find({
    _id: { $in: employeeIds },
    firedAt: null, // Only active employees
  }) as IEmployee[];

  if (employees.length === 0) {
    throw new Error('No valid employees assigned');
  }

  // Calculate skill match
  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills);

  // Calculate team metrics
  const teamMetrics = calculateTeamMetrics(employees);

  // Check minimum requirements
  if (employees.length < contract.minimumEmployees) {
    return {
      dailyProgress: 0,
      weeklyProgress: 0,
      estimatedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year out
      qualityScore: 30,
      riskLevel: 'Critical',
      successProbability: 10,
      recommendations: [
        `CRITICAL: Need ${contract.minimumEmployees - employees.length} more employees`,
        ...skillMatch.recommendations,
      ],
    };
  }

  // Calculate productivity factor (0.5 - 1.5)
  const productivityFactor = teamMetrics.averageProductivity / 100;

  // Calculate workload factor (0.7 - 1.2)
  // Optimal team size = minimumEmployees * 1.2
  const optimalSize = contract.minimumEmployees * 1.2;
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
  const remainingProgress = 100 - contract.completionPercentage;
  const daysToComplete = remainingProgress / dailyProgress;
  
  // Convert game days to real time (168x acceleration)
  const realHoursToComplete = (daysToComplete * 24) / TIME_ACCELERATION;
  const estimatedCompletion = new Date(
    Date.now() + realHoursToComplete * 60 * 60 * 1000
  );

  // Calculate quality score (1-100)
  const qualityScore = await calculateQualityScore(
    contract,
    employees,
    contract.currentMilestone
  );

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  if (skillMatch.overallMatch < 0.7 || skillMatch.criticalGaps.length > 0) {
    riskLevel = 'Critical';
  } else if (skillMatch.overallMatch < 0.85 || employees.length < contract.minimumEmployees * 0.8) {
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
  const sizeAdequacy = Math.min(1.0, employees.length / contract.minimumEmployees);
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
 * Calculate quality score for contract milestone
 * 
 * @param {IContract} contract - Contract document
 * @param {IEmployee[]} employees - Assigned employees
 * @param {number} milestoneIndex - Current milestone index
 * @returns {Promise<number>} Quality score (1-100)
 */
export async function calculateQualityScore(
  contract: IContract,
  employees: IEmployee[],
  _milestoneIndex: number // Prefixed with _ to indicate intentionally unused
): Promise<number> {
  // Skill match component (50% of quality)
  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills);
  const skillComponent = skillMatch.matchPercentage * 0.5;

  // Timeline adherence component (30% of quality)
  const now = new Date();
  const deadline = new Date(contract.deadline);
  const started = contract.actualStartDate || contract.startDate;
  const totalDuration = deadline.getTime() - new Date(started).getTime();
  const elapsed = now.getTime() - new Date(started).getTime();
  const progressExpected = (elapsed / totalDuration) * 100;
  const progressActual = contract.completionPercentage;
  
  let timelineScore = 100;
  if (progressActual < progressExpected) {
    // Behind schedule
    const lag = progressExpected - progressActual;
    timelineScore = Math.max(50, 100 - (lag * 2)); // -2 points per 1% lag
  } else if (progressActual > progressExpected) {
    // Ahead of schedule (bonus up to 110)
    const lead = progressActual - progressExpected;
    timelineScore = Math.min(110, 100 + (lead * 0.5)); // +0.5 points per 1% lead
  }
  
  const timelineComponent = timelineScore * 0.3;

  // Resource allocation component (20% of quality)
  const teamMetrics = calculateTeamMetrics(employees);
  const resourceAdequacy = Math.min(1.2, employees.length / contract.minimumEmployees);
  const moraleMultiplier = teamMetrics.averageMorale / 100;
  const resourceScore = resourceAdequacy * moraleMultiplier * 100;
  const resourceComponent = resourceScore * 0.2;

  // Calculate total quality score
  const qualityScore = skillComponent + timelineComponent + resourceComponent;

  return Math.round(Math.max(1, Math.min(100, qualityScore)));
}

/**
 * Update contract progress automatically (called by cron or API)
 * 
 * @param {string} contractId - Contract ID
 * @returns {Promise<IContract>} Updated contract
 */
export async function updateContractProgress(contractId: string): Promise<IContract> {
  const contract = await Contract.findById(contractId) as IContract;
  if (!contract) {
    throw new Error('Contract not found');
  }

  // Only update contracts in progress
  if (contract.status !== 'InProgress') {
    return contract;
  }

  // Get assigned employees
  const employees = await Employee.find({
    _id: { $in: contract.assignedEmployees },
    firedAt: null,
  }) as IEmployee[];

  if (employees.length === 0) {
    // No employees - no progress
    return contract;
  }

  // Calculate time elapsed since last update (in game time)
  const now = new Date();
  const lastUpdate = contract.updatedAt || contract.actualStartDate || now;
  const realHoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  const gameHoursElapsed = realHoursElapsed * TIME_ACCELERATION;
  const gameDaysElapsed = gameHoursElapsed / 24;

  // Calculate progression
  const progression = await calculateDailyProgress(
    contractId,
    contract.assignedEmployees.map((id) => id.toString())
  );

  // Apply progress
  const progressGain = progression.dailyProgress * gameDaysElapsed;
  const newCompletion = Math.min(100, contract.completionPercentage + progressGain);

  contract.completionPercentage = newCompletion;
  contract.qualityScore = progression.qualityScore;

  // Update current milestone
  if (contract.milestones.length > 0) {
    const currentMilestone = contract.milestones[contract.currentMilestone];
    
    if (currentMilestone && !currentMilestone.completed) {
      // Calculate milestone-specific progress
      const milestoneProgress = Math.min(
        100,
        currentMilestone.progressPercentage + progressGain
      );
      
      await contract.updateMilestoneProgress(
        contract.currentMilestone,
        milestoneProgress
      );
    }
  }

  // Check if contract is complete
  if (newCompletion >= 100) {
    await contract.completeContract();
    
    // Update company reputation
    const company = await Company.findById(contract.awardedTo);
    if (company) {
      const newReputation = Math.max(
        0,
        Math.min(100, company.reputation + contract.reputationImpact)
      );
      
      await company.updateOne({ reputation: newReputation });
      
      // Award XP scaled by contract value
      const xpReward = calculateContractXP(contract.value, contract.qualityScore);
      await awardExperience(
        String(company._id),
        xpReward,
        'contract_completion',
        `Completed ${contract.title}`
      );
    }

    // Update employee stats
    await Employee.updateMany(
      { _id: { $in: contract.assignedEmployees } },
      {
        $inc: {
          contractsCompleted: 1,
          revenueGenerated: contract.finalPayment / employees.length,
        },
      }
    );
  }

  await contract.save();
  return contract;
}

/**
 * Calculate XP reward for contract completion
 * 
 * @param {number} contractValue - Total contract value
 * @param {number} qualityScore - Quality score (1-100)
 * @returns {number} XP reward amount
 */
export function calculateContractXP(contractValue: number, qualityScore: number): number {
  // Base XP: Scale logarithmically with contract value
  // $10k = 50 XP, $100k = 200 XP, $1M = 500 XP, $10M = 1000 XP
  const baseXP = Math.log10(contractValue / 1000) * 100;
  
  // Quality multiplier: 0.5x at quality 50, 1.0x at quality 75, 1.5x at quality 100
  const qualityMultiplier = 0.5 + (qualityScore / 100);
  
  const totalXP = Math.round(baseXP * qualityMultiplier);
  
  return Math.max(10, totalXP); // Minimum 10 XP
}

/**
 * Get contract progress summary
 * 
 * @param {string} contractId - Contract ID
 * @returns {Promise<object>} Progress summary
 */
export async function getContractProgressSummary(contractId: string): Promise<{
  contract: IContract;
  progression: ProgressionResult;
  skillMatch: SkillMatchResult;
  teamMetrics: TeamMetrics;
}> {
  const contract = await Contract.findById(contractId).populate('assignedEmployees') as IContract;
  if (!contract) {
    throw new Error('Contract not found');
  }

  const employees = await Employee.find({
    _id: { $in: contract.assignedEmployees },
    firedAt: null,
  }) as IEmployee[];

  const progression = await calculateDailyProgress(
    contractId,
    contract.assignedEmployees.map((id) => id.toString())
  );

  const skillMatch = calculateSkillMatch(employees, contract.requiredSkills);
  const teamMetrics = calculateTeamMetrics(employees);

  return {
    contract,
    progression,
    skillMatch,
    teamMetrics,
  };
}
