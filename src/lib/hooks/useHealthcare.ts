/**
 * @fileoverview Healthcare Industry Data Hooks
 * @module lib/hooks/useHealthcare
 * 
 * OVERVIEW:
 * SWR-based data fetching hooks for Healthcare industry operations.
 * Provides hooks for hospitals, clinics, pharmaceuticals, devices,
 * research, and insurance portfolios.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';

// ============================================================================
// TYPES
// ============================================================================

export interface Hospital {
  id: string;
  name: string;
  company: string;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  capacity: {
    beds: number;
    icuBeds: number;
    emergencyRooms: number;
    operatingRooms: number;
  };
  specialties: string[];
  status: 'operational' | 'under_construction' | 'closed' | 'renovation';
  qualityScore: number;
  patientSatisfaction: number;
  annualRevenue: number;
  annualCosts: number;
}

export interface Clinic {
  id: string;
  name: string;
  company: string;
  type: 'primary_care' | 'specialty' | 'urgent_care' | 'outpatient';
  location: {
    city: string;
    state: string;
  };
  capacity: number;
  dailyPatients: number;
  efficiency: number;
  revenue: number;
  status: 'active' | 'inactive';
}

export interface Pharmaceutical {
  id: string;
  name: string;
  company: string;
  type: 'small_molecule' | 'biologic' | 'vaccine' | 'gene_therapy';
  stage: 'discovery' | 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'approved' | 'market';
  indication: string;
  estimatedValue: number;
  developmentCost: number;
  successProbability: number;
}

export interface MedicalDevice {
  id: string;
  name: string;
  company: string;
  category: string;
  fdaClass: 'I' | 'II' | 'III';
  status: 'development' | 'clinical_trials' | 'fda_review' | 'approved' | 'market';
  annualRevenue: number;
  reimbursementRate: number;
}

export interface ResearchProject {
  id: string;
  name: string;
  company: string;
  area: string;
  phase: 'basic' | 'translational' | 'clinical' | 'completed';
  budget: number;
  spent: number;
  successRate: number;
  startDate: string;
  expectedCompletion: string;
}

export interface InsurancePlan {
  id: string;
  name: string;
  company: string;
  type: 'hmo' | 'ppo' | 'epo' | 'pos' | 'hdhp';
  members: number;
  monthlyPremium: number;
  claimRatio: number;
  totalPremiums: number;
  totalClaims: number;
}

export interface HealthcareSummary {
  hospitals: {
    total: number;
    operational: number;
    averageQuality: number;
    totalRevenue: number;
  };
  clinics: {
    total: number;
    active: number;
    averageEfficiency: number;
    totalRevenue: number;
  };
  pharmaceuticals: {
    total: number;
    inDevelopment: number;
    approved: number;
    totalValue: number;
  };
  devices: {
    total: number;
    approved: number;
    totalRevenue: number;
  };
  research: {
    total: number;
    active: number;
    completed: number;
    successRate: number;
  };
  insurance: {
    total: number;
    totalMembers: number;
    totalPremiums: number;
    avgClaimRatio: number;
  };
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useHospitals - Fetch company's hospitals
 */
export function useHospitals(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<Hospital[]>(
    companyId ? `/api/healthcare/hospitals?companyId=${companyId}` : null,
    options
  );
}

/**
 * useHospital - Fetch single hospital
 */
export function useHospital(hospitalId: string | null, options?: UseAPIOptions) {
  return useAPI<Hospital>(
    hospitalId ? `/api/healthcare/hospitals/${hospitalId}` : null,
    options
  );
}

/**
 * useClinics - Fetch company's clinics
 */
export function useClinics(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<Clinic[]>(
    companyId ? `/api/healthcare/clinics?companyId=${companyId}` : null,
    options
  );
}

/**
 * usePharmaceuticals - Fetch company's pharmaceuticals
 */
export function usePharmaceuticals(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<Pharmaceutical[]>(
    companyId ? `/api/healthcare/pharmaceuticals?companyId=${companyId}` : null,
    options
  );
}

/**
 * useMedicalDevices - Fetch company's medical devices
 */
export function useMedicalDevices(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<MedicalDevice[]>(
    companyId ? `/api/healthcare/devices?companyId=${companyId}` : null,
    options
  );
}

/**
 * useHealthcareResearch - Fetch company's research projects
 */
export function useHealthcareResearch(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<ResearchProject[]>(
    companyId ? `/api/healthcare/research?companyId=${companyId}` : null,
    options
  );
}

/**
 * useInsurancePlans - Fetch company's insurance plans
 */
export function useInsurancePlans(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<InsurancePlan[]>(
    companyId ? `/api/healthcare/insurance?companyId=${companyId}` : null,
    options
  );
}

/**
 * useHealthcareSummary - Aggregated healthcare metrics for dashboard
 */
export function useHealthcareSummary(
  companyId: string | null,
  options?: UseAPIOptions
) {
  const hospitals = useHospitals(companyId, options);
  const clinics = useClinics(companyId, options);
  const pharmaceuticals = usePharmaceuticals(companyId, options);
  const devices = useMedicalDevices(companyId, options);
  const research = useHealthcareResearch(companyId, options);
  const insurance = useInsurancePlans(companyId, options);

  const isLoading = 
    hospitals.isLoading || 
    clinics.isLoading || 
    pharmaceuticals.isLoading || 
    devices.isLoading ||
    research.isLoading ||
    insurance.isLoading;

  const error = 
    hospitals.error || 
    clinics.error || 
    pharmaceuticals.error || 
    devices.error ||
    research.error ||
    insurance.error;

  // Extract arrays safely - handle both array and envelope responses
  const extractArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
      return (data as { data: T[] }).data;
    }
    return [];
  };

  const hospitalsArray = extractArray<Hospital>(hospitals.data);
  const clinicsArray = extractArray<Clinic>(clinics.data);
  const pharmaArray = extractArray<Pharmaceutical>(pharmaceuticals.data);
  const devicesArray = extractArray<MedicalDevice>(devices.data);
  const researchArray = extractArray<ResearchProject>(research.data);
  const insuranceArray = extractArray<InsurancePlan>(insurance.data);

  const data: HealthcareSummary | null = !isLoading ? {
    hospitals: {
      total: hospitalsArray.length,
      operational: hospitalsArray.filter(h => h.status === 'operational').length,
      averageQuality: hospitalsArray.length > 0
        ? hospitalsArray.reduce((sum, h) => sum + (h.qualityScore ?? 0), 0) / hospitalsArray.length
        : 0,
      totalRevenue: hospitalsArray.reduce((sum, h) => sum + (h.annualRevenue ?? 0), 0),
    },
    clinics: {
      total: clinicsArray.length,
      active: clinicsArray.filter(c => c.status === 'active').length,
      averageEfficiency: clinicsArray.length > 0
        ? clinicsArray.reduce((sum, c) => sum + (c.efficiency ?? 0), 0) / clinicsArray.length
        : 0,
      totalRevenue: clinicsArray.reduce((sum, c) => sum + (c.revenue ?? 0), 0),
    },
    pharmaceuticals: {
      total: pharmaArray.length,
      inDevelopment: pharmaArray.filter(p => !['approved', 'market'].includes(p.stage)).length,
      approved: pharmaArray.filter(p => ['approved', 'market'].includes(p.stage)).length,
      totalValue: pharmaArray.reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0),
    },
    devices: {
      total: devicesArray.length,
      approved: devicesArray.filter(d => ['approved', 'market'].includes(d.status)).length,
      totalRevenue: devicesArray.reduce((sum, d) => sum + (d.annualRevenue ?? 0), 0),
    },
    research: {
      total: researchArray.length,
      active: researchArray.filter(r => r.phase !== 'completed').length,
      completed: researchArray.filter(r => r.phase === 'completed').length,
      successRate: researchArray.length > 0
        ? researchArray.reduce((sum, r) => sum + (r.successRate ?? 0), 0) / researchArray.length
        : 0,
    },
    insurance: {
      total: insuranceArray.length,
      totalMembers: insuranceArray.reduce((sum, i) => sum + (i.members ?? 0), 0),
      totalPremiums: insuranceArray.reduce((sum, i) => sum + (i.totalPremiums ?? 0), 0),
      avgClaimRatio: insuranceArray.length > 0
        ? insuranceArray.reduce((sum, i) => sum + (i.claimRatio ?? 0), 0) / insuranceArray.length
        : 0,
    },
  } : null;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      hospitals.refetch?.();
      clinics.refetch?.();
      pharmaceuticals.refetch?.();
      devices.refetch?.();
      research.refetch?.();
      insurance.refetch?.();
    },
  };
}

export default useHealthcareSummary;
