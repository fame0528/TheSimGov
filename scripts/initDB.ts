/**
 * @fileoverview Comprehensive Database Initialization Script
 * @module scripts/initDB
 * 
 * OVERVIEW:
 * Complete database initialization for TheSimGov:
 * - Drops all existing collections (fresh start)
 * - Creates all required collections with indexes
 * - Seeds reference data (StatePricing for all 51 states)
 * - Optionally seeds QA test data (Crime domain)
 * 
 * USAGE:
 * ```bash
 * # Full reset with seed data
 * npx tsx scripts/initDB.ts
 * 
 * # Full reset with QA test data
 * npx tsx scripts/initDB.ts --with-qa
 * 
 * # Seed only (no drop)
 * npx tsx scripts/initDB.ts --seed-only
 * 
 * # Drop only (no seed)
 * npx tsx scripts/initDB.ts --drop-only
 * ```
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// IMPORTS: Models (for index creation)
// ============================================================================

// Core business models
import User from '@/lib/db/models/User';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import Contract from '@/lib/db/models/Contract';
import Department from '@/lib/db/models/Department';
import Sector from '@/lib/db/models/Sector';
import Business from '@/lib/db/models/business/Business';

// Banking models
import Bank from '@/lib/db/models/Bank';
import Loan from '@/lib/db/models/Loan';
import Investment from '@/lib/db/models/Investment';
import InvestmentPortfolio from '@/lib/db/models/InvestmentPortfolio';

// AI models
import AIModel from '@/lib/db/models/AIModel';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

// Crime domain models
import ProductionFacility from '@/lib/db/models/crime/ProductionFacility';
import DistributionRoute from '@/lib/db/models/crime/DistributionRoute';
import MarketplaceListing from '@/lib/db/models/crime/MarketplaceListing';
import LaunderingChannel from '@/lib/db/models/crime/LaunderingChannel';
import HeatLevel from '@/lib/db/models/crime/HeatLevel';
import Gang from '@/lib/db/models/crime/Gang';
import Territory from '@/lib/db/models/crime/Territory';
import TurfWar from '@/lib/db/models/crime/TurfWar';
import LegislationStatus from '@/lib/db/models/crime/LegislationStatus';
import BlackMarketItem from '@/lib/db/models/crime/BlackMarketItem';
import ConversionHistory from '@/lib/db/models/crime/ConversionHistory';
import StatePricing from '@/lib/db/models/crime/StatePricing';

// Politics models (root level)
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import LobbyingAction from '@/lib/db/models/LobbyingAction';
import Bill from '@/lib/db/models/Bill';
import LobbyPayment from '@/lib/db/models/LobbyPayment';
import DebateStatement from '@/lib/db/models/DebateStatement';
import AchievementUnlock from '@/lib/db/models/AchievementUnlock';
import TelemetryEvent from '@/lib/db/models/TelemetryEvent';
import TelemetryAggregate from '@/lib/db/models/TelemetryAggregate';
import ChatMessage from '@/lib/db/models/ChatMessage';
import ChatUnread from '@/lib/db/models/ChatUnread';
import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';

// Politics models (politics folder)
import Campaign from '@/lib/db/models/politics/Campaign';
import Election from '@/lib/db/models/politics/Election';
import District from '@/lib/db/models/politics/District';
import Donor from '@/lib/db/models/politics/Donor';
import VoterOutreach from '@/lib/db/models/politics/VoterOutreach';
import Lobby from '@/lib/db/models/politics/Lobby';
import Party from '@/lib/db/models/politics/Party';
import LeadershipElection from '@/lib/db/models/politics/LeadershipElection';
import Proposal from '@/lib/db/models/politics/Proposal';
import Paramilitary from '@/lib/db/models/politics/Paramilitary';
import Union from '@/lib/db/models/politics/Union';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
import PollingSnapshot from '@/lib/db/models/politics/PollingSnapshot';
import DebatePerformance from '@/lib/db/models/politics/DebatePerformance';
import ScandalRecord from '@/lib/db/models/politics/ScandalRecord';
import EndorsementRecord from '@/lib/db/models/politics/EndorsementRecord';
import AchievementEvent from '@/lib/db/models/politics/AchievementEvent';

// Healthcare models
import Hospital from '@/lib/db/models/healthcare/Hospital';
import Clinic from '@/lib/db/models/healthcare/Clinic';
import Pharmaceutical from '@/lib/db/models/healthcare/Pharmaceutical';
import MedicalDevice from '@/lib/db/models/healthcare/MedicalDevice';
import ResearchProject from '@/lib/db/models/healthcare/ResearchProject';
import HealthcareInsurance from '@/lib/db/models/healthcare/HealthcareInsurance';

// Media models
import Audience from '@/lib/db/models/media/Audience';
import MediaContent from '@/lib/db/models/media/MediaContent';
import Platform from '@/lib/db/models/media/Platform';
import AdCampaign from '@/lib/db/models/media/AdCampaign';
import MonetizationSettings from '@/lib/db/models/media/MonetizationSettings';
import InfluencerContract from '@/lib/db/models/media/InfluencerContract';
import SponsorshipDeal from '@/lib/db/models/media/SponsorshipDeal';
import ContentPerformance from '@/lib/db/models/media/ContentPerformance';

// Energy models
import { 
  OilWell, GasField, SolarFarm, WindTurbine, PowerPlant, 
  EnergyStorage, TransmissionLine, GridNode, CommodityPrice, PPA, EnergyTradeOrder 
} from '@/lib/db/models/energy';

// Software models
import { SoftwareProduct, SoftwareRelease, SaaSSubscription, Bug, Feature } from '@/lib/db/models/software';

// E-commerce models
import { ProductListing, Order, CustomerReview, SEOCampaign } from '@/lib/db/models/ecommerce';

// EdTech models
import { EdTechCourse, StudentEnrollment, Certification } from '@/lib/db/models/edtech';

// Manufacturing models
import { ManufacturingFacility, ProductionLine, Supplier } from '@/lib/db/models/manufacturing';

// Consulting models
import { ConsultingProject } from '@/lib/db/models/consulting';

// System models
import IdempotencyKey from '@/lib/db/models/system/IdempotencyKey';

// Other root models
import RealEstate from '@/lib/db/models/RealEstate';
import ComputeListing from '@/lib/db/models/ComputeListing';
import ComputeContract from '@/lib/db/models/ComputeContract';
import ModelListing from '@/lib/db/models/ModelListing';
import Transaction from '@/lib/db/models/Transaction';
import Breakthrough from '@/lib/db/models/Breakthrough';
import Patent from '@/lib/db/models/Patent';
import DataCenter from '@/lib/db/models/DataCenter';
import GlobalImpactEvent from '@/lib/db/models/GlobalImpactEvent';
import IndustryDominance from '@/lib/db/models/IndustryDominance';
import GlobalCompetition from '@/lib/db/models/GlobalCompetition';

// ============================================================================
// IMPORTS: Seed Data
// ============================================================================
import { seedCrimePricing } from '@/lib/seed/crime-pricing';
import { seedCrimeData, clearCrimeData } from './loaders/crime.seed';

// ============================================================================
// CONFIGURATION
// ============================================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is not set');
  console.error('   Please set it in .env.local or as an environment variable');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const withQA = args.includes('--with-qa');
const seedOnly = args.includes('--seed-only');
const dropOnly = args.includes('--drop-only');

// ============================================================================
// ALL MODELS - For index creation and collection management
// ============================================================================
const ALL_MODELS = [
  // Core business
  { name: 'User', model: User },
  { name: 'Company', model: Company },
  { name: 'Employee', model: Employee },
  { name: 'Contract', model: Contract },
  { name: 'Department', model: Department },
  { name: 'Sector', model: Sector },
  { name: 'Business', model: Business },
  
  // Banking
  { name: 'Bank', model: Bank },
  { name: 'Loan', model: Loan },
  { name: 'Investment', model: Investment },
  { name: 'InvestmentPortfolio', model: InvestmentPortfolio },
  
  // AI
  { name: 'AIModel', model: AIModel },
  { name: 'AIResearchProject', model: AIResearchProject },
  
  // Crime domain
  { name: 'ProductionFacility', model: ProductionFacility },
  { name: 'DistributionRoute', model: DistributionRoute },
  { name: 'MarketplaceListing', model: MarketplaceListing },
  { name: 'LaunderingChannel', model: LaunderingChannel },
  { name: 'HeatLevel', model: HeatLevel },
  { name: 'Gang', model: Gang },
  { name: 'Territory', model: Territory },
  { name: 'TurfWar', model: TurfWar },
  { name: 'LegislationStatus', model: LegislationStatus },
  { name: 'BlackMarketItem', model: BlackMarketItem },
  { name: 'ConversionHistory', model: ConversionHistory },
  { name: 'StatePricing', model: StatePricing },
  
  // Politics (root level)
  { name: 'PoliticalContribution', model: PoliticalContribution },
  { name: 'LobbyingAction', model: LobbyingAction },
  { name: 'Bill', model: Bill },
  { name: 'LobbyPayment', model: LobbyPayment },
  { name: 'DebateStatement', model: DebateStatement },
  { name: 'AchievementUnlock', model: AchievementUnlock },
  { name: 'TelemetryEvent', model: TelemetryEvent },
  { name: 'TelemetryAggregate', model: TelemetryAggregate },
  { name: 'ChatMessage', model: ChatMessage },
  { name: 'ChatUnread', model: ChatUnread },
  { name: 'LeaderboardSnapshot', model: LeaderboardSnapshot },
  
  // Politics (politics folder)
  { name: 'Campaign', model: Campaign },
  { name: 'Election', model: Election },
  { name: 'District', model: District },
  { name: 'Donor', model: Donor },
  { name: 'VoterOutreach', model: VoterOutreach },
  { name: 'Lobby', model: Lobby },
  { name: 'Party', model: Party },
  { name: 'LeadershipElection', model: LeadershipElection },
  { name: 'Proposal', model: Proposal },
  { name: 'Paramilitary', model: Paramilitary },
  { name: 'Union', model: Union },
  { name: 'CampaignPhaseState', model: CampaignPhaseState },
  { name: 'PollingSnapshot', model: PollingSnapshot },
  { name: 'DebatePerformance', model: DebatePerformance },
  { name: 'ScandalRecord', model: ScandalRecord },
  { name: 'EndorsementRecord', model: EndorsementRecord },
  { name: 'AchievementEvent', model: AchievementEvent },
  
  // Healthcare
  { name: 'Hospital', model: Hospital },
  { name: 'Clinic', model: Clinic },
  { name: 'Pharmaceutical', model: Pharmaceutical },
  { name: 'MedicalDevice', model: MedicalDevice },
  { name: 'ResearchProject', model: ResearchProject },
  { name: 'HealthcareInsurance', model: HealthcareInsurance },
  
  // Media
  { name: 'Audience', model: Audience },
  { name: 'MediaContent', model: MediaContent },
  { name: 'Platform', model: Platform },
  { name: 'AdCampaign', model: AdCampaign },
  { name: 'MonetizationSettings', model: MonetizationSettings },
  { name: 'InfluencerContract', model: InfluencerContract },
  { name: 'SponsorshipDeal', model: SponsorshipDeal },
  { name: 'ContentPerformance', model: ContentPerformance },
  
  // Energy
  { name: 'OilWell', model: OilWell },
  { name: 'GasField', model: GasField },
  { name: 'SolarFarm', model: SolarFarm },
  { name: 'WindTurbine', model: WindTurbine },
  { name: 'PowerPlant', model: PowerPlant },
  { name: 'EnergyStorage', model: EnergyStorage },
  { name: 'TransmissionLine', model: TransmissionLine },
  { name: 'GridNode', model: GridNode },
  { name: 'CommodityPrice', model: CommodityPrice },
  { name: 'PPA', model: PPA },
  { name: 'EnergyTradeOrder', model: EnergyTradeOrder },
  
  // Software
  { name: 'SoftwareProduct', model: SoftwareProduct },
  { name: 'SoftwareRelease', model: SoftwareRelease },
  { name: 'SaaSSubscription', model: SaaSSubscription },
  { name: 'Bug', model: Bug },
  { name: 'Feature', model: Feature },
  
  // E-commerce
  { name: 'ProductListing', model: ProductListing },
  { name: 'Order', model: Order },
  { name: 'CustomerReview', model: CustomerReview },
  { name: 'SEOCampaign', model: SEOCampaign },
  
  // EdTech
  { name: 'EdTechCourse', model: EdTechCourse },
  { name: 'StudentEnrollment', model: StudentEnrollment },
  { name: 'Certification', model: Certification },
  
  // Manufacturing
  { name: 'ManufacturingFacility', model: ManufacturingFacility },
  { name: 'ProductionLine', model: ProductionLine },
  { name: 'Supplier', model: Supplier },
  
  // Consulting
  { name: 'ConsultingProject', model: ConsultingProject },
  
  // System
  { name: 'IdempotencyKey', model: IdempotencyKey },
  
  // Other root models
  { name: 'RealEstate', model: RealEstate },
  { name: 'ComputeListing', model: ComputeListing },
  { name: 'ComputeContract', model: ComputeContract },
  { name: 'ModelListing', model: ModelListing },
  { name: 'Transaction', model: Transaction },
  { name: 'Breakthrough', model: Breakthrough },
  { name: 'Patent', model: Patent },
  { name: 'DataCenter', model: DataCenter },
  { name: 'GlobalImpactEvent', model: GlobalImpactEvent },
  { name: 'IndustryDominance', model: IndustryDominance },
  { name: 'GlobalCompetition', model: GlobalCompetition },
];

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Connect to MongoDB
 */
async function connectDB(): Promise<void> {
  console.log('🔌 Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI!, {
      maxPoolSize: 10,
      minPoolSize: 2,
      family: 4, // Force IPv4
    });
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Drop all collections in the database
 */
async function dropAllCollections(): Promise<void> {
  console.log('🗑️  Dropping all collections...');
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  
  const collections = await db.listCollections().toArray();
  
  for (const collection of collections) {
    try {
      await db.dropCollection(collection.name);
      console.log(`   ✓ Dropped: ${collection.name}`);
    } catch (error) {
      // Collection might not exist, ignore
      console.log(`   ⚠ Could not drop: ${collection.name}`);
    }
  }
  
  console.log(`\n✅ Dropped ${collections.length} collections\n`);
}

/**
 * Create all collections and indexes
 */
async function createCollectionsAndIndexes(): Promise<void> {
  console.log('📦 Creating collections and indexes...\n');
  
  let created = 0;
  let indexCount = 0;
  
  for (const { name, model } of ALL_MODELS) {
    try {
      // Ensure collection exists by calling createCollection on the model
      // This also builds all indexes defined in the schema
      await model.createCollection();
      await model.ensureIndexes();
      
      // Count indexes
      const indexes = await model.collection.indexes();
      indexCount += indexes.length - 1; // Subtract 1 for default _id index
      
      created++;
      console.log(`   ✓ ${name}: ${indexes.length - 1} custom indexes`);
    } catch (error) {
      console.error(`   ✗ ${name}: Failed to create`, error);
    }
  }
  
  console.log(`\n✅ Created ${created} collections with ${indexCount} custom indexes\n`);
}

/**
 * Seed reference data (StatePricing for all 51 states)
 */
async function seedReferenceData(): Promise<void> {
  console.log('🌱 Seeding reference data...\n');
  
  // Seed StatePricing for all 51 states (50 states + DC)
  console.log('   → Seeding StatePricing (51 states)...');
  await seedCrimePricing();
  
  const count = await StatePricing.countDocuments();
  console.log(`   ✓ StatePricing: ${count} state records\n`);
  
  console.log('✅ Reference data seeded\n');
}

/**
 * Seed QA test data (Crime domain)
 */
async function seedQAData(): Promise<void> {
  console.log('🧪 Seeding QA test data...\n');
  
  // Use the crime.seed.ts loader
  await seedCrimeData();
  
  console.log('✅ QA test data seeded\n');
}

/**
 * Print database summary
 */
async function printSummary(): Promise<void> {
  console.log('📊 DATABASE SUMMARY\n');
  console.log('=' .repeat(50));
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  
  const stats = await db.stats();
  console.log(`Database: ${db.databaseName}`);
  console.log(`Collections: ${stats.collections}`);
  console.log(`Documents: ${stats.objects}`);
  console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('=' .repeat(50));
  
  // Per-collection stats
  console.log('\nCollection Details:');
  console.log('-'.repeat(50));
  
  const collections = await db.listCollections().toArray();
  for (const collection of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`   ${collection.name.padEnd(30)} ${count.toString().padStart(8)} docs`);
  }
  
  console.log('-'.repeat(50));
  console.log('');
}

// ============================================================================
// SEED DATA REFERENCE (Static TypeScript Data)
// ============================================================================
// Note: Political structure data (Senate, House, State Governments) is stored
// as static TypeScript constants in src/lib/seed/. This data is used at runtime
// and does not need to be stored in the database:
//
// - src/lib/seed/senate-seats.ts: 100 Senate seats (2 per state)
// - src/lib/seed/house-seats.ts: 436 House seats (apportioned by population)  
// - src/lib/seed/state-government.ts: 50 state governments with structure
//
// These are accessed via:
// import { allSenateSeats, allHouseSeats, stateGovernments } from '@/lib/seed';

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🚀 TheSimGov Database Initialization\n');
  console.log('=' .repeat(50));
  console.log(`Mode: ${dropOnly ? 'DROP ONLY' : seedOnly ? 'SEED ONLY' : 'FULL RESET'}`);
  console.log(`QA Data: ${withQA ? 'YES' : 'NO'}`);
  console.log('=' .repeat(50));
  console.log('');
  
  try {
    // Connect
    await connectDB();
    
    // Drop collections (unless seed-only)
    if (!seedOnly) {
      await dropAllCollections();
    }
    
    // Create collections and indexes (unless drop-only)
    if (!dropOnly) {
      await createCollectionsAndIndexes();
    }
    
    // Seed reference data (unless drop-only)
    if (!dropOnly) {
      await seedReferenceData();
    }
    
    // Seed QA data if requested
    if (withQA && !dropOnly) {
      await seedQAData();
    }
    
    // Print summary
    await printSummary();
    
    console.log('🎉 Database initialization complete!\n');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Disconnect
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run
main();
