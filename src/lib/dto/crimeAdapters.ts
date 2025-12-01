// Timestamp: 2025-12-01
// OVERVIEW: Mapping utilities converting Mongoose documents/lean objects into Crime domain DTOs.
// These functions enforce consistent shape across all API responses, centralizing doc-to-DTO logic.

import type { FacilityDTO, RouteDTO, MarketplaceListingDTO, LaunderingChannelDTO, HeatLevelDTO } from "./crime";
import type { SubstanceName } from "@/lib/types/crime";

// Helper to normalize ObjectId or primitive to string
function toId(value: any): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString();
}

export function mapFacilityDoc(doc: any): FacilityDTO {
  return {
    id: toId(doc._id),
    ownerId: doc.ownerId ? toId(doc.ownerId) : undefined,
    companyId: doc.companyId ? toId(doc.companyId) : null,
    type: doc.type,
    location: { state: doc.location?.state, city: doc.location?.city },
    capacity: doc.capacity,
    quality: doc.quality,
    suspicionLevel: doc.suspicionLevel ?? 0,
    status: doc.status,
    upgrades: Array.isArray(doc.upgrades) ? doc.upgrades.map((u: any) => ({ type: u.type, level: u.level, installed: u.installed })) : [],
    inventory: Array.isArray(doc.inventory)
      ? doc.inventory.map((i: any) => ({ substance: i.substance as SubstanceName, quantity: i.quantity, purity: i.purity, batch: i.batch }))
      : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapRouteDoc(doc: any): RouteDTO {
  return {
    id: toId(doc._id),
    ownerId: doc.ownerId ? toId(doc.ownerId) : undefined,
    facilityId: doc.facilityId ? toId(doc.facilityId) : null,
    origin: { state: doc.origin?.state, city: doc.origin?.city },
    destination: { state: doc.destination?.state, city: doc.destination?.city },
    method: doc.method,
    capacity: doc.capacity,
    cost: doc.cost,
    speed: doc.speed,
    riskScore: doc.riskScore ?? 0,
    status: doc.status,
    shipments: Array.isArray(doc.shipments)
      ? doc.shipments.map((s: any) => ({ id: toId(s.id), quantity: s.quantity, status: s.status, eta: s.eta }))
      : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapMarketplaceListingDoc(doc: any): MarketplaceListingDTO {
  return {
    id: toId(doc._id),
    sellerId: toId(doc.sellerId),
    companyId: doc.companyId ? toId(doc.companyId) : null,
    substance: doc.substance as SubstanceName,
    quantity: doc.quantity,
    purity: doc.purity,
    pricePerUnit: doc.pricePerUnit,
    location: { state: doc.location?.state, city: doc.location?.city },
    deliveryOptions: Array.isArray(doc.deliveryOptions)
      ? doc.deliveryOptions.map((d: any) => ({ method: d.method, cost: d.cost, risk: d.risk }))
      : [],
    minOrder: doc.minOrder,
    status: doc.status,
    sellerRep: doc.sellerRep,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapLaunderingChannelDoc(doc: any): LaunderingChannelDTO {
  return {
    id: toId(doc._id),
    ownerId: toId(doc.ownerId),
    companyId: doc.companyId ? toId(doc.companyId) : null,
    method: doc.method,
    throughputCap: doc.throughputCap,
    feePercent: doc.feePercent,
    latencyDays: doc.latencyDays,
    detectionRisk: doc.detectionRisk,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapHeatLevelDoc(doc: any): HeatLevelDTO {
  return {
    id: toId(doc._id),
    scope: doc.scope,
    scopeId: toId(doc.scopeId),
    current: doc.current,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Generic list mapping helpers for consistency
export function mapFacilityList(docs: any[]): FacilityDTO[] {
  return docs.map(mapFacilityDoc);
}
export function mapRouteList(docs: any[]): RouteDTO[] {
  return docs.map(mapRouteDoc);
}
export function mapMarketplaceListingList(docs: any[]): MarketplaceListingDTO[] {
  return docs.map(mapMarketplaceListingDoc);
}
export function mapLaunderingChannelList(docs: any[]): LaunderingChannelDTO[] {
  return docs.map(mapLaunderingChannelDoc);
}
export function mapHeatLevelList(docs: any[]): HeatLevelDTO[] {
  return docs.map(mapHeatLevelDoc);
}
