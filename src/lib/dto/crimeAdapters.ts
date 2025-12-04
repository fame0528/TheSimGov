// Timestamp: 2025-12-01
// OVERVIEW: Mapping utilities converting Mongoose documents/lean objects into Crime domain DTOs.
// These functions enforce consistent shape across all API responses, centralizing doc-to-DTO logic.

import type { 
  FacilityDTO, 
  RouteDTO, 
  MarketplaceListingDTO, 
  LaunderingChannelDTO, 
  HeatLevelDTO,
  GangDTO,
  TerritoryDTO,
  TurfWarDTO,
  LegislationBillDTO
} from "./crime";
import type { SubstanceName, LegislationStatusDTO, BlackMarketItemDTO, PenaltyStructureDTO, StateCode } from "@/lib/types/crime";

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

// ============================================================
// PHASE 2 (Beta) - MMO Social Layer Adapters
// ============================================================

export function mapGangDoc(doc: any): GangDTO {
  return {
    id: toId(doc._id),
    name: doc.name,
    tag: doc.tag,
    color: doc.color,
    leaderId: toId(doc.leaderId),
    members: Array.isArray(doc.members)
      ? doc.members.map((m: any) => ({
          userId: toId(m.userId),
          rank: m.rank,
          role: m.role,
          joinedAt: m.joinedAt,
          contributionScore: m.contributionScore ?? 0
        }))
      : [],
    territories: Array.isArray(doc.territories) ? doc.territories.map(toId) : [],
    facilities: Array.isArray(doc.facilities) ? doc.facilities.map(toId) : [],
    reputation: doc.reputation ?? 0,
    bankroll: doc.bankroll ?? 0,
    rivalries: Array.isArray(doc.rivalries)
      ? doc.rivalries.map((r: any) => ({
          gangId: toId(r.gangId),
          hostilityLevel: r.hostilityLevel ?? 0,
          incidents: r.incidents ?? 0
        }))
      : [],
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export function mapTerritoryDoc(doc: any): TerritoryDTO {
  return {
    id: toId(doc._id),
    name: doc.name,
    location: {
      state: doc.location?.state,
      city: doc.location?.city,
      district: doc.location?.district
    },
    controlledBy: doc.controlledBy ? toId(doc.controlledBy) : null,
    contestedBy: Array.isArray(doc.contestedBy) ? doc.contestedBy.map(toId) : [],
    status: doc.status,
    income: doc.income ?? 0,
    heat: doc.heat ?? 0,
    demographics: doc.demographics ? {
      population: doc.demographics.population ?? 0,
      medianIncome: doc.demographics.medianIncome ?? 0,
      crimeRate: doc.demographics.crimeRate ?? 0,
      lawEnforcementPresence: doc.demographics.lawEnforcementPresence ?? 0
    } : undefined,
    claimedAt: doc.claimedAt,
    lastIncomeAt: doc.lastIncomeAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export function mapTurfWarDoc(doc: any): TurfWarDTO {
  return {
    id: toId(doc._id),
    territoryId: toId(doc.territoryId),
    challengerGangId: toId(doc.challengerGangId),
    defenderGangId: toId(doc.defenderGangId),
    status: doc.status,
    method: doc.method,
    initiatedBy: toId(doc.initiatedBy),
    initiatedAt: doc.initiatedAt,
    resolvedAt: doc.resolvedAt,
    outcome: doc.outcome,
    casualties: Array.isArray(doc.casualties)
      ? doc.casualties.map((c: any) => ({
          userId: toId(c.userId),
          gangId: toId(c.gangId),
          status: c.status,
          timestamp: c.timestamp
        }))
      : [],
    spoils: doc.spoils ? {
      territoryTransfer: doc.spoils.territoryTransfer ?? false,
      cashSettlement: doc.spoils.cashSettlement ?? 0,
      reputationDelta: doc.spoils.reputationDelta ? {
        challenger: doc.spoils.reputationDelta.challenger ?? 0,
        defender: doc.spoils.reputationDelta.defender ?? 0
      } : undefined
    } : undefined,
    negotiationTerms: doc.negotiationTerms || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Phase 2 list mappers
export function mapGangList(docs: any[]): GangDTO[] {
  return docs.map(mapGangDoc);
}
export function mapTerritoryList(docs: any[]): TerritoryDTO[] {
  return docs.map(mapTerritoryDoc);
}
export function mapTurfWarList(docs: any[]): TurfWarDTO[] {
  return docs.map(mapTurfWarDoc);
}

// ============================================================
// PHASE 3 (Gamma) - Integration Layer Adapters
// ============================================================

export function mapLegislationStatusDoc(doc: any): LegislationStatusDTO {
  const penalties: PenaltyStructureDTO = {
    possession: doc.penalties?.possession,
    distribution: doc.penalties?.distribution,
    manufacturing: doc.penalties?.manufacturing,
    fineMin: doc.penalties?.fineMin ?? 0,
    fineMax: doc.penalties?.fineMax ?? 0,
  };

  const isEffective = doc.effectiveDate ? new Date(doc.effectiveDate) <= new Date() : false;
  const notExpired = !doc.sunsetDate || new Date(doc.sunsetDate) > new Date();
  const legalStatuses = ['Medical', 'Recreational'];
  const isLegal = isEffective && notExpired && legalStatuses.includes(doc.status);

  return {
    id: toId(doc._id),
    substance: doc.substance,
    jurisdiction: doc.jurisdiction,
    jurisdictionId: doc.jurisdictionId,
    status: doc.status,
    effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate).toISOString() : new Date().toISOString(),
    sunsetDate: doc.sunsetDate ? new Date(doc.sunsetDate).toISOString() : undefined,
    penalties,
    taxRate: doc.taxRate ?? 0,
    regulations: Array.isArray(doc.regulations) ? doc.regulations : [],
    relatedBillId: doc.relatedBillId ? toId(doc.relatedBillId) : undefined,
    isLegal,
    canConvert: isLegal,
  };
}

export function mapLegislationStatusList(docs: any[]): LegislationStatusDTO[] {
  return docs.map(mapLegislationStatusDoc);
}

export function mapBlackMarketItemDoc(doc: any): BlackMarketItemDTO {
  return {
    id: toId(doc._id),
    companyId: doc.companyId ? toId(doc.companyId) : "",
    sellerId: toId(doc.sellerId),
    category: doc.category,
    itemName: doc.itemName,
    description: doc.description,
    quantity: doc.quantity,
    pricePerUnit: doc.pricePerUnit,
    location: { state: doc.location?.state, city: doc.location?.city },
    riskScore: doc.riskScore ?? 0,
    status: doc.status,
    sellerReputation: doc.sellerReputation ?? 50,
    postedAt: doc.postedAt ? new Date(doc.postedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapBlackMarketItemList(docs: any[]): BlackMarketItemDTO[] {
  return docs.map(mapBlackMarketItemDoc);
}

/**
 * Maps Politics Bill document to LegislationBillDTO with Crime-specific metadata
 * @param billDoc - Politics Bill Mongoose document
 * @param legislationMeta - Crime LegislationStatus metadata to attach (substance, jurisdiction, etc.)
 */
export function mapLegislationBillDoc(billDoc: any, legislationMeta?: {
  substance: SubstanceName;
  jurisdiction: StateCode;
  jurisdictionId: string;
  currentStatus: "Legal" | "Decriminalized" | "MedicalOnly" | "Illegal";
}): LegislationBillDTO {
  const voteCountData = billDoc.voteCount || billDoc.votes?.reduce(
    (acc: any, v: any) => {
      if (v.voteType === "Yea") acc.yea++;
      if (v.voteType === "Nay") acc.nay++;
      if (v.voteType === "Abstain") acc.abstain++;
      return acc;
    },
    { yea: 0, nay: 0, abstain: 0 }
  );

  return {
    id: toId(billDoc._id),
    billNumber: billDoc.billNumber,
    title: billDoc.title,
    category: billDoc.category,
    status: billDoc.status,
    sponsor: billDoc.sponsor,
    description: billDoc.description,
    textSummary: billDoc.textSummary,
    introducedDate: billDoc.introducedDate,
    
    // Crime-specific metadata from LegislationStatus
    relatedTo: legislationMeta ? {
      substance: legislationMeta.substance,
      jurisdiction: legislationMeta.jurisdiction,
      jurisdictionId: legislationMeta.jurisdictionId,
      currentLegislationStatus: legislationMeta.currentStatus
    } : {
      substance: "Cannabis" as SubstanceName, // fallback
      jurisdiction: "CA" as StateCode, // fallback
      jurisdictionId: "",
      currentLegislationStatus: "Illegal" as const
    },
    
    supportPercentage: billDoc.supportPercentage,
    voteCount: voteCountData ? {
      yea: voteCountData.yea ?? 0,
      nay: voteCountData.nay ?? 0,
      abstain: voteCountData.abstain ?? 0
    } : undefined,
    
    createdAt: billDoc.createdAt,
    updatedAt: billDoc.updatedAt
  };
}

export function mapLegislationBillList(billDocs: any[], legislationMeta?: {
  substance: SubstanceName;
  jurisdiction: StateCode;
  jurisdictionId: string;
  currentStatus: "Legal" | "Decriminalized" | "MedicalOnly" | "Illegal";
}): LegislationBillDTO[] {
  return billDocs.map(doc => mapLegislationBillDoc(doc, legislationMeta));
}

