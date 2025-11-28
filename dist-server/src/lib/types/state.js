"use strict";
/**
 * @fileoverview State Perk System Type Definitions
 * @module lib/types/state
 *
 * OVERVIEW:
 * Complete type definitions for state economic perk system.
 * StatePerkData interface includes legacy data (GDP, crime, population)
 * plus new economic metrics (tax burden, unemployment, sales tax) and
 * calculated gameplay perks (profit bonuses, hiring modifiers, industry bonuses).
 *
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Data Source**: Legacy project + Wikipedia (Nov 2023-2024 data)
 * 2. **Balance**: No universally "best" state - all have tradeoffs
 * 3. **Strategy**: Permanent state choice at registration creates commitment
 * 4. **Education**: Real economic data teaches players state differences
 * 5. **Performance**: Stored as TypeScript constants (not DB) for zero latency
 *
 * PREVENTS:
 * - Pay-to-win scenarios (all states accessible)
 * - Min-maxing (no optimal state for all playstyles)
 * - Analysis paralysis (clear tradeoffs per state)
 */
//# sourceMappingURL=state.js.map