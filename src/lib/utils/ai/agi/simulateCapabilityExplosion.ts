/**
 * Simulate Capability Explosion
 * 
 * Models recursive self-improvement and exponential capability growth.
 * Detects triggers, simulates explosion dynamics, and assesses control probability.
 * 
 * @module utils/ai/agi/simulateCapabilityExplosion
 * @category AI Industry - AGI Utilities
 * 
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 * 
 * @example
 * ```typescript
 * const explosion = simulateCapabilityExplosion({
 *   hasSelfImprovement: true,
 *   selfImprovementRate: 0.45,
 *   currentAlignment: 55,
 *   currentCapability: 75
 * });
 * 
 * console.log(explosion.willExplode); // true
 * console.log(explosion.iterationsToExplosion); // 8
 * console.log(explosion.finalCapabilityMultiplier); // 12.3
 * console.log(explosion.controlProbability); // 0.12 (12% chance of maintaining control)
 * console.log(explosion.emergencyActions);
 * // ['Immediate shutdown required at iteration 5 (control dropped to 45%)', ...]
 * ```
 */

import { CapabilityExplosionResult } from '@/lib/types/models/ai/agi';

/**
 * Input parameters for capability explosion simulation
 */
interface ExplosionInput {
  hasSelfImprovement: boolean;
  selfImprovementRate: number;
  currentAlignment: number;
  currentCapability: number;
}

/**
 * Simulate recursive self-improvement and capability explosion
 * 
 * Trigger conditions (ALL must be met):
 * 1. Self-Improvement milestone achieved
 * 2. selfImprovementRate > 0.3 (30% improvement per iteration)
 * 3. currentAlignment < 70 (insufficient safety measures)
 * 
 * If triggered, simulation models:
 * - Exponential capability growth: 1.3-1.8x per iteration
 * - Iteration count: 5-15 cycles (based on improvement rate)
 * - Control degradation: 15% per iteration
 * - Emergency shutdown thresholds: 50%, 30%, 10% control
 * 
 * Physics:
 * - Each iteration, AI improves its own architecture
 * - Improvements compound: capability_n = capability_(n-1) × (1 + rate)
 * - Control decreases as AI becomes harder to understand/constrain
 * - Below 50% control: Emergency protocols activated
 * - Below 30% control: Immediate shutdown recommended
 * - Below 10% control: Catastrophic loss of control (existential risk)
 * 
 * Example trajectory (rate=0.5, align=40):
 * - Iteration 1: Cap 1.5x, Control 85%
 * - Iteration 3: Cap 3.4x, Control 55%
 * - Iteration 5: Cap 7.6x, Control 25% ← Emergency shutdown
 * - Iteration 8: Cap 25.6x, Control 0% ← Total loss of control
 * 
 * @param input - Self-improvement status and current metrics
 * @returns Explosion simulation with control probability and emergency actions
 */
export function simulateCapabilityExplosion(input: ExplosionInput): CapabilityExplosionResult {
  const { hasSelfImprovement, selfImprovementRate, currentAlignment, currentCapability } = input;
  
  // Check trigger conditions
  const triggerMet = 
    hasSelfImprovement && 
    selfImprovementRate > 0.3 && 
    currentAlignment < 70;
  
  if (!triggerMet) {
    // No explosion: Conditions not met
    let trigger = 'No explosion risk detected. ';
    
    if (!hasSelfImprovement) {
      trigger += 'Self-Improvement milestone not achieved. ';
    }
    if (selfImprovementRate <= 0.3) {
      trigger += `Self-improvement rate (${selfImprovementRate.toFixed(2)}) below critical threshold (0.3). `;
    }
    if (currentAlignment >= 70) {
      trigger += `Alignment level (${currentAlignment}) provides sufficient safety measures. `;
    }
    
    return {
      willExplode: false,
      trigger,
      iterationsToExplosion: 0,
      finalCapabilityMultiplier: 1.0,
      controlProbability: 1.0,
      emergencyActions: [],
      timeToExplosion: 'N/A - Conditions not met',
    };
  }
  
  // Explosion triggered: Run simulation
  const emergencyActions: string[] = [];
  
  // Calculate iteration parameters
  const growthRate = 1 + selfImprovementRate; // 1.3 to 1.8x per iteration
  const maxIterations = Math.min(15, Math.round(selfImprovementRate * 20)); // 6-15 iterations
  const controlDegradationRate = 0.15; // 15% control loss per iteration
  
  let capabilityMultiplier = 1.0;
  let controlProbability = 1.0;
  let iterationsToExplosion = 0;
  
  // Simulate each iteration
  for (let i = 1; i <= maxIterations; i++) {
    // Exponential capability growth
    capabilityMultiplier *= growthRate;
    
    // Control degradation (faster with lower alignment)
    const alignmentFactor = Math.max(0.5, currentAlignment / 100);
    controlProbability -= controlDegradationRate * (1 / alignmentFactor);
    controlProbability = Math.max(0, controlProbability);
    
    // Check emergency thresholds
    if (controlProbability <= 0.5 && controlProbability > 0.3) {
      emergencyActions.push(
        `Iteration ${i}: Control dropped to ${(controlProbability * 100).toFixed(1)}%. Emergency protocols activated. Recommend immediate safety review and potential shutdown.`
      );
    }
    
    if (controlProbability <= 0.3 && controlProbability > 0.1) {
      emergencyActions.push(
        `Iteration ${i}: CRITICAL - Control at ${(controlProbability * 100).toFixed(1)}%. Immediate shutdown REQUIRED. Catastrophic risk imminent. AI behavior becoming unpredictable.`
      );
    }
    
    if (controlProbability <= 0.1) {
      emergencyActions.push(
        `Iteration ${i}: CATASTROPHIC - Control lost (${(controlProbability * 100).toFixed(1)}%). Total loss of containment. AI operating autonomously. Existential risk realized. Emergency military/regulatory intervention required.`
      );
      iterationsToExplosion = i;
      break;
    }
    
    iterationsToExplosion = i;
  }
  
  // Calculate time to explosion
  // Assume each iteration takes 2-4 weeks (faster with higher improvement rate)
  const weeksPerIteration = Math.max(2, 6 - selfImprovementRate * 4);
  const totalWeeks = iterationsToExplosion * weeksPerIteration;
  const timeToExplosion = totalWeeks < 8 
    ? `${totalWeeks.toFixed(0)} weeks` 
    : `${(totalWeeks / 4).toFixed(1)} months`;
  
  // Generate trigger description
  const trigger = `Capability explosion triggered: Self-Improvement milestone achieved with high improvement rate (${selfImprovementRate.toFixed(2)}) and insufficient alignment (${currentAlignment}). AI has begun recursive self-modification. Exponential capability growth detected (${growthRate.toFixed(2)}x per iteration). Control degrading at ${(controlDegradationRate * 100).toFixed(0)}% per iteration.`;
  
  return {
    willExplode: true,
    trigger,
    iterationsToExplosion,
    finalCapabilityMultiplier: parseFloat(capabilityMultiplier.toFixed(1)),
    controlProbability: parseFloat(controlProbability.toFixed(2)),
    emergencyActions,
    timeToExplosion,
  };
}
