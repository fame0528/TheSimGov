/**
 * @file src/types/politics.ts
 * @description TypeScript types and interfaces for politics domain
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive type definitions for the politics and elections module.
 * Includes election types, campaign management, legislative bills, donors,
 * districts, and voter outreach types and interfaces.
 */

import type { Types } from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Political party affiliations
 */
export enum PoliticalParty {
  DEMOCRATIC = 'Democratic',
  REPUBLICAN = 'Republican',
  INDEPENDENT = 'Independent',
  LIBERTARIAN = 'Libertarian',
  GREEN = 'Green',
  OTHER = 'Other',
}

/**
 * Types of elections
 */
export enum ElectionType {
  PRIMARY = 'Primary',
  GENERAL = 'General',
  SPECIAL = 'Special',
  RUNOFF = 'Runoff',
  RECALL = 'Recall',
}

/**
 * Political offices
 */
export enum PoliticalOffice {
  MAYOR = 'Mayor',
  CITY_COUNCIL = 'City Council',
  GOVERNOR = 'Governor',
  STATE_SENATOR = 'State Senator',
  STATE_REPRESENTATIVE = 'State Representative',
  US_SENATOR = 'US Senator',
  US_REPRESENTATIVE = 'US Representative',
  PRESIDENT = 'President',
}

/**
 * Election status lifecycle
 */
export enum ElectionStatus {
  SCHEDULED = 'Scheduled',
  REGISTRATION_OPEN = 'Registration Open',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CERTIFIED = 'Certified',
  CANCELLED = 'Cancelled',
}

/**
 * Campaign lifecycle status
 */
export enum CampaignStatus {
  EXPLORATORY = 'Exploratory',
  ANNOUNCED = 'Announced',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  WITHDRAWN = 'Withdrawn',
  COMPLETED = 'Completed',
}

/**
 * Legislative bill status
 */
export enum BillStatus {
  DRAFTED = 'Drafted',
  INTRODUCED = 'Introduced',
  IN_COMMITTEE = 'In Committee',
  FLOOR_DEBATE = 'Floor Debate',
  PASSED_HOUSE = 'Passed House',
  PASSED_SENATE = 'Passed Senate',
  SENT_TO_EXECUTIVE = 'Sent to Executive',
  SIGNED = 'Signed',
  VETOED = 'Vetoed',
  FAILED = 'Failed',
}

/**
 * Bill category types
 */
export enum BillCategory {
  BUDGET = 'Budget',
  EDUCATION = 'Education',
  HEALTHCARE = 'Healthcare',
  INFRASTRUCTURE = 'Infrastructure',
  ENVIRONMENT = 'Environment',
  CRIMINAL_JUSTICE = 'Criminal Justice',
  ECONOMIC_DEVELOPMENT = 'Economic Development',
  SOCIAL_SERVICES = 'Social Services',
  LABOR = 'Labor',
  TAXATION = 'Taxation',
  OTHER = 'Other',
}

/**
 * Vote types for legislation
 */
export enum VoteType {
  YEA = 'Yea',
  NAY = 'Nay',
  ABSTAIN = 'Abstain',
  PRESENT = 'Present',
  ABSENT = 'Absent',
}

/**
 * Donor type categories
 */
export enum DonorType {
  INDIVIDUAL = 'Individual',
  PAC = 'PAC',
  SUPER_PAC = 'Super PAC',
  CORPORATION = 'Corporation',
  LABOR_UNION = 'Labor Union',
  NON_PROFIT = 'Non-Profit',
  PARTY_COMMITTEE = 'Party Committee',
  OTHER = 'Other',
}

/**
 * District type classifications
 */
export enum DistrictType {
  CONGRESSIONAL = 'Congressional',
  STATE_SENATE = 'State Senate',
  STATE_HOUSE = 'State House',
  CITY_COUNCIL = 'City Council',
  SCHOOL_BOARD = 'School Board',
  COUNTY = 'County',
}

/**
 * Voter outreach method types
 */
export enum OutreachMethod {
  DOOR_TO_DOOR = 'Door to Door',
  PHONE_BANKING = 'Phone Banking',
  TEXT_MESSAGING = 'Text Messaging',
  EMAIL_CAMPAIGN = 'Email Campaign',
  SOCIAL_MEDIA = 'Social Media',
  DIRECT_MAIL = 'Direct Mail',
  TV_ADVERTISING = 'TV Advertising',
  RADIO_ADVERTISING = 'Radio Advertising',
  DIGITAL_ADVERTISING = 'Digital Advertising',
  TOWN_HALL = 'Town Hall',
  RALLY = 'Rally',
  DEBATE = 'Debate',
}

/**
 * Campaign event types
 */
export enum CampaignEventType {
  FUNDRAISER = 'Fundraiser',
  RALLY = 'Rally',
  TOWN_HALL = 'Town Hall',
  DEBATE = 'Debate',
  MEET_AND_GREET = 'Meet and Greet',
  CANVASSING = 'Canvassing',
  PHONE_BANK = 'Phone Bank',
  PRESS_CONFERENCE = 'Press Conference',
  VOLUNTEER_TRAINING = 'Volunteer Training',
}

/**
 * Political lean spectrum
 */
export enum PoliticalLean {
  STRONGLY_LIBERAL = 'Strongly Liberal',
  LIBERAL = 'Liberal',
  LEAN_LIBERAL = 'Lean Liberal',
  MODERATE = 'Moderate',
  LEAN_CONSERVATIVE = 'Lean Conservative',
  CONSERVATIVE = 'Conservative',
  STRONGLY_CONSERVATIVE = 'Strongly Conservative',
}

// ============================================================================
// SUB-INTERFACES
// ============================================================================

/**
 * Candidate information in an election (player-only)
 */
export interface ElectionCandidate {
  playerId: string;
  candidateId: string;
  candidateName: string;
  party: PoliticalParty;
  platform: string;
  fundsRaised: number;
  endorsements: string[];
  votes: number;
  votePercentage: number;
  won: boolean;
}

/**
 * Election results summary
 */
export interface ElectionResults {
  totalVotes: number;
  turnoutRate: number;
  winnerId: string;
  winnerName: string;
  winnerParty: PoliticalParty;
  margin: number;
  marginPercentage: number;
  certifiedDate?: string | Date;
}

/**
 * Campaign event details
 */
export interface CampaignEvent {
  eventType: CampaignEventType;
  name: string;
  date: string | Date;
  location: string;
  description?: string;
  attendees: number;
  fundsRaised?: number;
  cost: number;
  success: boolean;
}

/**
 * Campaign poll data
 */
export interface CampaignPoll {
  date: string | Date;
  pollster: string;
  sampleSize: number;
  support: number;
  favorability: number;
  nameRecognition: number;
  marginOfError: number;
}

/**
 * Legislative vote record
 */
export interface LegislativeVote {
  legislatorId: string;
  legislatorName: string;
  party: PoliticalParty;
  vote: VoteType;
  date: string | Date;
}

/**
 * Bill amendment
 */
export interface BillAmendment {
  amendmentNumber: string;
  sponsor: string;
  description: string;
  status: 'Pending' | 'Adopted' | 'Rejected';
  date: string | Date;
}

/**
 * Expected impact of legislation
 */
export interface BillImpact {
  economicImpact: number;
  socialImpact: number;
  environmentalImpact: number;
  estimatedCost: number;
  approvalRating: number;
  affectedPopulation: number;
}

/**
 * Donor contact information
 */
export interface DonorContact {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * District demographics
 */
export interface DistrictDemographics {
  medianAge: number;
  medianIncome: number;
  populationDensity: number;
  educationBachelor: number;
  educationHighSchool: number;
  raceWhite: number;
  raceBlack: number;
  raceHispanic: number;
  raceAsian: number;
  raceOther: number;
  unemploymentRate: number;
  povertyRate: number;
}

// ============================================================================
// MAIN DATA INTERFACES
// ============================================================================

/**
 * Election data structure (from API/database)
 */
export interface ElectionData {
  _id: string;
  company: string | Types.ObjectId;
  electionType: ElectionType;
  office: PoliticalOffice;
  district?: string | Types.ObjectId;
  districtName?: string;
  electionDate: string | Date;
  registrationDeadline: string | Date;
  candidates: ElectionCandidate[];
  results?: ElectionResults;
  status: ElectionStatus;
  active: boolean;
  
  // Virtual fields
  daysUntilElection?: number;
  isCompleted?: boolean;
  totalCandidates?: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Campaign data structure (from API/database)
 */
export interface CampaignData {
  _id: string;
  company: string | Types.ObjectId;
  playerId: string | Types.ObjectId;
  playerName: string;
  election: string | Types.ObjectId;
  electionName?: string;
  office: PoliticalOffice;
  party: PoliticalParty;
  platform: string;
  status: CampaignStatus;
  startDate: string | Date;
  endDate?: string | Date;
  
  // Financial
  fundsRaised: number;
  fundsSpent: number;
  budget: number;
  
  // Events & Outreach
  events: CampaignEvent[];
  polls: CampaignPoll[];
  endorsements: string[];
  
  // Staff & Volunteers
  staff: number;
  volunteers: number;
  
  active: boolean;
  
  // Virtual fields
  remainingBudget?: number;
  pollAverage?: number;
  favorabilityAverage?: number;
  daysActive?: number;
  eventCount?: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Legislative bill data structure (from API/database)
 */
export interface BillData {
  _id: string;
  company: string | Types.ObjectId;
  billNumber: string;
  title: string;
  sponsor: string;
  sponsorId?: string | Types.ObjectId;
  coSponsors: string[];
  category: BillCategory;
  description: string;
  textSummary: string;
  status: BillStatus;
  introducedDate: string | Date;
  committee?: string;
  votes: LegislativeVote[];
  amendments: BillAmendment[];
  expectedImpact: BillImpact;
  active: boolean;
  
  // Virtual fields
  voteCount?: {
    yea: number;
    nay: number;
    abstain: number;
    present: number;
    absent: number;
  };
  supportPercentage?: number;
  daysInCongress?: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Donor data structure (from API/database)
 */
export interface DonorData {
  _id: string;
  company: string | Types.ObjectId;
  donorType: DonorType;
  name: string;
  amount: number;
  campaign: string | Types.ObjectId;
  campaignName?: string;
  date: string | Date;
  recurring: boolean;
  recurringFrequency?: 'Weekly' | 'Monthly' | 'Quarterly';
  matchingGift: boolean;
  matchingAmount?: number;
  anonymous: boolean;
  contact?: DonorContact;
  notes?: string;
  active: boolean;
  
  // Virtual fields
  totalContribution?: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * District data structure (from API/database)
 */
export interface DistrictData {
  _id: string;
  company: string | Types.ObjectId;
  districtType: DistrictType;
  name: string;
  number: number;
  population: number;
  demographics: DistrictDemographics;
  politicalLean: PoliticalLean;
  keyIssues: string[];
  turnoutRate: number;
  incumbents: string[];
  active: boolean;
  
  // Virtual fields
  competitiveness?: 'Safe' | 'Likely' | 'Lean' | 'Toss-up';
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Voter outreach data structure (from API/database)
 */
export interface VoterOutreachData {
  _id: string;
  company: string | Types.ObjectId;
  campaign: string | Types.ObjectId;
  campaignName?: string;
  method: OutreachMethod;
  targetDemographic: string;
  message: string;
  date: string | Date;
  cost: number;
  reach: number;
  engagement: number;
  conversions: number;
  effectiveness: number;
  notes?: string;
  active: boolean;
  
  // Virtual fields
  roi?: number;
  conversionRate?: number;
  engagementRate?: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

/**
 * Data required to create a new election
 */
export interface ElectionCreate {
  electionType: ElectionType;
  office: PoliticalOffice;
  district?: string;
  electionDate: string | Date;
  registrationDeadline: string | Date;
  candidates?: ElectionCandidate[];
  status?: ElectionStatus;
}

/**
 * Data for updating an existing election
 */
export interface ElectionUpdate {
  electionType?: ElectionType;
  office?: PoliticalOffice;
  district?: string;
  electionDate?: string | Date;
  registrationDeadline?: string | Date;
  candidates?: ElectionCandidate[];
  results?: ElectionResults;
  status?: ElectionStatus;
  active?: boolean;
}

/**
 * Data required to create a new campaign
 */
export interface CampaignCreate {
  playerId: string;
  playerName: string;
  election: string;
  office: PoliticalOffice;
  party: PoliticalParty;
  platform: string;
  startDate: string | Date;
  budget: number;
  status?: CampaignStatus;
  staff?: number;
  volunteers?: number;
}

/**
 * Data for updating an existing campaign
 */
export interface CampaignUpdate {
  playerId?: string;
  playerName?: string;
  election?: string;
  office?: PoliticalOffice;
  party?: PoliticalParty;
  platform?: string;
  status?: CampaignStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  fundsRaised?: number;
  fundsSpent?: number;
  budget?: number;
  events?: CampaignEvent[];
  polls?: CampaignPoll[];
  endorsements?: string[];
  staff?: number;
  volunteers?: number;
  active?: boolean;
}

/**
 * Data required to create a new bill
 */
export interface BillCreate {
  billNumber: string;
  title: string;
  sponsor: string;
  sponsorId?: string;
  coSponsors?: string[];
  category: BillCategory;
  description: string;
  textSummary: string;
  introducedDate: string | Date;
  committee?: string;
  expectedImpact: BillImpact;
  status?: BillStatus;
}

/**
 * Data for updating an existing bill
 */
export interface BillUpdate {
  billNumber?: string;
  title?: string;
  sponsor?: string;
  sponsorId?: string;
  coSponsors?: string[];
  category?: BillCategory;
  description?: string;
  textSummary?: string;
  status?: BillStatus;
  introducedDate?: string | Date;
  committee?: string;
  votes?: LegislativeVote[];
  amendments?: BillAmendment[];
  expectedImpact?: Partial<BillImpact>;
  active?: boolean;
}

/**
 * Data required to create a new donor
 */
export interface DonorCreate {
  donorType: DonorType;
  name: string;
  amount: number;
  campaign: string;
  date: string | Date;
  recurring?: boolean;
  recurringFrequency?: 'Weekly' | 'Monthly' | 'Quarterly';
  matchingGift?: boolean;
  matchingAmount?: number;
  anonymous?: boolean;
  contact?: DonorContact;
  notes?: string;
}

/**
 * Data for updating an existing donor
 */
export interface DonorUpdate {
  donorType?: DonorType;
  name?: string;
  amount?: number;
  campaign?: string;
  date?: string | Date;
  recurring?: boolean;
  recurringFrequency?: 'Weekly' | 'Monthly' | 'Quarterly';
  matchingGift?: boolean;
  matchingAmount?: number;
  anonymous?: boolean;
  contact?: Partial<DonorContact>;
  notes?: string;
  active?: boolean;
}

/**
 * Data required to create a new district
 */
export interface DistrictCreate {
  districtType: DistrictType;
  name: string;
  number: number;
  population: number;
  demographics: DistrictDemographics;
  politicalLean: PoliticalLean;
  keyIssues?: string[];
  turnoutRate?: number;
  incumbents?: string[];
}

/**
 * Data for updating an existing district
 */
export interface DistrictUpdate {
  districtType?: DistrictType;
  name?: string;
  number?: number;
  population?: number;
  demographics?: Partial<DistrictDemographics>;
  politicalLean?: PoliticalLean;
  keyIssues?: string[];
  turnoutRate?: number;
  incumbents?: string[];
  active?: boolean;
}

/**
 * Data required to create a new voter outreach activity
 */
export interface VoterOutreachCreate {
  campaign: string;
  method: OutreachMethod;
  targetDemographic: string;
  message: string;
  date: string | Date;
  cost: number;
  reach: number;
  engagement?: number;
  conversions?: number;
  notes?: string;
}

/**
 * Data for updating an existing voter outreach activity
 */
export interface VoterOutreachUpdate {
  campaign?: string;
  method?: OutreachMethod;
  targetDemographic?: string;
  message?: string;
  date?: string | Date;
  cost?: number;
  reach?: number;
  engagement?: number;
  conversions?: number;
  effectiveness?: number;
  notes?: string;
  active?: boolean;
}

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

/**
 * Aggregated metrics for politics dashboard
 */
export interface PoliticsMetrics {
  // Election counts
  totalElections: number;
  scheduledElections: number;
  activeElections: number;
  completedElections: number;
  
  // Campaign metrics
  totalCampaigns: number;
  activeCampaigns: number;
  suspendedCampaigns: number;
  completedCampaigns: number;
  totalFundsRaised: number;
  totalFundsSpent: number;
  averagePollSupport: number;
  
  // Legislative metrics
  totalBills: number;
  billsIntroduced: number;
  billsPassed: number;
  billsFailed: number;
  averageBillSupport: number;
  
  // Fundraising metrics
  totalDonors: number;
  totalDonations: number;
  averageDonation: number;
  recurringDonors: number;
  
  // Voter engagement
  averageTurnoutRate: number;
  totalVoterReach: number;
  averageOutreachEffectiveness: number;
}

/**
 * Election statistics by type
 */
export interface ElectionTypeStats {
  electionType: ElectionType;
  count: number;
  averageTurnout: number;
  completionRate: number;
}

/**
 * Campaign performance summary
 */
export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  candidate: string;
  party: PoliticalParty;
  fundsRaised: number;
  pollAverage: number;
  favorability: number;
  eventCount: number;
  volunteerCount: number;
  projectedWinProbability: number;
}

/**
 * Bill passage analysis
 */
export interface BillAnalysis {
  category: BillCategory;
  totalBills: number;
  passedBills: number;
  failedBills: number;
  passageRate: number;
  averageSupport: number;
  averageImpact: number;
}

/**
 * Fundraising breakdown
 */
export interface FundraisingBreakdown {
  donorType: DonorType;
  count: number;
  totalAmount: number;
  averageAmount: number;
  percentOfTotal: number;
}

/**
 * District competitiveness analysis
 */
export interface DistrictCompetitiveness {
  districtId: string;
  districtName: string;
  politicalLean: PoliticalLean;
  turnoutRate: number;
  activeElections: number;
  competitiveness: 'Safe' | 'Likely' | 'Lean' | 'Toss-up';
}

// ============================================================================
// API QUERY & RESPONSE TYPES
// ============================================================================

/**
 * API query parameters for elections
 */
export interface ElectionQuery {
  electionType?: ElectionType | ElectionType[];
  office?: PoliticalOffice | PoliticalOffice[];
  status?: ElectionStatus | ElectionStatus[];
  district?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  search?: string;
  sortBy?: keyof ElectionData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeMetrics?: boolean;
}

/**
 * API query parameters for campaigns
 */
export interface CampaignQuery {
  status?: CampaignStatus | CampaignStatus[];
  party?: PoliticalParty | PoliticalParty[];
  office?: PoliticalOffice | PoliticalOffice[];
  election?: string;
  playerId?: string;
  minFunds?: number;
  maxFunds?: number;
  search?: string;
  sortBy?: keyof CampaignData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeMetrics?: boolean;
}

/**
 * API query parameters for bills
 */
export interface BillQuery {
  status?: BillStatus | BillStatus[];
  category?: BillCategory | BillCategory[];
  sponsor?: string;
  committee?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  search?: string;
  sortBy?: keyof BillData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeMetrics?: boolean;
}

/**
 * API query parameters for donors
 */
export interface DonorQuery {
  donorType?: DonorType | DonorType[];
  campaign?: string;
  minAmount?: number;
  maxAmount?: number;
  recurring?: boolean;
  anonymous?: boolean;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  search?: string;
  sortBy?: keyof DonorData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * API query parameters for districts
 */
export interface DistrictQuery {
  districtType?: DistrictType | DistrictType[];
  politicalLean?: PoliticalLean | PoliticalLean[];
  minPopulation?: number;
  maxPopulation?: number;
  search?: string;
  sortBy?: keyof DistrictData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * API query parameters for voter outreach
 */
export interface VoterOutreachQuery {
  campaign?: string;
  method?: OutreachMethod | OutreachMethod[];
  dateFrom?: string | Date;
  dateTo?: string | Date;
  minEffectiveness?: number;
  search?: string;
  sortBy?: keyof VoterOutreachData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response for election list
 */
export interface ElectionListResponse {
  success: boolean;
  data: ElectionData[];
  pagination: PaginationMetadata;
  metrics?: PoliticsMetrics;
}

/**
 * API response for single election
 */
export interface ElectionResponse {
  success: boolean;
  data: ElectionData;
}

/**
 * API response for campaign list
 */
export interface CampaignListResponse {
  success: boolean;
  data: CampaignData[];
  pagination: PaginationMetadata;
  metrics?: PoliticsMetrics;
}

/**
 * API response for single campaign
 */
export interface CampaignResponse {
  success: boolean;
  data: CampaignData;
}

/**
 * API response for bill list
 */
export interface BillListResponse {
  success: boolean;
  data: BillData[];
  pagination: PaginationMetadata;
  metrics?: PoliticsMetrics;
}

/**
 * API response for single bill
 */
export interface BillResponse {
  success: boolean;
  data: BillData;
}

/**
 * API response for donor list
 */
export interface DonorListResponse {
  success: boolean;
  data: DonorData[];
  pagination: PaginationMetadata;
}

/**
 * API response for single donor
 */
export interface DonorResponse {
  success: boolean;
  data: DonorData;
}

/**
 * API response for district list
 */
export interface DistrictListResponse {
  success: boolean;
  data: DistrictData[];
  pagination: PaginationMetadata;
}

/**
 * API response for single district
 */
export interface DistrictResponse {
  success: boolean;
  data: DistrictData;
}

/**
 * API response for voter outreach list
 */
export interface VoterOutreachListResponse {
  success: boolean;
  data: VoterOutreachData[];
  pagination: PaginationMetadata;
}

/**
 * API response for single voter outreach
 */
export interface VoterOutreachResponse {
  success: boolean;
  data: VoterOutreachData;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Election with ID for frontend use
 */
export type ElectionWithId = ElectionData & { id: string };

/**
 * Campaign with ID for frontend use
 */
export type CampaignWithId = CampaignData & { id: string };

/**
 * Bill with ID for frontend use
 */
export type BillWithId = BillData & { id: string };

/**
 * Partial update types
 */
export type ElectionPartial = Partial<ElectionData>;
export type CampaignPartial = Partial<CampaignData>;
export type BillPartial = Partial<BillData>;
export type DonorPartial = Partial<DonorData>;
export type DistrictPartial = Partial<DistrictData>;
export type VoterOutreachPartial = Partial<VoterOutreachData>;

/**
 * Filter options for dropdowns
 */
export interface PoliticsFilterOptions {
  electionTypes: ElectionType[];
  offices: PoliticalOffice[];
  parties: PoliticalParty[];
  campaignStatuses: CampaignStatus[];
  billStatuses: BillStatus[];
  billCategories: BillCategory[];
  donorTypes: DonorType[];
  districtTypes: DistrictType[];
  outreachMethods: OutreachMethod[];
}

/**
 * Dashboard summary data
 */
export interface PoliticsDashboardData {
  metrics: PoliticsMetrics;
  electionStats: ElectionTypeStats[];
  campaignPerformance: CampaignPerformance[];
  billAnalysis: BillAnalysis[];
  fundraisingBreakdown: FundraisingBreakdown[];
  districtCompetitiveness: DistrictCompetitiveness[];
  recentElections: ElectionData[];
  activeCampaigns: CampaignData[];
  recentBills: BillData[];
}

// ============================================================================
// LEGACY/ALIAS EXPORTS FOR CONTRACT COMPATIBILITY
// ============================================================================

// Core entity aliases (expected by hooks/components)
export type Election = ElectionData;
export type Campaign = CampaignData;
export type Bill = BillData;
export type Donor = DonorData;
export type District = DistrictData;
export type VoterOutreach = VoterOutreachData;

// List item projections commonly used in dashboards/tables
export interface ElectionListItem {
  id: string;
  _id?: string;
  electionType: ElectionType;
  office: PoliticalOffice;
  districtName?: string;
  electionDate: string | Date;
  status: ElectionStatus;
  // Optional fields used by UI components
  officeName?: string;
  state?: string;
  daysUntil?: number;
  candidateCount?: number;
}

export interface CampaignListItem {
  id: string;
  playerName: string;
  office: PoliticalOffice;
  party: PoliticalParty;
  status: CampaignStatus;
  fundsRaised: number;
}

export interface BillListItem {
  id: string;
  billNumber: string;
  title: string;
  category: BillCategory;
  status: BillStatus;
}

export interface DonorListItem {
  id: string;
  name: string;
  donorType: DonorType;
  amount: number;
  date: string | Date;
}

export interface DistrictListItem {
  id: string;
  name: string;
  districtType: DistrictType;
  population: number;
}

export interface VoterOutreachListItem {
  id: string;
  _id?: string;
  campaignName?: string;
  method: OutreachMethod;
  date: string | Date;
  reach: number;
  effectiveness: number;
  // Optional fields referenced by panels
  name?: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string | Date;
  type?: string;
  totalAttempts?: number;
  successfulContacts?: number;
  contactRate?: number;
  volunteerCount?: number;
  targetContacts?: number;
  isUpcoming?: boolean;
}

// DTO alias names expected by hooks (Create*/Update*Input)
export type CreateElectionInput = ElectionCreate;
export type UpdateElectionInput = ElectionUpdate;
export type CreateCampaignInput = CampaignCreate;
export type UpdateCampaignInput = CampaignUpdate;
export type CreateBillInput = BillCreate;
export type UpdateBillInput = BillUpdate;
export type CreateDonorInput = DonorCreate;
export type UpdateDonorInput = DonorUpdate;
export type CreateDistrictInput = DistrictCreate;
export type UpdateDistrictInput = DistrictUpdate;
export type CreateOutreachInput = VoterOutreachCreate;
export type UpdateOutreachInput = VoterOutreachUpdate;
