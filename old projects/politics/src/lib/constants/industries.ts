/**
 * @file src/lib/constants/industries.ts
 * @description Industry type definitions and metadata
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Central source of truth for company industries.
 * Separated from Mongoose models to allow client-side imports.
 * 
 * USAGE:
 * Import in both client components (forms, cards) and server models.
 */

/**
 * Available industry types for companies
 */
export const INDUSTRIES = [
  'Construction',
  'Real Estate', 
  'Crypto',
  'Stocks',
  'Retail',
  'Banking',
  'Technology',
  'Manufacturing',
  'E-Commerce',
  'Healthcare',
  'Energy',
  'Media',
] as const;

export type IndustryType = typeof INDUSTRIES[number];

/**
 * Industry metadata with descriptions, risk/reward profiles, and startup costs
 */
export const INDUSTRY_INFO: Record<IndustryType, { 
  description: string; 
  risk: 'Low' | 'Medium' | 'High';
  reward: 'Steady' | 'Scalable' | 'High';
  startupCost: number;
  equipmentCost: number;
  licensingCost: number;
}> = {
  'Construction': {
    description: 'Bid on contracts, manage crews, complete projects for government and private clients',
    risk: 'Medium',
    reward: 'Steady',
    startupCost: 5000,     // Office, insurance
    equipmentCost: 3000,   // Basic tools and equipment
    licensingCost: 1000,   // Contractor license, permits
  },
  'Real Estate': {
    description: 'Buy properties, renovate, rent or sell. Manage tenants and property portfolios',
    risk: 'Medium',
    reward: 'Scalable',
    startupCost: 3000,     // Office, marketing
    equipmentCost: 1000,   // Signs, staging materials
    licensingCost: 2000,   // Real estate license, broker fees
  },
  'Crypto': {
    description: 'Trade cryptocurrency, launch ICOs, risk market volatility and potential hacks',
    risk: 'High',
    reward: 'High',
    startupCost: 4000,     // Exchange setup, security
    equipmentCost: 3500,   // Servers, mining rigs
    licensingCost: 1500,   // Compliance, legal fees
  },
  'Stocks': {
    description: 'Buy and sell shares, collect dividends, engage in insider trading (risky)',
    risk: 'Medium',
    reward: 'Scalable',
    startupCost: 2500,     // Office, terminals
    equipmentCost: 2000,   // Trading software, data feeds
    licensingCost: 2500,   // Broker-dealer license, SEC registration
  },
  'Retail': {
    description: 'Produce or source goods, manage supply chains, sell in competitive markets',
    risk: 'Medium',
    reward: 'Scalable',
    startupCost: 4500,     // Store lease, signage
    equipmentCost: 3500,   // Shelving, POS system, inventory
    licensingCost: 500,    // Business license, sales tax permit
  },
  'Banking': {
    description: 'Issue loans, collect interest, manage risk of defaults and regulations',
    risk: 'Low',
    reward: 'Steady',
    startupCost: 3000,     // Office, vault
    equipmentCost: 2000,   // Security systems, software
    licensingCost: 4000,   // Banking charter, FDIC insurance
  },
  'Technology': {
    description: 'Choose your path: Software ($6k SaaS startup), AI ($12k ML consulting), or Hardware ($18k repair shop). Three distinct progression tracks from freelancer to global tech giant.',
    risk: 'High',
    reward: 'High',
    startupCost: 6000,     // Software: Lowest barrier to entry (freelance dev)
    equipmentCost: 8000,   // Average across subcategories (Software: $8k, AI: $8k, Hardware: $18k)
    licensingCost: 2000,   // Software/AI licenses, cloud agreements, IP fees
  },
  'Manufacturing': {
    description: 'Produce physical goods, manage factories, supply chains, quality control, inventory',
    risk: 'Medium',
    reward: 'Scalable',
    startupCost: 7000,     // Factory lease, utilities setup, insurance
    equipmentCost: 9000,   // Machinery, assembly lines, tools, safety equipment
    licensingCost: 1500,   // Manufacturing permits, environmental compliance, safety certs
  },
  'E-Commerce': {
    description: 'Amazon-style platform: marketplace, logistics, fulfillment, multiple revenue streams',
    risk: 'High',
    reward: 'High',
    startupCost: 5500,     // Platform development, cloud hosting, initial marketing
    equipmentCost: 4000,   // Warehouse automation, fulfillment tech, inventory systems
    licensingCost: 1000,   // E-commerce licenses, payment processing, data privacy compliance
  },
  'Healthcare': {
    description: 'Medical services, pharmaceuticals, insurance, health tech, patient care',
    risk: 'Low',
    reward: 'Steady',
    startupCost: 8000,     // Medical facility setup, insurance, compliance systems
    equipmentCost: 7000,   // Medical equipment, diagnostic tools, health IT systems
    licensingCost: 5000,   // Medical licenses, accreditation, malpractice insurance, HIPAA compliance
  },
  'Energy': {
    description: 'Oil & gas, renewable energy, utilities, power generation, energy trading',
    risk: 'Medium',
    reward: 'High',
    startupCost: 10000,    // Infrastructure, land leases, initial exploration/setup
    equipmentCost: 12000,  // Drilling equipment, solar panels, turbines, extraction tools
    licensingCost: 6000,   // Environmental permits, energy licenses, safety certifications
  },
  'Media': {
    description: 'Content creation, streaming, social platforms, advertising, entertainment',
    risk: 'High',
    reward: 'Scalable',
    startupCost: 4000,     // Studio setup, content licensing, platform development
    equipmentCost: 5000,   // Production equipment, servers, streaming infrastructure
    licensingCost: 2500,   // Content rights, broadcast licenses, copyright fees
  },
};
