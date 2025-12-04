import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import District from '@/lib/db/models/politics/District';
import { updateDistrictSchema } from '@/lib/validations/politics';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const district = await District.findOne({ _id: id, company: session.user.companyId }).lean();
    if (!district) return createErrorResponse('District not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ district });
  } catch (error) {
    console.error('[District GET] Error:', error);
    return createErrorResponse('Failed to fetch district', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateDistrictSchema.parse(body);
    const { id } = await params;
    const district = await District.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!district) return createErrorResponse('District not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ district });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid district data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[District PATCH] Error:', error);
    return createErrorResponse('Failed to update district', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const district = await District.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!district) return createErrorResponse('District not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('[District DELETE] Error:', error);
    return createErrorResponse('Failed to delete district', 'INTERNAL_ERROR', 500);
  }
}
