/**
 * @file src/lib/types/empire.ts
 * @description Type definitions for the Interconnected Empire System
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Defines types for the synergy system connecting player-owned companies.
 * When a player owns multiple company types, synergies create bonuses:
 * - Direct Synergies: Company A helps Company B directly
 * - Compound Synergies: Owning A+B unlocks special bonuses
 * - Empire Bonuses: Multi-industry chains create multipliers
 *
 * THE VISION:
 * Every company in the player's empire connects to others, creating
 * exponential growth - just like real business empires (Musk, Bezos).
 * Banking is the financial backbone that finances everything.
 */

/**
 * All supported industries in the empire system.
 * Extends IndustryType from enums.ts with additional categories.
 */
export enum EmpireIndustry {
  // Core Industries (from IndustryType)
  BANKING = 'BANKING',
  TECH = 'TECH',
  MEDIA = 'MEDIA',
  REAL_ESTATE = 'REAL_ESTATE',
  ENERGY = 'ENERGY',
  MANUFACTURING = 'MANUFACTURING',
  HEALTHCARE = 'HEALTHCARE',
  LOGISTICS = 'LOGISTICS',
  POLITICS = 'POLITICS', // Special: Influence through donations/lobbying
  RETAIL = 'RETAIL',
  CONSULTING = 'CONSULTING',
  CRIME = 'CRIME', // Underground economy
}

/**
 * Resource types that flow between companies
 */
export enum ResourceType {
  // Financial Resources
  CAPITAL = 'CAPITAL',           // Cash/loans
  CREDIT = 'CREDIT',             // Lines of credit
  INVESTMENT = 'INVESTMENT',     // Equity stakes

  // Operational Resources
  ENERGY_POWER = 'ENERGY_POWER', // Electricity
  ENERGY_FUEL = 'ENERGY_FUEL',   // Gas/oil
  RAW_MATERIALS = 'RAW_MATERIALS',
  MANUFACTURED_GOODS = 'MANUFACTURED_GOODS',
  
  // Tech Resources
  SOFTWARE = 'SOFTWARE',
  AI_AUTOMATION = 'AI_AUTOMATION',
  DATA_ANALYTICS = 'DATA_ANALYTICS',
  
  // Media Resources
  ADVERTISING = 'ADVERTISING',
  INFLUENCE = 'INFLUENCE',
  USER_DATA = 'USER_DATA',
  
  // Real Estate Resources
  LAND = 'LAND',
  BUILDINGS = 'BUILDINGS',
  WAREHOUSE_SPACE = 'WAREHOUSE_SPACE',
  
  // Logistics Resources
  TRANSPORT = 'TRANSPORT',
  STORAGE = 'STORAGE',
  DISTRIBUTION = 'DISTRIBUTION',
  
  // Healthcare Resources
  HEALTH_SERVICES = 'HEALTH_SERVICES',
  RESEARCH = 'RESEARCH',
  
  // Political Resources
  LEGISLATION = 'LEGISLATION',
  CONTRACTS = 'CONTRACTS',
  TAX_BREAKS = 'TAX_BREAKS',
}

/**
 * Synergy bonus types
 */
export enum SynergyBonusType {
  PERCENTAGE = 'PERCENTAGE',     // +15% revenue
  FLAT = 'FLAT',                  // +$10,000/month
  UNLOCK = 'UNLOCK',              // Unlocks new feature
  COST_REDUCTION = 'COST_REDUCTION', // -20% operating costs
  EFFICIENCY = 'EFFICIENCY',      // +10% production speed
}

/**
 * What the synergy bonus affects
 */
export enum SynergyBonusTarget {
  REVENUE = 'REVENUE',
  OPERATING_COST = 'OPERATING_COST',
  LOAN_RATE = 'LOAN_RATE',
  DEPOSIT_RATE = 'DEPOSIT_RATE',
  PRODUCTION_SPEED = 'PRODUCTION_SPEED',
  CUSTOMER_ACQUISITION = 'CUSTOMER_ACQUISITION',
  DEFAULT_RATE = 'DEFAULT_RATE',
  REPUTATION = 'REPUTATION',
  FEATURE_UNLOCK = 'FEATURE_UNLOCK',
  ALL_PROFITS = 'ALL_PROFITS',
}

/**
 * Tier levels for synergies
 */
export enum SynergyTier {
  BASIC = 'BASIC',       // 2 industries
  ADVANCED = 'ADVANCED', // 3 industries
  ELITE = 'ELITE',       // 4 industries
  ULTIMATE = 'ULTIMATE', // 5+ industries
}

/**
 * Synergy definition - how industries connect
 */
export interface SynergyDefinition {
  id: string;
  name: string;                          // "Fintech Empire", "Property Mogul"
  description: string;                   // What this synergy does
  requiredIndustries: EmpireIndustry[];  // Which industries needed
  tier: SynergyTier;
  bonuses: SynergyBonus[];               // Multiple bonuses possible
  icon?: string;                         // For UI display
  color?: string;                        // Theme color
  unlockLevel?: number;                  // Min empire level required
}

/**
 * Individual bonus from a synergy
 */
export interface SynergyBonus {
  type: SynergyBonusType;
  target: SynergyBonusTarget;
  value: number;                         // Amount (% or flat)
  appliesToIndustry?: EmpireIndustry;    // If specific industry
  description: string;                   // Human-readable
}

/**
 * Active synergy for a player - instantiated from SynergyDefinition
 */
export interface ActiveSynergy {
  synergyId: string;
  synergy: SynergyDefinition;
  activatedAt: Date;
  contributingCompanyIds: string[];      // Which companies enable this
  currentBonuses: CalculatedBonus[];     // Actual calculated values
}

/**
 * Calculated bonus value after all modifiers
 */
export interface CalculatedBonus {
  synergyId: string;
  synergyName: string;
  type: SynergyBonusType;
  target: SynergyBonusTarget;
  baseValue: number;
  multiplier: number;                    // From empire level, etc.
  finalValue: number;
  description: string;
}

/**
 * Resource flow between companies
 */
export interface IResourceFlow {
  id: string;
  fromCompanyId: string;
  fromCompanyName: string;
  fromIndustry: EmpireIndustry;
  toCompanyId: string;
  toCompanyName: string;
  toIndustry: EmpireIndustry;
  resourceType: ResourceType;
  quantity: number;
  pricePerUnit: number;                  // 0 for internal transfers
  isInternal: boolean;                   // Same owner = free
  frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  createdAt: Date;
  lastFlowAt?: Date;
}

/**
 * Player's empire - aggregation of all owned companies
 */
export interface IPlayerEmpire {
  id: string;
  userId: string;                        // Player user ID
  name?: string;                         // Optional empire name
  companies: EmpireCompany[];            // All owned companies
  activeSynergies: ActiveSynergy[];      // Currently active synergies
  totalValue: number;                    // Sum of all company values
  monthlyRevenue: number;                // Combined revenue
  monthlyExpenses: number;               // Combined expenses
  resourceFlows: IResourceFlow[];        // Active resource transfers
  empireLevel: number;                   // Overall empire progression
  empireXp: number;                      // XP toward next level
  industryCount: number;                 // Unique industries owned
  synergyMultiplier: number;             // Global bonus from synergies
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company as part of empire (simplified view)
 */
export interface EmpireCompany {
  companyId: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  revenue: number;
  value: number;
  isHeadquarters: boolean;               // Primary company
  synergyContributions: string[];        // Which synergies this enables
  receivingBonuses: CalculatedBonus[];   // Bonuses applied to this company
}

/**
 * Empire statistics for dashboard
 */
export interface EmpireStats {
  totalCompanies: number;
  industriesCovered: EmpireIndustry[];
  activeSynergiesCount: number;
  totalSynergyBonus: number;             // Combined percentage bonus
  monthlyPassiveIncome: number;
  resourceFlowsCount: number;
  empireLevel: number;
  empireXp: number;
  nextLevelXp: number;
  totalAssetValue: number;
}

/**
 * Synergy discovery - potential synergies player could unlock
 */
export interface PotentialSynergy {
  synergy: SynergyDefinition;
  missingIndustries: EmpireIndustry[];
  percentComplete: number;               // 50% = have 2 of 4 industries
  estimatedBonus: number;                // Projected value
}

/**
 * Resource production/consumption per industry
 */
export interface IndustryResources {
  industry: EmpireIndustry;
  produces: ResourceType[];
  consumes: ResourceType[];
  optimalPartners: EmpireIndustry[];     // Best synergy matches
}

/**
 * Empire level requirements
 */
export interface EmpireLevelRequirement {
  level: number;
  name: string;                          // "Startup Mogul", "Industry Titan"
  xpRequired: number;
  minCompanies: number;
  minIndustries: number;
  minTotalValue: number;
  unlocks: string[];                     // Features unlocked at this level
  synergyMultiplier: number;             // Bonus to all synergies
}

/**
 * DTO for API responses
 */
export interface EmpireDTO {
  empire: IPlayerEmpire;
  stats: EmpireStats;
  activeSynergies: ActiveSynergy[];
  potentialSynergies: PotentialSynergy[];
  industryResources: IndustryResources[];
}

/**
 * Synergy calculation request
 */
export interface SynergyCalculationRequest {
  userId: string;
  companyIds: string[];
  includeProjections?: boolean;          // Calculate potential synergies
}

/**
 * Synergy calculation result
 */
export interface SynergyCalculationResult {
  activeSynergies: ActiveSynergy[];
  totalBonusPercentage: number;
  bonusesByTarget: Record<SynergyBonusTarget, number>;
  potentialSynergies?: PotentialSynergy[];
}

/**
 * Pre-defined synergy combos (for reference in seed data)
 */
export const SYNERGY_COMBOS = {
  // 2-Industry Synergies (Basic)
  FINTECH_EMPIRE: 'fintech-empire',           // Banking + Tech
  PROPERTY_MOGUL: 'property-mogul',           // Banking + Real Estate
  FINANCIAL_INFLUENCER: 'financial-influencer', // Banking + Media
  GREEN_FINANCE: 'green-finance',             // Banking + Energy
  INDUSTRIAL_BANKER: 'industrial-banker',     // Banking + Manufacturing
  
  // 3-Industry Synergies (Advanced)
  DATA_GOLDMINE: 'data-goldmine',             // Banking + Tech + Media
  INFRASTRUCTURE_KING: 'infrastructure-king', // Banking + Real Estate + Energy
  SUPPLY_CHAIN_MASTER: 'supply-chain-master', // Manufacturing + Logistics + Retail
  HEALTHCARE_ECOSYSTEM: 'healthcare-ecosystem', // Healthcare + Tech + Real Estate
  
  // 4-Industry Synergies (Elite)
  VERTICAL_INTEGRATION: 'vertical-integration', // Manufacturing + Energy + Logistics + Retail
  MEDIA_EMPIRE: 'media-empire',               // Media + Tech + Politics + Banking
  
  // 5+ Industry Synergies (Ultimate)
  TOTAL_MONOPOLY: 'total-monopoly',           // All industries
} as const;

/**
 * Industry connection map - which industries connect to which
 */
export const INDUSTRY_CONNECTIONS: Record<EmpireIndustry, EmpireIndustry[]> = {
  [EmpireIndustry.BANKING]: [
    EmpireIndustry.TECH, EmpireIndustry.REAL_ESTATE, EmpireIndustry.MEDIA,
    EmpireIndustry.ENERGY, EmpireIndustry.MANUFACTURING, EmpireIndustry.HEALTHCARE,
    EmpireIndustry.LOGISTICS, EmpireIndustry.POLITICS,
  ],
  [EmpireIndustry.TECH]: [
    EmpireIndustry.BANKING, EmpireIndustry.MEDIA, EmpireIndustry.HEALTHCARE,
    EmpireIndustry.MANUFACTURING, EmpireIndustry.ENERGY, EmpireIndustry.LOGISTICS,
  ],
  [EmpireIndustry.MEDIA]: [
    EmpireIndustry.BANKING, EmpireIndustry.TECH, EmpireIndustry.POLITICS,
    EmpireIndustry.RETAIL, EmpireIndustry.HEALTHCARE,
  ],
  [EmpireIndustry.REAL_ESTATE]: [
    EmpireIndustry.BANKING, EmpireIndustry.ENERGY, EmpireIndustry.MANUFACTURING,
    EmpireIndustry.LOGISTICS, EmpireIndustry.RETAIL,
  ],
  [EmpireIndustry.ENERGY]: [
    EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE, EmpireIndustry.MANUFACTURING,
    EmpireIndustry.TECH, EmpireIndustry.LOGISTICS,
  ],
  [EmpireIndustry.MANUFACTURING]: [
    EmpireIndustry.BANKING, EmpireIndustry.ENERGY, EmpireIndustry.LOGISTICS,
    EmpireIndustry.RETAIL, EmpireIndustry.TECH,
  ],
  [EmpireIndustry.HEALTHCARE]: [
    EmpireIndustry.BANKING, EmpireIndustry.TECH, EmpireIndustry.REAL_ESTATE,
    EmpireIndustry.MANUFACTURING, EmpireIndustry.MEDIA,
  ],
  [EmpireIndustry.LOGISTICS]: [
    EmpireIndustry.BANKING, EmpireIndustry.MANUFACTURING, EmpireIndustry.RETAIL,
    EmpireIndustry.REAL_ESTATE, EmpireIndustry.ENERGY,
  ],
  [EmpireIndustry.POLITICS]: [
    EmpireIndustry.BANKING, EmpireIndustry.MEDIA, EmpireIndustry.REAL_ESTATE,
    EmpireIndustry.ENERGY, EmpireIndustry.MANUFACTURING,
  ],
  [EmpireIndustry.RETAIL]: [
    EmpireIndustry.MANUFACTURING, EmpireIndustry.LOGISTICS, EmpireIndustry.MEDIA,
    EmpireIndustry.REAL_ESTATE, EmpireIndustry.TECH,
  ],
  [EmpireIndustry.CONSULTING]: [
    EmpireIndustry.TECH, EmpireIndustry.BANKING, EmpireIndustry.HEALTHCARE,
    EmpireIndustry.MANUFACTURING, EmpireIndustry.POLITICS,
  ],
  [EmpireIndustry.CRIME]: [
    EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE, EmpireIndustry.LOGISTICS,
    EmpireIndustry.POLITICS, EmpireIndustry.MEDIA,
  ],
};

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Industry Enum**: Separate from IndustryType to support empire-specific
 *    categories (CRIME, POLITICS as influence)
 *
 * 2. **Synergy Tiers**: Balance complexity - basic synergies easy to achieve,
 *    ultimate synergies require significant empire building
 *
 * 3. **Resource Types**: Map to actual gameplay resources that flow between
 *    companies, creating economic dependencies
 *
 * 4. **Connection Map**: Defines which industries can synergize - not all
 *    combinations make sense (e.g., Crime + Healthcare limited)
 *
 * 5. **Bonus Targets**: Specific effects players can stack and optimize
 *
 * USAGE:
 * ```typescript
 * import { EmpireIndustry, SynergyDefinition } from '@/lib/types/empire';
 *
 * const hasFintech = empire.activeSynergies.some(
 *   s => s.synergy.requiredIndustries.includes(EmpireIndustry.BANKING)
 *     && s.synergy.requiredIndustries.includes(EmpireIndustry.TECH)
 * );
 * ```
 */
