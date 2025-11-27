/**
 * @file lib/utils/locationManagement.ts
 * @description Utility functions for managing company locations, expansion, and cost/benefit calculations
 * @created 2025-11-15
 *
 * OVERVIEW:
 * Provides functions to add, remove, move, and calculate costs/benefits for company locations (HQ, branches).
 * Integrates with state data for region/cost lookups and supports expansion validation.
 */

import CompanyLocation, { ICompanyLocation, LocationType } from '../db/models/CompanyLocation';
import { Types } from 'mongoose';
import { statesPart1, StateSeedData } from '@/lib/seed/states-part1';
import { statesPart2 } from '@/lib/seed/states-part2';
import { statesPart3 } from '@/lib/seed/states-part3';
import { statesPart4 } from '@/lib/seed/states-part4';
import { statesPart5 } from '@/lib/seed/states-part5';

// Combine all state data into a single array
const ALL_STATES: StateSeedData[] = [
  ...statesPart1,
  ...statesPart2,
  ...statesPart3,
  ...statesPart4,
  ...statesPart5,
];

export function getStateData(abbreviation: string): StateSeedData | undefined {
  return ALL_STATES.find(s => s.abbreviation === abbreviation);
}

export async function addLocation({
  companyId,
  type,
  address,
  state,
  region,
  costs,
  benefits,
}: {
  companyId: Types.ObjectId;
  type: LocationType;
  address: string;
  state: string;
  region: string;
  costs: Record<string, number>;
  benefits: Record<string, number>;
}): Promise<ICompanyLocation> {
  const location = await CompanyLocation.create({
    company: companyId,
    type,
    address,
    state,
    region,
    costs,
    benefits,
  });
  return location;
}

export async function removeLocation(locationId: Types.ObjectId): Promise<boolean> {
  const res = await CompanyLocation.deleteOne({ _id: locationId });
  return res.deletedCount === 1;
}

export async function moveLocation(locationId: Types.ObjectId, newAddress: string, newState: string, newRegion: string): Promise<ICompanyLocation | null> {
  return CompanyLocation.findByIdAndUpdate(
    locationId,
    { address: newAddress, state: newState, region: newRegion },
    { new: true }
  );
}

export function calculateLocationCosts(state: string): Record<string, number> {
  // Example: Use state GDP, population, crime rate to influence costs
  const data = getStateData(state);
  if (!data) return { taxes: 0, wages: 0, regulations: 0, rent: 0 };
  return {
    taxes: Math.round(data.gdpPerCapita * 0.02), // 2% of per capita GDP
    wages: Math.round(data.gdpPerCapita * 0.5), // 50% of per capita GDP
    regulations: Math.round(data.violentCrimeRate * 10), // proxy for regulatory burden
    rent: Math.round(data.gdpPerCapita * 0.1), // 10% of per capita GDP
  };
}

export function calculateLocationBenefits(state: string): Record<string, number> {
  const data = getStateData(state);
  if (!data) return { talentPool: 0, marketSize: 0, logistics: 0 };
  return {
    talentPool: Math.round(data.population / 100_000), // proxy for available workforce
    marketSize: Math.round(data.gdpMillions / 1000), // proxy for market size
    logistics: Math.round(100 - data.violentCrimeRate / 10), // higher crime = lower logistics score
  };
}

export async function listCompanyLocations(companyId: Types.ObjectId): Promise<ICompanyLocation[]> {
  return CompanyLocation.find({ company: companyId }).sort({ openedAt: 1 });
}

export async function getLocationById(locationId: Types.ObjectId): Promise<ICompanyLocation | null> {
  return CompanyLocation.findById(locationId);
}
