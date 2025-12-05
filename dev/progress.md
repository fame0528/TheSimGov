# 🚧 In Progress Features

**Last Updated:** 2025-12-05  
**Session Status:** ✅ Session Closed — User Model Consolidation Complete  
**ECHO Version:** v1.4.0 (OPTIMIZED Release)

This file tracks features currently being implemented. Features move here from `planned.md` when work begins, and move to `completed.md` when finished.

---

## 📊 Current Focus

**Active Work:** None — Session properly closed  
**Last Completed:** User Model Consolidation (PlayerStash → User.crime)  
**TypeScript:** 0 errors ✅

---

## ✅ Session 2025-12-05 Complete

### User Model Consolidation (PlayerStash Removal)

**Completed Tasks:**
- ✅ Consolidated all crime data into `User.crime` subdocument
- ✅ Unified `User.cash` as single source of truth for money
- ✅ Added `User.bankBalance` for safe deposits
- ✅ Rewrote `stash/route.ts` to use User.crime
- ✅ Rewrote `buy-sell/route.ts` to use User.crime  
- ✅ Rewrote `travel/route.ts` to use User.crime
- ✅ Deleted `PlayerStash.ts` model file
- ✅ Fixed TravelEncounterType to use correct snake_case values
- ✅ Fixed useCrimeTrading hook (playerId → id)
- ✅ TypeScript: 0 errors

### Current Data Architecture

```
User {
  cash: number           // Unified cash (default 5000)
  bankBalance: number    // Safe money (bank deposits)
  state: StateCode       // Current US state
  
  crime: {               // Embedded subdocument
    currentCity, heat, reputation, carryCapacity,
    inventory, level, experience, unlockedSubstances,
    totalProfit, totalDeals, successfulDeals,
    timesArrested, timesMugged, lastActiveAt
  }
}
```

---

## 🎯 Next Session

1. Phase 11.2: Production Foundation
2. Bank deposit/withdraw API with fees (player-owned banks revenue)
3. Continue Crime MMO implementation