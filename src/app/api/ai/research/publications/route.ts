/**
 * @fileoverview Research Publication API Endpoint
 * @module app/api/ai/research/publications
 * 
 * OVERVIEW:
 * POST endpoint for publishing research findings from breakthrough discoveries.
 * Includes venue selection (Conference/Journal/Workshop/Preprint), citation tracking,
 * and company reputation boost based on publication impact.
 * 
 * BUSINESS LOGIC:
 * - Venues: Conference (NeurIPS, ICML), Journal (Nature, Science), Workshop, Preprint (arXiv)
 * - Citation impact: Top venues (NeurIPS, Nature) 1.5x multiplier
 * - Reputation boost: 0-10 points based on impact score (0-100)
 * - Impact factors: Venue prestige, research area, novelty score
 * - Expected citations: 10-100+ range (top venues with high novelty)
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Employee from '@/lib/db/models/Employee';
import { estimatePublicationImpact } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/publications
 * 
 * Publish research findings from breakthrough discovery
 * 
 * @security Requires authentication, company ownership verification
 * 
 * @body {
 *   projectId: string,              // Research project ID
 *   breakthroughIndex: number,      // Index in project.breakthroughs array
 *   venue: 'Conference' | 'Journal' | 'Workshop' | 'Preprint',
 *   venueName: string              // e.g., "NeurIPS 2025", "Nature AI"
 * }
 * 
 * @returns {
 *   success: boolean,
 *   message: string,
 *   publication: {
 *     publicationId: string,        // PUB-<timestamp>-<random>
 *     title: string,
 *     authors: string[],            // Researcher names
 *     venue: string,
 *     venueName: string,
 *     publishedAt: Date,
 *     citations: number,            // Initially 0
 *     downloads: number             // Initially 0
 *   },
 *   impact: {
 *     expectedCitations: number,    // Predicted citations (1 year)
 *     impactScore: number,          // 0-100 overall impact
 *     communityBenefit: string,     // 'Low' | 'Medium' | 'High' | 'Very High'
 *     recommendedVenue: boolean     // Is this venue appropriate?
 *   },
 *   reputationBoost: number,        // 0-10 points
 *   companyNewReputation: number
 * }
 * 
 * @example
 * POST /api/ai/research/publications
 * {
 *   "projectId": "673f5e8b1a2b3c4d5e6f7890",
 *   "breakthroughIndex": 0,
 *   "venue": "Conference",
 *   "venueName": "NeurIPS 2025"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // 2. Parse request body
    const body = await req.json();
    const { projectId, breakthroughIndex, venue, venueName } = body;

    // 3. Validate required fields
    if (!projectId || breakthroughIndex === undefined || !venue || !venueName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, breakthroughIndex, venue, venueName' },
        { status: 400 }
      );
    }

    // 4. Validate venue type
    const validVenues = ['Conference', 'Journal', 'Workshop', 'Preprint'];
    if (!validVenues.includes(venue)) {
      return NextResponse.json(
        { success: false, error: 'Invalid venue. Must be: Conference, Journal, Workshop, or Preprint' },
        { status: 400 }
      );
    }

    // 5. Validate breakthrough index
    if (breakthroughIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid breakthrough index (must be >= 0)' },
        { status: 400 }
      );
    }

    // 6. Connect to database
    await connectDB();

    // 7. Find company and verify ownership
    const company = await Company.findById(companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this company' },
        { status: 403 }
      );
    }

    // 8. Find research project
    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Research project not found' },
        { status: 404 }
      );
    }

    // 9. Verify project belongs to user's company
    if (project.company.toString() !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Research project does not belong to your company' },
        { status: 403 }
      );
    }

    // 10. Validate breakthrough exists
    if (breakthroughIndex >= project.breakthroughs.length) {
      return NextResponse.json(
        { success: false, error: `Invalid breakthrough index (project has ${project.breakthroughs.length} breakthroughs)` },
        { status: 400 }
      );
    }

    const breakthrough = project.breakthroughs[breakthroughIndex];

    // 11. Check if publication already exists for this breakthrough
    const existingPublication = project.publications.find(
      p => p.title === `${breakthrough.name}: ${project.name}`
    );

    if (existingPublication) {
      return NextResponse.json(
        {
          success: false,
          error: 'Publication already created for this breakthrough',
          existingPublicationId: existingPublication.publicationId,
        },
        { status: 400 }
      );
    }

    // 12. Load researchers for author list
    const researchers = await Employee.find({
      _id: { $in: project.assignedResearchers },
    }).select('name');

    const authors = researchers.map(r => r.name);

    // 13. Estimate publication impact
    const impactResult = estimatePublicationImpact(
      venue as any,
      venueName,
      breakthrough.area as any,
      breakthrough.noveltyScore
    );

    // 14. Create publication record
    const publicationId = `PUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const publication = {
      publicationId,
      title: `${breakthrough.name}: ${project.name}`,
      authors,
      venue: venue as 'Conference' | 'Journal' | 'Workshop' | 'Preprint',
      venueName,
      publishedAt: new Date(),
      citations: 0,
      downloads: 0,
    };

    // 15. Add publication to project
    project.publications.push(publication);
    await project.save();

    // 16. Boost company reputation based on publication impact
    const reputationBoost = Math.floor(impactResult.impactScore / 10); // 0-10 points
    const currentReputation = company.reputation || 70;
    const newReputation = Math.min(100, currentReputation + reputationBoost);
    
    company.reputation = newReputation;
    await company.save();

    // 17. Log publication
    console.log(`[POST /api/ai/research/publications] Publication created: ${publicationId} in ${venueName} (impact score: ${impactResult.impactScore})`);

    // 18. Return success response
    return NextResponse.json({
      success: true,
      message: `Publication submitted to ${venueName}`,
      publication,
      impact: impactResult,
      reputationBoost,
      companyNewReputation: newReputation,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/research/publications]', error, 'Failed to create publication');
  }
}
