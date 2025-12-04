// Timestamp: 2025-11-30
// OVERVIEW: Zod validations for Crime domain (Alpha subset) with reality-based substance catalog enforcement.

import { z } from "zod";
import {
  SUBSTANCE_CATALOG,
  type SubstanceName,
  type StateCode,
  type FacilityType,
} from "@/lib/types/crime";
import { BillCategory } from "@/types/politics";

const substanceNames: SubstanceName[] = SUBSTANCE_CATALOG.map((s) => s.name) as SubstanceName[];

export const stateCodeSchema = z.enum([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as [StateCode, ...StateCode[]]);

export const locationSchema = z.object({
  state: stateCodeSchema,
  city: z.string().min(1).max(120),
});

export const facilityTypeSchema = z.enum(["Lab","Farm","Warehouse"] as [FacilityType, ...FacilityType[]]);

export const productionFacilityCreateSchema = z.object({
  ownerId: z.string().min(1),
  companyId: z.string().min(1),
  type: facilityTypeSchema,
  location: locationSchema,
  capacity: z.number().int().positive(),
  quality: z.number().min(0).max(100).default(50),
});

export const distributionRouteCreateSchema = z.object({
  ownerId: z.string().min(1),
  companyId: z.string().min(1),
  origin: locationSchema,
  destination: locationSchema,
  method: z.enum(["Road","Air","Rail","Courier"]),
  capacity: z.number().int().positive(),
  cost: z.number().positive(),
  speed: z.number().positive(),
});

export const marketplaceListingCreateSchema = z.object({
  sellerId: z.string().min(1),
  companyId: z.string().min(1),
  // Zod requires a non-empty readonly tuple for enum values
  substance: z.enum([...substanceNames] as [string, ...string[]]),
  quantity: z.number().int().positive(),
  purity: z.number().min(0).max(100),
  pricePerUnit: z.number().positive(),
  location: locationSchema,
  deliveryOptions: z
    .array(z.object({ method: z.enum(["Road","Air","Rail","Courier"]), cost: z.number().positive(), risk: z.number().min(0).max(100) }))
    .default([]),
  minOrder: z.number().int().positive().optional(),
});

export const transactionPurchaseSchema = z.object({
  listingId: z.string().min(1),
  buyerId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const heatQuerySchema = z.object({
  scope: z.enum(["Global","State","City","User","Gang"]),
  scopeId: z.string().min(1),
});

export const launderingChannelCreateSchema = z.object({
  ownerId: z.string().min(1),
  companyId: z.string().min(1),
  method: z.enum(["Shell","CashBiz","Crypto","TradeBased","Counterfeit"]),
  throughputCap: z.number().int().positive(),
  feePercent: z.number().min(0).max(100),
  latencyDays: z.number().int().min(0),
  detectionRisk: z.number().min(0).max(100),
});

// ========== Phase 2 (Beta) - MMO Social Layer Validations ==========

export const gangCreateSchema = z.object({
  name: z.string().min(3).max(50).trim(),
  tag: z.string().min(3).max(6).trim().toUpperCase(),
  leaderId: z.string().min(1),
  companyId: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const gangUpdateSchema = z.object({
  name: z.string().min(3).max(50).trim().optional(),
  tag: z.string().min(3).max(6).trim().toUpperCase().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  bankroll: z.number().min(0).optional(),
});

export const gangMemberAddSchema = z.object({
  userId: z.string().min(1),
  rank: z.enum(["Recruit", "Member", "Officer"]).default("Recruit"),
  role: z.enum(["Leader", "Enforcer", "Dealer", "Chemist", "Driver", "Accountant"]).optional(),
});

export const gangMemberUpdateSchema = z.object({
  userId: z.string().min(1),
  rank: z.enum(["Recruit", "Member", "Officer", "Founder"]).optional(),
  role: z.enum(["Leader", "Enforcer", "Dealer", "Chemist", "Driver", "Accountant"]).optional(),
});

export const territoryCreateSchema = z.object({
  territoryId: z.string().min(1).trim().toUpperCase(),
  name: z.string().min(3).max(100).trim(),
  location: z.object({
    state: stateCodeSchema,
    city: z.string().min(1).max(120),
    district: z.string().min(1).max(120),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  demographics: z.object({
    population: z.number().int().min(100),
    medianIncome: z.number().min(0),
    crimeRate: z.number().min(0).max(100),
    lawEnforcementPresence: z.number().min(0).max(100),
  }),
  income: z.number().min(0).default(100),
  influencePoints: z.number().int().min(100).default(1000),
});

export const territoryClaimSchema = z.object({
  territoryId: z.string().min(1),
  gangId: z.string().min(1),
  influencePointsSpent: z.number().int().min(100).default(1000),
});

export const territoryContestSchema = z.object({
  territoryId: z.string().min(1),
  challengerGangId: z.string().min(1),
});

export const turfWarInitiateSchema = z.object({
  challengerGangId: z.string().min(1),
  territoryId: z.string().min(1),
  method: z.enum(["Negotiation", "Violence", "Buyout"]),
  negotiationOffer: z.number().min(0).optional(), // For Negotiation/Buyout methods
});

export const turfWarResolveSchema = z.object({
  warId: z.string().min(1).optional(),
  outcome: z.enum(["ChallengerVictory", "DefenderVictory", "Stalemate", "Negotiated"]),
  casualties: z.array(z.object({
    userId: z.string().min(1),
    gangId: z.string().min(1),
    status: z.enum(["Injured", "Arrested", "Killed"]),
  })).default([]),
  spoils: z.object({
    territoryTransfer: z.boolean(),
    cashSettlement: z.number().min(0).optional(),
    reputationDelta: z.object({
      challenger: z.number(),
      defender: z.number(),
    }).optional(),
  }).optional(),
});

export const statePricingQuerySchema = z.object({
  state: stateCodeSchema,
  substance: z.enum([...substanceNames] as [string, ...string[]]).optional(),
});

export const travelSchema = z.object({
  userId: z.string().min(1),
  fromState: stateCodeSchema,
  toState: stateCodeSchema,
});

// =======================
// Phase 3 (Gamma) - Integration Layer Validations
// =======================

export const legislationStatusQuerySchema = z.object({
  substance: z.enum([...substanceNames] as [string, ...string[]]).optional(),
  jurisdiction: z.enum(["Federal", "State"]).optional(),
  jurisdictionId: z.string().min(1).max(10).optional(), // "USA" or state code
  status: z.enum(["Illegal", "Decriminalized", "Medical", "Recreational"]).optional(),
});

export const legislationLobbySchema = z.object({
  substance: z.enum([...substanceNames] as [string, ...string[]]),
  jurisdiction: z.enum(["Federal", "State"]),
  jurisdictionId: z.string().min(1).max(10), // "USA" or state code
  targetStatus: z.enum(["Decriminalized", "Medical", "Recreational"]),
  lobbyAmount: z.number().min(1000).max(10000000), // $1K - $10M
  politicalCapitalSpent: z.number().min(0).max(100).optional(),
  companyId: z.string().min(1).optional(),
  bill: z.object({
    title: z.string().min(5).max(300).optional(),
    summary: z.string().min(10).max(5000).optional(),
    sponsor: z.string().min(2).max(100).optional(),
    category: z.enum(Object.values(BillCategory) as [string, ...string[]]).optional(),
  }).optional(),
});

export const legislationBillsQuerySchema = z.object({
  substance: z.enum([...substanceNames] as [string, ...string[]]).optional(),
  jurisdiction: z.enum(["Federal", "State"]).optional(),
  jurisdictionId: z.string().min(1).max(10).optional(), // "USA" or state code
  onlyLinked: z.coerce.boolean().optional(), // Filter to only bills with linked LegislationStatus
});

export const blackMarketItemCreateSchema = z.object({
  sellerId: z.string().min(1),
  category: z.enum(["Stolen Goods", "Counterfeits", "Weapons", "Restricted Items", "Services"]),
  itemName: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  quantity: z.number().int().min(1).max(1000000),
  pricePerUnit: z.number().min(0.01).max(1000000),
  location: locationSchema,
  riskScore: z.number().min(0).max(100).default(50),
});

export const blackMarketItemUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(1000000).optional(),
  pricePerUnit: z.number().min(0.01).max(1000000).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: z.enum(["Active", "Sold", "Seized", "Removed"]).optional(),
});

export const blackMarketPurchaseSchema = z.object({
  buyerId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  deliveryMethod: z.enum(["Pickup", "Courier", "Shipping"]),
  meetupLocation: z.object({
    state: stateCodeSchema,
    city: z.string().min(1),
    address: z.string().min(1).optional(),
  }).optional(),
});

export const businessConversionSchema = z.object({
  facilityId: z.string().min(1),
  substance: z.enum([...substanceNames] as [string, ...string[]]),
  newBusinessType: z.enum(["Dispensary", "Cultivation Facility", "Distribution Center", "Processing Plant"]),
  licenseApplicationData: z.object({
    businessName: z.string().min(1).max(200),
    owners: z.array(z.string().min(1)),
    capitalInvestment: z.number().min(0),
    employeeCount: z.number().int().min(0),
  }).optional(),
});

// Shared response envelope for contracts-first approach
export const responseEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.boolean(), data: dataSchema.nullish(), error: z.string().nullish(), meta: z.record(z.any()).optional() });
