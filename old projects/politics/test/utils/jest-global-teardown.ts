import { stopTestDB } from './db';

export default async function globalTeardown() {
  if (process.env.TEST_MONGODB_MEMORY === 'true') {
    console.log('[jest-global-teardown] Stopping in-memory MongoDB...');
    await stopTestDB();
  }
}
