/**
 * Crime Domain Seed Data Loader
 * 
 * OVERVIEW:
 * Provides deterministic seed data for Crime domain manual QA testing.
 * Creates realistic test data across all 5 Crime models with known values
 * for reproducible testing scenarios.
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

import { ObjectId } from 'mongodb';
import ProductionFacility from '@/lib/db/models/crime/ProductionFacility';
import DistributionRoute from '@/lib/db/models/crime/DistributionRoute';
import MarketplaceListing from '@/lib/db/models/crime/MarketplaceListing';
import LaunderingChannel from '@/lib/db/models/crime/LaunderingChannel';
import HeatLevel from '@/lib/db/models/crime/HeatLevel';

/**
 * Deterministic ObjectId generator for consistent seed data
 */
function deterministicObjectId(seed: string): ObjectId {
  // Generate deterministic 24-char hex string from seed
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const hex = Math.abs(hash).toString(16).padStart(24, '0').slice(0, 24);
  return new ObjectId(hex);
}

// Seed user IDs for consistent testing
const SEED_USER_1 = deterministicObjectId('CRIME_USER_001');
const SEED_USER_2 = deterministicObjectId('CRIME_USER_002');
const SEED_USER_3 = deterministicObjectId('CRIME_USER_003');

const SEED_COMPANY_1 = deterministicObjectId('CRIME_COMPANY_001');
const SEED_COMPANY_2 = deterministicObjectId('CRIME_COMPANY_002');

/**
 * Seed data: Production Facilities
 * 
 * Creates 6 facilities across types and statuses for comprehensive testing:
 * - 2 Labs (Active, Raided)
 * - 2 Farms (Active, Abandoned)
 * - 2 Warehouses (Active, Seized)
 */
const facilitySeedData = [
  {
    _id: deterministicObjectId('FACILITY_001'),
    ownerId: SEED_USER_1,
    companyId: SEED_COMPANY_1,
    type: 'Lab' as const,
    location: { state: 'CA', city: 'Los Angeles' },
    capacity: 1000,
    quality: 85,
    suspicionLevel: 25,
    status: 'Active' as const,
    upgrades: [
      { type: 'Equipment', level: 2, installed: new Date('2025-01-15') },
      { type: 'Security', level: 1, installed: new Date('2025-03-01') }
    ],
    employees: [
      { userId: deterministicObjectId('EMP_001'), role: 'Chemist', skill: 90 },
      { userId: deterministicObjectId('EMP_002'), role: 'Assistant', skill: 65 }
    ],
    inventory: [
      { substance: 'Methamphetamine', quantity: 500, purity: 92, batch: 'BATCH_LAB_001' },
      { substance: 'Precursor_A', quantity: 200, purity: 100, batch: 'BATCH_PRECURSOR_001' }
    ]
  },
  {
    _id: deterministicObjectId('FACILITY_002'),
    ownerId: SEED_USER_1,
    type: 'Lab' as const,
    location: { state: 'NM', city: 'Albuquerque' },
    capacity: 750,
    quality: 75,
    suspicionLevel: 85,
    status: 'Raided' as const,
    upgrades: [
      { type: 'Equipment', level: 1, installed: new Date('2024-11-20') }
    ],
    employees: [],
    inventory: []
  },
  {
    _id: deterministicObjectId('FACILITY_003'),
    ownerId: SEED_USER_2,
    companyId: SEED_COMPANY_2,
    type: 'Farm' as const,
    location: { state: 'OR', city: 'Portland' },
    capacity: 2000,
    quality: 70,
    suspicionLevel: 15,
    status: 'Active' as const,
    upgrades: [
      { type: 'Automation', level: 3, installed: new Date('2025-02-10') }
    ],
    employees: [
      { userId: deterministicObjectId('EMP_003'), role: 'Grower', skill: 80 }
    ],
    inventory: [
      { substance: 'Cannabis', quantity: 1500, purity: 88, batch: 'BATCH_FARM_001' }
    ]
  },
  {
    _id: deterministicObjectId('FACILITY_004'),
    ownerId: SEED_USER_2,
    type: 'Farm' as const,
    location: { state: 'CO', city: 'Denver' },
    capacity: 1500,
    quality: 60,
    suspicionLevel: 55,
    status: 'Abandoned' as const,
    upgrades: [],
    employees: [],
    inventory: []
  },
  {
    _id: deterministicObjectId('FACILITY_005'),
    ownerId: SEED_USER_3,
    type: 'Warehouse' as const,
    location: { state: 'TX', city: 'Houston' },
    capacity: 5000,
    quality: 50,
    suspicionLevel: 10,
    status: 'Active' as const,
    upgrades: [
      { type: 'Security', level: 2, installed: new Date('2025-04-01') }
    ],
    employees: [
      { userId: deterministicObjectId('EMP_004'), role: 'Manager', skill: 75 },
      { userId: deterministicObjectId('EMP_005'), role: 'Guard', skill: 60 }
    ],
    inventory: [
      { substance: 'Cocaine', quantity: 2000, purity: 85, batch: 'BATCH_WAREHOUSE_001' },
      { substance: 'Heroin', quantity: 800, purity: 78, batch: 'BATCH_WAREHOUSE_002' }
    ]
  },
  {
    _id: deterministicObjectId('FACILITY_006'),
    ownerId: SEED_USER_3,
    type: 'Warehouse' as const,
    location: { state: 'FL', city: 'Miami' },
    capacity: 4000,
    quality: 65,
    suspicionLevel: 95,
    status: 'Seized' as const,
    upgrades: [],
    employees: [],
    inventory: []
  }
];

/**
 * Seed data: Distribution Routes
 * 
 * Creates 5 routes across methods and statuses:
 * - Road (Active)
 * - Air (Active)
 * - Rail (Suspended)
 * - Courier (Active)
 * - Road (Interdicted)
 */
const routeSeedData = [
  {
    _id: deterministicObjectId('ROUTE_001'),
    ownerId: SEED_USER_1,
    companyId: SEED_COMPANY_1,
    origin: { state: 'CA', city: 'Los Angeles' },
    destination: { state: 'NV', city: 'Las Vegas' },
    method: 'Road' as const,
    capacity: 500,
    cost: 2000,
    speed: 4,
    riskScore: 20,
    status: 'Active' as const,
    shipments: [
      { 
        id: 'SHIP_001', 
        quantity: 300, 
        status: 'InTransit', 
        eta: new Date('2025-12-02T10:00:00Z') 
      }
    ]
  },
  {
    _id: deterministicObjectId('ROUTE_002'),
    ownerId: SEED_USER_1,
    origin: { state: 'CA', city: 'Los Angeles' },
    destination: { state: 'NY', city: 'New York' },
    method: 'Air' as const,
    capacity: 200,
    cost: 8000,
    speed: 6,
    riskScore: 35,
    status: 'Active' as const,
    shipments: []
  },
  {
    _id: deterministicObjectId('ROUTE_003'),
    ownerId: SEED_USER_2,
    companyId: SEED_COMPANY_2,
    origin: { state: 'OR', city: 'Portland' },
    destination: { state: 'WA', city: 'Seattle' },
    method: 'Rail' as const,
    capacity: 1000,
    cost: 3500,
    speed: 8,
    riskScore: 15,
    status: 'Suspended' as const,
    shipments: []
  },
  {
    _id: deterministicObjectId('ROUTE_004'),
    ownerId: SEED_USER_3,
    origin: { state: 'TX', city: 'Houston' },
    destination: { state: 'FL', city: 'Miami' },
    method: 'Courier' as const,
    capacity: 50,
    cost: 1500,
    speed: 24,
    riskScore: 10,
    status: 'Active' as const,
    shipments: [
      { id: 'SHIP_002', quantity: 40, status: 'Delivered', eta: new Date('2025-11-30T14:00:00Z') }
    ]
  },
  {
    _id: deterministicObjectId('ROUTE_005'),
    ownerId: SEED_USER_2,
    origin: { state: 'NM', city: 'Albuquerque' },
    destination: { state: 'AZ', city: 'Phoenix' },
    method: 'Road' as const,
    capacity: 400,
    cost: 1800,
    speed: 3,
    riskScore: 90,
    status: 'Interdicted' as const,
    shipments: []
  }
];

/**
 * Seed data: Marketplace Listings
 * 
 * Creates 6 listings across substances and statuses:
 * - Methamphetamine (Active)
 * - Cannabis (Active)
 * - Cocaine (Sold)
 * - Heroin (Active)
 * - Fentanyl (Expired)
 * - MDMA (Seized)
 */
const listingSeedData = [
  {
    _id: deterministicObjectId('LISTING_001'),
    sellerId: SEED_USER_1,
    companyId: SEED_COMPANY_1,
    substance: 'Methamphetamine',
    quantity: 500,
    purity: 92,
    pricePerUnit: 150,
    location: { state: 'CA', city: 'Los Angeles' },
    deliveryOptions: [
      { method: 'Road', cost: 500, risk: 20 },
      { method: 'Air', cost: 2000, risk: 35 }
    ],
    minOrder: 50,
    bulkDiscounts: [
      { qty: 100, discount: 5 },
      { qty: 250, discount: 10 }
    ],
    status: 'Active' as const,
    sellerRep: 85
  },
  {
    _id: deterministicObjectId('LISTING_002'),
    sellerId: SEED_USER_2,
    companyId: SEED_COMPANY_2,
    substance: 'Cannabis',
    quantity: 1500,
    purity: 88,
    pricePerUnit: 50,
    location: { state: 'OR', city: 'Portland' },
    deliveryOptions: [
      { method: 'Road', cost: 300, risk: 15 },
      { method: 'Rail', cost: 800, risk: 12 }
    ],
    minOrder: 100,
    bulkDiscounts: [
      { qty: 500, discount: 8 },
      { qty: 1000, discount: 15 }
    ],
    status: 'Active' as const,
    sellerRep: 90
  },
  {
    _id: deterministicObjectId('LISTING_003'),
    sellerId: SEED_USER_3,
    substance: 'Cocaine',
    quantity: 0,
    purity: 85,
    pricePerUnit: 200,
    location: { state: 'TX', city: 'Houston' },
    deliveryOptions: [
      { method: 'Courier', cost: 1000, risk: 10 }
    ],
    status: 'Sold' as const,
    sellerRep: 78
  },
  {
    _id: deterministicObjectId('LISTING_004'),
    sellerId: SEED_USER_3,
    substance: 'Heroin',
    quantity: 300,
    purity: 78,
    pricePerUnit: 180,
    location: { state: 'TX', city: 'Houston' },
    deliveryOptions: [
      { method: 'Road', cost: 600, risk: 25 }
    ],
    minOrder: 25,
    status: 'Active' as const,
    sellerRep: 78
  },
  {
    _id: deterministicObjectId('LISTING_005'),
    sellerId: SEED_USER_1,
    substance: 'Fentanyl',
    quantity: 100,
    purity: 95,
    pricePerUnit: 500,
    location: { state: 'NM', city: 'Albuquerque' },
    deliveryOptions: [
      { method: 'Courier', cost: 1500, risk: 30 }
    ],
    status: 'Expired' as const,
    sellerRep: 85
  },
  {
    _id: deterministicObjectId('LISTING_006'),
    sellerId: SEED_USER_2,
    substance: 'MDMA',
    quantity: 200,
    purity: 80,
    pricePerUnit: 120,
    location: { state: 'CO', city: 'Denver' },
    deliveryOptions: [],
    status: 'Seized' as const,
    sellerRep: 90
  }
];

/**
 * Seed data: Laundering Channels
 * 
 * Creates 5 channels across methods:
 * - Shell company
 * - Cash business
 * - Cryptocurrency
 * - Trade-based
 * - Counterfeit goods
 */
const launderingChannelSeedData = [
  {
    _id: deterministicObjectId('CHANNEL_001'),
    ownerId: SEED_USER_1,
    companyId: SEED_COMPANY_1,
    method: 'Shell' as const,
    throughputCap: 500000,
    feePercent: 15,
    latencyDays: 7,
    detectionRisk: 30,
    transactionHistory: [
      { amount: 100000, date: new Date('2025-11-15'), detected: false },
      { amount: 150000, date: new Date('2025-11-20'), detected: false }
    ]
  },
  {
    _id: deterministicObjectId('CHANNEL_002'),
    ownerId: SEED_USER_1,
    method: 'CashBiz' as const,
    throughputCap: 200000,
    feePercent: 10,
    latencyDays: 3,
    detectionRisk: 20,
    transactionHistory: [
      { amount: 50000, date: new Date('2025-11-25'), detected: false }
    ]
  },
  {
    _id: deterministicObjectId('CHANNEL_003'),
    ownerId: SEED_USER_2,
    companyId: SEED_COMPANY_2,
    method: 'Crypto' as const,
    throughputCap: 1000000,
    feePercent: 8,
    latencyDays: 1,
    detectionRisk: 25,
    transactionHistory: [
      { amount: 300000, date: new Date('2025-11-28'), detected: false },
      { amount: 200000, date: new Date('2025-11-29'), detected: true }
    ]
  },
  {
    _id: deterministicObjectId('CHANNEL_004'),
    ownerId: SEED_USER_3,
    method: 'TradeBased' as const,
    throughputCap: 750000,
    feePercent: 12,
    latencyDays: 14,
    detectionRisk: 18,
    transactionHistory: [
      { amount: 400000, date: new Date('2025-11-10'), detected: false }
    ]
  },
  {
    _id: deterministicObjectId('CHANNEL_005'),
    ownerId: SEED_USER_2,
    method: 'Counterfeit' as const,
    throughputCap: 300000,
    feePercent: 20,
    latencyDays: 5,
    detectionRisk: 45,
    transactionHistory: []
  }
];

/**
 * Seed data: Heat Levels
 * 
 * Creates heat tracking across scopes:
 * - Global heat
 * - State heat (CA, TX, OR)
 * - User heat (SEED_USER_1, SEED_USER_3)
 */
const heatLevelSeedData = [
  {
    _id: deterministicObjectId('HEAT_001'),
    scope: 'Global' as const,
    scopeId: 'GLOBAL',
    current: 35,
    factors: [
      { source: 'RecentSeizure', delta: 10, decay: 0.1 },
      { source: 'MediaCoverage', delta: 15, decay: 0.05 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  },
  {
    _id: deterministicObjectId('HEAT_002'),
    scope: 'State' as const,
    scopeId: 'CA',
    current: 55,
    factors: [
      { source: 'LocalBust', delta: 25, decay: 0.15 },
      { source: 'TaskForce', delta: 20, decay: 0.08 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  },
  {
    _id: deterministicObjectId('HEAT_003'),
    scope: 'State' as const,
    scopeId: 'TX',
    current: 25,
    factors: [
      { source: 'RoutinePatrol', delta: 10, decay: 0.2 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  },
  {
    _id: deterministicObjectId('HEAT_004'),
    scope: 'State' as const,
    scopeId: 'OR',
    current: 15,
    factors: [
      { source: 'LowActivity', delta: 5, decay: 0.25 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  },
  {
    _id: deterministicObjectId('HEAT_005'),
    scope: 'User' as const,
    scopeId: SEED_USER_1.toString(),
    current: 65,
    factors: [
      { source: 'FacilityRaid', delta: 40, decay: 0.12 },
      { source: 'Surveillance', delta: 15, decay: 0.08 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  },
  {
    _id: deterministicObjectId('HEAT_006'),
    scope: 'User' as const,
    scopeId: SEED_USER_3.toString(),
    current: 20,
    factors: [
      { source: 'CleanRecord', delta: 5, decay: 0.3 }
    ],
    thresholds: { raid: 80, investigation: 60, surveillance: 40 },
    lastDecay: new Date('2025-11-30T00:00:00Z')
  }
];

/**
 * Seed Crime Domain Data
 * 
 * Loads all seed data into database. Safe to run multiple times (uses _id to prevent duplicates).
 * 
 * @returns Promise<void>
 */
export async function seedCrimeData(): Promise<void> {
  console.log('🌱 Seeding Crime domain data...');

  try {
    // Seed Production Facilities
    console.log('  → Seeding Production Facilities...');
    for (const facility of facilitySeedData) {
      await ProductionFacility.findOneAndUpdate(
        { _id: facility._id },
        facility,
        { upsert: true, new: true }
      );
    }
    console.log(`    ✓ ${facilitySeedData.length} facilities seeded`);

    // Seed Distribution Routes
    console.log('  → Seeding Distribution Routes...');
    for (const route of routeSeedData) {
      await DistributionRoute.findOneAndUpdate(
        { _id: route._id },
        route,
        { upsert: true, new: true }
      );
    }
    console.log(`    ✓ ${routeSeedData.length} routes seeded`);

    // Seed Marketplace Listings
    console.log('  → Seeding Marketplace Listings...');
    for (const listing of listingSeedData) {
      await MarketplaceListing.findOneAndUpdate(
        { _id: listing._id },
        listing,
        { upsert: true, new: true }
      );
    }
    console.log(`    ✓ ${listingSeedData.length} listings seeded`);

    // Seed Laundering Channels
    console.log('  → Seeding Laundering Channels...');
    for (const channel of launderingChannelSeedData) {
      await LaunderingChannel.findOneAndUpdate(
        { _id: channel._id },
        channel,
        { upsert: true, new: true }
      );
    }
    console.log(`    ✓ ${launderingChannelSeedData.length} channels seeded`);

    // Seed Heat Levels
    console.log('  → Seeding Heat Levels...');
    for (const heat of heatLevelSeedData) {
      await HeatLevel.findOneAndUpdate(
        { _id: heat._id },
        heat,
        { upsert: true, new: true }
      );
    }
    console.log(`    ✓ ${heatLevelSeedData.length} heat levels seeded`);

    console.log('✅ Crime domain seed data complete!');
    console.log('\n📊 Summary:');
    console.log(`   - ${facilitySeedData.length} Production Facilities`);
    console.log(`   - ${routeSeedData.length} Distribution Routes`);
    console.log(`   - ${listingSeedData.length} Marketplace Listings`);
    console.log(`   - ${launderingChannelSeedData.length} Laundering Channels`);
    console.log(`   - ${heatLevelSeedData.length} Heat Levels`);
    console.log(`   Total: ${facilitySeedData.length + routeSeedData.length + listingSeedData.length + launderingChannelSeedData.length + heatLevelSeedData.length} documents\n`);
  } catch (error) {
    console.error('❌ Error seeding Crime data:', error);
    throw error;
  }
}

/**
 * Clear Crime Domain Data
 * 
 * Removes all Crime domain data from database.
 * Use with caution - this is destructive!
 * 
 * @returns Promise<void>
 */
export async function clearCrimeData(): Promise<void> {
  console.log('🧹 Clearing Crime domain data...');

  try {
    const results = await Promise.all([
      ProductionFacility.deleteMany({}),
      DistributionRoute.deleteMany({}),
      MarketplaceListing.deleteMany({}),
      LaunderingChannel.deleteMany({}),
      HeatLevel.deleteMany({})
    ]);

    console.log('✅ Crime domain data cleared!');
    console.log(`   - ${results[0].deletedCount} Production Facilities`);
    console.log(`   - ${results[1].deletedCount} Distribution Routes`);
    console.log(`   - ${results[2].deletedCount} Marketplace Listings`);
    console.log(`   - ${results[3].deletedCount} Laundering Channels`);
    console.log(`   - ${results[4].deletedCount} Heat Levels\n`);
  } catch (error) {
    console.error('❌ Error clearing Crime data:', error);
    throw error;
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Deterministic IDs: Uses seed-based ObjectId generation for reproducible data
 * 2. Realistic Values: All numeric values and enums match production constraints
 * 3. Comprehensive Coverage: Tests all entity types, statuses, and relationships
 * 4. Safe Upserts: Uses findOneAndUpdate with upsert to prevent duplicates
 * 5. Manual QA Ready: Known values enable predictable testing scenarios
 * 
 * USAGE:
 * 
 * ```typescript
 * import { seedCrimeData, clearCrimeData } from '@/scripts/loaders/crime.seed';
 * 
 * // Load seed data
 * await seedCrimeData();
 * 
 * // Clear all crime data
 * await clearCrimeData();
 * ```
 * 
 * TEST SCENARIOS:
 * 
 * - Facility Types: Lab (2), Farm (2), Warehouse (2)
 * - Facility Statuses: Active (3), Raided (1), Abandoned (1), Seized (1)
 * - Route Methods: Road (2), Air (1), Rail (1), Courier (1)
 * - Route Statuses: Active (3), Suspended (1), Interdicted (1)
 * - Listing Substances: Methamphetamine, Cannabis, Cocaine, Heroin, Fentanyl, MDMA
 * - Listing Statuses: Active (3), Sold (1), Expired (1), Seized (1)
 * - Laundering Methods: Shell, CashBiz, Crypto, TradeBased, Counterfeit
 * - Heat Scopes: Global (1), State (3), User (2)
 * 
 * @created 2025-12-01
 * @version 1.0.0
 */
