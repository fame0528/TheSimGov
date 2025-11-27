/**
 * Database Connection Bridge
 * 
 * OVERVIEW:
 * Compatibility bridge for @/lib/db imports to maintain consistent import paths
 * across test files and application code. Re-exports mongodb connection utility.
 * 
 * Created: 2025-11-14
 * ECHO Phase: Test Infrastructure
 */

import connectDB from '@/lib/db/mongodb';

export default connectDB;
