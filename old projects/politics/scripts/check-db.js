#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  
  await mongoose.connect(uri);
  
  console.log('Connected to database:', mongoose.connection.db.databaseName);
  
  const adminDb = mongoose.connection.db.admin();
  const { databases } = await adminDb.listDatabases();
  
  console.log('\n=== ALL DATABASES ===');
  databases.forEach(db => {
    console.log(`${db.name}: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
  });
  
  // Check current database collections
  console.log('\n=== CURRENT DB COLLECTIONS ===');
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Database:', mongoose.connection.db.databaseName);
  for (const coll of collections) {
    const count = await mongoose.connection.db.collection(coll.name).countDocuments();
    console.log(`  ${coll.name}: ${count} documents`);
  }
  
  // Show users
  console.log('\n=== USERS ===');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  users.forEach(u => console.log(`  ID: ${u._id}, Email: ${u.email}`));
  
  // Show companies
  console.log('\n=== COMPANIES ===');
  const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
  companies.forEach(c => console.log(`  ID: ${c._id}, Name: ${c.name}, Industry: ${c.industry}, Cash: $${c.cash}`));
  
  await mongoose.disconnect();
}

main().catch(console.error);
