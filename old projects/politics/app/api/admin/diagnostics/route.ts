import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import Loan from '@/lib/db/models/Loan';

/**
 * GET /api/admin/diagnostics
 *
 * Developer-only diagnostics and optional repair endpoint for financial inconsistencies.
 * Restrictions:
 * - Only allowed when NODE_ENV !== 'production' (local/dev use only)
 * - Requires authenticated session (owner check applied per-company)
 *
 * Query params:
 * - repair=true  => Attempt repair for detected issues (requires confirm=true)
 * - confirm=true => Explicit confirmation flag to perform repairs
 */
export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Diagnostics disabled in production' }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(request.url);
    const repair = url.searchParams.get('repair') === 'true';
    const confirm = url.searchParams.get('confirm') === 'true';

    // Find companies that appear to be missing the system seed investment or early funding
    // Criteria: no investment transaction with metadata.source === 'system' and no loan/investment within 5 minutes of foundedAt
    const candidates = [] as any[];

    const companies = await Company.find({}).lean();

    for (const c of companies) {
      // Fetch recent transactions around the foundedAt window
      const windowStart = new Date(new Date(c.foundedAt).getTime() - 5 * 60 * 1000);
      const windowEnd = new Date(new Date(c.foundedAt).getTime() + 60 * 60 * 1000);

      const recent = await Transaction.find({ company: c._id, createdAt: { $gte: windowStart, $lte: windowEnd } }).lean();

      const hasSystemSeed = recent.some((t: any) => t.type === 'investment' && t.metadata?.source === 'system' && t.amount === 10000);
      const hasEarlyFunding = recent.some((t: any) => t.type === 'investment' || t.type === 'loan');

      // Check for loan inconsistencies (loans without corresponding transactions)
      const loans = await Loan.find({ company: c._id, status: { $in: ['Active', 'PaidOff'] } }).lean();
      const loanTransactions = await Transaction.find({ company: c._id, type: 'loan' }).lean();
      const hasOrphanedLoans = loans.length > 0 && loanTransactions.length === 0;

      if (!hasSystemSeed || hasOrphanedLoans) {
        candidates.push({ 
          company: c, 
          recent, 
          hasSystemSeed, 
          hasEarlyFunding,
          loans: loans.length,
          loanTransactions: loanTransactions.length,
          hasOrphanedLoans
        });
      }
    }

    // If repair requested, apply safe repairs only when confirm=true
    const repairs: any[] = [];
    if (repair) {
      if (!confirm) {
        return NextResponse.json({ error: 'To perform repairs set confirm=true' }, { status: 400 });
      }

      for (const item of candidates) {
        const c = item.company;

        // Create system seed investment transaction if missing
        const seedTx = await Transaction.create({
          type: 'investment',
          amount: 10000,
          description: 'System seed capital (repair)',
          company: c._id,
          metadata: { source: 'system', repaired: true },
        });

        // Adjust company cash to reflect seed (only if company.cash appears low)
        const newCash = (c.cash || 0) + 10000;
        await Company.updateOne({ _id: c._id }, { $set: { cash: newCash } });

        repairs.push({ companyId: c._id, seedTxId: seedTx._id, newCash });
      }
    }

    // Optional: Full cleanup mode to handle negative cash and orphan expenses
    const fullCleanup = url.searchParams.get('fullCleanup') === 'true';
    const fullRepairs: any[] = [];
    if (fullCleanup) {
      if (!confirm) {
        return NextResponse.json({ error: 'fullCleanup requires confirm=true' }, { status: 400 });
      }

      for (const c of companies) {
        // Recompute company's cash based on transaction history if inconsistent
        const txs = await Transaction.find({ company: c._id }).lean();

        // Compute net cash flow from transactions (investment + loan - expense + revenue)
        const netFromTxs = txs.reduce((acc: number, t: any) => {
          if (t.type === 'investment' || t.type === 'loan' || t.type === 'revenue') return acc + (t.amount || 0);
          if (t.type === 'expense' || t.type === 'transfer') return acc - (t.amount || 0);
          return acc;
        }, 0);

        // If company cash deviates significantly from initial seed + txs, repair by setting cash = Math.max(0, netFromTxs)
        if (c.cash < 0 || Math.abs(c.cash - netFromTxs) > 1000) {
          const oldCash = c.cash || 0;
          const newCash = Math.max(0, netFromTxs);
          await Company.updateOne({ _id: c._id }, { $set: { cash: newCash } });
          fullRepairs.push({ companyId: c._id, oldCash, newCash });
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      candidatesCount: candidates.length,
      candidates: candidates.map((x) => ({
        _id: x.company._id,
        name: x.company.name,
        foundedAt: x.company.foundedAt,
        cash: x.company.cash,
        expenses: x.company.expenses,
        recentTransactionsCount: x.recent.length,
        hasEarlyFunding: x.hasEarlyFunding,
        loans: x.loans,
        loanTransactions: x.loanTransactions,
        hasOrphanedLoans: x.hasOrphanedLoans,
      })),
      repairs,
    });
  } catch (error) {
    console.error('Admin diagnostics error:', error);
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 });
  }
}
