import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import VoterOutreach from '@/lib/db/models/politics/VoterOutreach';
import { updateVoterOutreachSchema } from '@/lib/validations/politics';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const outreach = await VoterOutreach.findOne({ _id: id, company: session.user.companyId }).populate('campaign', 'playerName office party').lean();
    if (!outreach) return createErrorResponse('Outreach activity not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ outreach });
  } catch (error) {
    console.error('[Outreach GET] Error:', error);
    return createErrorResponse('Failed to fetch outreach activity', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateVoterOutreachSchema.parse(body);
    const { id } = await params;
    const outreach = await VoterOutreach.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('campaign', 'playerName office party').lean();
    if (!outreach) return createErrorResponse('Outreach activity not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ outreach });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid outreach data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Outreach PATCH] Error:', error);
    return createErrorResponse('Failed to update outreach activity', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const outreach = await VoterOutreach.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!outreach) return createErrorResponse('Outreach activity not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'Outreach activity deleted successfully' });
  } catch (error) {
    console.error('[Outreach DELETE] Error:', error);
    return createErrorResponse('Failed to delete outreach activity', 'INTERNAL_ERROR', 500);
  }
}
