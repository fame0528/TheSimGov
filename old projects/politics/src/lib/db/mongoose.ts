/**
 * @file src/lib/db/mongoose.ts
 * @description MongoDB connection utility with caching for Next.js
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Establishes and caches MongoDB connection using Mongoose.
 * Implements connection pooling and prevents multiple connections in development.
 * Uses global caching to reuse connections across hot reloads.
 * 
 * USAGE:
 * ```typescript
 * import { connectDB } from '@/lib/db/mongoose';
 * await connectDB(); // Returns cached or new connection
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Connection string from MONGODB_URI environment variable
 * - Global caching prevents connection leaks in dev mode
 * - Connection pooling configured for optimal performance
 * - Automatic reconnection on connection loss
 * - Strict query mode enabled for type safety
 */

import mongoose from 'mongoose';

// We read environment variables inside `connectDB` so tests that modify
// process.env (e.g., memory server) affect the connection resolution.

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  throw new Error('MONGODB_URI is required in production');
}

/**
 * Global type declaration for MongoDB connection caching
 * Prevents TypeScript errors with global namespace augmentation
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

/**
 * Initialize global mongoose cache
 * Allows connection reuse across hot reloads in development
 */
let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB with caching
 * 
 * @returns {Promise<typeof mongoose>} Mongoose instance
 * 
 * @description
 * - Returns cached connection if available
 * - Creates new connection with optimized settings
 * - Caches promise to prevent race conditions
 * 
 * @example
 * ```typescript
 * // In API route or server component
 * import { connectDB } from '@/lib/db/mongoose';
 * 
 * export async function GET() {
 *   await connectDB();
 *   const users = await User.find();
 *   return Response.json(users);
 * }
 * ```
 */
export async function connectDB(): Promise<typeof mongoose> {
  // If tests request an in-memory MongoDB, start it automatically so
  // callers don't need to manage starting the memory server.
  if (process.env.TEST_MONGODB_MEMORY === 'true' && !process.env.MONGODB_URI) {
    try {
      // Dynamic import the test helper to avoid requiring it in production
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dbHelper = await import('../../../test/utils/db');
      await dbHelper.startTestDB();
    } catch (err) {
      console.warn('[connectDB] Could not start test MongoDB memory server:', (err as Error)?.message ?? err);
    }
  }
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for immediate errors
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2, // Minimum connections to maintain
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      family: 4, // Use IPv4
    };

    // Read environment variables at call time (honors memory server setup)
    const PRIMARY_URI = process.env.MONGODB_URI || '';
    const FALLBACK_URI =
      process.env.MONGODB_LOCAL_URI || process.env.MONGODB_URI_FALLBACK || 'mongodb://127.0.0.1:27017/politics-dev';

    // Prefer primary URI when provided; allow dev-only fallback if it fails
    const tryConnect = async (uri: string) =>
      mongoose.connect(uri, opts).then((mongooseInstance) => {
        console.log(`✅ MongoDB connected: ${new URL(uri).host}`);
        return mongooseInstance;
      });

    if (PRIMARY_URI) {
      cached.promise = tryConnect(PRIMARY_URI).catch(async (err) => {
        console.error('❌ Primary MongoDB connection failed:', err?.message || err);
        // In non-production, attempt a local fallback to keep dev unblocked
        if (process.env.NODE_ENV !== 'production' && FALLBACK_URI && FALLBACK_URI !== PRIMARY_URI) {
          console.warn(`⚠️  Falling back to local MongoDB at ${FALLBACK_URI}`);
          return tryConnect(FALLBACK_URI);
        }
        throw err;
      });
    } else {
      // No primary provided (dev only). Attempt fallback directly.
      cached.promise = tryConnect(FALLBACK_URI);
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * 
 * @description
 * Closes all connections and clears cache.
 * Useful for cleanup in tests or graceful shutdown.
 * 
 * @example
 * ```typescript
 * import { disconnectDB } from '@/lib/db/mongoose';
 * 
 * // In test cleanup
 * afterAll(async () => {
 *   await disconnectDB();
 * });
 * ```
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ MongoDB disconnected');
  }
}

/**
 * Check if MongoDB is connected
 * 
 * @returns {boolean} True if connected, false otherwise
 * 
 * @example
 * ```typescript
 * import { isConnected } from '@/lib/db/mongoose';
 * 
 * if (!isConnected()) {
 *   await connectDB();
 * }
 * ```
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
