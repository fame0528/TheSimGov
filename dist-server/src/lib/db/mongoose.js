"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI environment variable');
}
let cached = global.mongoose || { conn: null, promise: null };
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
async function connectDB() {
    // Return cached connection if available
    if (cached.conn) {
        return cached.conn;
    }
    // If mongoose is already connected (e.g., in tests), cache and return it
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    if (mongoose_1.default.connection.readyState === 1 || mongoose_1.default.connection.readyState === 2) {
        // Wait for connection if currently connecting
        if (mongoose_1.default.connection.readyState === 2) {
            await new Promise((resolve) => {
                mongoose_1.default.connection.once('connected', resolve);
            });
        }
        cached.conn = mongoose_1.default;
        return mongoose_1.default;
    }
    // Return existing promise if connection is in progress
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 2,
            autoIndex: false,
        };
        // Reduce dev console noise
        mongoose_1.default.set('debug', false);
        cached.promise = mongoose_1.default.connect(MONGODB_URI, opts);
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (error) {
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
async function disconnectDB() {
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
//# sourceMappingURL=mongoose.js.map