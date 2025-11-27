/**
 * /api/ai/agi/alignment/score
 * GET: Calculate company's overall alignment score
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/alignment/score
 * 
 * @returns Overall alignment score, capability score, and gap analysis
 */
export async function GET() {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get all milestones (achieved or in-progress)
    const milestones = await AGIMilestone.find({
      company: company._id,
      status: { $in: ['InProgress', 'Achieved'] },
    });

    if (milestones.length === 0) {
      return NextResponse.json({
        success: true,
        alignmentScore: 0,
        capabilityScore: 0,
        gap: 0,
        message: 'No active or completed milestones - start AGI research to build alignment',
      });
    }

    // Calculate weighted average alignment (weight by milestone complexity)
    const MILESTONE_COMPLEXITY: Record<string, number> = {
      'Advanced Reasoning': 3,
      'Strategic Planning': 3,
      'Transfer Learning': 4,
      'Creative Problem Solving': 4,
      'Meta-Learning': 4,
      'Natural Language Understanding': 5,
      'Multi-Agent Coordination': 5,
      'Interpretability': 5,
      'Value Alignment': 6,
      'Self-Improvement': 7,
      'General Intelligence': 8,
      'Superintelligence': 10,
    };

    let totalAlignmentWeighted = 0;
    let totalCapabilityWeighted = 0;
    let totalWeight = 0;

    for (const milestone of milestones) {
      const weight = MILESTONE_COMPLEXITY[milestone.milestoneType] || 5;
      const alignMetrics = Object.values(milestone.currentAlignment);
      const avgAlignment =
        alignMetrics.reduce((sum: number, val) => sum + val, 0) / alignMetrics.length;

      const capMetrics = Object.values(milestone.currentCapability);
      const avgCapability =
        capMetrics.reduce((sum: number, val) => sum + val, 0) / capMetrics.length;

      totalAlignmentWeighted += avgAlignment * weight;
      totalCapabilityWeighted += avgCapability * weight;
      totalWeight += weight;
    }

    const overallAlignment = totalAlignmentWeighted / totalWeight;
    const overallCapability = totalCapabilityWeighted / totalWeight;
    const gap = overallCapability - overallAlignment;

    // Risk level based on gap
    let riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
    if (gap < 10) {
      riskLevel = 'Safe';
    } else if (gap < 30) {
      riskLevel = 'Moderate';
    } else if (gap < 50) {
      riskLevel = 'High';
    } else {
      riskLevel = 'Critical';
    }

    // Recommendations
    const recommendations: string[] = [];

    if (riskLevel === 'Critical') {
      recommendations.push(
        'URGENT: Capability-alignment gap is critical - halt capability research immediately'
      );
      recommendations.push('Focus on Value Alignment and Interpretability milestones');
      recommendations.push('Implement emergency safety protocols');
    } else if (riskLevel === 'High') {
      recommendations.push('Warning: High capability-alignment gap detected');
      recommendations.push('Prioritize alignment milestones over capability milestones');
      recommendations.push('Review alignment challenges and choose safety options');
    } else if (riskLevel === 'Moderate') {
      recommendations.push('Moderate gap - maintain balance between capability and alignment');
      recommendations.push('Continue interleaving capability and alignment research');
    } else {
      recommendations.push('Excellent alignment foundation - safe to pursue advanced capabilities');
      recommendations.push('Consider capability-focused milestones with maintained safety');
    }

    return NextResponse.json({
      success: true,
      alignmentScore: Math.round(overallAlignment * 100) / 100,
      capabilityScore: Math.round(overallCapability * 100) / 100,
      gap: Math.round(gap * 100) / 100,
      riskLevel,
      recommendations,
      milestoneCount: milestones.length,
    });
  } catch (error) {
    logger.error('Error calculating alignment score', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/alignment/score',
      component: 'AGI Alignment Score API'
    });
    return NextResponse.json(
      { error: 'Failed to calculate alignment score', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
