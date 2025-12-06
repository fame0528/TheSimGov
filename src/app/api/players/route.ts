/**
 * @fileoverview Players API - List and Search Players
 * @module app/api/players/route
 * 
 * OVERVIEW:
 * Lists players with pagination and search functionality.
 * Returns public profile data only.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    // Build query - exclude current user
    const query: Record<string, unknown> = {
      _id: { $ne: session.user.id },
    };

    // Add search if provided
    if (search.trim()) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sort field
    const sortField: Record<string, number> = {};
    switch (sortBy) {
      case 'username':
        sortField.username = sortOrder;
        break;
      case 'name':
        sortField.firstName = sortOrder;
        break;
      case 'state':
        sortField.state = sortOrder;
        break;
      default:
        sortField.createdAt = sortOrder;
    }

    // Execute queries
    const [players, total] = await Promise.all([
      UserModel.find(query)
        .select('username firstName lastName state gender imageUrl createdAt')
        .sort(sortField as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: players.map(p => ({
        id: p._id.toString(),
        username: p.username,
        firstName: p.firstName,
        lastName: p.lastName,
        state: p.state,
        gender: p.gender,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('[API] Players GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
