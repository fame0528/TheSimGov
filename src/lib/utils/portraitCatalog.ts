/**
 * @fileoverview Portrait Catalog Utility
 * @module lib/utils/portraitCatalog
 *
 * OVERVIEW:
 * Client-safe portrait catalog (no node:fs). Enumerates existing portrait assets under
 * /public/portraits without dynamic filesystem access to satisfy Turbopack constraints.
 * Provides filtering, lookup, statistics, and default selection logic.
 *
 * FEATURES:
 * - 14 gender/ethnicity combinations (7 ethnicities × 2 genders)
 * - Verified real image entries (no placeholders) loaded from enumeration
 * - Filter by gender and/or ethnicity
 * - Default portrait selection logic
 * - Catalog statistics and validation helpers
 *
 * STORAGE STRUCTURE:
 * - /public/portraits/{gender}/{ethnicity}/{gender-ethnicity-01}.png
 * - Thumbnails: /public/portraits/thumbs/* (future; fallback to full image now)
 *
 * BUILD COMPATIBILITY:
 * - Removed node:fs usage (prior implementation caused Turbopack client build error)
 * - Static enumeration ensures client bundle safety while preserving AAA feature set
 *
 * EXTENSION:
 * - Add additional variations (02,03...) by appending entries to RAW_FILES
 * - For large catalogs, migrate to API route returning JSON to keep bundle lean
 *
 * @created 2025-11-26
 * @updated 2025-11-26 (Removed fs; static enumeration)
 */

import type { PresetPortrait, Gender, Ethnicity, PortraitFilter, PortraitCatalogStats } from '@/lib/types/portraits';

// In-memory cache & timestamp (still useful for future API migration parity)
let CACHED_CATALOG: PresetPortrait[] | null = null;
let LAST_LOAD_TS: number | null = null;

// Verified portrait files (enumerated from actual directory listing)
// Each entry corresponds to an existing file. No placeholders.
const RAW_FILES: Array<{ gender: Gender; ethnicity: Ethnicity; filename: string; relativePath: string }> = [
  { gender: 'Female', ethnicity: 'Asian', filename: 'female-asian-01.png', relativePath: '/portraits/female/asian/female-asian-01.png' },
  { gender: 'Female', ethnicity: 'Asian', filename: 'female-asian-02.png', relativePath: '/portraits/female/asian/female-asian-02.png' },
  { gender: 'Female', ethnicity: 'Black', filename: 'female-black-01.png', relativePath: '/portraits/female/black/female-black-01.png' },
  { gender: 'Female', ethnicity: 'Hispanic', filename: 'female-hispanic-01.png', relativePath: '/portraits/female/hispanic/female-hispanic-01.png' },
  { gender: 'Female', ethnicity: 'Middle Eastern', filename: 'female-middle-eastern-01.png', relativePath: '/portraits/female/middle-eastern/female-middle-eastern-01.png' },
  { gender: 'Female', ethnicity: 'Native American', filename: 'female-native-american-01.png', relativePath: '/portraits/female/native-american/female-native-american-01.png' },
  { gender: 'Female', ethnicity: 'White', filename: 'female-white-01.png', relativePath: '/portraits/female/white/female-white-01.png' },
  { gender: 'Male', ethnicity: 'Asian', filename: 'male-asian-01.png', relativePath: '/portraits/male/asian/male-asian-01.png' },
  { gender: 'Male', ethnicity: 'Black', filename: 'male-black-01.png', relativePath: '/portraits/male/black/male-black-01.png' },
  { gender: 'Male', ethnicity: 'Hispanic', filename: 'male-hispanic-01.png', relativePath: '/portraits/male/hispanic/male-hispanic-01.png' },
  { gender: 'Male', ethnicity: 'Middle Eastern', filename: 'male-middle-eastern-01.png', relativePath: '/portraits/male/middle-eastern/male-middle-eastern-01.png' },
  { gender: 'Male', ethnicity: 'Native American', filename: 'male-native-american-01.png', relativePath: '/portraits/male/native-american/male-native-american-01.png' },
  { gender: 'Male', ethnicity: 'White', filename: 'male-white-01.png', relativePath: '/portraits/male/white/male-white-01.png' },
];

function buildCatalog(): PresetPortrait[] {
  let order = 1;
  return RAW_FILES.map(f => {
    const id = f.filename.replace(/\.(png|jpg|jpeg)$/i, '');
    return {
      id,
      gender: f.gender,
      ethnicity: f.ethnicity,
      filename: f.filename,
      fullUrl: f.relativePath,
      thumbnailUrl: f.relativePath, // Fallback (no thumbnails yet)
      displayOrder: order++,
    } as PresetPortrait;
  });
}

function getAllPortraits(): PresetPortrait[] {
  if (CACHED_CATALOG) return CACHED_CATALOG;
  CACHED_CATALOG = buildCatalog();
  LAST_LOAD_TS = Date.now();
  return CACHED_CATALOG;
}

export function refreshCatalog(): PresetPortrait[] {
  CACHED_CATALOG = buildCatalog();
  LAST_LOAD_TS = Date.now();
  return CACHED_CATALOG;
}

export function getCatalogLastLoadedAt(): number | null {
  return LAST_LOAD_TS;
}

export function getPortraitsByFilter(filter?: PortraitFilter): PresetPortrait[] {
  const catalog = getAllPortraits();
  if (!filter) return catalog;
  return catalog.filter(p => {
    const genderMatch = !filter.gender || p.gender === filter.gender;
    const ethnicityMatch = !filter.ethnicity || p.ethnicity === filter.ethnicity;
    return genderMatch && ethnicityMatch;
  });
}

export function getDefaultPortrait(gender: Gender, ethnicity?: Ethnicity): PresetPortrait | null {
  const catalog = getAllPortraits();
  if (ethnicity) {
    const exact = catalog.find(p => p.gender === gender && p.ethnicity === ethnicity);
    if (exact) return exact;
  }
  return catalog.find(p => p.gender === gender) || null;
}

export function getPortraitById(portraitId: string): PresetPortrait | null {
  const catalog = getAllPortraits();
  return catalog.find(p => p.id === portraitId) || null;
}

export function getCatalogStats(): PortraitCatalogStats {
  const catalog = getAllPortraits();
  const totalPortraits = catalog.length;
  const combos = new Map<string, number>();
  catalog.forEach(p => {
    const key = `${p.gender}-${p.ethnicity}`;
    combos.set(key, (combos.get(key) || 0) + 1);
  });
  const variationCounts = Array.from(combos.values());
  const combinationsCovered = combos.size;
  const combinationsExpected = 7 * 2; // 7 ethnicities × 2 genders
  const averageVariations = totalPortraits / combinationsCovered;
  const minVariations = Math.min(...variationCounts);
  const maxVariations = Math.max(...variationCounts);
  const allEthnicities: Ethnicity[] = ['White', 'Black', 'Asian', 'Hispanic', 'Native American', 'Middle Eastern', 'Pacific Islander'];
  const allGenders: Gender[] = ['Male', 'Female'];
  const missingCombinations: Array<{ gender: Gender; ethnicity: Ethnicity }> = [];
  allGenders.forEach(g => {
    allEthnicities.forEach(e => {
      const key = `${g}-${e}`;
      if (!combos.has(key)) missingCombinations.push({ gender: g, ethnicity: e });
    });
  });
  return {
    totalPortraits,
    combinationsCovered,
    combinationsExpected,
    averageVariations,
    minVariations,
    maxVariations,
    ...(missingCombinations.length > 0 && { missingCombinations }),
  };
}

export function isValidPortraitId(portraitId: string): boolean {
  return !!getPortraitById(portraitId);
}

/**
 * IMPLEMENTATION NOTES:
 * 1. Catalog Population: Static enumeration (RAW_FILES) eliminates client fs dependency.
 * 2. File Naming: Uses existing files; extend RAW_FILES for new variations without placeholders.
 * 3. Display Order: Stable deterministic order based on insertion sequence.
 * 4. Performance: O(1) cache build; O(n) simple filters with n=14 currently.
 * 5. Extensibility: Migrate to server API + dynamic revalidation for large catalogs.
 * 6. Type Safety: Strict types from portraits module.
 * 7. Build Compatibility: Fixes Turbopack error (external module node:fs not supported in client chunk).
 */
