import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/politics/Bill';
import { updateBillSchema } from '@/lib/validations/politics';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const bill = await Bill.findOne({ _id: params.id, company: session.user.companyId }).lean();
    if (!bill) return createErrorResponse('Bill not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ bill });
  } catch (error) {
    console.error('[Bill GET] Error:', error);
    return createErrorResponse('Failed to fetch bill', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const body = await request.json();
    const validatedData = updateBillSchema.parse(body);
    const bill = await Bill.findOneAndUpdate(
      { _id: params.id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!bill) return createErrorResponse('Bill not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid bill data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Bill PATCH] Error:', error);
    return createErrorResponse('Failed to update bill', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user) return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    await connectDB();
    const bill = await Bill.findOneAndDelete({ _id: params.id, company: session.user.companyId }).lean();
    if (!bill) return createErrorResponse('Bill not found', 'NOT_FOUND', 404);
    return createSuccessResponse({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('[Bill DELETE] Error:', error);
    return createErrorResponse('Failed to delete bill', 'INTERNAL_ERROR', 500);
  }
}
