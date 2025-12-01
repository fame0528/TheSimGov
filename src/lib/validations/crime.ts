// Timestamp: 2025-11-30
// OVERVIEW: Zod validations for Crime domain (Alpha subset) with reality-based substance catalog enforcement.

import { z } from "zod";
import {
  SUBSTANCE_CATALOG,
  type SubstanceName,
  type StateCode,
  type FacilityType,
} from "@/lib/types/crime";

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

// Shared response envelope for contracts-first approach
export const responseEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.boolean(), data: dataSchema.nullish(), error: z.string().nullish(), meta: z.record(z.any()).optional() });
