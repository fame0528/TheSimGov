/**
 * @fileoverview MongoDB Connection Manager
 * @module lib/db/mongoose
 * 
 * OVERVIEW:
 * Manages MongoDB connection with pooling, caching, and error handling.
 * Prevents connection leaks and ensures single connection in development.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to prevent multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * connectDB - Connect to MongoDB with caching
 * 
 * Uses connection pooling and caching to prevent multiple connections.
 * Safe for serverless environments (Next.js API routes).
 * 
 * @example
 * ```ts
 * // In API route
 * import { connectDB } from '@/lib/db';
 * 
 * export async function GET() {
 *   await connectDB();
 *   const users = await User.find();
 *   return Response.json(users);
 * }
 * ```
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // If mongoose is already connected (e.g., in tests), cache and return it
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    // Wait for connection if currently connecting
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
    cached.conn = mongoose;
    return mongoose;
  }

  // Return existing promise if connection is in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      autoIndex: false,
    } as const;

    // Reduce dev console noise
    mongoose.set('debug', false);
    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * disconnectDB - Disconnect from MongoDB
 * 
 * Only needed for cleanup in tests or specific scenarios.
 * Not typically needed in serverless environments.
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Cached**: Single connection reused across requests
 * 2. **Safe**: Prevents connection leaks in serverless
 * 3. **Pooling**: Configurable connection pool size
 * 4. **Error Handling**: Clears promise on connection failure
 * 
 * PREVENTS:
 * - Multiple database connections
 * - Connection exhaustion
 * - Memory leaks from unclosed connections
 */
