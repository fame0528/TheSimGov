import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Election from '@/lib/db/models/politics/Election';
import { updateElectionSchema } from '@/lib/validations/politics';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const election = await Election.findOne({ _id: params.id, company: session.user.companyId }).lean();
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    return NextResponse.json({ election });
  } catch (error) {
    console.error('[Election GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch election' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const validatedData = updateElectionSchema.parse(body);
    const election = await Election.findOneAndUpdate(
      { _id: params.id, company: session.user.companyId },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    return NextResponse.json({ election });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid election data', details: error.errors }, { status: 400 });
    }
    console.error('[Election PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update election' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const election = await Election.findOneAndDelete({ _id: params.id, company: session.user.companyId }).lean();
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Election deleted successfully' });
  } catch (error) {
    console.error('[Election DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete election' }, { status: 500 });
  }
}
