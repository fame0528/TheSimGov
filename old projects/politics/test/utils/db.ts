/*
 * Test DB helper
 *
 * Provides startTestDB, stopTestDB and clearTestDB helpers that can be used in
 * Jest integration test suites to run an in-memory MongoDB via mongodb-memory-server.
 *
 * Usage example in a test suite:
 *
 * import { startTestDB, stopTestDB, clearTestDB } from '../../../test/utils/db';
 *
 * beforeAll(async () => {
 *   await startTestDB();
 *   await connectDB(); // existing connect helper reads MONGODB_URI
 * });
 *
 * afterEach(async () => {
 *   await clearTestDB();
 * });
 *
 * afterAll(async () => {
 *   await stopTestDB();
 * });
 */

import mongoose from 'mongoose';
let mongod: any | null = null;

export async function startTestDB() {
  // Allow override via env var
  if (process.env.TEST_MONGODB_MEMORY !== 'true') return null;

  try {
    const { getMongoMemoryServer } = await import('./memoryServer');
    const MongoMemoryServer = await getMongoMemoryServer();
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    // Optionally ensure mongoose uses the correct uri
    return mongod;
  } catch (err) {
    // If memory server is not installed, warn and continue (CI may use a real DB URI)
    // eslint-disable-next-line no-console
    const error = err as { message?: unknown };
    console.warn('[test/db] mongodb-memory-server not available:', error.message ?? err);
    return null;
  }
}

export async function stopTestDB() {
  if (mongod) await mongod.stop();
  mongod = null;
  // Remove URI so tests don't accidentally connect later
  delete process.env.MONGODB_URI;
}

export async function clearTestDB() {
  // Remove documents from all collections
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    try {
      await mongoose.connection.collections[collectionName].deleteMany({});
    } catch (err) {
      // ignore errors when a collection disappears between tests
    }
  }
}
