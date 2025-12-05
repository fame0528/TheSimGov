# 🚧 In Progress Features

**Last Updated:** 2025-12-05  
**Session Status:** ✅ Session Closed — DB Init Script Complete  
**ECHO Version:** v1.4.0 (OPTIMIZED Release)

This file tracks features currently being implemented. Features move here from `planned.md` when work begins, and move to `completed.md` when finished.

---

## 📊 Current Focus

**Active Work:** None — Session properly closed  
**Last Completed:** Comprehensive DB Init Script + Schema Fixes  
**TypeScript:** 0 errors ✅

---

## ✅ Session 2025-12-05 Complete

### 1. Comprehensive DB Init Script (FID-20251205-007)

**Completed Tasks:**
- ✅ Created `scripts/initDB.ts` (536 LOC) - comprehensive DB scaffold
- ✅ Registered 106 Mongoose models for index creation
- ✅ Created 635 custom indexes across all collections
- ✅ Added StatePricing seed for all 51 states
- ✅ Added npm scripts: `db:init`, `db:init:qa`, `db:drop`, `db:seed`
- ✅ Fixed 3 schema index conflicts:
  - Business.ts: Removed duplicate `convertedFromFacilityId` index
  - Union.ts: Removed duplicate `slug` unique constraint
  - StudentEnrollment.ts: Fixed sparse + partialFilterExpression conflict
- ✅ Installed tsx for TypeScript script execution

### 2. User Model Consolidation (FID-20251205-006)

**Completed Tasks:**
- ✅ Consolidated all crime data into `User.crime` subdocument
- ✅ Unified `User.cash` as single source of truth for money
- ✅ Added `User.bankBalance` for safe deposits
- ✅ Rewrote stash, buy-sell, travel routes
- ✅ Deleted `PlayerStash.ts` model file
- ✅ TypeScript: 0 errors

### Current DB Architecture

```
106 Collections | 635 Indexes | 51 StatePricing Records

npm run db:init      # Full reset with seed data
npm run db:init:qa   # Full reset with QA test data
npm run db:drop      # Drop only
npm run db:seed      # Seed only
```

---

## 🎯 Next Session

1. Phase 11.2: Production Foundation
2. Bank deposit/withdraw API with fees (player-owned banks revenue)
3. Continue Crime MMO implementation