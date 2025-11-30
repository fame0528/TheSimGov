/**
 * @file src/lib/validations/politics.ts
 * @description Zod validation schemas for politics API endpoints
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive validation schemas for politics domain (elections, campaigns, bills,
 * donors, districts, voter outreach). Ensures data integrity and type safety at API boundaries.
 */

import { z } from 'zod';
import {
  PoliticalParty,
  ElectionType,
  PoliticalOffice,
  ElectionStatus,
  CampaignStatus,
  BillStatus,
  BillCategory,
  VoteType,
  DonorType,
  DistrictType,
  OutreachMethod,
  CampaignEventType,
  PoliticalLean,
} from '@/types/politics';

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/**
 * Election candidate schema
 */
export const electionCandidateSchema = z.object({
  candidateName: z.string().min(2, 'Candidate name must be at least 2 characters').max(100),
  party: z.nativeEnum(PoliticalParty, {
    errorMap: () => ({ message: 'Invalid political party' }),
  }),
  votes: z.number().min(0).default(0),
  votePercentage: z.number().min(0).max(100).default(0),
  incumbent: z.boolean().default(false),
  endorsements: z.array(z.string()).default([]),
  campaignWebsite: z.string().url('Invalid URL').optional(),
});

/**
 * Election results schema
 */
export const electionResultsSchema = z.object({
  totalVotes: z.number().min(0),
  turnoutRate: z.number().min(0).max(100),
  winner: z.string().min(1, 'Winner name is required'),
  winnerParty: z.nativeEnum(PoliticalParty),
  margin: z.number(),
  marginPercentage: z.number(),
});

/**
 * Campaign event schema
 */
export const campaignEventSchema = z.object({
  eventType: z.nativeEnum(CampaignEventType),
  eventName: z.string().min(2, 'Event name is required').max(200),
  eventDate: z.coerce.date(),
  location: z.string().max(200).optional(),
  attendees: z.number().min(0).default(0),
  fundsRaised: z.number().min(0).default(0),
  description: z.string().max(1000).optional(),
});

/**
 * Campaign poll schema
 */
export const campaignPollSchema = z.object({
  pollDate: z.coerce.date(),
  pollster: z.string().max(100).optional(),
  sampleSize: z.number().min(1),
  support: z.number().min(0).max(100),
  favorability: z.number().min(0).max(100),
  marginOfError: z.number().min(0).max(100).default(3),
});

/**
 * Legislative vote schema
 */
export const legislativeVoteSchema = z.object({
  legislatorName: z.string().min(2).max(100),
  party: z.nativeEnum(PoliticalParty),
  district: z.string().max(50).optional(),
  vote: z.nativeEnum(VoteType),
});

/**
 * Bill amendment schema
 */
export const billAmendmentSchema = z.object({
  amendmentNumber: z.string().max(50),
  sponsor: z.string().max(100),
  description: z.string().max(1000),
  adoptedDate: z.coerce.date().optional(),
  adopted: z.boolean().default(false),
});

/**
 * Bill impact schema
 */
export const billImpactSchema = z.object({
  economicImpact: z.number().min(0).max(10).default(5),
  socialImpact: z.number().min(0).max(10).default(5),
  environmentalImpact: z.number().min(0).max(10).default(5),
  estimatedCost: z.number().min(0).optional(),
  affectedPopulation: z.number().min(0).optional(),
  implementationTimeframe: z.string().max(200).optional(),
});

/**
 * Donor contact schema
 */
export const donorContactSchema = z.object({
  preferredContactMethod: z.enum(['Email', 'Phone', 'Mail', 'In-Person']).default('Email'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  lastContactDate: z.coerce.date().optional(),
});

/**
 * District demographics schema
 */
export const districtDemographicsSchema = z.object({
  medianIncome: z.number().min(0).optional(),
  medianAge: z.number().min(0).max(120).optional(),
  educationLevel: z.string().max(100).optional(),
  urbanRural: z.enum(['Urban', 'Suburban', 'Rural']).optional(),
  ethnicComposition: z.record(z.string(), z.number()).optional(),
  politicalLean: z.nativeEnum(PoliticalLean).optional(),
});

// ============================================================================
// ELECTION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new election
 */
const baseElectionSchema = z.object({
  electionType: z.nativeEnum(ElectionType, {
    errorMap: () => ({ message: 'Invalid election type' }),
  }),
  
  office: z.nativeEnum(PoliticalOffice, {
    errorMap: () => ({ message: 'Invalid political office' }),
  }),
  
  electionDate: z.coerce.date(),
  
  district: z.string().max(100).optional(),
  
  registeredVoters: z.number().min(0).default(0),
  
  candidates: z.array(electionCandidateSchema).min(1, 'At least one candidate is required'),
  
  status: z.nativeEnum(ElectionStatus).default(ElectionStatus.SCHEDULED),
  
  results: electionResultsSchema.optional(),
  
  description: z.string().max(2000).optional(),
});

export const createElectionSchema = baseElectionSchema.refine(
  (data) => {
    // If status is Completed or Certified, results are required
    if ((data.status === ElectionStatus.COMPLETED || data.status === ElectionStatus.CERTIFIED) && !data.results) {
      return false;
    }
    return true;
  },
  {
    message: 'Results are required for completed or certified elections',
    path: ['results'],
  }
);

/**
 * Schema for updating an election
 */
export const updateElectionSchema = baseElectionSchema.partial();

// ============================================================================
// CAMPAIGN SCHEMAS
// ============================================================================

/**
 * Schema for creating a new campaign
 */
const baseCampaignSchema = z.object({
  playerName: z.string().min(2, 'Player name is required').max(100),
  
  party: z.nativeEnum(PoliticalParty),
  
  office: z.nativeEnum(PoliticalOffice),
  
  election: z.string().min(1, 'Election reference is required'),
  
  startDate: z.coerce.date(),
  
  endDate: z.coerce.date().optional(),
  
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.ANNOUNCED),
  
  fundsRaised: z.number().min(0).default(0),
  
  fundsSpent: z.number().min(0).default(0),
  
  volunteers: z.number().min(0).default(0),
  
  events: z.array(campaignEventSchema).default([]),
  
  polls: z.array(campaignPollSchema).default([]),
  
  platform: z.array(z.string()).default([]),
  
  campaignWebsite: z.string().url('Invalid URL').optional(),
  
  socialMediaHandles: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

export const createCampaignSchema = baseCampaignSchema.refine(
  (data) => {
    // Validate funds spent doesn't exceed funds raised
    return data.fundsSpent <= data.fundsRaised;
  },
  {
    message: 'Funds spent cannot exceed funds raised',
    path: ['fundsSpent'],
  }
).refine(
  (data) => {
    // Validate end date is after start date (if provided)
    if (data.endDate && data.endDate <= data.startDate) {
      return false;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Schema for updating a campaign
 */
export const updateCampaignSchema = baseCampaignSchema.partial();

// ============================================================================
// BILL SCHEMAS
// ============================================================================

/**
 * Schema for creating a new bill
 */
const baseBillSchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required').max(50),
  
  title: z.string().min(5, 'Title must be at least 5 characters').max(300),
  
  category: z.nativeEnum(BillCategory),
  
  sponsor: z.string().min(2, 'Sponsor name is required').max(100),
  
  cosponsors: z.array(z.string()).default([]),
  
  introducedDate: z.coerce.date(),
  
  status: z.nativeEnum(BillStatus).default(BillStatus.DRAFTED),
  
  summary: z.string().max(5000).optional(),
  
  fullText: z.string().max(50000).optional(),
  
  votes: z.array(legislativeVoteSchema).default([]),
  
  amendments: z.array(billAmendmentSchema).default([]),
  
  expectedImpact: billImpactSchema.optional(),
  
  committee: z.string().max(100).optional(),
  
  lastAction: z.string().max(500).optional(),
  
  lastActionDate: z.coerce.date().optional(),
});

/**
 * Schema for creating a bill (base validations)
 * Note: Additional route-level refinements can be applied where needed.
 */
export const createBillSchema = baseBillSchema;

/**
 * Schema for updating a bill
 */
export const updateBillSchema = baseBillSchema.partial();

// ============================================================================
// DONOR SCHEMAS
// ============================================================================

/**
 * Schema for creating a new donor
 */
const baseDonorSchema = z.object({
  donorName: z.string().min(2, 'Donor name is required').max(150),
  
  donorType: z.nativeEnum(DonorType),
  
  amount: z.number().min(0.01, 'Donation amount must be positive'),
  
  donationDate: z.coerce.date(),
  
  campaign: z.string().min(1, 'Campaign reference is required'),
  
  recurring: z.boolean().default(false),
  
  matchingGift: z.boolean().default(false),
  
  anonymous: z.boolean().default(false),
  
  notes: z.string().max(1000).optional(),
  
  contact: donorContactSchema.optional(),
});

export const createDonorSchema = baseDonorSchema.refine(
  (data) => {
    // Individual donations cannot exceed federal limit
    if (data.donorType === DonorType.INDIVIDUAL && data.amount > 3300) {
      return false;
    }
    return true;
  },
  {
    message: 'Individual donations cannot exceed $3,300 (federal limit)',
    path: ['amount'],
  }
);

/**
 * Schema for updating a donor
 */
export const updateDonorSchema = baseDonorSchema.partial();

// ============================================================================
// DISTRICT SCHEMAS
// ============================================================================

/**
 * Schema for creating a new district
 */
const baseDistrictSchema = z.object({
  districtName: z.string().min(2, 'District name is required').max(150),
  
  districtType: z.nativeEnum(DistrictType),
  
  population: z.number().min(0),
  
  registeredVoters: z.number().min(0),
  
  currentRepresentative: z.string().max(100).optional(),
  
  representativeParty: z.nativeEnum(PoliticalParty).optional(),
  
  demographics: districtDemographicsSchema.optional(),
  
  competitiveness: z.enum(['Safe', 'Likely', 'Lean', 'Toss-up']).default('Toss-up'),
  
  boundaries: z.string().max(5000).optional(),
  
  notes: z.string().max(2000).optional(),
});

export const createDistrictSchema = baseDistrictSchema.refine(
  (data) => {
    // Registered voters cannot exceed population
    return data.registeredVoters <= data.population;
  },
  {
    message: 'Registered voters cannot exceed total population',
    path: ['registeredVoters'],
  }
);

/**
 * Schema for updating a district
 */
export const updateDistrictSchema = baseDistrictSchema.partial();

// ============================================================================
// VOTER OUTREACH SCHEMAS
// ============================================================================

/**
 * Schema for creating a new voter outreach activity
 */
const baseVoterOutreachSchema = z.object({
  campaign: z.string().min(1, 'Campaign reference is required'),
  
  method: z.nativeEnum(OutreachMethod),
  
  targetAudience: z.string().min(2, 'Target audience is required').max(200),
  
  date: z.coerce.date(),
  
  reach: z.number().min(0, 'Reach must be non-negative'),
  
  engagement: z.number().min(0, 'Engagement must be non-negative'),
  
  conversions: z.number().min(0, 'Conversions must be non-negative'),
  
  cost: z.number().min(0, 'Cost must be non-negative').default(0),
  
  effectiveness: z.number().min(0).max(100).optional(),
  
  notes: z.string().max(1000).optional(),
});

export const createVoterOutreachSchema = baseVoterOutreachSchema.refine(
  (data) => {
    // Engagement cannot exceed reach
    return data.engagement <= data.reach;
  },
  {
    message: 'Engagement cannot exceed reach',
    path: ['engagement'],
  }
).refine(
  (data) => {
    // Conversions cannot exceed engagement
    return data.conversions <= data.engagement;
  },
  {
    message: 'Conversions cannot exceed engagement',
    path: ['conversions'],
  }
);

/**
 * Schema for updating a voter outreach activity
 */
export const updateVoterOutreachSchema = baseVoterOutreachSchema.partial();

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for election query parameters
 */
export const electionQuerySchema = z.object({
  // Filters
  electionType: z.union([
    z.nativeEnum(ElectionType),
    z.array(z.nativeEnum(ElectionType)),
  ]).optional(),
  
  office: z.nativeEnum(PoliticalOffice).optional(),
  
  status: z.union([
    z.nativeEnum(ElectionStatus),
    z.array(z.nativeEnum(ElectionStatus)),
  ]).optional(),
  
  district: z.string().optional(),
  
  dateFrom: z.coerce.date().optional(),
  
  dateTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'electionDate',
    'office',
    'status',
    'registeredVoters',
    'createdAt',
    'updatedAt',
  ]).default('electionDate'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

/**
 * Schema for campaign query parameters
 */
export const campaignQuerySchema = z.object({
  // Filters
  status: z.union([
    z.nativeEnum(CampaignStatus),
    z.array(z.nativeEnum(CampaignStatus)),
  ]).optional(),
  
  party: z.nativeEnum(PoliticalParty).optional(),
  
  office: z.nativeEnum(PoliticalOffice).optional(),
  
  minFundsRaised: z.coerce.number().min(0).optional(),
  
  maxFundsRaised: z.coerce.number().min(0).optional(),
  
  dateFrom: z.coerce.date().optional(),
  
  dateTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'playerName',
    'party',
    'office',
    'status',
    'fundsRaised',
    'fundsSpent',
    'startDate',
    'createdAt',
    'updatedAt',
  ]).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

/**
 * Schema for bill query parameters
 */
export const billQuerySchema = z.object({
  // Filters
  status: z.union([
    z.nativeEnum(BillStatus),
    z.array(z.nativeEnum(BillStatus)),
  ]).optional(),
  
  category: z.nativeEnum(BillCategory).optional(),
  
  sponsor: z.string().optional(),
  
  committee: z.string().optional(),
  
  dateFrom: z.coerce.date().optional(),
  
  dateTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'billNumber',
    'title',
    'category',
    'status',
    'introducedDate',
    'lastActionDate',
    'createdAt',
    'updatedAt',
  ]).default('introducedDate'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

/**
 * Schema for donor query parameters
 */
export const donorQuerySchema = z.object({
  // Filters
  donorType: z.union([
    z.nativeEnum(DonorType),
    z.array(z.nativeEnum(DonorType)),
  ]).optional(),
  
  campaign: z.string().optional(),
  
  minAmount: z.coerce.number().min(0).optional(),
  
  maxAmount: z.coerce.number().min(0).optional(),
  
  recurring: z.coerce.boolean().optional(),
  
  anonymous: z.coerce.boolean().optional(),
  
  dateFrom: z.coerce.date().optional(),
  
  dateTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'donorName',
    'donorType',
    'amount',
    'donationDate',
    'createdAt',
    'updatedAt',
  ]).default('donationDate'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

/**
 * Schema for district query parameters
 */
export const districtQuerySchema = z.object({
  // Filters
  districtType: z.nativeEnum(DistrictType).optional(),
  
  minPopulation: z.coerce.number().min(0).optional(),
  
  maxPopulation: z.coerce.number().min(0).optional(),
  
  competitiveness: z.enum(['Safe', 'Likely', 'Lean', 'Toss-up']).optional(),
  
  representativeParty: z.nativeEnum(PoliticalParty).optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'districtName',
    'districtType',
    'population',
    'registeredVoters',
    'competitiveness',
    'createdAt',
    'updatedAt',
  ]).default('districtName'),
  
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

/**
 * Schema for voter outreach query parameters
 */
export const voterOutreachQuerySchema = z.object({
  // Filters
  campaign: z.string().optional(),
  
  method: z.union([
    z.nativeEnum(OutreachMethod),
    z.array(z.nativeEnum(OutreachMethod)),
  ]).optional(),
  
  minReach: z.coerce.number().min(0).optional(),
  
  maxReach: z.coerce.number().min(0).optional(),
  
  minEffectiveness: z.coerce.number().min(0).max(100).optional(),
  
  dateFrom: z.coerce.date().optional(),
  
  dateTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'date',
    'method',
    'reach',
    'engagement',
    'conversions',
    'effectiveness',
    'cost',
    'createdAt',
    'updatedAt',
  ]).default('date'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include options
  includeMetrics: z.coerce.boolean().default(false),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateElectionInput = z.infer<typeof createElectionSchema>;
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>;
export type ElectionQueryInput = z.infer<typeof electionQuerySchema>;

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type BillQueryInput = z.infer<typeof billQuerySchema>;

export type CreateDonorInput = z.infer<typeof createDonorSchema>;
export type UpdateDonorInput = z.infer<typeof updateDonorSchema>;
export type DonorQueryInput = z.infer<typeof donorQuerySchema>;

export type CreateDistrictInput = z.infer<typeof createDistrictSchema>;
export type UpdateDistrictInput = z.infer<typeof updateDistrictSchema>;
export type DistrictQueryInput = z.infer<typeof districtQuerySchema>;

export type CreateVoterOutreachInput = z.infer<typeof createVoterOutreachSchema>;
export type UpdateVoterOutreachInput = z.infer<typeof updateVoterOutreachSchema>;
export type VoterOutreachQueryInput = z.infer<typeof voterOutreachQuerySchema>;
