/**
 * @fileoverview AI/Technology Industry Type Definitions
 * @module lib/types/ai
 * 
 * OVERVIEW:
 * TypeScript types and interfaces for AI model training, research projects,
 * and AGI development. Provides type safety for Technology industry operations.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import type { Types } from 'mongoose';

/**
 * AI Model Architecture Types
 */
export type AIArchitecture = 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN';

/**
 * AI Model Size Categories
 */
export type AIModelSize = 'Small' | 'Medium' | 'Large';

/**
 * Training Status Lifecycle
 */
export type AITrainingStatus = 'Training' | 'Completed' | 'Deployed';

/**
 * Research Project Status
 */
export type ResearchStatus = 'InProgress' | 'Completed' | 'Cancelled';

/**
 * Research Project Types
 */
export type ResearchType = 'Performance' | 'Efficiency' | 'NewCapability';

/**
 * Research Complexity Levels
 */
export type ResearchComplexity = 'Low' | 'Medium' | 'High';

/**
 * Compute Pricing Models
 */
export type PricingModel = 'Spot' | 'Reserved' | 'OnDemand';

/**
 * SLA Tier Levels
 */
export type SLATier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/**
 * Compute Listing Status
 */
export type ListingStatus = 'Active' | 'Reserved' | 'Inactive' | 'Expired';

/**
 * GPU Types Available
 */
export type GPUType =
  | 'H100'        // NVIDIA H100 (80GB, flagship)
  | 'A100'        // NVIDIA A100 (40GB/80GB)
  | 'V100'        // NVIDIA V100 (16GB/32GB, older gen)
  | 'A6000'       // NVIDIA RTX A6000 (48GB, workstation)
  | 'RTX4090'     // NVIDIA RTX 4090 (24GB, consumer)
  | 'MI300X'      // AMD MI300X (192GB, competitor)
  | 'Custom';     // Custom/other hardware

/**
 * GPU Specifications
 */
export interface GPUSpec {
  type: GPUType;
  count: number;              // Number of GPUs available
  memoryPerGPU: number;       // GB memory per GPU
  computePower: number;       // TFLOPS (FP16/BF16)
  interconnect: string;       // 'NVLink', 'InfiniBand', 'PCIe', etc.
}

/**
 * SLA Terms and Conditions
 */
export interface SLATerms {
  tier: SLATier;
  uptimeGuarantee: number;    // Percentage uptime guarantee (95-99.99%)
  maxLatency: number;         // Maximum latency in milliseconds
  supportResponse: number;    // Support response time in hours
  refundPolicy: string;       // Refund policy description
}

/**
 * Model Valuation for Pricing Calculations
 */
export interface ModelValuation {
  baseValue: number;           // Base value by size category
  performancePremium: number;  // Premium for superior performance
  reputationAdjustment: number; // Adjustment for seller reputation
  marketValue: number;         // Final calculated market value
  confidence: number;          // Confidence in valuation (0-100)
  comparables: string[];       // Comparable models and price ranges
  reasoning: string;           // Explanation of valuation factors
}

/**
 * Compute Listing Interface
 */
export interface ComputeListing {
  id: string;
  sellerId: string;
  gpuType: GPUType;
  gpuCount: number;
  pricingModel: PricingModel;
  basePrice: number;          // USD per GPU per hour
  slaTier: SLATier;
  status: ListingStatus;
  availabilityStart: Date;
  availabilityEnd: Date;
  location: string;
  powerRedundancy: boolean;
  coolingEfficiency: number;  // PUE rating
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Center Cooling Systems
 */
export type CoolingSystem = 'Air' | 'Liquid' | 'Immersion';

/**
 * Data Center Tier Certifications
 */
export type TierCertification = 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';

/**
 * Construction Phase Status
 */
export type ConstructionPhase = 'Planning' | 'Foundation' | 'Construction' | 'FitOut' | 'Commissioning' | 'Operational';

/**
 * Certification Types
 */
export type CertificationType = 'Uptime' | 'Efficiency' | 'Security' | 'Environmental';

/**
 * Certification Details
 */
export interface Certification {
  type: string;               // Certification type (SOC2, ISO27001, HIPAA, LEED, GDPR)
  auditDate?: Date;           // Date of audit/certification
  expiryDate?: Date;          // Expiration date
  cost: number;               // Cost of certification
  status: 'Pending' | 'Active' | 'Expired' | 'Denied'; // Certification status
}

/**
 * Power Redundancy Levels
 */
export interface PowerRedundancy {
  generators: number;         // Number of backup generators
  ups: boolean;               // Uninterruptible Power Supply enabled
  fuelReserveHours: number;   // Hours of fuel reserve
  dualUtilityFeeds: boolean;  // Dual utility power feeds
}

/**
 * Data Center Interface
 */
export interface DataCenter {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  size: number;               // Square footage
  powerCapacity: number;      // MW
  coolingSystem: CoolingSystem;
  tierCertification: TierCertification;
  targetUptime: number;       // SLA uptime requirement (99.671-99.995%)
  actualUptime: number;       // Current uptime percentage
  uptimeHours: number;        // Total uptime hours tracked
  downtimeHours: number;      // Total downtime hours tracked
  powerCapacityMW: number;    // Power capacity in MW
  powerUtilizationMW: number; // Current power utilization in MW
  coolingCapacityKW: number;  // Cooling capacity in KW
  pue: number;                // Current Power Usage Effectiveness
  targetPUE: number;          // Target PUE based on cooling system
  rackCount: number;          // Total rack slots available
  rackUtilization: number;    // Percentage of racks utilized
  gpuCount: number;           // Total GPUs installed
  storageCapacityTB: number;  // Storage capacity in TB
  networkBandwidthGbps: number; // Network bandwidth in Gbps
  powerRedundancy: PowerRedundancy;
  constructionPhase: ConstructionPhase;
  constructionStartDate?: Date;
  operationalDate?: Date;
  constructionCost: number;   // Total construction cost
  monthlyOperatingCost: number; // Monthly operating expenses
  revenue: number;            // Monthly revenue from hosting
  certifications: Certification[];
  pueRating: number;          // Power Usage Effectiveness
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Real Estate Property Types
 */
export type PropertyType = 'Land' | 'Warehouse' | 'Office' | 'Industrial' | 'Urban';

/**
 * Zoning Classifications
 */
export type ZoneClassification = 'Commercial' | 'Industrial' | 'Residential' | 'Mixed';

/**
 * Acquisition Types
 */
export type AcquisitionType = 'Purchase' | 'Lease' | 'Development';

/**
 * Permit Status
 */
export type PermitStatus = 'NotApplied' | 'Applied' | 'Pending' | 'Approved' | 'Rejected' | 'Expired';

/**
 * Location Coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fiberTier: number;  // 1-3, indicates internet infrastructure quality
}

/**
 * Permit Information
 */
export interface Permit {
  type: string;               // e.g., "Building", "Zoning", "Environmental"
  status: PermitStatus;
  appliedAt: Date;
  approvedAt?: Date;
  expiresAt?: Date;
  cost: number;               // USD
  description: string;
}

/**
 * Real Estate Property Interface
 */
export interface RealEstate {
  id: string;
  ownerId: string;
  propertyType: PropertyType;
  zoneClassification: ZoneClassification;
  acquisitionType: AcquisitionType;
  location: Location;
  size: number;               // Square footage
  price: number;              // USD
  permits: Permit[];
  zoningCompliant: boolean;
  environmentalClearance: boolean;
  utilityConnections: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Benchmark Scores Interface
 * Industry-standard model performance metrics
 */
export interface BenchmarkScores {
  accuracy: number;           // 0-100%, validation set performance
  perplexity: number;         // Lower is better (language models)
  f1Score: number;            // 0-1, precision-recall harmonic mean
  inferenceLatency: number;   // milliseconds per inference (average)
}

/**
 * Performance Gain Metrics
 * Improvements achieved by completing research
 */
export interface PerformanceGain {
  accuracy: number;        // +0-20% improvement to model accuracy
  efficiency: number;      // +0-50% reduction in training cost
  speed: number;           // +0-40% reduction in inference latency
  capability: string | null; // New capability unlocked (e.g., "multimodal")
}

/**
 * Research Breakthrough
 * Major discovery during research project
 */
export interface Breakthrough {
  name: string;
  area: 'Performance' | 'Efficiency' | 'Alignment' | 'Multimodal' | 'Reasoning' | 'Architecture';
  discoveredAt: Date;
  noveltyScore: number;          // 0-100 (originality rating)
  performanceGainPercent: number; // 0-20%
  efficiencyGainPercent: number;  // 0-50%
  patentable: boolean;
  estimatedPatentValue: number;
}

/**
 * Patent Filed from Research
 */
export interface Patent {
  patentId: string;
  title: string;
  area: 'Performance' | 'Efficiency' | 'Alignment' | 'Multimodal' | 'Reasoning' | 'Architecture';
  filedAt: Date;
  approvedAt?: Date;
  status: 'Filed' | 'UnderReview' | 'Approved' | 'Rejected';
  filingCost: number;
  estimatedValue: number;
  licensingRevenue: number;
  citations: number;
}

/**
 * Publication from Research
 */
export interface Publication {
  publicationId: string;
  title: string;
  authors: string[];
  venue: 'Conference' | 'Journal' | 'Workshop' | 'Preprint';
  venueName: string;
  publishedAt: Date;
  citations: number;
  downloads: number;
}

/**
 * AI Model Interface
 * Complete model training lifecycle
 */
export interface AIModel {
  id: string;
  companyId: string;
  name: string;
  architecture: AIArchitecture;
  
  // Model specifications
  size: AIModelSize;
  parameters: number; // Total parameter count
  
  // Training lifecycle
  status: AITrainingStatus;
  trainingProgress: number; // 0-100%
  trainingStarted: Date;
  trainingCompleted?: Date;
  trainingCost: number; // Accumulated USD cost
  
  // Dataset information
  dataset: string;
  datasetSize: number; // GB or millions of examples
  
  // Performance metrics
  benchmarkScores: BenchmarkScores;
  
  // Deployment information
  deployed: boolean;
  apiEndpoint?: string;
  pricing?: number; // USD per 1000 API calls
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Research Project Interface
 */
export interface AIResearchProject {
  id: string;
  companyId: string;
  name: string;
  type: ResearchType;
  complexity: ResearchComplexity;
  
  // Project lifecycle
  status: ResearchStatus;
  progress: number; // 0-100%
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Budget tracking
  budgetAllocated: number; // USD allocated
  budgetSpent: number;     // USD spent
  
  // Resource allocation
  assignedResearchers: string[]; // Employee IDs
  
  // Performance outcomes
  performanceGain: PerformanceGain;
  
  // Research outputs (references to separate models)
  breakthroughs: string[]; // Breakthrough document IDs
  patents: string[];       // Patent document IDs
  publications: Publication[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Model Creation Input
 */
export interface CreateAIModelInput {
  companyId: string;
  name: string;
  architecture: AIArchitecture;
  size: AIModelSize;
  parameters: number;
  dataset: string;
  datasetSize: number;
}

/**
 * AI Research Project Creation Input
 */
export interface CreateResearchProjectInput {
  companyId: string;
  name: string;
  type: ResearchType;
  complexity: ResearchComplexity;
  budgetAllocated: number;
  assignedResearchers: string[];
}

/**
 * Training Progress Update Input
 */
export interface TrainingProgressInput {
  modelId: string;
  progressIncrement: number; // Percentage points to advance (1-20)
}

/**
 * Research Progress Update Input
 */
export interface ResearchProgressInput {
  projectId: string;
  progressIncrement: number; // Percentage points to advance
  costIncurred: number;      // USD spent for this increment
}

/**
 * Model Deployment Input
 */
export interface DeployModelInput {
  modelId: string;
  pricing: number; // USD per 1000 API calls
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Strict TypeScript types prevent runtime errors
 * 2. **Reuse Legacy Types**: Ported from legacy AIModel.ts + AIResearchProject.ts
 * 3. **Benchmark Standards**: Industry-standard metrics (accuracy, perplexity, F1, latency)
 * 4. **Input Validation**: Separate types for creation vs updates
 * 5. **Nested Objects**: Performance gains, breakthroughs, patents well-structured
 * 
 * USAGE:
 * ```ts
 * import { AIModel, AITrainingStatus, BenchmarkScores } from '@/lib/types/ai';
 * 
 * const model: AIModel = {
 *   id: '123',
 *   companyId: 'abc',
 *   name: 'GPT-Clone-v1',
 *   architecture: 'Transformer',
 *   size: 'Medium',
 *   parameters: 50_000_000_000,
 *   status: 'Training',
 *   trainingProgress: 45,
 *   benchmarkScores: { accuracy: 0, perplexity: 0, f1Score: 0, inferenceLatency: 0 },
 *   // ... other fields
 * };
 * ```
 * 
 * REUSE:
 * - Reuses Department system patterns (type segregation, input types)
 * - Reuses validation approach (separate input vs entity types)
 * - Follows existing naming conventions (companyId, status enums)
 */
