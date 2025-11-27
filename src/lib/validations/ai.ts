/**
 * @fileoverview AI/Technology Industry Validation Schemas
 * @module lib/validations/ai
 * 
 * OVERVIEW:
 * Zod validation schemas for AI model training and research project operations.
 * Provides runtime validation with TypeScript type inference for Technology industry.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const AIArchitectureSchema = z.enum(['Transformer', 'CNN', 'RNN', 'Diffusion', 'GAN']);
export const AIModelSizeSchema = z.enum(['Small', 'Medium', 'Large']);
export const AITrainingStatusSchema = z.enum(['Training', 'Completed', 'Deployed']);

export const ResearchTypeSchema = z.enum(['Performance', 'Efficiency', 'NewCapability']);
export const ResearchComplexitySchema = z.enum(['Low', 'Medium', 'High']);
export const ResearchStatusSchema = z.enum(['InProgress', 'Completed', 'Cancelled']);

// ============================================================================
// AI MODEL SCHEMAS
// ============================================================================

/**
 * Create AI Model Schema
 * 
 * VALIDATION RULES:
 * - Name: 3-100 characters (unique per company)
 * - Parameters: 0.1-1000B (validated against size in model pre-save)
 * - Dataset size: 0.1-10000GB
 * - Architecture: Valid AI architecture type
 * - Size: Small/Medium/Large (auto-validated against parameters)
 */
export const CreateAIModelSchema = z.object({
  companyId: z.string().min(1, 'Company ID required'),
  name: z.string().min(3, 'Model name must be at least 3 characters').max(100),
  architecture: AIArchitectureSchema,
  size: AIModelSizeSchema,
  parameters: z.number()
    .min(0.1, 'Minimum 100M parameters (0.1B)')
    .max(1000, 'Maximum 1000B parameters'),
  dataset: z.string().min(3, 'Dataset name required').max(200),
  datasetSize: z.number()
    .min(0.1, 'Minimum 100MB dataset (0.1GB)')
    .max(10000, 'Maximum 10TB dataset (10000GB)'),
});

/**
 * Training Progress Schema
 * 
 * VALIDATION RULES:
 * - Increment: 1-20% per update (prevents overflow)
 * - Cost: Positive number (calculated via utility)
 */
export const TrainingProgressSchema = z.object({
  modelId: z.string().min(1, 'Model ID required'),
  increment: z.number()
    .min(1, 'Minimum 1% progress increment')
    .max(20, 'Maximum 20% progress increment'),
  costIncurred: z.number()
    .min(0, 'Cost cannot be negative'),
});

/**
 * Deploy Model Schema
 * 
 * VALIDATION RULES:
 * - Pricing: $0.001-$10 per 1000 API calls
 */
export const DeployModelSchema = z.object({
  modelId: z.string().min(1, 'Model ID required'),
  pricing: z.number()
    .min(0.001, 'Minimum $0.001 per 1000 calls')
    .max(10, 'Maximum $10 per 1000 calls'),
});

// ============================================================================
// AI RESEARCH PROJECT SCHEMAS
// ============================================================================

/**
 * Create Research Project Schema
 * 
 * VALIDATION RULES:
 * - Name: 5-150 characters
 * - Budget: $1,000 - $10,000,000
 * - Researchers: 1-10 employees (validated in model pre-save)
 * - Type: Performance/Efficiency/NewCapability
 * - Complexity: Low/Medium/High
 */
export const CreateResearchProjectSchema = z.object({
  companyId: z.string().min(1, 'Company ID required'),
  name: z.string()
    .min(5, 'Project name must be at least 5 characters')
    .max(150, 'Project name too long'),
  type: ResearchTypeSchema,
  complexity: ResearchComplexitySchema,
  budgetAllocated: z.number()
    .min(1000, 'Minimum budget $1,000')
    .max(10000000, 'Maximum budget $10,000,000'),
  assignedResearchers: z.array(z.string())
    .min(1, 'At least 1 researcher required')
    .max(10, 'Maximum 10 researchers allowed'),
});

/**
 * Research Progress Schema
 * 
 * VALIDATION RULES:
 * - Increment: 1-20% per update
 * - Cost: Positive number (must not exceed 110% of allocated)
 * - Researcher skills: Array of 0-100 skill levels
 */
export const ResearchProgressSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  increment: z.number()
    .min(1, 'Minimum 1% progress increment')
    .max(20, 'Maximum 20% progress increment'),
  costIncurred: z.number()
    .min(0, 'Cost cannot be negative'),
  researcherSkills: z.array(
    z.number().min(0, 'Skill minimum 0').max(100, 'Skill maximum 100')
  ).min(1, 'At least 1 researcher skill required'),
});

/**
 * Cancel Research Schema
 * 
 * NOTE: 10% RP penalty applied in API route, not here
 */
export const CancelResearchSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  reason: z.string().max(500, 'Reason too long').optional(),
});

/**
 * Add Breakthrough Schema
 * 
 * VALIDATION RULES:
 * - Name: 5-100 characters
 * - Area: 3-50 characters
 * - Novelty score: 0-100
 * - Estimated value: $0 - $100,000,000
 */
export const AddBreakthroughSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  name: z.string().min(5, 'Breakthrough name too short').max(100),
  area: z.string().min(3, 'Research area required').max(50),
  noveltyScore: z.number().min(0).max(100),
  patentable: z.boolean(),
  estimatedValue: z.number()
    .min(0, 'Value cannot be negative')
    .max(100000000, 'Maximum value $100M'),
});

/**
 * File Patent Schema
 * 
 * VALIDATION RULES:
 * - Title: 10-200 characters
 * - Inventors: 1-10 employees
 * - Filing cost: $5,000 - $100,000
 */
export const FilePatentSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  breakthroughId: z.string().min(1, 'Breakthrough ID required'),
  title: z.string()
    .min(10, 'Patent title must be at least 10 characters')
    .max(200, 'Patent title too long'),
  inventors: z.array(z.string())
    .min(1, 'At least 1 inventor required')
    .max(10, 'Maximum 10 inventors'),
  filingCost: z.number()
    .min(5000, 'Minimum filing cost $5,000')
    .max(100000, 'Maximum filing cost $100,000'),
});

/**
 * Publish Research Schema
 * 
 * VALIDATION RULES:
 * - Title: 10-200 characters
 * - Authors: 1-20 researchers
 * - Venue: 3-100 characters (journal/conference)
 */
export const PublishResearchSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  title: z.string()
    .min(10, 'Publication title must be at least 10 characters')
    .max(200, 'Publication title too long'),
  authors: z.array(z.string())
    .min(1, 'At least 1 author required')
    .max(20, 'Maximum 20 authors'),
  venue: z.string()
    .min(3, 'Venue name required')
    .max(100, 'Venue name too long'),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const AIModelQuerySchema = z.object({
  companyId: z.string().min(1),
  status: AITrainingStatusSchema.optional(),
  size: AIModelSizeSchema.optional(),
  architecture: AIArchitectureSchema.optional(),
});

export const ResearchProjectQuerySchema = z.object({
  companyId: z.string().min(1),
  status: ResearchStatusSchema.optional(),
  type: ResearchTypeSchema.optional(),
  complexity: ResearchComplexitySchema.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AIArchitecture = z.infer<typeof AIArchitectureSchema>;
export type AIModelSize = z.infer<typeof AIModelSizeSchema>;
export type AITrainingStatus = z.infer<typeof AITrainingStatusSchema>;

export type ResearchType = z.infer<typeof ResearchTypeSchema>;
export type ResearchComplexity = z.infer<typeof ResearchComplexitySchema>;
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;

export type CreateAIModel = z.infer<typeof CreateAIModelSchema>;
export type TrainingProgress = z.infer<typeof TrainingProgressSchema>;
export type DeployModel = z.infer<typeof DeployModelSchema>;

export type CreateResearchProject = z.infer<typeof CreateResearchProjectSchema>;
export type ResearchProgress = z.infer<typeof ResearchProgressSchema>;
export type CancelResearch = z.infer<typeof CancelResearchSchema>;
export type AddBreakthrough = z.infer<typeof AddBreakthroughSchema>;
export type FilePatent = z.infer<typeof FilePatentSchema>;
export type PublishResearch = z.infer<typeof PublishResearchSchema>;

export type AIModelQuery = z.infer<typeof AIModelQuerySchema>;
export type ResearchProjectQuery = z.infer<typeof ResearchProjectQuerySchema>;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Parameter Validation**: Size-parameter mapping validated in model pre-save hook
 *    - Small: 0-10B params
 *    - Medium: 10-80B params
 *    - Large: >80B params
 * 
 * 2. **Budget Validation**: Budget overage (max 110%) validated in model pre-save hook
 *    - Prevents excessive cost overruns
 *    - Uses validateBudgetOverage utility
 * 
 * 3. **Progress Increments**: 1-20% per update
 *    - Prevents overflow past 100%
 *    - Allows gradual training/research progress
 * 
 * 4. **Researcher Count**: 1-10 researchers per project
 *    - Validated via validateResearcherCount utility
 *    - Ensures team is properly sized
 * 
 * 5. **Cost Tracking**: All costs positive numbers
 *    - Training cost calculated via calculateIncrementalCost utility
 *    - Research cost tracked incrementally
 * 
 * USAGE EXAMPLES:
 * ```ts
 * // Validate AI model creation
 * const result = CreateAIModelSchema.safeParse(input);
 * if (!result.success) {
 *   return { error: result.error.errors };
 * }
 * 
 * // Type inference
 * const modelData: CreateAIModel = result.data; // Fully typed!
 * 
 * // Use in API route
 * const model = await AIModel.create(modelData);
 * ```
 * 
 * PREVENTS:
 * - Invalid model configurations (wrong size-parameter mapping)
 * - Budget overruns (>110% of allocated)
 * - Progress overflow (>100%)
 * - Invalid team sizes (0 or >10 researchers)
 * - Negative costs or budgets
 */
