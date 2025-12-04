import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Donor from '@/lib/db/models/politics/Donor';
import { updateDonorSchema } from '@/lib/validations/politics';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const donor = await Donor.findOne({ _id: id, company: session.user.companyId }).populate('campaign', 'playerName office party').lean();
    if (!donor) return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ donor });
  } catch (error) {
    console.error('[Donor GET] Error:', error);
    return createErrorResponse('Failed to fetch donor', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateDonorSchema.parse(body);
    const { id } = await params;
    const donor = await Donor.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('campaign', 'playerName office party').lean();
    if (!donor) return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ donor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid donor data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Donor PATCH] Error:', error);
    return createErrorResponse('Failed to update donor', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const donor = await Donor.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!donor) return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('[Donor DELETE] Error:', error);
    return createErrorResponse('Failed to delete donor', 'INTERNAL_ERROR', 500);
  }
}
