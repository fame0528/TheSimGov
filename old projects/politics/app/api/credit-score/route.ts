import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import CreditScore from '@/lib/db/models/CreditScore';

/**
 * GET /api/credit-score
 * Returns minimal credit score info for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const credit = await CreditScore.findOne({ userId: session.user.id }).lean();
    const score = credit?.score ?? 600;

    const getTier = (s: number) => {
      if (s < 580) return 'Poor';
      if (s < 670) return 'Fair';
      if (s < 740) return 'Good';
      if (s < 800) return 'Very Good';
      return 'Excellent';
    };

    const getLoanCap = (s: number) => {
      if (s < 580) return 5000;
      if (s < 670) return 25000;
      if (s < 740) return 100000;
      if (s < 800) return 500000;
      return 2000000;
    };

    const tierName = getTier(score);
    const maxLoan = getLoanCap(score);

    return NextResponse.json({ score, tierName, maxLoan });
  } catch (err) {
    console.error('GET /api/credit-score error:', err);
    return NextResponse.json({ error: 'Failed to fetch credit score' }, { status: 500 });
  }
}
