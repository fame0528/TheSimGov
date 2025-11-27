/**
 * @fileoverview Research Breakthrough API Endpoint
 * @module app/api/ai/research/breakthrough
 * 
 * OVERVIEW:
 * Attempt breakthrough discoveries during AI research projects. Calculates probability based on
 * compute budget and researcher skill, generates breakthrough details with novelty/impact metrics,
 * and determines patent potential. Integrates with researchLab.ts utilities for probability
 * calculations and patent valuation.
 * 
 * BUSINESS LOGIC:
 * - Probability: Logarithmic scaling (base 5-15% + compute boost + talent boost, capped at 60%)
 * - Breakthrough success: Random roll vs calculated probability
 * - Novelty: 70-100 range (originality score)
 * - Performance gain: 0-20% capability improvement
 * - Efficiency gain: 0-50% cost reduction
 * - Patent check: Automatic patentability assessment with value estimation
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import { calculateBreakthroughProbability, isPatentable, type ResearchArea } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/breakthrough
 * 
 * Attempt breakthrough discovery for research project
 * 
 * Request body:
 * - projectId: ObjectId (research project)
 * - computeBudgetUSD: number (compute allocation for this attempt, $100k-$10M typical)
 * 
 * @returns 200: Breakthrough success/failure with probability breakdown
 * @returns 400: Validation error (missing fields, invalid values)
 * @returns 401: Unauthorized
 * @returns 404: Project not found
 * @returns 422: Project not InProgress or no researchers assigned
 * 
 * @example
 * POST /api/ai/research/breakthrough
 * {
 *   "projectId": "507f1f77bcf86cd799439011",
 *   "computeBudgetUSD": 500000
 * }
 * 
 * Success Response (breakthrough discovered):
 * {
 *   "success": true,
 *   "breakthrough": true,
 *   "message": "🎉 Breakthrough discovered!",
 *   "probability": { probability: 0.44, breakdown: {...}, percentChance: 44.00 },
 *   "roll": 0.3251,
 *   "breakthroughDetails": {
 *     "breakthroughId": "BT-1732234567890-ABC123XYZ",
 *     "name": "Performance Research Breakthrough",
 *     "area": "Performance",
 *     "noveltyScore": 88,
 *     "patentable": true,
 *     "estimatedValue": 920000,
 *     "discoveredAt": "2025-11-22T10:15:30.000Z"
 *   },
 *   "patentability": { patentable: true, reasoning: "...", estimatedValue: 920000, recommendedAction: "..." }
 * }
 * 
 * Failure Response (no breakthrough):
 * {
 *   "success": false,
 *   "breakthrough": false,
 *   "message": "No breakthrough discovered this cycle",
 *   "probability": { probability: 0.44, breakdown: {...}, percentChance: 44.00 },
 *   "roll": 0.7823
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // 2. Parse request body
    const body = await request.json();
    const { projectId, computeBudgetUSD } = body;

    // 3. Validate required fields
    if (!projectId || computeBudgetUSD === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, computeBudgetUSD' },
        { status: 400 }
      );
    }

    // 4. Validate compute budget (must be positive)
    if (typeof computeBudgetUSD !== 'number' || computeBudgetUSD < 0) {
      return NextResponse.json(
        { success: false, error: 'computeBudgetUSD must be a non-negative number' },
        { status: 422 }
      );
    }

    await connectDB();

    // 5. Find user's AI company
    const company = await Company.findById(companyId);

    if (!company || !['Technology', 'AI'].includes(company.industry)) {
      return NextResponse.json(
        { success: false, error: 'No AI/Technology company found for this user.' },
        { status: 403 }
      );
    }

    // 6. Load research project with ownership verification
    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Research project not found' },
        { status: 404 }
      );
    }

    // Verify project belongs to user's company
    if (project.company.toString() !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Project does not belong to your company' },
        { status: 403 }
      );
    }

    // 7. Project must be InProgress
    if (project.status !== 'InProgress') {
      return NextResponse.json(
        { success: false, error: `Project status is ${project.status}, must be InProgress to attempt breakthroughs` },
        { status: 422 }
      );
    }

    // 8. Load assigned researchers to calculate average skill
    if (!project.assignedResearchers || project.assignedResearchers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No researchers assigned to project - assign team before attempting breakthroughs' },
        { status: 422 }
      );
    }

    const researchers = await Employee.find({
      _id: { $in: project.assignedResearchers },
    }).select('skills');

    if (researchers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assigned researchers not found' },
        { status: 422 }
      );
    }

    // 9. Calculate average researcher skill (use technical skill for AI research)
    const researcherSkills = researchers.map(r => r.skills?.technical || 50);
    const avgSkill = researcherSkills.reduce((sum, skill) => sum + skill, 0) / researcherSkills.length;

    // 10. Map project type to research area for breakthrough probability
    const areaMap: Record<string, ResearchArea> = {
      Performance: 'Performance',
      Efficiency: 'Efficiency',
      NewCapability: 'Multimodal', // Assume multimodal for new capabilities
    };
    const area: ResearchArea = areaMap[project.type] || 'Performance';

    // 11. Calculate breakthrough probability (uses utility - logarithmic scaling)
    const probabilityResult = calculateBreakthroughProbability(
      area,
      computeBudgetUSD,
      avgSkill
    );

    // 12. Roll for breakthrough (random 0-1 vs probability)
    const roll = Math.random();
    const breakthroughOccurred = roll <= probabilityResult.probability;

    // 13. If no breakthrough, return failure with probability details
    if (!breakthroughOccurred) {
      return NextResponse.json({
        success: false,
        breakthrough: false,
        message: 'No breakthrough discovered this cycle',
        probability: probabilityResult,
        roll: Math.round(roll * 10000) / 10000, // 4 decimal places
      });
    }

    // 14. Breakthrough discovered! Generate breakthrough details
    const noveltyScore = Math.floor(Math.random() * 30) + 70; // 70-100 range (high novelty)
    const performanceGainPercent = Math.random() * 20; // 0-20% performance improvement
    const efficiencyGainPercent = Math.random() * 50; // 0-50% efficiency improvement

    // 15. Check if breakthrough is patentable (uses utility)
    const patentableResult = isPatentable(
      area,
      noveltyScore,
      performanceGainPercent,
      efficiencyGainPercent
    );

    // 16. Create breakthrough record
    const breakthroughId = `BT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const breakthrough = {
      breakthroughId,
      name: `${project.name} Breakthrough`,
      area,
      discoveredAt: new Date(),
      noveltyScore,
      performanceGainPercent,
      efficiencyGainPercent,
      patentable: patentableResult.patentable,
      estimatedPatentValue: patentableResult.estimatedValue,
    };

    // 17. Add breakthrough to project
    project.breakthroughs.push(breakthrough);
    await project.save();

    // 18. Return success with breakthrough details
    return NextResponse.json({
      success: true,
      breakthrough: true,
      message: '🎉 Breakthrough discovered!',
      probability: probabilityResult,
      roll: Math.round(roll * 10000) / 10000,
      breakthroughDetails: breakthrough,
      patentability: patentableResult,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/research/breakthrough]', error, 'Failed to process breakthrough attempt');
  }
}
