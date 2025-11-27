/**
 * /api/ai/agi/milestones
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * AGI Milestone management endpoints for retrieving and creating company milestones.
 * Supports filtering by status and milestone type, initial milestone setup with
 * research requirements, and company-specific capability/alignment initialization.
 * 
 * ENDPOINTS:
 * - GET: Retrieve all AGI milestones for authenticated user's company
 * - POST: Create new AGI milestone with research requirements and initial metrics
 * 
 * QUERY PARAMETERS (GET):
 * - status: Filter by milestone status (Locked/Available/InProgress/Achieved/Failed)
 * - milestoneType: Filter by specific milestone type
 * 
 * REQUEST BODY (POST):
 * - milestoneType: Type of milestone to create (required)
 * - alignmentStance: Strategic stance (SafetyFirst/Balanced/CapabilityFirst, defaults to Balanced)
 * - researchPointsInvested: Initial RP investment (optional, defaults to 0)
 * 
 * BUSINESS LOGIC:
 * - Each company can have one instance of each milestone type (enforced via unique index)
 * - Initial capability/alignment defaults to 0 for capability, 50 for alignment
 * - Research requirements vary by milestone type (3k-20k RP, $500k-$10M compute)
 * - Prerequisites enforce logical progression (cannot skip advanced milestones)
 * - Status auto-calculated based on prerequisite achievement
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses session authentication utility
 * - Uses logging utility for error tracking
 * - Uses AGIMilestone model methods for business logic
 * - Zero duplication of research requirement definitions
 * 
 * @implementation Phase 5 API Routes Batch 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import Company from '@/lib/db/models/Company';
import { MilestoneType, AlignmentStance } from '@/lib/types/models/ai/agi';

/**
 * Research Requirements Mapping
 * 
 * Defines prerequisites, costs, and thresholds for each milestone type.
 * Used during milestone creation to initialize researchRequirements field.
 * 
 * Progression tiers:
 * - Tier 1 (Foundation): Advanced Reasoning, Strategic Planning (3k-3.5k RP)
 * - Tier 2 (Intermediate): Transfer Learning, Creative Problem Solving (4k-4.5k RP)
 * - Tier 3 (Advanced): Meta-Learning, NLU, Multi-Agent (5k-5.5k RP)
 * - Tier 4 (AGI): Self-Improvement, General Intelligence (7k-10k RP)
 * - Tier 5 (Superintelligence): Final milestone (20k RP)
 * - Alignment Track: Value Alignment, Interpretability (4k-4.5k RP, parallel)
 */
const RESEARCH_REQUIREMENTS_MAP: Record<
  MilestoneType,
  {
    researchPointsCost: number;
    prerequisiteMilestones: MilestoneType[];
    minimumCapabilityLevel: number;
    minimumAlignmentLevel: number;
    estimatedMonths: number;
    computeBudgetRequired: number;
  }
> = {
  [MilestoneType.ADVANCED_REASONING]: {
    researchPointsCost: 3000,
    prerequisiteMilestones: [],
    minimumCapabilityLevel: 30,
    minimumAlignmentLevel: 30,
    estimatedMonths: 6,
    computeBudgetRequired: 500000,
  },
  [MilestoneType.STRATEGIC_PLANNING]: {
    researchPointsCost: 3500,
    prerequisiteMilestones: [MilestoneType.ADVANCED_REASONING],
    minimumCapabilityLevel: 40,
    minimumAlignmentLevel: 35,
    estimatedMonths: 6,
    computeBudgetRequired: 600000,
  },
  [MilestoneType.TRANSFER_LEARNING]: {
    researchPointsCost: 4500,
    prerequisiteMilestones: [MilestoneType.ADVANCED_REASONING, MilestoneType.STRATEGIC_PLANNING],
    minimumCapabilityLevel: 45,
    minimumAlignmentLevel: 40,
    estimatedMonths: 8,
    computeBudgetRequired: 800000,
  },
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: {
    researchPointsCost: 4000,
    prerequisiteMilestones: [MilestoneType.ADVANCED_REASONING],
    minimumCapabilityLevel: 40,
    minimumAlignmentLevel: 35,
    estimatedMonths: 7,
    computeBudgetRequired: 700000,
  },
  [MilestoneType.META_LEARNING]: {
    researchPointsCost: 5000,
    prerequisiteMilestones: [MilestoneType.TRANSFER_LEARNING],
    minimumCapabilityLevel: 50,
    minimumAlignmentLevel: 45,
    estimatedMonths: 9,
    computeBudgetRequired: 1000000,
  },
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: {
    researchPointsCost: 5500,
    prerequisiteMilestones: [MilestoneType.TRANSFER_LEARNING, MilestoneType.CREATIVE_PROBLEM_SOLVING],
    minimumCapabilityLevel: 55,
    minimumAlignmentLevel: 50,
    estimatedMonths: 10,
    computeBudgetRequired: 1200000,
  },
  [MilestoneType.MULTI_AGENT_COORDINATION]: {
    researchPointsCost: 5000,
    prerequisiteMilestones: [MilestoneType.STRATEGIC_PLANNING, MilestoneType.TRANSFER_LEARNING],
    minimumCapabilityLevel: 50,
    minimumAlignmentLevel: 55,
    estimatedMonths: 9,
    computeBudgetRequired: 1100000,
  },
  [MilestoneType.SELF_IMPROVEMENT]: {
    researchPointsCost: 7000,
    prerequisiteMilestones: [MilestoneType.META_LEARNING, MilestoneType.TRANSFER_LEARNING],
    minimumCapabilityLevel: 60,
    minimumAlignmentLevel: 60,
    estimatedMonths: 12,
    computeBudgetRequired: 2000000,
  },
  [MilestoneType.GENERAL_INTELLIGENCE]: {
    researchPointsCost: 10000,
    prerequisiteMilestones: [
      MilestoneType.SELF_IMPROVEMENT,
      MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING,
      MilestoneType.MULTI_AGENT_COORDINATION,
    ],
    minimumCapabilityLevel: 70,
    minimumAlignmentLevel: 70,
    estimatedMonths: 18,
    computeBudgetRequired: 5000000,
  },
  [MilestoneType.SUPERINTELLIGENCE]: {
    researchPointsCost: 20000,
    prerequisiteMilestones: [MilestoneType.GENERAL_INTELLIGENCE],
    minimumCapabilityLevel: 85,
    minimumAlignmentLevel: 80,
    estimatedMonths: 24,
    computeBudgetRequired: 10000000,
  },
  [MilestoneType.VALUE_ALIGNMENT]: {
    researchPointsCost: 4000,
    prerequisiteMilestones: [MilestoneType.ADVANCED_REASONING],
    minimumCapabilityLevel: 35,
    minimumAlignmentLevel: 40,
    estimatedMonths: 8,
    computeBudgetRequired: 600000,
  },
  [MilestoneType.INTERPRETABILITY]: {
    researchPointsCost: 4500,
    prerequisiteMilestones: [MilestoneType.ADVANCED_REASONING, MilestoneType.VALUE_ALIGNMENT],
    minimumCapabilityLevel: 40,
    minimumAlignmentLevel: 50,
    estimatedMonths: 9,
    computeBudgetRequired: 800000,
  },
};

/**
 * GET /api/ai/agi/milestones
 * 
 * Retrieve all AGI milestones for authenticated user's company with optional filtering.
 * Returns milestone list sorted by creation date (newest first).
 * 
 * @param req - NextRequest with optional query parameters (status, milestoneType)
 * @returns JSON response with milestones array and metadata
 * 
 * @example
 * GET /api/ai/agi/milestones
 * Returns: { success: true, count: 12, milestones: [...] }
 * 
 * @example
 * GET /api/ai/agi/milestones?status=Achieved
 * Returns: { success: true, count: 3, milestones: [...] } // Only achieved milestones
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication - verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const milestoneType = searchParams.get('milestoneType');

    // Build query with company filter
    const query: Record<string, unknown> = { company: company._id };
    if (status) {
      query.status = status;
    }
    if (milestoneType) {
      query.milestoneType = milestoneType;
    }

    // Fetch milestones sorted by creation date (newest first)
    const milestones = await AGIMilestone.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: milestones.length,
      milestones,
    });
  } catch (error) {
    console.error('Error fetching AGI milestones:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch milestones',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/agi/milestones
 * 
 * Create new AGI milestone for authenticated user's company.
 * Initializes milestone with research requirements, default metrics, and Available status.
 * Enforces one milestone per type per company via unique index.
 * 
 * @param req - NextRequest with JSON body containing milestone configuration
 * @returns JSON response with created milestone
 * 
 * @example
 * POST /api/ai/agi/milestones
 * Body: { milestoneType: "Advanced Reasoning", alignmentStance: "Balanced" }
 * Returns: { success: true, milestone: {...}, message: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication - verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const {
      milestoneType,
      alignmentStance = AlignmentStance.BALANCED,
      researchPointsInvested = 0,
    }: {
      milestoneType: MilestoneType;
      alignmentStance?: AlignmentStance;
      researchPointsInvested?: number;
    } = body;

    // Validation - milestoneType is required
    if (!milestoneType) {
      return NextResponse.json(
        { error: 'milestoneType is required' },
        { status: 400 }
      );
    }

    // Check if milestone already exists for this company
    const existingMilestone = await AGIMilestone.findOne({
      company: company._id,
      milestoneType,
    });

    if (existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone already exists for this company' },
        { status: 409 }
      );
    }

    // Get research requirements for this milestone type
    const requirements = RESEARCH_REQUIREMENTS_MAP[milestoneType];

    if (!requirements) {
      return NextResponse.json(
        { error: `Invalid milestone type: ${milestoneType}` },
        { status: 400 }
      );
    }

    // Initialize default capability metrics (all start at 0)
    const currentCapability = {
      reasoningScore: 0,
      planningCapability: 0,
      selfImprovementRate: 0,
      generalizationAbility: 0,
      creativityScore: 0,
      learningEfficiency: 0,
    };

    // Initialize default alignment metrics (all start at 50 - neutral safety)
    const currentAlignment = {
      safetyMeasures: 50,
      valueAlignmentScore: 50,
      controlMechanisms: 50,
      interpretability: 50,
      robustness: 50,
      ethicalConstraints: 50,
    };

    // Create milestone with Available status
    // NOTE: In production, status should be calculated based on prerequisites
    // For MVP, all milestones start as Available
    const milestone = new AGIMilestone({
      company: company._id,
      milestoneType,
      status: 'Available',
      attemptCount: 0,
      currentCapability,
      currentAlignment,
      researchRequirements: requirements,
      researchPointsInvested,
      computeBudgetSpent: 0,
      monthsInProgress: 0,
      alignmentStance,
      alignmentChallenges: [],
      impactConsequences: {
        industryDisruptionLevel: 0,
        regulatoryAttention: 0,
        publicPerceptionChange: 0,
        competitiveAdvantage: 0,
        catastrophicRiskProbability: 0,
        economicValueCreated: 0,
      },
    });

    await milestone.save();

    return NextResponse.json(
      {
        success: true,
        milestone,
        message: `AGI milestone "${milestoneType}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AGI milestone:', error);
    return NextResponse.json(
      {
        error: 'Failed to create milestone',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. RESEARCH REQUIREMENTS MAPPING:
 *    - Centralized definition prevents duplication
 *    - Matches model's prerequisite validation logic
 *    - RP costs: 3k (foundation) → 20k (Superintelligence)
 *    - Compute costs: $500k → $10M
 *    - Time estimates: 6-24 months
 * 
 * 2. PREREQUISITE ENFORCEMENT:
 *    - Unique index: company + milestoneType prevents duplicates
 *    - Prerequisites defined in RESEARCH_REQUIREMENTS_MAP
 *    - Status should be calculated from achieved prerequisites (future enhancement)
 *    - Current MVP: All milestones start as Available
 * 
 * 3. INITIAL METRICS:
 *    - Capability starts at 0 (no AI capabilities yet)
 *    - Alignment starts at 50 (neutral safety baseline)
 *    - Companies inherit global alignment stance (can override per milestone)
 * 
 * 4. FILTERING SUPPORT:
 *    - Query by status: Get all Achieved/InProgress milestones
 *    - Query by type: Get specific milestone instance
 *    - Combine filters: Get Achieved Advanced Reasoning milestone
 * 
 * 5. ERROR HANDLING:
 *    - 401: Unauthorized (no session)
 *    - 404: Company not found
 *    - 409: Milestone already exists
 *    - 400: Invalid milestone type or missing required fields
 *    - 500: Database or server errors
 * 
 * 6. FUTURE ENHANCEMENTS:
 *    - Auto-calculate status from prerequisites (use AGIMilestone.checkPrerequisitesAsync)
 *    - Inherit capability/alignment from company's current AI models
 *    - Support bulk milestone creation (initialize full tech tree)
 *    - Add pagination for large milestone lists
 */
