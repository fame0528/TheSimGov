import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import District from '@/lib/db/models/politics/District';
import { updateDistrictSchema } from '@/lib/validations/politics';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const district = await District.findOne({ _id: id, company: session.user.companyId }).lean();
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });
    return NextResponse.json({ district });
  } catch (error) {
    console.error('[District GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch district' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const validatedData = updateDistrictSchema.parse(body);
    const { id } = await params;
    const district = await District.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });
    return NextResponse.json({ district });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid district data', details: error.errors }, { status: 400 });
    }
    console.error('[District PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update district' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const district = await District.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'District deleted successfully' });
  } catch (error) {
    console.error('[District DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete district' }, { status: 500 });
  }
}
