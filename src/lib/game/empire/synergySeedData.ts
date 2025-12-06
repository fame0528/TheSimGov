/**
 * @file src/lib/game/empire/synergySeedData.ts
 * @description Default synergy definitions for the Interconnected Empire system
 *
 * OVERVIEW:
 * Contains all predefined synergy configurations that create meaningful gameplay
 * connections between different industries. These synergies are seeded into the
 * database when the game initializes or when a new game world is created.
 *
 * SYNERGY PHILOSOPHY:
 * - Each industry should synergize with at least 3 others
 * - Higher tier synergies require more investments but yield greater rewards
 * - Some synergies unlock special features rather than just bonuses
 * - Empire chains encourage building diversified empires
 *
 * @author ECHO v1.4.0 Automated Generation
 * @created 2024-12-05
 */

import {
  EmpireIndustry,
  SynergyTier,
  SynergyBonusType,
  SynergyBonusTarget,
} from '@/lib/types/empire';
import type { ISynergyBonus } from '@/lib/db/models/empire/Synergy';

/**
 * Seed synergy definition (matches Synergy model without Document fields)
 */
export interface SeedSynergyDefinition {
  synergyId: string;
  name: string;
  description: string;
  requiredIndustries: EmpireIndustry[];
  tier: SynergyTier;
  unlockLevel: number;
  bonuses: ISynergyBonus[];
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * All predefined synergy definitions for seeding
 * Organized by primary industry for clarity
 */
export const SYNERGY_SEED_DATA: SeedSynergyDefinition[] = [
  // ============================================
  // BANKING SYNERGIES (Basic Tier - 2 Industries)
  // ============================================

  // Banking + Tech: Digital Banking Revolution
  {
    synergyId: 'fintech-empire',
    name: 'Fintech Empire',
    description: 'Tech companies enhance banking operations with AI and automation, reducing costs and improving customer acquisition',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 15,
        description: 'Automated operations reduce operating costs by 15%',
      },
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.PRODUCTION_SPEED,
        value: 20,
        description: 'AI-powered risk assessment improves loan approval speed by 20%',
      },
    ],
    icon: '💳',
    color: '#3B82F6',
    isActive: true,
    sortOrder: 1,
  },

  // Banking + Real Estate: Property Mogul
  {
    synergyId: 'property-mogul',
    name: 'Property Mogul',
    description: 'Banks provide preferential financing to real estate holdings, while properties serve as collateral',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 12,
        description: 'Mortgage revenue increases 12% from integrated property portfolio',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.LOAN_RATE,
        value: 8,
        description: 'Lower interest rates on property investments by 8%',
      },
    ],
    icon: '🏢',
    color: '#10B981',
    isActive: true,
    sortOrder: 2,
  },

  // Banking + Manufacturing: Industrial Banker
  {
    synergyId: 'industrial-banker',
    name: 'Industrial Banker',
    description: 'Dedicated credit facilities for manufacturing operations boost production capacity',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.MANUFACTURING],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 18,
        description: 'Credit-funded equipment purchases increase revenue by 18%',
      },
      {
        type: SynergyBonusType.FLAT,
        target: SynergyBonusTarget.REVENUE,
        value: 50000,
        description: 'Interest income from industrial loans: $50,000/month',
      },
    ],
    icon: '🏭',
    color: '#6366F1',
    isActive: true,
    sortOrder: 3,
  },

  // Banking + Media: Financial Influencer
  {
    synergyId: 'financial-influencer',
    name: 'Financial Influencer',
    description: 'Media presence drives customer acquisition while financial news coverage generates ad revenue',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.MEDIA],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.CUSTOMER_ACQUISITION,
        value: 25,
        description: 'Media exposure increases customer acquisition by 25%',
      },
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REPUTATION,
        value: 15,
        description: 'Positive financial coverage boosts reputation by 15%',
      },
    ],
    icon: '📺',
    color: '#EC4899',
    isActive: true,
    sortOrder: 4,
  },

  // Banking + Energy: Green Finance
  {
    synergyId: 'green-finance',
    name: 'Green Finance',
    description: 'Sustainable energy investments and green bonds create premium returns',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.ENERGY],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 10,
        description: 'Green bond premiums add 10% revenue',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 12,
        description: 'Subsidized operations reduce costs by 12%',
      },
    ],
    icon: '🌱',
    color: '#22C55E',
    isActive: true,
    sortOrder: 5,
  },

  // ============================================
  // TECH SYNERGIES (Basic Tier)
  // ============================================

  // Tech + Media: Content Platform
  {
    synergyId: 'content-platform',
    name: 'Content Platform',
    description: 'Tech platforms amplify media reach while media content drives platform engagement',
    requiredIndustries: [EmpireIndustry.TECH, EmpireIndustry.MEDIA],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 18,
        description: 'Ad revenue from integrated content platform increases 18%',
      },
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.CUSTOMER_ACQUISITION,
        value: 30,
        description: 'Viral content algorithms multiply reach by 30%',
      },
    ],
    icon: '📱',
    color: '#8B5CF6',
    isActive: true,
    sortOrder: 6,
  },

  // Tech + Healthcare: Health Tech
  {
    synergyId: 'health-tech',
    name: 'Health Tech Innovation',
    description: 'Technology transforms healthcare delivery with telemedicine and AI diagnostics',
    requiredIndustries: [EmpireIndustry.TECH, EmpireIndustry.HEALTHCARE],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 22,
        description: 'Telemedicine expands patient capacity by 22%',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 20,
        description: 'Automation reduces administrative costs by 20%',
      },
    ],
    icon: '🏥',
    color: '#EF4444',
    isActive: true,
    sortOrder: 7,
  },

  // Tech + Logistics: Smart Supply Chain
  {
    synergyId: 'smart-supply-chain',
    name: 'Smart Supply Chain',
    description: 'AI and IoT optimization creates highly efficient logistics networks',
    requiredIndustries: [EmpireIndustry.TECH, EmpireIndustry.LOGISTICS],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.PRODUCTION_SPEED,
        value: 40,
        description: 'Route optimization and predictive analytics boost speed 40%',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 25,
        description: 'Reduced fuel and time costs by 25%',
      },
    ],
    icon: '📦',
    color: '#F59E0B',
    isActive: true,
    sortOrder: 8,
  },

  // ============================================
  // MANUFACTURING SYNERGIES (Basic Tier)
  // ============================================

  // Manufacturing + Logistics: Vertical Integration
  {
    synergyId: 'vertical-supply',
    name: 'Vertically Integrated Supply',
    description: 'Own logistics ensures just-in-time delivery and reduced inventory costs',
    requiredIndustries: [EmpireIndustry.MANUFACTURING, EmpireIndustry.LOGISTICS],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 20,
        description: 'Reduced shipping and inventory holding costs by 20%',
      },
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.PRODUCTION_SPEED,
        value: 25,
        description: 'Just-in-time delivery speeds production by 25%',
      },
    ],
    icon: '🚛',
    color: '#78716C',
    isActive: true,
    sortOrder: 9,
  },

  // Manufacturing + Energy: Industrial Power
  {
    synergyId: 'industrial-power',
    name: 'Industrial Power Grid',
    description: 'Dedicated power infrastructure reduces manufacturing energy costs',
    requiredIndustries: [EmpireIndustry.MANUFACTURING, EmpireIndustry.ENERGY],
    tier: SynergyTier.BASIC,
    unlockLevel: 1,
    bonuses: [
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 35,
        description: 'Wholesale energy pricing for owned facilities saves 35%',
      },
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.PRODUCTION_SPEED,
        value: 15,
        description: 'Reliable power prevents production interruptions (+15%)',
      },
    ],
    icon: '⚡',
    color: '#FBBF24',
    isActive: true,
    sortOrder: 10,
  },

  // ============================================
  // REAL ESTATE SYNERGIES (Basic Tier)
  // ============================================

  // Real Estate + Logistics: Distribution Hub
  {
    synergyId: 'distribution-hub',
    name: 'Distribution Hub Network',
    description: 'Strategic property locations serve as logistics hubs, reducing costs',
    requiredIndustries: [EmpireIndustry.REAL_ESTATE, EmpireIndustry.LOGISTICS],
    tier: SynergyTier.BASIC,
    unlockLevel: 2,
    bonuses: [
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 30,
        description: 'Owned warehouses eliminate rental costs (-30%)',
      },
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 15,
        description: 'Expanded storage capacity increases revenue by 15%',
      },
    ],
    icon: '🏬',
    color: '#0EA5E9',
    isActive: true,
    sortOrder: 11,
  },

  // ============================================
  // ADVANCED TIER (3 Industries)
  // ============================================

  // Banking + Tech + Media: Data Goldmine
  {
    synergyId: 'data-goldmine',
    name: 'Data Goldmine',
    description: 'Financial data combined with tech analytics and media reach creates unparalleled insights',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH, EmpireIndustry.MEDIA],
    tier: SynergyTier.ADVANCED,
    unlockLevel: 3,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 20,
        description: 'Cross-platform data monetization adds 20% to all profits',
      },
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.CUSTOMER_ACQUISITION,
        value: 35,
        description: 'Targeted marketing increases customer acquisition by 35%',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Consumer Behavior Prediction',
      },
    ],
    icon: '📊',
    color: '#A855F7',
    isActive: true,
    sortOrder: 20,
  },

  // Banking + Real Estate + Energy: Infrastructure King
  {
    synergyId: 'infrastructure-king',
    name: 'Infrastructure King',
    description: 'Control of property, power, and finance creates self-sustaining developments',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE, EmpireIndustry.ENERGY],
    tier: SynergyTier.ADVANCED,
    unlockLevel: 3,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 25,
        description: 'Self-funded, self-powered properties earn 25% more revenue',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 30,
        description: 'Zero external financing or utility costs (-30%)',
      },
    ],
    icon: '🏗️',
    color: '#64748B',
    isActive: true,
    sortOrder: 21,
  },

  // Manufacturing + Logistics + Retail: Supply Chain Master
  {
    synergyId: 'supply-chain-master',
    name: 'Supply Chain Master',
    description: 'End-to-end control from production to consumer delivery',
    requiredIndustries: [EmpireIndustry.MANUFACTURING, EmpireIndustry.LOGISTICS, EmpireIndustry.RETAIL],
    tier: SynergyTier.ADVANCED,
    unlockLevel: 3,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 22,
        description: 'Captured margins at every stage add 22% profits',
      },
      {
        type: SynergyBonusType.EFFICIENCY,
        target: SynergyBonusTarget.PRODUCTION_SPEED,
        value: 40,
        description: 'Seamless supply chain speeds operations by 40%',
      },
    ],
    icon: '🔗',
    color: '#059669',
    isActive: true,
    sortOrder: 22,
  },

  // Tech + Healthcare + Real Estate: Healthcare Ecosystem
  {
    synergyId: 'healthcare-ecosystem',
    name: 'Healthcare Ecosystem',
    description: 'Purpose-built medical tech facilities with integrated systems',
    requiredIndustries: [EmpireIndustry.TECH, EmpireIndustry.HEALTHCARE, EmpireIndustry.REAL_ESTATE],
    tier: SynergyTier.ADVANCED,
    unlockLevel: 3,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REVENUE,
        value: 28,
        description: 'Premium facilities with advanced tech command 28% more',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 25,
        description: 'Owned facilities with in-house tech save 25%',
      },
    ],
    icon: '🏨',
    color: '#DC2626',
    isActive: true,
    sortOrder: 23,
  },

  // Banking + Media + Politics: Influence Triad
  {
    synergyId: 'influence-triad',
    name: 'Influence Triad',
    description: 'Control of finance, media, and politics creates unprecedented influence',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.MEDIA, EmpireIndustry.POLITICS],
    tier: SynergyTier.ADVANCED,
    unlockLevel: 4,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REPUTATION,
        value: 40,
        description: 'Public narrative control boosts reputation by 40%',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 20,
        description: 'Favorable regulations reduce compliance costs by 20%',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Policy Manipulation',
      },
    ],
    icon: '👑',
    color: '#7C3AED',
    isActive: true,
    sortOrder: 24,
  },

  // ============================================
  // ELITE TIER (4 Industries)
  // ============================================

  // Manufacturing + Energy + Logistics + Retail: Vertical Integration
  {
    synergyId: 'full-vertical',
    name: 'Complete Vertical Integration',
    description: 'From raw materials to consumer: total supply chain control',
    requiredIndustries: [
      EmpireIndustry.MANUFACTURING,
      EmpireIndustry.ENERGY,
      EmpireIndustry.LOGISTICS,
      EmpireIndustry.RETAIL,
    ],
    tier: SynergyTier.ELITE,
    unlockLevel: 5,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 35,
        description: 'Zero external dependencies adds 35% to all profits',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 45,
        description: 'Self-sufficient operations cut costs by 45%',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Government Defense Contracts',
      },
    ],
    icon: '🔧',
    color: '#374151',
    isActive: true,
    sortOrder: 30,
  },

  // Media + Tech + Politics + Banking: Media Empire
  {
    synergyId: 'media-empire',
    name: 'Media Empire',
    description: 'Control the narrative, the technology, the money, and the policy',
    requiredIndustries: [
      EmpireIndustry.MEDIA,
      EmpireIndustry.TECH,
      EmpireIndustry.POLITICS,
      EmpireIndustry.BANKING,
    ],
    tier: SynergyTier.ELITE,
    unlockLevel: 6,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REPUTATION,
        value: 60,
        description: 'Complete narrative control: +60% reputation',
      },
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.CUSTOMER_ACQUISITION,
        value: 50,
        description: 'Omnichannel influence: +50% customer acquisition',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Election Manipulation',
      },
    ],
    icon: '📡',
    color: '#BE185D',
    isActive: true,
    sortOrder: 31,
  },

  // Tech + Healthcare + Manufacturing + Banking: HealthTech Vertical
  {
    synergyId: 'healthtech-vertical',
    name: 'HealthTech Vertical',
    description: 'Complete control of healthcare technology from design to delivery to financing',
    requiredIndustries: [
      EmpireIndustry.TECH,
      EmpireIndustry.HEALTHCARE,
      EmpireIndustry.MANUFACTURING,
      EmpireIndustry.BANKING,
    ],
    tier: SynergyTier.ELITE,
    unlockLevel: 6,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 40,
        description: 'Integrated health solutions: +40% all profits',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Pharmaceutical Development',
      },
    ],
    icon: '💊',
    color: '#0891B2',
    isActive: true,
    sortOrder: 32,
  },

  // ============================================
  // ULTIMATE TIER (5+ Industries)
  // ============================================

  // 5 Core Industries
  {
    synergyId: 'economic-titan',
    name: 'Economic Titan',
    description: 'Control of five major industries creates market-moving power',
    requiredIndustries: [
      EmpireIndustry.BANKING,
      EmpireIndustry.TECH,
      EmpireIndustry.MANUFACTURING,
      EmpireIndustry.ENERGY,
      EmpireIndustry.REAL_ESTATE,
    ],
    tier: SynergyTier.ULTIMATE,
    unlockLevel: 8,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 50,
        description: 'Economic dominance: +50% all profits',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 40,
        description: 'Self-sufficient ecosystem: -40% costs',
      },
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.REPUTATION,
        value: 50,
        description: 'Industry titan status: +50% reputation',
      },
    ],
    icon: '🌐',
    color: '#1E3A8A',
    isActive: true,
    sortOrder: 40,
  },

  // Total Monopoly - All Industries
  {
    synergyId: 'total-monopoly',
    name: 'Total Monopoly',
    description: 'Controlling all sectors grants unprecedented economic power',
    requiredIndustries: [
      EmpireIndustry.BANKING,
      EmpireIndustry.TECH,
      EmpireIndustry.MEDIA,
      EmpireIndustry.REAL_ESTATE,
      EmpireIndustry.ENERGY,
      EmpireIndustry.MANUFACTURING,
      EmpireIndustry.HEALTHCARE,
      EmpireIndustry.LOGISTICS,
      EmpireIndustry.POLITICS,
      EmpireIndustry.RETAIL,
    ],
    tier: SynergyTier.ULTIMATE,
    unlockLevel: 10,
    bonuses: [
      {
        type: SynergyBonusType.PERCENTAGE,
        target: SynergyBonusTarget.ALL_PROFITS,
        value: 100,
        description: 'Complete economic control: DOUBLE all profits',
      },
      {
        type: SynergyBonusType.COST_REDUCTION,
        target: SynergyBonusTarget.OPERATING_COST,
        value: 50,
        description: 'Zero external dependencies: -50% costs',
      },
      {
        type: SynergyBonusType.UNLOCK,
        target: SynergyBonusTarget.FEATURE_UNLOCK,
        value: 1,
        description: 'Unlocks: Economic Victory Condition',
      },
    ],
    icon: '👁️',
    color: '#0F172A',
    isActive: true,
    sortOrder: 50,
  },
];

/**
 * Industry synergy count for validation
 * Each industry should have at least 3 direct synergies
 */
export function validateSynergyCoverage(): {
  industry: EmpireIndustry;
  synergyCount: number;
  synergies: string[];
}[] {
  const coverage: Map<EmpireIndustry, Set<string>> = new Map();

  // Initialize all industries
  Object.values(EmpireIndustry).forEach((ind) => {
    coverage.set(ind, new Set());
  });

  // Count synergies per industry
  SYNERGY_SEED_DATA.forEach((synergy) => {
    synergy.requiredIndustries.forEach((ind) => {
      coverage.get(ind)?.add(synergy.name);
    });
  });

  return Object.values(EmpireIndustry).map((ind) => ({
    industry: ind,
    synergyCount: coverage.get(ind)?.size || 0,
    synergies: Array.from(coverage.get(ind) || []),
  }));
}

export default SYNERGY_SEED_DATA;
