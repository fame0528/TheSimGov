/**
 * @file src/types/politics/index.ts
 * @description Expanded Politics Types - Elections, Districts, Donors, Voter Outreach
 * @created 2025-11-29
 * @author ECHO v1.3.3
 *
 * OVERVIEW:
 * Frontend-specific type definitions for the politics expansion.
 * Extends backend model types for use across UI components.
 * Includes DTOs, display types, and form types.
 */

// Re-export bill types
export * from './bills';

// ============================================================================
// ELECTION TYPES
// ============================================================================

/**
 * Office types for elections
 */
export type OfficeType =
  | 'President'
  | 'VicePresident'
  | 'Senator'
  | 'Representative'
  | 'Governor'
  | 'LtGovernor'
  | 'StateSenator'
  | 'StateRep'
  | 'Mayor'
  | 'CityCouncil'
  | 'CountyExec'
  | 'Sheriff'
  | 'DistrictAttorney';

/**
 * Election types
 */
export type ElectionType = 'Primary' | 'General' | 'Special' | 'Runoff' | 'Recall';

/**
 * Election status
 */
export type ElectionStatus =
  | 'Scheduled'
  | 'FilingClosed'
  | 'Active'
  | 'Counting'
  | 'Called'
  | 'Certified'
  | 'Cancelled'
  | 'Contested';

/**
 * Political party
 */
export type Party = 'Democrat' | 'Republican' | 'Independent' | 'Libertarian' | 'Green' | 'Other';

/**
 * Candidate display type
 */
export interface CandidateDisplay {
  playerId?: string;
  campaignId?: string;
  name: string;
  party: Party;
  incumbent: boolean;
  filedAt: string | Date;
  qualified: boolean;
  withdrawn: boolean;
  ballotOrder: number;
  endorsementCount: number;
  pollingAverage: number;
  fundsRaised: number;
}

/**
 * Candidate result display type
 */
export interface CandidateResultDisplay {
  candidateIndex: number;
  candidateName: string;
  party: Party;
  votes: number;
  percentage: number;
  margin?: number;
  winner: boolean;
}

/**
 * Election display type for UI
 */
export interface ElectionDisplay {
  _id: string;
  state?: string;
  districtNumber?: number;
  officeType: OfficeType;
  officeName: string;
  electionYear: number;
  electionCycle: string;
  electionDate: string | Date;
  electionType: ElectionType;
  status: ElectionStatus;
  filingDeadline: string | Date;
  candidates: CandidateDisplay[];
  results: CandidateResultDisplay[];
  totalVotes: number;
  turnout: number;
  margin: number;
  winnerIndex?: number;
  calledAt?: string | Date;
  certifiedAt?: string | Date;
  termLength: number;
  termStartDate: string | Date;
  termEndDate: string | Date;
  // Computed
  daysUntil?: number;
  isFilingOpen?: boolean;
  winner?: CandidateDisplay;
}

/**
 * Election list item (summary)
 */
export interface ElectionListItem {
  _id: string;
  officeName: string;
  state?: string;
  electionType: ElectionType;
  electionDate: string | Date;
  status: ElectionStatus;
  candidateCount: number;
  daysUntil: number;
}

/**
 * Create election DTO
 */
export interface CreateElectionDTO {
  state?: string;
  districtNumber?: number;
  officeType: OfficeType;
  officeName: string;
  electionYear: number;
  electionType: ElectionType;
  electionDate: string;
  filingDeadline: string;
  runoffRequired?: boolean;
  runoffThreshold?: number;
}

/**
 * File for office DTO
 */
export interface FileForOfficeDTO {
  electionId: string;
  candidateName: string;
  party: Party;
}

// ============================================================================
// DISTRICT TYPES
// ============================================================================

/**
 * District types
 */
export type DistrictType =
  | 'Congressional'
  | 'StateSenate'
  | 'StateHouse'
  | 'County'
  | 'City'
  | 'SchoolBoard'
  | 'Special';

/**
 * Urban/Rural classification
 */
export type UrbanRuralType = 'Urban' | 'Suburban' | 'Rural' | 'Mixed';

/**
 * Trend direction
 */
export type TrendDirection = 'TrendingD' | 'Stable' | 'TrendingR';

/**
 * Demographics display
 */
export interface DemographicsDisplay {
  population: number;
  votingAgePopulation: number;
  medianAge: number;
  medianIncome: number;
  povertyRate: number;
  unemploymentRate: number;
  populationDensity: number;
}

/**
 * Education breakdown display
 */
export interface EducationBreakdownDisplay {
  lessThanHS: number;
  highSchool: number;
  someCollege: number;
  bachelors: number;
  graduate: number;
}

/**
 * Race/Ethnicity breakdown display
 */
export interface RaceEthnicityDisplay {
  white: number;
  black: number;
  hispanic: number;
  asian: number;
  nativeAmerican: number;
  pacific: number;
  multiracial: number;
  other: number;
}

/**
 * Voter registration display
 */
export interface VoterRegistrationDisplay {
  total: number;
  democrat: number;
  republican: number;
  independent: number;
  other: number;
  advantage: number;
  democratPercent: number;
  republicanPercent: number;
  independentPercent: number;
  asOfDate: string | Date;
}

/**
 * Historical election result
 */
export interface HistoricalResultDisplay {
  year: number;
  officeType: string;
  democratName: string;
  democratVotes: number;
  democratPercent: number;
  republicanName: string;
  republicanVotes: number;
  republicanPercent: number;
  totalVotes: number;
  turnout: number;
  winner: 'Democrat' | 'Republican' | 'Other';
  margin: number;
}

/**
 * Key issue display
 */
export interface KeyIssueDisplay {
  issue: string;
  importance: number;
  lean: number;
}

/**
 * District display type for UI
 */
export interface DistrictDisplay {
  _id: string;
  state: string;
  districtType: DistrictType;
  districtNumber: number;
  districtName: string;
  districtCode: string;
  areaSqMiles: number;
  urbanRural: UrbanRuralType;
  urbanPercent: number;
  suburbanPercent: number;
  ruralPercent: number;
  demographics: DemographicsDisplay;
  education: EducationBreakdownDisplay;
  raceEthnicity: RaceEthnicityDisplay;
  voterRegistration: VoterRegistrationDisplay;
  historicalResults: HistoricalResultDisplay[];
  pvi: number;
  pviFormatted: string;
  avgTurnout: number;
  trend: TrendDirection;
  trendMagnitude: number;
  competitivenessScore: number;
  isSwingDistrict: boolean;
  lastFlipped?: string | Date;
  currentParty: 'Democrat' | 'Republican' | 'Vacant';
  currentRepName?: string;
  keyIssues: KeyIssueDisplay[];
  // Computed
  leanDescription?: string;
}

/**
 * District list item (summary)
 */
export interface DistrictListItem {
  _id: string;
  districtCode: string;
  districtName: string;
  state: string;
  districtType: DistrictType;
  pviFormatted: string;
  competitivenessScore: number;
  isSwingDistrict: boolean;
  currentParty: 'Democrat' | 'Republican' | 'Vacant';
}

/**
 * District targeting score
 */
export interface DistrictTargetingScore {
  persuadableVoters: number;
  turnoutPotential: number;
  resourceEfficiency: number;
  overallScore: number;
}

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

/**
 * Campaign status
 */
export type CampaignStatus =
  | 'Exploratory'
  | 'Announced'
  | 'Active'
  | 'Suspended'
  | 'Withdrawn'
  | 'Won'
  | 'Lost'
  | 'Runoff';

/**
 * Strategy type
 */
export type StrategyType = 'Grassroots' | 'AirWar' | 'Hybrid' | 'Digital' | 'Retail';

/**
 * Staff role
 */
export type StaffRole =
  | 'CampaignManager'
  | 'CommunicationsDirector'
  | 'FinanceDirector'
  | 'FieldDirector'
  | 'PoliticalDirector'
  | 'DigitalDirector'
  | 'Pollster'
  | 'MediaConsultant'
  | 'OppositionResearcher'
  | 'Scheduler'
  | 'VolunteerCoordinator'
  | 'FieldOrganizer'
  | 'PressSecretary';

/**
 * Campaign metrics display
 */
export interface CampaignMetricsDisplay {
  pollingAverage: number;
  pollingTrend: number;
  favorability: number;
  nameRecognition: number;
  momentum: number;
  enthusiasm: number;
  groundGame: number;
  mediaScore: number;
  overallHealth: number;
}

/**
 * Campaign staff display
 */
export interface CampaignStaffDisplay {
  employeeId?: string;
  name: string;
  role: StaffRole;
  salary: number;
  skill: number;
  experience: number;
  hiredAt: string | Date;
  active: boolean;
  performance: number;
}

/**
 * Issue position display
 */
export interface IssuePositionDisplay {
  issue: string;
  position: number;
  emphasis: number;
  description?: string;
}

/**
 * Campaign display type for UI
 */
export interface CampaignDisplay {
  _id: string;
  playerId: string;
  companyId: string;
  electionId: string;
  candidateName: string;
  party: Party;
  incumbent: boolean;
  status: CampaignStatus;
  slogan?: string;
  announcedAt: string | Date;
  messagingTheme: string;
  strategyType: StrategyType;
  issuePositions: IssuePositionDisplay[];
  // Finances
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  weeklyBurnRate: number;
  daysUntilBroke: number;
  debt: number;
  // Staff
  staff: CampaignStaffDisplay[];
  monthlyPayroll: number;
  volunteersActive: number;
  volunteerHours: number;
  // Metrics
  metrics: CampaignMetricsDisplay;
  endorsementCount: number;
  // Ground game
  doorsKnocked: number;
  phoneCallsMade: number;
  voterContacts: number;
  identifiedSupporters: number;
  // Computed
  isActive?: boolean;
  activeStaffCount?: number;
}

/**
 * Create campaign DTO
 */
export interface CreateCampaignDTO {
  electionId: string;
  candidateName: string;
  party: Party;
  slogan?: string;
  messagingTheme: string;
  strategyType: StrategyType;
}

// ============================================================================
// DONOR TYPES
// ============================================================================

/**
 * Donor type
 */
export type DonorType =
  | 'Individual'
  | 'PAC'
  | 'SuperPAC'
  | 'Business'
  | 'Union'
  | 'PartyCommittee'
  | 'SelfFunded';

/**
 * Contribution type
 */
export type ContributionType = 'Monetary' | 'InKind' | 'Bundled' | 'Loan' | 'SelfContribution';

/**
 * Donor tier
 */
export type DonorTier = 'Small' | 'Grassroots' | 'MidLevel' | 'Major' | 'Elite' | 'Bundler' | 'Mega';

/**
 * Contribution display
 */
export interface ContributionDisplay {
  campaignId: string;
  campaignName?: string;
  amount: number;
  type: ContributionType;
  date: string | Date;
  electionType: 'Primary' | 'General' | 'Special' | 'Runoff';
  receiptId: string;
}

/**
 * Donor display type for UI
 */
export interface DonorDisplay {
  _id: string;
  name: string;
  donorType: DonorType;
  companyId?: string;
  playerId?: string;
  tier: DonorTier;
  totalContributed: number;
  thisElectionCycle: number;
  maxContribution: number;
  remainingCapacity: number;
  averageContribution: number;
  contributionCount: number;
  contributions: ContributionDisplay[];
  isBundler: boolean;
  bundledAmount: number;
  preferredParty?: string;
  issueInterests: string[];
  optedOut: boolean;
  complianceVerified: boolean;
  flaggedForReview: boolean;
}

/**
 * Create contribution DTO
 */
export interface CreateContributionDTO {
  donorId: string;
  campaignId: string;
  amount: number;
  type: ContributionType;
  electionType: 'Primary' | 'General' | 'Special' | 'Runoff';
}

/**
 * Donor list item (summary)
 */
export interface DonorListItem {
  _id: string;
  name: string;
  donorType: DonorType;
  tier: DonorTier;
  totalContributed: number;
  remainingCapacity: number;
  isBundler: boolean;
}

// ============================================================================
// VOTER OUTREACH TYPES
// ============================================================================

/**
 * Outreach operation type
 */
export type OutreachOperationType =
  | 'PhoneBank'
  | 'TextBank'
  | 'Canvass'
  | 'GOTV'
  | 'RallyAttendance'
  | 'VoterRegistration'
  | 'LiteratureDrop'
  | 'Visibility';

/**
 * Outreach status
 */
export type OutreachStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

/**
 * Contact result
 */
export type ContactResult =
  | 'NotAttempted'
  | 'NoAnswer'
  | 'LeftMessage'
  | 'Refused'
  | 'StrongSupport'
  | 'LeanSupport'
  | 'Undecided'
  | 'LeanOppose'
  | 'StrongOppose'
  | 'Moved'
  | 'Deceased'
  | 'WrongNumber'
  | 'LanguageBarrier'
  | 'Voted'
  | 'CommittedToVote'
  | 'NeedsRide';

/**
 * Voter contact display
 */
export interface VoterContactDisplay {
  voterId: string;
  voterName: string;
  contactMethod: 'Phone' | 'Door' | 'Text' | 'InPerson';
  result: ContactResult;
  notes?: string;
  contactedAt: string | Date;
  attemptNumber: number;
  duration?: number;
  issuesDiscussed?: string[];
  followUpNeeded: boolean;
}

/**
 * Volunteer assignment display
 */
export interface VolunteerAssignmentDisplay {
  volunteerId: string;
  volunteerName: string;
  status: 'Active' | 'Inactive' | 'OnBreak' | 'CompletedShift';
  shiftStart: string | Date;
  shiftEnd?: string | Date;
  hoursWorked: number;
  contactsMade: number;
  contactsSuccessful: number;
  performanceScore: number;
}

/**
 * Outreach shift display
 */
export interface OutreachShiftDisplay {
  date: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  location?: string;
  volunteerCount: number;
  contactsAttempted: number;
  contactsSuccessful: number;
  supportersIdentified: number;
}

/**
 * Voter outreach display type for UI
 */
export interface VoterOutreachDisplay {
  _id: string;
  campaignId: string;
  districtId: string;
  districtName?: string;
  operationType: OutreachOperationType;
  status: OutreachStatus;
  name: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  shifts: OutreachShiftDisplay[];
  // Targets
  targetVoterCount: number;
  targetContactRate: number;
  targetSupportersIdentified: number;
  // Progress
  contactsAttempted: number;
  contactsReached: number;
  supportersIdentified: number;
  oppositionIdentified: number;
  undecidedVoters: number;
  completionPercentage: number;
  contactRateAchieved: number;
  // Resources
  volunteersAssigned: VolunteerAssignmentDisplay[];
  volunteerHours: number;
  staffCount: number;
  // GOTV
  committeesToVote: number;
  needsRideCount: number;
  confirmedVoted: number;
  // Metrics
  contactsPerHour: number;
  persuasionRate: number;
  costPerContact: number;
  totalCost: number;
}

/**
 * Create outreach operation DTO
 */
export interface CreateOutreachDTO {
  campaignId: string;
  districtId: string;
  operationType: OutreachOperationType;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetVoterCount: number;
  targetContactRate: number;
}

/**
 * Record voter contact DTO
 */
export interface RecordContactDTO {
  outreachId: string;
  voterId: string;
  voterName: string;
  contactMethod: 'Phone' | 'Door' | 'Text' | 'InPerson';
  result: ContactResult;
  notes?: string;
  duration?: number;
  issuesDiscussed?: string[];
}

/**
 * Outreach list item (summary)
 */
export interface OutreachListItem {
  _id: string;
  name: string;
  operationType: OutreachOperationType;
  status: OutreachStatus;
  districtName: string;
  completionPercentage: number;
  supportersIdentified: number;
  startDate: string | Date;
  endDate: string | Date;
}

/**
 * Campaign outreach stats
 */
export interface CampaignOutreachStats {
  totalContacts: number;
  totalSupporters: number;
  totalVolunteerHours: number;
  contactRate: number;
  persuasionRate: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Election API response
 */
export interface ElectionAPIResponse {
  success: boolean;
  data?: ElectionDisplay;
  elections?: ElectionListItem[];
  error?: string;
}

/**
 * District API response
 */
export interface DistrictAPIResponse {
  success: boolean;
  data?: DistrictDisplay;
  districts?: DistrictListItem[];
  error?: string;
}

/**
 * Campaign API response
 */
export interface CampaignAPIResponse {
  success: boolean;
  data?: CampaignDisplay;
  campaigns?: CampaignDisplay[];
  error?: string;
}

/**
 * Donor API response
 */
export interface DonorAPIResponse {
  success: boolean;
  data?: DonorDisplay;
  donors?: DonorListItem[];
  error?: string;
}

/**
 * Outreach API response
 */
export interface OutreachAPIResponse {
  success: boolean;
  data?: VoterOutreachDisplay;
  operations?: OutreachListItem[];
  stats?: CampaignOutreachStats;
  error?: string;
}
