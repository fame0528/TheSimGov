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
  status: "Active" | "Raided" | "Abandoned" | "Seized";
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

// Envelope type reused by routes/hooks
export interface ResponseEnvelope<T> {
  success: boolean;
  data: T | T[] | null;
  error: string | null;
  meta?: Record<string, unknown> | null;
}
