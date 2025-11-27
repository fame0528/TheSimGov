import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import Loan from '@/lib/db/models/Loan';

/**
 * GET /api/companies/[id]/financials
 *
 * Temporary diagnostic endpoint to return a company's recent transactions
 * and loans so developers/players can trace funding sources after partial
 * failures (read-only, owner-only).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const company = await Company.findById(id).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - you do not own this company' }, { status: 403 });
    }

    // Fetch recent transactions and active loans
    const transactions = await Transaction.find({ company: company._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const loans = await Loan.find({ company: company._id }).lean();

    // Return a concise summary (avoid exposing unrelated PII)
    return NextResponse.json(
      {
        company: {
          _id: company._id,
          name: company.name,
          industry: company.industry,
          cash: company.cash,
          expenses: company.expenses,
          revenue: company.revenue,
          foundedAt: company.foundedAt,
        },
        transactions,
        loans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/companies/[id]/financials error:', error);
    return NextResponse.json({ error: 'Failed to fetch financials' }, { status: 500 });
  }
}
