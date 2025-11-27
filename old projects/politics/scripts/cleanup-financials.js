#!/usr/bin/env node
/**
 * scripts/cleanup-financials.js
 *
 * Runs a safe cleanup over company financials:
 * - Detects companies lacking the system seed transaction
 * - Optionally creates the seed transaction and adjusts company cash
 * - Optionally recomputes company.cash from transactions and corrects large discrepancies
 * - Optionally delete ALL users and related player data (useful for dev only)
 *
 * Use: node scripts/cleanup-financials.js --confirm --fullCleanup --dryRun
 * Use: node scripts/cleanup-financials.js --deleteAllUsers --confirm --dryRun
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const fullCleanup = args.includes('--fullCleanup');
  const dryRun = args.includes('--dryRun');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set. Set .env or export env var.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('Cleanup script is disabled in production. Set NODE_ENV to development on local dev only.');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const companies = mongoose.connection.collection('companies');
  const transactions = mongoose.connection.collection('transactions');

  const allCompanies = await companies.find({}).toArray();
  console.log(`Found ${allCompanies.length} companies`);

  const candidates = [];

  for (const c of allCompanies) {
    const txs = await transactions.find({ company: c._id }).toArray();

    const hasSystemSeed = txs.some(t => t.type === 'investment' && t.metadata && t.metadata.source === 'system' && t.amount === 10000);
    const hasEarlyFunding = txs.some(t => t.type === 'investment' || t.type === 'loan');

    if (!hasSystemSeed) {
      candidates.push({ company: c, recentTxCount: txs.length, hasEarlyFunding });
    }
  }

  console.log(`Candidates lacking system seed: ${candidates.length}`);
  if (candidates.length > 0 && (confirm && !dryRun)) {
    for (const item of candidates) {
      const c = item.company;
      console.log('Repairing company', c._id.toString(), c.name);
      const seedTx = {
        type: 'investment',
        amount: 10000,
        description: 'System seed capital (repair)',
        company: c._id,
        metadata: { source: 'system', repaired: true },
        createdAt: new Date()
      };

      await transactions.insertOne(seedTx);
      const newCash = Math.max(0, (c.cash || 0) + 10000);
      await companies.updateOne({ _id: c._id }, { $set: { cash: newCash } });
      console.log('Seed repair applied. New cash:', newCash);
    }
  } else if (candidates.length > 0 && dryRun) {
    console.log('Dry run: candidate details:');
    console.log(JSON.stringify(candidates.map(x => ({ id: x.company._id, name: x.company.name, recent: x.recentTxCount })), null, 2));
  }

  if (fullCleanup && confirm) {
    console.log('Running full cleanup — recalculating cash from transactions');
    for (const c of allCompanies) {
      const txs = await transactions.find({ company: c._id }).toArray();
      const netFromTxs = txs.reduce((acc, t) => {
        if (t.type === 'investment' || t.type === 'loan' || t.type === 'revenue') return acc + (t.amount || 0);
        if (t.type === 'expense' || t.type === 'transfer') return acc - (t.amount || 0);
        return acc;
      }, 0);

      if (c.cash < 0 || Math.abs(c.cash - netFromTxs) > 1000) {
        console.log(`Company ${c._id} cash mismatch: on-record ${c.cash}, derived from txns ${netFromTxs}`);
        if (!dryRun) {
          await companies.updateOne({ _id: c._id }, { $set: { cash: Math.max(0, netFromTxs) } });
          console.log('Updated cash');
        }
      }
    }
  }

  // Optional: delete a single company and all related data (useful for QA)
  // Usage: node scripts/cleanup-financials.js --deleteCompany=<companyId> --confirm
  const deleteCompanyArg = args.find(a => a.startsWith('--deleteCompany='));
  if (deleteCompanyArg) {
    if (!confirm) {
      console.error('To delete a company pass --confirm');
      process.exit(1);
    }
    const companyId = deleteCompanyArg.split('=')[1];
    if (!companyId) {
      console.error('Invalid company id');
      process.exit(1);
    }

    // Delete loans, transactions, locations and the company. Avoid deleting user documents.
    console.log(`Deleting company ${companyId} and related loans/transactions/locations`);
    const loansColl = mongoose.connection.collection('loans');
    const locationsColl = mongoose.connection.collection('companylocations');

    if (!dryRun) {
      const loanResult = await loansColl.deleteMany({ company: new mongoose.Types.ObjectId(companyId) });
      console.log('Deleted loans:', loanResult.deletedCount);

      const txResult = await transactions.deleteMany({ company: new mongoose.Types.ObjectId(companyId) });
      console.log('Deleted transactions:', txResult.deletedCount);

      const locResult = await locationsColl.deleteMany({ company: new mongoose.Types.ObjectId(companyId) });
      console.log('Deleted locations:', locResult.deletedCount);

      const companyResult = await companies.deleteOne({ _id: new mongoose.Types.ObjectId(companyId) });
      console.log('Deleted companies:', companyResult.deletedCount);
    } else {
      console.log('Dry run: would delete loans/transactions/locations and company with id:', companyId);
    }
  }

  // Optional: delete all user accounts and all related player data (companies, transactions, loans, creditScores, employees)
  // Usage: node scripts/cleanup-financials.js --deleteAllUsers --confirm [--dryRun]
  const deleteAllUsers = args.includes('--deleteAllUsers');
  if (deleteAllUsers) {
    if (!confirm) {
      console.error('To delete ALL users pass --confirm — this operation is destructive.');
      process.exit(1);
    }

    const usersColl = mongoose.connection.collection('users');
    const loansColl = mongoose.connection.collection('loans');
    const creditScoresColl = mongoose.connection.collection('creditScores');
    const employeesColl = mongoose.connection.collection('employees');

    const userCount = await usersColl.countDocuments();
    console.log(`Found ${userCount} user(s)`);

    if (dryRun) {
      console.log('Dry run: would delete users and related collections: companies, transactions, loans, creditScores, employees');
    } else {
      // Backup users to disk before deleting (exclude password for safety)
      const backupsDir = './backups';
      try {
        const fs = require('fs');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const users = await usersColl.find({}, { projection: { password: 0 } }).toArray();
        const fname = `${backupsDir}/users-backup-${Date.now()}.json`;
        fs.writeFileSync(fname, JSON.stringify({ users }, null, 2));
        console.log(`Backed up ${users.length} user(s) to ${fname}`);
      } catch (e) {
        console.warn('Warning: failed to write users backup:', e);
      }

      // Delete player-kept data
      const compResult = await companies.deleteMany({});
      console.log('Deleted companies:', compResult.deletedCount);

      const txResultAll = await transactions.deleteMany({});
      console.log('Deleted transactions:', txResultAll.deletedCount);

      const loanResultAll = await loansColl.deleteMany({});
      console.log('Deleted loans:', loanResultAll.deletedCount);

      const csResult = await creditScoresColl.deleteMany({});
      console.log('Deleted creditScores:', csResult.deletedCount);

      const empResult = await employeesColl.deleteMany({});
      console.log('Deleted employees:', empResult.deletedCount);

      const userResult = await usersColl.deleteMany({});
      console.log('Deleted users:', userResult.deletedCount);
    }
  }

  await mongoose.disconnect();
  console.log('Cleanup complete');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
