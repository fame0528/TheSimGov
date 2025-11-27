import { startTestDB } from './db';

// Jest global setup
export default async function globalSetup() {
  if (process.env.TEST_MONGODB_MEMORY === 'true') {
    console.log('[jest-global-setup] Starting in-memory MongoDB...');
    await startTestDB();
  }
}
