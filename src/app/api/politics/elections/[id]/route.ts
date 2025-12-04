import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Election from '@/lib/db/models/politics/Election';
import { updateElectionSchema } from '@/lib/validations/politics';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const election = await Election.findOne({ _id: id, company: session.user.companyId }).lean();
    if (!election) return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ election });
  } catch (error) {
    console.error('[Election GET] Error:', error);
    return createErrorResponse('Failed to fetch election', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateElectionSchema.parse(body);
    const { id } = await params;
    const election = await Election.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!election) return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ election });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid election data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Election PATCH] Error:', error);
    return createErrorResponse('Failed to update election', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const { id } = await params;
    const election = await Election.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!election) return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'Election deleted successfully' });
  } catch (error) {
    console.error('[Election DELETE] Error:', error);
    return createErrorResponse('Failed to delete election', 'INTERNAL_ERROR', 500);
  }
}
