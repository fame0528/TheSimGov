/**
 * @file src/lib/types/gameTick.ts
 * @description Type definitions for the Game Tick Engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * The Game Tick Engine processes time-based events across all game systems.
 * Each "tick" represents one game month passing, triggering:
 * - Loan payments and interest accrual
 * - Deposit interest payouts
 * - Random events (defaults, windfalls)
 * - Resource flows between companies
 * - XP awards and level progression
 *
 * ARCHITECTURE:
 * TickEngine orchestrates multiple TickProcessors, each handling one domain.
 * Processors are independent and can be added/removed without affecting others.
 *
 * @author ECHO v1.4.0
 */

// ============================================================================
// CORE TICK TYPES
// ============================================================================

/**
 * Game time representation
 */
export interface GameTime {
  year: number;
  month: number;        // 1-12
  totalMonths: number;  // Total months since game start
}

/**
 * Tick execution result from a single processor
 */
export interface TickProcessorResult {
  processor: string;           // Processor name (e.g., 'banking', 'empire')
  success: boolean;
  itemsProcessed: number;      // How many entities were processed
  errors: TickError[];         // Any errors encountered
  summary: { [key: string]: unknown }; // Processor-specific summary data
  durationMs: number;          // How long processing took
}

/**
 * Error during tick processing
 */
export interface TickError {
  entityId: string;
  entityType: string;
  message: string;
  stack?: string;
  recoverable: boolean;
}

/**
 * Complete tick execution result
 */
export interface TickResult {
  tickId: string;              // Unique ID for this tick
  gameTime: GameTime;          // What game time this tick represents
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  processors: TickProcessorResult[];
  totalItemsProcessed: number;
  totalErrors: number;
  success: boolean;
}

// ============================================================================
// PROCESSOR INTERFACES
// ============================================================================

/**
 * Base interface for tick processors
 * Each game system implements this to handle its time-based events
 */
export interface ITickProcessor {
  /** Unique name for this processor */
  name: string;
  
  /** Order of execution (lower = earlier) */
  priority: number;
  
  /** Whether this processor is enabled */
  enabled: boolean;
  
  /**
   * Process one tick for this system
   * @param gameTime - Current game time
   * @param options - Processing options
   * @returns Processing result
   */
  process(gameTime: GameTime, options?: TickProcessorOptions): Promise<TickProcessorResult>;
  
  /**
   * Validate processor is ready to run
   * @returns true if ready, error message if not
   */
  validate(): Promise<true | string>;
}

/**
 * Options passed to processors
 */
export interface TickProcessorOptions {
  /** Only process specific player */
  playerId?: string;
  
  /** Only process specific company */
  companyId?: string;
  
  /** Dry run - don't actually save changes */
  dryRun?: boolean;
  
  /** Force processing even if already processed this tick */
  force?: boolean;
  
  /** Maximum items to process (for batching) */
  limit?: number;
}

// ============================================================================
// BANKING TICK TYPES
// ============================================================================

/**
 * Result of processing a single loan
 */
export interface LoanTickResult {
  loanId: string;
  bankId: string;
  action: 'PAYMENT_DUE' | 'PAYMENT_RECEIVED' | 'LATE_FEE' | 'DEFAULT' | 'PAID_OFF' | 'NO_ACTION';
  amountProcessed?: number;
  interestAccrued?: number;
  xpEarned?: number;
  newStatus?: string;
  error?: string;
}

/**
 * Result of processing a single deposit
 */
export interface DepositTickResult {
  depositId: string;
  bankId: string;
  action: 'INTEREST_PAID' | 'MATURED' | 'WITHDRAWN' | 'NO_ACTION';
  interestPaid?: number;
  newBalance?: number;
  error?: string;
}

/**
 * Summary of banking tick processing
 */
export interface BankingTickSummary {
  [key: string]: unknown;  // Index signature for compatibility
  loansProcessed: number;
  paymentsReceived: number;
  totalPaymentAmount: number;
  lateFeesCollected: number;
  defaultsTriggered: number;
  loansPaidOff: number;
  
  depositsProcessed: number;
  interestPaidOut: number;
  depositsMatured: number;
  
  totalXpEarned: number;
  totalRevenueGenerated: number;
  totalExpenses: number;
  netProfit: number;
}

// ============================================================================
// EMPIRE TICK TYPES
// ============================================================================

/**
 * Result of processing resource flows
 */
export interface ResourceFlowTickResult {
  flowId: string;
  fromCompanyId: string;
  toCompanyId: string;
  resourceType: string;
  amount: number;
  success: boolean;
  error?: string;
}

/**
 * Summary of empire tick processing
 */
export interface EmpireTickSummary {
  [key: string]: unknown;
  flowsProcessed: number;
  flowsSuccessful: number;
  flowsFailed: number;
  totalResourcesTransferred: Record<string, number>;
  synergiesActivated: number;
  synergiesDeactivated: number;
  xpEarned: number;
}

/**
 * Summary of energy tick processing
 */
export interface EnergyTickSummary {
  [key: string]: unknown;
  
  // Facilities processed
  oilWellsProcessed: number;
  solarFarmsProcessed: number;
  windTurbinesProcessed: number;
  gasFieldsProcessed: number;
  powerPlantsProcessed: number;
  
  // Production totals
  totalOilProduced: number;
  totalGasProduced: number;
  totalElectricityGenerated: number;
  
  // Revenue
  commoditySalesRevenue: number;
  ppaSalesRevenue: number;
  spotMarketRevenue: number;
  totalRevenue: number;
  
  // Expenses
  fuelCosts: number;
  maintenanceCosts: number;
  operatingCosts: number;
  totalExpenses: number;
  
  // Net
  netProfit: number;
}

/**
 * Summary of manufacturing tick processing
 */
export interface ManufacturingTickSummary {
  [key: string]: unknown;
  
  // Facilities & lines processed
  facilitiesProcessed: number;
  productionLinesProcessed: number;
  suppliersProcessed: number;
  
  // Production totals
  unitsProduced: number;
  batchesCompleted: number;
  defectsDetected: number;
  scrapGenerated: number;
  
  // OEE metrics
  averageOEE: number;
  averageAvailability: number;
  averagePerformance: number;
  averageQuality: number;
  
  // Financial
  productionRevenue: number;
  laborCosts: number;
  materialCosts: number;
  energyCosts: number;
  maintenanceCosts: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  // Issues
  breakdownsOccurred: number;
  maintenanceDue: number;
}

// ============================================================================
// RETAIL TICK TYPES
// ============================================================================

/**
 * Summary of retail tick processing
 */
export interface RetailTickSummary {
  [key: string]: unknown;
  
  // Orders processed
  ordersPending: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersReturned: number;
  ordersCancelled: number;
  
  // Financial
  grossRevenue: number;
  returnsRefunded: number;
  shippingCosts: number;
  processingFees: number;
  netRevenue: number;
  
  // Inventory
  productsProcessed: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  
  // Metrics
  averageOrderValue: number;
  fulfillmentRate: number;
}

// ============================================================================
// TECH TICK TYPES
// ============================================================================

/**
 * Summary of tech tick processing
 */
export interface TechTickSummary {
  [key: string]: unknown;
  
  // Subscriptions
  subscriptionsProcessed: number;
  activeSubscribers: number;
  newSubscribers: number;
  churnedSubscribers: number;
  churnRate: number;
  
  // Revenue
  subscriptionRevenue: number;
  apiUsageRevenue: number;
  licenseRevenue: number;
  totalRevenue: number;
  
  // Metrics
  mrr: number;
  arr: number;
  avgRevenuePerSubscriber: number;
  
  // Products
  productsProcessed: number;
  productsActive: number;
}

// ============================================================================
// MEDIA TICK TYPES
// ============================================================================

/**
 * Summary of media tick processing
 */
export interface MediaTickSummary {
  [key: string]: unknown;
  
  // Content
  contentProcessed: number;
  publishedContent: number;
  trendingContent: number;
  archivedContent: number;
  
  // Audience
  audiencesProcessed: number;
  totalFollowers: number;
  newFollowers: number;
  churnedFollowers: number;
  avgEngagementRate: number;
  
  // Revenue
  adRevenue: number;
  sponsorshipRevenue: number;
  totalRevenue: number;
  avgCPM: number;
  
  // Metrics
  totalViews: number;
  totalShares: number;
  viralContentCount: number;
}

// ============================================================================
// CONSULTING TICK TYPES
// ============================================================================

/**
 * Summary of consulting tick processing
 */
export interface ConsultingTickSummary {
  [key: string]: unknown;
  
  // Projects
  projectsProcessed: number;
  projectsActive: number;
  projectsCompleted: number;
  milestonesCompleted: number;
  
  // Time tracking
  hoursWorked: number;
  hoursRemaining: number;
  avgUtilization: number;
  
  // Revenue by billing model
  hourlyRevenue: number;
  fixedFeeRevenue: number;
  retainerRevenue: number;
  performanceBonuses: number;
  totalRevenue: number;
  
  // Costs
  laborCosts: number;
  profitMargin: number;
  
  // Client satisfaction
  avgClientSatisfaction: number;
  onTimeDeliveryRate: number;
}

// ============================================================================
// HEALTHCARE TICK TYPES
// ============================================================================

/**
 * Summary of healthcare tick processing
 */
export interface HealthcareTickSummary {
  [key: string]: unknown;
  
  // Research & Development
  researchProjectsProcessed: number;
  projectsAdvancedPhase: number;
  projectsFailed: number;
  projectsCompleted: number;
  patentsAwarded: number;
  publicationsPublished: number;
  
  // Clinical Trials
  trialsRecruiting: number;
  trialsActive: number;
  patientsEnrolled: number;
  adverseEvents: number;
  
  // Pharmaceuticals & Devices
  drugsApproved: number;
  devicesApproved: number;
  productRevenue: number;
  
  // Healthcare Services
  clinicsProcessed: number;
  hospitalsProcessed: number;
  patientVisits: number;
  proceduresPerformed: number;
  serviceRevenue: number;
  
  // Insurance
  insurancePoliciesProcessed: number;
  premiumsCollected: number;
  claimsPaid: number;
  
  // Financial
  totalRevenue: number;
  totalExpenses: number;
  rdCosts: number;
  netProfit: number;
}

// ============================================================================
// CRIME TICK TYPES
// ============================================================================

/**
 * Summary of crime tick processing
 */
export interface CrimeTickSummary {
  [key: string]: unknown;
  
  // Players processed
  playersProcessed: number;
  activeDealers: number;
  
  // Heat mechanics
  heatDecayed: number;
  avgHeatLevel: number;
  playersArrested: number;
  playersMugged: number;
  
  // Price fluctuations
  pricesUpdated: number;
  avgPriceChange: number;
  bullMarkets: number;  // Substances with rising prices
  bearMarkets: number;  // Substances with falling prices
  
  // Production (future)
  facilitiesProcessed: number;
  unitsProduced: number;
  productionRevenue: number;
  
  // Distribution (future)
  routesProcessed: number;
  shipmentsCompleted: number;
  shipmentsIntercepted: number;
  
  // Territory (future)
  territoriesProcessed: number;
  territoryTaxCollected: number;
  
  // Totals
  totalDeals: number;
  totalProfit: number;
}

// ============================================================================
// POLITICS TICK TYPES
// ============================================================================

/**
 * Summary of politics tick processing
 */
export interface PoliticsTickSummary {
  [key: string]: unknown;
  
  // Bills & Legislation
  billsProcessed: number;
  billsAdvanced: number;
  billsPassed: number;
  billsFailed: number;
  billsVetoed: number;
  billsSigned: number;
  
  // Campaigns & Elections
  campaignsProcessed: number;
  electionsHeld: number;
  electionsWon: number;
  electionsLost: number;
  votesReceived: number;
  
  // Lobbying
  lobbyingActionsProcessed: number;
  lobbyingSuccessful: number;
  lobbyingInfluenceSpent: number;
  
  // Donations & Fundraising
  donationsProcessed: number;
  donationsReceived: number;
  totalFundsRaised: number;
  
  // Unions & Paramilitaries
  unionsProcessed: number;
  membershipChanges: number;
  strikesStarted: number;
  strikesEnded: number;
  paramilitariesProcessed: number;
  
  // Voter Outreach
  outreachActionsProcessed: number;
  votersReached: number;
  supportGained: number;
  
  // Financial
  campaignSpending: number;
  lobbyingSpending: number;
  totalPoliticalSpending: number;
}

// ============================================================================
// TICK ENGINE CONFIGURATION
// ============================================================================

/**
 * Configuration for the tick engine
 */
export interface TickEngineConfig {
  /** Processors to run */
  processors: ITickProcessor[];
  
  /** Whether to continue on processor errors */
  continueOnError: boolean;
  
  /** Maximum tick duration before timeout (ms) */
  timeoutMs: number;
  
  /** Whether to log detailed progress */
  verbose: boolean;
}

/**
 * Tick engine state
 */
export interface TickEngineState {
  lastTick: GameTime | null;
  lastTickAt: Date | null;
  ticksProcessed: number;
  isProcessing: boolean;
  currentProcessor: string | null;
}

// ============================================================================
// TICK HISTORY & AUDIT
// ============================================================================

/**
 * Stored tick record for history/audit
 */
export interface TickRecord {
  _id?: string;
  tickId: string;
  gameTime: GameTime;
  triggeredBy: 'CRON' | 'MANUAL' | 'CATCHUP';
  triggeredByUserId?: string;
  result: TickResult;
  createdAt: Date;
}

/**
 * Tick schedule configuration
 */
export interface TickSchedule {
  /** Cron expression for automatic ticks */
  cronExpression: string;
  
  /** Whether automatic ticks are enabled */
  enabled: boolean;
  
  /** Timezone for cron */
  timezone: string;
  
  /** Game months per real tick */
  gameMonthsPerTick: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request to trigger a tick
 */
export interface TriggerTickRequest {
  /** Optional: only process specific player */
  playerId?: string;
  
  /** Optional: number of ticks to process (for catchup) */
  count?: number;
  
  /** Optional: dry run */
  dryRun?: boolean;
  
  /** Optional: force even if recently processed */
  force?: boolean;
}

/**
 * Response from tick trigger
 */
export interface TriggerTickResponse {
  success: boolean;
  message: string;
  tickId?: string;
  gameTime?: GameTime;
  result?: TickResult;
  error?: string;
}

/**
 * Tick status response
 */
export interface TickStatusResponse {
  engineState: TickEngineState;
  schedule: TickSchedule;
  lastResult?: TickResult;
  nextScheduledTick?: Date;
}

export default {
  // Re-export for convenience
};
