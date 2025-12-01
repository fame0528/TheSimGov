import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import VoterOutreach from '@/lib/db/models/politics/VoterOutreach';
import { updateVoterOutreachSchema } from '@/lib/validations/politics';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const outreach = await VoterOutreach.findOne({ _id: id, company: session.user.companyId }).populate('campaign', 'playerName office party').lean();
    if (!outreach) return NextResponse.json({ error: 'Outreach activity not found' }, { status: 404 });
    return NextResponse.json({ outreach });
  } catch (error) {
    console.error('[Outreach GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch outreach activity' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const validatedData = updateVoterOutreachSchema.parse(body);
    const { id } = await params;
    const outreach = await VoterOutreach.findOneAndUpdate(
      { _id: id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('campaign', 'playerName office party').lean();
    if (!outreach) return NextResponse.json({ error: 'Outreach activity not found' }, { status: 404 });
    return NextResponse.json({ outreach });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid outreach data', details: error.errors }, { status: 400 });
    }
    console.error('[Outreach PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update outreach activity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const outreach = await VoterOutreach.findOneAndDelete({ _id: id, company: session.user.companyId }).lean();
    if (!outreach) return NextResponse.json({ error: 'Outreach activity not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Outreach activity deleted successfully' });
  } catch (error) {
    console.error('[Outreach DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete outreach activity' }, { status: 500 });
  }
}
