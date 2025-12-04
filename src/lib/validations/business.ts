// Timestamp: 2025-12-01
// OVERVIEW: Zod validations for Business domain (conversion target for legalized substances).

import { z } from 'zod';
import { stateCodeSchema } from '@/lib/validations/crime';

export const businessCategorySchema = z.enum([
  'Dispensary',
  'Cultivation Facility',
  'Distribution Center',
  'Processing Plant',
] as [
  'Dispensary',
  'Cultivation Facility',
  'Distribution Center',
  'Processing Plant',
]);

export const businessStatusSchema = z.enum([
  'Active',
  'Pending',
  'Suspended',
  'Closed',
  'Converted',
] as ['Active','Pending','Suspended','Closed','Converted']);

export const businessAddressSchema = z.object({
  state: stateCodeSchema,
  city: z.string().min(1).max(120),
  addressLine: z.string().min(1).max(200).optional(),
  postalCode: z.string().min(3).max(12).optional(),
});

export const businessCreateSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  ownerId: z.string().min(1),
  companyId: z.string().min(1).optional(),
  facilityId: z.string().min(1).optional(),
  convertedFromFacilityId: z.string().min(1).optional(),
  category: businessCategorySchema,
  status: businessStatusSchema.default('Active'),
  taxRate: z.number().min(0).max(100).default(0),
  inventory: z
    .array(
      z.object({
        substance: z.string().min(1),
        quantity: z.number().int().min(0),
        purity: z.number().min(0).max(100),
        batch: z.string().min(1).optional(),
      })
    )
    .default([]),
  address: businessAddressSchema,
});

export const businessUpdateSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  category: businessCategorySchema.optional(),
  status: businessStatusSchema.optional(),
  taxRate: z.number().min(0).max(100).optional(),
  address: businessAddressSchema.partial().optional(),
  // Optimistic concurrency tokens (one of these should be supplied by clients)
  version: z.number().int().nonnegative().optional(),
  ifUnmodifiedSince: z.string().datetime().optional(),
});

// Envelope helper for API responses
export const responseEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.boolean(), data: dataSchema.nullish(), error: z.string().nullish(), meta: z.record(z.any()).optional() });
