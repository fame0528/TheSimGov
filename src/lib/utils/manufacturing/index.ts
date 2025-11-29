/**
 * @file src/lib/utils/manufacturing/index.ts
 * @description Manufacturing utilities barrel export
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Central export point for all manufacturing utility functions.
 * Provides clean imports for OEE, supplier scorecard, capacity planning,
 * COGS, Six Sigma, inventory management, and MRP calculations.
 * 
 * USAGE:
 * import { calculateOEE, calculateSupplierScorecard, planCapacity } from '@/lib/utils/manufacturing';
 */

// OEE calculations
export {
  calculateOEE,
  calculateAvailability,
  calculateTEEP,
  estimateSixBigLosses,
  calculateOEETrend,
  getOEERecommendations,
  type OEETrend,
  type OEERecommendation,
  type SixBigLosses,
} from './oeeCalculation';

// Supplier scorecard
export {
  calculateSupplierScorecard,
  calculateQualityScore,
  calculateDeliveryScore,
  calculateCostScore,
  assessSupplierRisk,
  generateDevelopmentPlan,
  DEFAULT_WEIGHTS,
  type QualityMetrics,
  type DeliveryMetrics,
  type CostMetrics,
  type RiskFactors,
  type RiskAssessmentResult,
  type DevelopmentPlan,
} from './supplierScorecard';

// Capacity planning
export {
  planCapacity,
  calculateUtilization,
  identifyBottleneck,
  runRCCP,
  analyzeExpansionOptions,
  optimizeShifts,
  type CapacityUtilization,
  type Resource,
  type BottleneckResult,
  type MasterScheduleItem,
  type ResourceProfile,
  type RCCPResult,
  type ExpansionOption,
  type ExpansionAnalysis,
  type ShiftConfig,
  type ShiftOptimization,
} from './capacityPlanner';

// COGS calculator
export {
  calculateCOGS,
  calculateABC,
  calculateVariances,
  calculateBreakEven,
  calculateTargetProfitUnits,
  identifyCostReductions,
  type ActivityCostPool,
  type ProductActivityUsage,
  type ABCResult,
  type StandardCosts,
  type ActualCosts,
  type VarianceAnalysis,
  type BreakEvenInputs,
  type BreakEvenResult,
  type CostReductionOpportunity,
} from './cogsCalculator';

// Six Sigma metrics
export {
  calculateSixSigma,
  sigmaToDpmo,
  calculateProcessCapability,
  calculateXBarLimits,
  detectRuleViolations,
  calculateDMAICProgress,
  type ProcessCapabilityInputs,
  type ProcessCapabilityResult,
  type ControlLimits,
  type RuleViolation,
  type DMAICPhase,
  type DMAICProject,
} from './sixSigmaMetrics';

// Inventory management
export {
  calculateInventory,
  calculateSafetyStock,
  analyzeInventoryTurnover,
  classifyABC,
  calculateHoldingCost,
  compareReviewSystems,
  identifySlowMovers,
  type SafetyStockInputs,
  type SafetyStockResult,
  type TurnoverAnalysis,
  type InventoryItem,
  type ABCClassification,
  type HoldingCostComponents,
  type ReviewSystemComparison,
  type SlowMovingItem,
} from './inventoryManager';

// MRP planning
export {
  runMRP,
  runFullMRP,
  explodeBOM,
  explodeBOMMultiLevel,
  calculateCumulativeLeadTime,
  calculateCRP,
  type LotSizingMethod,
  type BOMItem,
  type MRPRecord,
  type FullMRPInputs,
  type FullMRPResult,
  type WorkCenter,
  type RoutingStep,
  type CRPResult,
} from './mrpPlanner';
