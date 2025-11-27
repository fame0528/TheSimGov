/**
 * @file Order.ts
 * @description Bridge export for Order model (test import compatibility)
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Re-exports Order model from actual location to support @/models/ecommerce/* import pattern.
 */

import Order from '@/lib/db/models/Order';

export { Order };
