#!/usr/bin/env node
/**
 * scripts/create-media-company.js
 *
 * Quick script to create a Media company for testing
 * Usage: node scripts/create-media-company.js <userId>
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const args = process.argv.slice(2);
  const userId = args[0];

  if (!userId) {
    console.error('Usage: node scripts/create-media-company.js <userId>');
    console.error('Get userId from MongoDB users collection');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const companies = mongoose.connection.collection('companies');
  const transactions = mongoose.connection.collection('transactions');
  const users = mongoose.connection.collection('users');

  // Verify user exists
  const user = await users.findOne({ _id: new mongoose.Types.ObjectId(userId) });
  if (!user) {
    console.error('User not found');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Creating Media company for user: ${user.email}`);

  // Create Media company
  const company = {
    _id: new mongoose.Types.ObjectId(),
    name: 'StreamVision Media',
    industry: 'Media',
    owner: new mongoose.Types.ObjectId(userId),
    cash: 100000,
    level: 1,
    experience: 0,
    reputation: 50,
    netWorth: 100000,
    employees: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await companies.insertOne(company);
  console.log('✅ Media company created:', company._id.toString());

  // Create seed transaction
  const seedTx = {
    type: 'investment',
    amount: 100000,
    description: 'Initial seed capital',
    company: company._id,
    metadata: { source: 'system' },
    createdAt: new Date(),
  };

  await transactions.insertOne(seedTx);
  console.log('✅ Seed transaction created');

  await mongoose.disconnect();
  console.log('\n🎉 Media company ready! Navigate to /media in the game.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
