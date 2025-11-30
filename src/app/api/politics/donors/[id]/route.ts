import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Donor from '@/lib/db/models/politics/Donor';
import { updateDonorSchema } from '@/lib/validations/politics';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const donor = await Donor.findOne({ _id: params.id, company: session.user.companyId }).populate('campaign', 'playerName office party').lean();
    if (!donor) return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    return NextResponse.json({ donor });
  } catch (error) {
    console.error('[Donor GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch donor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const validatedData = updateDonorSchema.parse(body);
    const donor = await Donor.findOneAndUpdate(
      { _id: params.id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('campaign', 'playerName office party').lean();
    if (!donor) return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    return NextResponse.json({ donor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid donor data', details: error.errors }, { status: 400 });
    }
    console.error('[Donor PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update donor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const donor = await Donor.findOneAndDelete({ _id: params.id, company: session.user.companyId }).lean();
    if (!donor) return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('[Donor DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete donor' }, { status: 500 });
  }
}
