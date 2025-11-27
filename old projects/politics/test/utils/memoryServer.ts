/**
 * @file test/utils/memoryServer.ts
 * @description Test-only helper to isolate mongodb-memory-server import
 * @created 2025-11-16
 * 
 * OVERVIEW:
 * Isolates the mongodb-memory-server dynamic import so it's never visible
 * to Next.js dev/build tooling (Turbopack/Webpack). This prevents version
 * mismatch warnings between the app's mongodb@6.x and memory-server's mongodb@4.x.
 * Only imported by test/utils/db.ts when TEST_MONGODB_MEMORY=true.
 */

export async function getMongoMemoryServer() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  return MongoMemoryServer;
}
