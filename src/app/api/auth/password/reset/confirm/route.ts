/**
 * @fileoverview Password Reset Confirm API
 * @module app/api/auth/password/reset/confirm
 *
 * POST /api/auth/password/reset/confirm
 * Body: { token: string, password: string }
 *
 * Verifies token and sets new hashed password for the user.
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Invalid password (min 6 chars)' }, { status: 400 });
    }

    const secret = process.env.NEXTAUTH_SECRET || 'dev-secret';
    let payload: { sub: string; email: string };
    try {
      payload = jwt.verify(token, secret) as { sub: string; email: string };
    } catch {
      return NextResponse.json({ error: 'Verification' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.sub);
    if (!user) {
      // Avoid leaking existence
      return NextResponse.json({ error: 'Verification' }, { status: 400 });
    }

    const hashed = await hash(password, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[PasswordReset] confirm error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
