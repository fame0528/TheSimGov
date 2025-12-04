// Timestamp: 2025-12-01
// OVERVIEW: Crime domain DTO interfaces consumed by API routes and hooks.
// Reality-based substance names retained; manufacturing abstracted.

import type { SubstanceName, FacilityType, StateCode } from "@/lib/types/crime";

export interface FacilityDTO {
  id: string;
  ownerId: string | undefined;
  companyId: string | null;
  type: FacilityType;
  location: { state: StateCode; city: string };
  capacity: number;
  quality: number;
  suspicionLevel: number;
  status: "Active" | "Raided" | "Abandoned" | "Seized" | "Converted";
  upgrades: Array<{ type: string; level: number; installed?: string | Date }>;
  inventory: Array<{ substance: SubstanceName; quantity: number; purity: number; batch?: string }>; 
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RouteShipmentDTO {
  id: string;
  quantity: number;
  status: string;
  eta?: string | Date;
}

export interface RouteDTO {
  id: string;
  ownerId: string | undefined;
  facilityId: string | null;
  origin: { state: StateCode; city: string };
  destination: { state: StateCode; city: string };
  method: "Road" | "Air" | "Rail" | "Courier";
  capacity: number;
  cost: number;
  speed: number;
  riskScore: number;
  status: "Active" | "Suspended" | "Interdicted";
  shipments: RouteShipmentDTO[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MarketplaceListingDTO {
  id: string;
  sellerId: string;
  companyId: string | null;
  substance: SubstanceName;
  quantity: number;
  purity: number;
  pricePerUnit: number;
  location: { state: StateCode; city: string };
  deliveryOptions: Array<{ method: "Road" | "Air" | "Rail" | "Courier"; cost: number; risk: number }>;
  minOrder?: number;
  status: "Active" | "Sold" | "Expired" | "Seized";
  sellerRep?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LaunderingChannelDTO {
  id: string;
  ownerId: string;
  companyId: string | null;
  method: "Shell" | "CashBiz" | "Crypto" | "TradeBased" | "Counterfeit";
  throughputCap: number;
  feePercent: number;
  latencyDays: number;
  detectionRisk: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface HeatLevelDTO {
  id: string;
  scope: "Global" | "State" | "City" | "User" | "Gang";
  scopeId: string;
  current: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ========== Phase 2 (Beta) - MMO Social Layer DTOs ==========

export interface GangMemberDTO {
  userId: string;
  rank: "Founder" | "Officer" | "Member" | "Recruit";
  role?: "Leader" | "Enforcer" | "Dealer" | "Chemist" | "Driver" | "Accountant";
  joinedAt: Date | string;
  contributionScore?: number;
}

export interface RivalryDTO {
  gangId: string;
  hostilityLevel: number;
  incidents: number;
  lastIncident?: Date | string;
}

export interface GangDTO {
  id: string;
  name: string;
  tag: string;
  color: string;
  leaderId: string;
  members: GangMemberDTO[];
  territories: string[];
  facilities: string[];
  reputation: number;
  bankroll: number;
  rivalries: RivalryDTO[];
  status: "Active" | "Disbanded" | "War";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DemographicsDTO {
  population: number;
  medianIncome: number;
  crimeRate: number;
  lawEnforcementPresence: number;
}

export interface TerritoryDTO {
  id: string;
  name: string;
  location: {
    state: StateCode;
    city: string;
    district?: string;
  };
  controlledBy: string | null;
  contestedBy: string[];
  status: "Unclaimed" | "Claimed" | "Contested" | "Lockdown";
  income: number;
  heat: number;
  demographics?: DemographicsDTO;
  claimedAt?: Date | string;
  lastIncomeAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CasualtyDTO {
  userId: string;
  gangId: string;
  status: "Injured" | "Arrested" | "Killed";
  timestamp: Date | string;
}

export interface SpoilsDTO {
  territoryTransfer: boolean;
  cashSettlement?: number;
  reputationDelta?: {
    challenger: number;
    defender: number;
  };
}

export interface TurfWarDTO {
  id: string;
  territoryId: string;
  challengerGangId: string;
  defenderGangId: string;
  status: "Pending" | "InProgress" | "Resolved";
  method: "Negotiation" | "Violence" | "Buyout";
  initiatedBy: string;
  initiatedAt: Date | string;
  resolvedAt?: Date | string;
  outcome?: "ChallengerVictory" | "DefenderVictory" | "Stalemate" | "Negotiated";
  casualties: CasualtyDTO[];
  spoils?: SpoilsDTO;
  negotiationTerms?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StatePricingDTO {
  state: StateCode;
  substance: SubstanceName;
  buyPrice: number;
  sellPrice: number;
  demandLevel: number; // 0-100
  supplyLevel: number; // 0-100
  lastUpdated: Date | string;
}

export interface TravelDTO {
  userId: string;
  fromState: StateCode;
  toState: StateCode;
  travelTime: number; // hours
  cost: number;
  risk: number; // 0-100
  departedAt: Date | string;
  arrivedAt?: Date | string;
}

// ========== Phase 3 (Gamma) - Integration Layer DTOs ==========

export interface LegislationStatusDTO {
  id: string;
  companyId: string;
  substance: SubstanceName;
  jurisdiction: StateCode;
  jurisdictionId: string;
  status: "Legal" | "Decriminalized" | "MedicalOnly" | "Illegal";
  penalties: {
    possession: { minYears: number; maxYears: number; fine: number };
    distribution: { minYears: number; maxYears: number; fine: number };
    manufacturing: { minYears: number; maxYears: number; fine: number };
  };
  relatedBillId?: string;
  effectiveDate: Date | string;
  lastReviewedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BlackMarketItemDTO {
  id: string;
  companyId: string;
  itemType: "Weapon" | "Drug" | "Document" | "Service" | "Information";
  name: string;
  description: string;
  price: number;
  riskLevel: number;
  availability: "InStock" | "LimitedSupply" | "OutOfStock" | "OnRequest";
  supplier: string;
  location: { state: StateCode; city: string };
  requiresReputation?: number;
  effects?: Record<string, number>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * DTO for Politics Bills linked to Crime LegislationStatus
 * Subset of BillData focused on Crime domain use cases
 */
export interface LegislationBillDTO {
  id: string;
  billNumber: string;
  title: string;
  category: string; // BillCategory from politics
  status: string;   // BillStatus from politics
  sponsor: string;
  description: string;
  textSummary: string;
  introducedDate: Date | string;
  
  // Crime-specific metadata
  relatedTo: {
    substance: SubstanceName;
    jurisdiction: StateCode;
    jurisdictionId: string;
    currentLegislationStatus: "Legal" | "Decriminalized" | "MedicalOnly" | "Illegal";
  };
  
  // Vote summary (if available)
  supportPercentage?: number;
  voteCount?: {
    yea: number;
    nay: number;
    abstain: number;
  };
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * DTO for business conversion results
 * Used when converting illegal facilities to legitimate businesses
 */
export interface ConversionResultDTO {
  convertedFacilityId: string;
  businessId: string;
  success: boolean;
  conversionDetails: {
    substance: SubstanceName;
    oldStatus: "Illegal" | "Decriminalized";
    newBusinessType: "Dispensary" | "Cultivation Facility" | "Distribution Center" | "Processing Plant";
    legalStatus: "Legal" | "Decriminalized" | "MedicalOnly";
    taxRate: number; // Percentage
    estimatedAnnualRevenue: number; // Projected legal market revenue
  };
  inventoryTransferred: {
    substance: SubstanceName;
    quantity: number;
    illegalValue: number; // Black market valuation
    legalValue: number;   // Legal market valuation
  }[];
  conversionDate: Date | string;
  createdAt: Date | string;
}

// Envelope type reused by routes/hooks
export interface ResponseEnvelope<T> {
  success: boolean;
  data: T | T[] | null;
  error: string | null;
  meta?: Record<string, unknown> | null;
}
