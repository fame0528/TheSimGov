/**
 * @fileoverview Company Logo Upload API
 * @module app/api/upload/company-logo
 * 
 * OVERVIEW:
 * Validates and stores uploaded company logos under /public/company-logos.
 * Mirrors avatar upload behavior with shared constraints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AVATAR_CONSTRAINTS } from '@/lib/types/portraits';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isValid: false, errors: ['Unauthorized'] }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar');
    if (!(file instanceof File)) {
      return NextResponse.json({ isValid: false, errors: ['No file uploaded'] }, { status: 400 });
    }

    // Validate size
    if (file.size > AVATAR_CONSTRAINTS.MAX_FILE_SIZE) {
      return NextResponse.json({ isValid: false, errors: ['File too large'] }, { status: 400 });
    }

    // Validate type by extension
    const filename = (file.name || 'upload').toLowerCase();
    const ext = path.extname(filename);
    const allowedExtensions: readonly string[] = AVATAR_CONSTRAINTS.ALLOWED_EXTENSIONS;
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ isValid: false, errors: ['Invalid file type'] }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate dimensions using sharp
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height || meta.width < AVATAR_CONSTRAINTS.MIN_WIDTH || meta.height < AVATAR_CONSTRAINTS.MIN_HEIGHT) {
      return NextResponse.json({ isValid: false, errors: ['Image too small'] }, { status: 400 });
    }

    // Ensure directory exists
    const destDir = path.join(process.cwd(), 'public', 'company-logos');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Generate destination filename
    const ts = Math.floor(Date.now() / 1000);
    const destName = `company-${session.user.id}-${ts}${ext}`;
    const destPath = path.join(destDir, destName);

    // Write processed image (normalize to recommended size if larger)
    const width = Math.min(meta.width || AVATAR_CONSTRAINTS.RECOMMENDED_WIDTH, AVATAR_CONSTRAINTS.RECOMMENDED_WIDTH);
    const height = Math.min(meta.height || AVATAR_CONSTRAINTS.RECOMMENDED_HEIGHT, AVATAR_CONSTRAINTS.RECOMMENDED_HEIGHT);
    await sharp(buffer).resize({ width, height, fit: 'cover' }).toFile(destPath);

    const uploadUrl = `/company-logos/${destName}`;
    return NextResponse.json({ isValid: true, uploadUrl, errors: [] });
  } catch (error) {
    console.error('POST /api/upload/company-logo error:', error);
    return NextResponse.json({ isValid: false, errors: ['Internal server error'] }, { status: 500 });
  }
}
