/**
 * @file lib/db/mongodb.ts
 * @description MongoDB connection alias for backward compatibility
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Re-exports connectDB from src/lib/db/mongoose for compatibility.
 * Provides dbConnect as default export matching expected import pattern.
 * 
 * USAGE:
 * ```typescript
 * import dbConnect from '@/lib/db/mongodb';
 * await dbConnect();
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Alias to src/lib/db/mongoose connectDB
 * - Maintains backward compatibility with existing imports
 * - No additional logic - pure re-export
 */

import { connectDB } from '@/lib/db/mongoose';

/**
 * Default export for MongoDB connection
 * Alias to connectDB from mongoose utility
 */
export default connectDB;

/**
 * Named export for consistency
 */
export { connectDB as dbConnect };
