import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Campaign from '@/lib/db/models/politics/Campaign';
import { updateCampaignSchema } from '@/lib/validations/politics';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const campaign = await Campaign.findOne({ _id: id, company: session.user.companyId }).lean();
    if (!campaign) return createErrorResponse('Campaign not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ campaign });
  } catch (error) {
    console.error('[Campaign GET] Error:', error);
    return createErrorResponse('Failed to fetch campaign', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateCampaignSchema.parse(body);
    const { id } = await params;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!campaign) return createErrorResponse('Campaign not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid campaign data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Campaign PATCH] Error:', error);
    return createErrorResponse('Failed to update campaign', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const campaign = await Campaign.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!campaign) return createErrorResponse('Campaign not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('[Campaign DELETE] Error:', error);
    return createErrorResponse('Failed to delete campaign', 'INTERNAL_ERROR', 500);
  }
}
