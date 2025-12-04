// Timestamp: 2025-11-30
// OVERVIEW: Crime domain shared types and reality-based substance catalog.

export type StateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY" | "DC";

export type SubstanceCategory =
  | "Cannabis"
  | "Stimulant"
  | "Depressant"
  | "Hallucinogen"
  | "Opioid"
  | "Synthetic";

// Reality-based substance names; manufacturing remains abstract (no synthesis instructions).
export type SubstanceName =
  | "Cannabis"
  | "Cocaine"
  | "Heroin"
  | "Methamphetamine"
  | "MDMA"
  | "LSD"
  | "Psilocybin"
  | "Fentanyl"
  | "Oxycodone";

export interface SubstanceCatalogEntry {
  name: SubstanceName;
  category: SubstanceCategory;
}

export const SUBSTANCE_CATALOG: readonly SubstanceCatalogEntry[] = [
  { name: "Cannabis", category: "Cannabis" },
  { name: "Cocaine", category: "Stimulant" },
  { name: "Heroin", category: "Opioid" },
  { name: "Methamphetamine", category: "Stimulant" },
  { name: "MDMA", category: "Hallucinogen" },
  { name: "LSD", category: "Hallucinogen" },
  { name: "Psilocybin", category: "Hallucinogen" },
  { name: "Fentanyl", category: "Opioid" },
  { name: "Oxycodone", category: "Opioid" },
];

export type LegalStatus = "Illegal" | "Decriminalized" | "Medical" | "Recreational";

export interface SubstancePricing {
  state: StateCode;
  buy: number; // per unit
  sell: number; // per unit
  lastUpdate: string; // ISO date
}

export interface SubstanceDefinition {
  name: SubstanceName;
  category: SubstanceCategory;
  legalStatus: {
    federal: LegalStatus;
    stateOverrides?: Partial<Record<StateCode, LegalStatus>>;
  };
  marketPrices?: SubstancePricing[];
}

export interface Location {
  state: StateCode;
  city: string;
}

export type FacilityType = "Lab" | "Farm" | "Warehouse";

export interface ProductionFacilityBase {
  ownerId: string; // ObjectId string
  companyId: string; // tenant key
  type: FacilityType;
  location: Location;
  capacity: number;
  quality: number; // 0-100
  status: "Active" | "Raided" | "Abandoned" | "Seized" | "Converted";
}

export interface InventoryItem {
  substance: SubstanceName;
  quantity: number;
  purity: number; // 0-100
  batch?: string;
}

export interface DistributionRouteBase {
  ownerId: string;
  companyId: string;
  origin: Location;
  destination: Location;
  method: "Road" | "Air" | "Rail" | "Courier";
  capacity: number;
  cost: number;
  speed: number; // hours
  riskScore: number; // 0-100
  status: "Active" | "Suspended" | "Interdicted";
}

export interface MarketplaceListingBase {
  sellerId: string;
  companyId: string;
  substance: SubstanceName;
  quantity: number;
  purity: number;
  pricePerUnit: number;
  location: Location;
  status: "Active" | "Sold" | "Expired" | "Seized";
}

export interface TransactionBase {
  buyerId: string;
  sellerId: string;
  listingId: string;
  substance: SubstanceName;
  quantity: number;
  purity: number;
  totalPrice: number;
  escrowStatus: "Pending" | "Released" | "Disputed" | "Refunded";
  deliveryStatus: "Scheduled" | "InTransit" | "Delivered" | "Seized" | "Lost";
}

export interface HeatLevelBase {
  scope: "Global" | "State" | "City" | "User" | "Gang";
  scopeId: string;
  current: number; // 0-100
}

export interface LaunderingChannelBase {
  ownerId: string;
  companyId: string;
  method: "Shell" | "CashBiz" | "Crypto" | "TradeBased" | "Counterfeit";
  throughputCap: number;
  feePercent: number;
  latencyDays: number;
  detectionRisk: number; // 0-100
}

// =======================
// Phase 3 (Gamma) - Integration Layer Types
// =======================

export type Jurisdiction = "Federal" | "State";

export interface PenaltyStructureDTO {
  possession: string;
  distribution: string;
  manufacturing: string;
  fineMin: number;
  fineMax: number;
}

export interface LegislationStatusDTO {
  id: string;
  substance: SubstanceName;
  jurisdiction: Jurisdiction;
  jurisdictionId: string; // "USA" or state code
  status: LegalStatus;
  effectiveDate: string; // ISO date
  sunsetDate?: string; // ISO date
  penalties: PenaltyStructureDTO;
  taxRate: number; // 0-100
  regulations: string[];
  relatedBillId?: string;
  isLegal: boolean; // Computed
  canConvert: boolean; // Computed
}

export type BlackMarketCategory = 
  | "Stolen Goods"
  | "Counterfeits"
  | "Weapons"
  | "Restricted Items"
  | "Services";

export type BlackMarketItemStatus = "Active" | "Sold" | "Seized" | "Removed";

export interface BlackMarketItemDTO {
  id: string;
  companyId: string;
  sellerId: string;
  category: BlackMarketCategory;
  itemName: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  location: {
    state: StateCode;
    city: string;
  };
  riskScore: number; // 0-100 (likelihood of sting/seizure)
  status: BlackMarketItemStatus;
  sellerReputation: number; // 0-100
  postedAt: string; // ISO date
}

export interface BusinessConversionDTO {
  facilityId: string;
  substance: SubstanceName;
  originalType: string; // "Lab" | "Farm" | "Warehouse"
  newBusinessType: string; // "Dispensary" | "Cultivation Facility" | "Distribution Center"
  conversionDate: string; // ISO date
  taxRate: number;
  licenseNumber: string;
  regulations: string[];
  employeesRetained: number;
  inventoryValue: number;
}

// Implementation Notes:
// - Use catalog validation to ensure only real substance names appear in endpoints and models.
// - Keep manufacturing abstract; purity/quality numeric without chemistry instructions.
