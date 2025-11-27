/**
 * @fileoverview Public User Profile API
 * @route GET /api/users/[username]
 * Returns public-facing profile fields and owned companies for display.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';
import Company from '@/lib/db/models/Company';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await context.params;
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch companies owned by this user
    const companies = await Company.find({ userId: user._id?.toString() }).select('name industry level reputation logoUrl').lean();

    // Public profile fields (exclude sensitive data like email/password)
    const publicProfile = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      state: user.state,
      gender: user.gender,
      ethnicity: user.ethnicity ?? undefined,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      companies: companies?.map(c => ({
        id: c._id?.toString?.() ?? '',
        name: c.name,
        industry: c.industry,
        level: c.level,
        reputation: (c as any).reputation,
        logoUrl: (c as any).logoUrl,
      })) ?? [],
    };

    return NextResponse.json({ profile: publicProfile }, { status: 200 });
  } catch (err) {
    console.error('Public profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
