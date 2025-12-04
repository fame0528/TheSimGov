// Timestamp: 2025-12-01
// OVERVIEW: Business domain types to support legalization conversion from Crime facilities.

import type { InventoryItem, Location } from '@/lib/types/crime';

export type BusinessCategory =
  | 'Dispensary'
  | 'Cultivation Facility'
  | 'Distribution Center'
  | 'Processing Plant';

export type BusinessStatus =
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Closed'
  | 'Converted';

export interface BusinessAddress {
  state: Location['state'];
  city: string;
  addressLine?: string;
  postalCode?: string;
}

export interface BusinessBase {
  name: string;
  ownerId: string; // User ObjectId string
  companyId?: string; // Tenant key if applicable
  // Linkage to Crime facility when converted (optional if created directly)
  facilityId?: string; // Active linked facility id (if co-located)
  convertedFromFacilityId?: string; // Original facility id at conversion time
  category: BusinessCategory;
  status: BusinessStatus;
  taxRate: number; // 0-100
  inventory: InventoryItem[]; // Carried forward on conversion where legal
  address: BusinessAddress;
}

export interface BusinessDTO extends BusinessBase {
  id: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// Minimal DTO for list views
export interface BusinessListItemDTO {
  id: string;
  name: string;
  category: BusinessCategory;
  status: BusinessStatus;
  state: Location['state'];
  city: string;
  taxRate: number;
}
