/**
 * @fileoverview Password Reset Request API
 * @module app/api/auth/password/reset/request
 *
 * POST /api/auth/password/reset/request
 * Body: { email: string }
 *
 * Generates a short-lived reset token and logs a reset link.
 * In production, send the link via email provider.
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';
import { resend } from '@/lib/email/resend';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    // Always respond success (avoid user enumeration). Log link only if user exists.

    if (user) {
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret';
      const token = jwt.sign({ sub: user._id.toString(), email }, secret, { expiresIn: '15m' });
      const baseUrl = getBaseUrl();
      const resetLink = `${baseUrl}/reset-password/${token}`;
      // Attempt to send email via Resend; if not configured, log link for development
      try {
        const from = process.env.RESEND_FROM || 'no-reply@localhost';
        if (!process.env.RESEND_API_KEY) {
          console.warn('[PasswordReset] RESEND_API_KEY not set. Logging link instead.');
          console.log('[PasswordReset] Link for', email, '→', resetLink);
        } else {
          await resend.emails.send({
            from,
            to: email,
            subject: 'Reset your password',
            html: `
              <div style="font-family: Arial, sans-serif; color: #0f172a;">
                <h2>Reset your password</h2>
                <p>We received a request to reset your password. Use the link below to set a new one. This link expires in 15 minutes.</p>
                <p><a href="${resetLink}" style="color:#10b981;">Reset Password</a></p>
                <p>Or copy and paste this URL:
                  <br/><code>${resetLink}</code></p>
                <p>If you didn’t request this, you can safely ignore this email.</p>
              </div>
            `,
          });
        }
      } catch (e) {
        console.error('[PasswordReset] Resend error:', e);
        // Do not reveal errors to client to avoid enumeration
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[PasswordReset] request error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
