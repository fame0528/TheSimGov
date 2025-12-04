# 📋 Planned Features

**Last Updated:** 2025-12-05  
**Single Source of Truth:** [MASTER_PLAN.md](./MASTER_PLAN.md)  
**Session Status:** ✅ Properly closed - all work current

---

## ⚠️ IMPORTANT

This file is now kept minimal. All planned work is documented in:

1. **[MASTER_PLAN.md](./MASTER_PLAN.md)** - Execution sequence and phase breakdown
2. **[dev/fids/](./fids/)** - Detailed FID specification files

---

## 📊 Current Planned Work

### ✅ Recently Completed (moved to completed.md)
- **FID-20251203-002** - Political System Expansion (100% complete) ✅
- **FID-20251204-AUDIT** - Game Production Readiness Audit ✅
- **FID-20251205-001** - Manufacturing/Consulting/Crime Dashboard Wiring ✅
- **FID-20251205-002** - Healthcare/Media/Banking Dashboard Wiring ✅
- **FID-20251205-003** - ECHO Compliance Phase 2A (Type Safety) ✅

### Queued for Implementation (See [MASTER_PLAN.md](./MASTER_PLAN.md))

| Phase | FID | Description | Status |
|-------|-----|-------------|--------|
| 6 | FID-20251127-POLITICS | Politics Expansion | ✅ COMPLETE |
| 7 | FID-20251127-CRIME | Crime/Underworld Domain | ✅ COMPLETE |
| 8 | FID-20251201-001 | Crime P1 Backlog | ✅ COMPLETE |
| 9 | FID-20251201-002 | ECHO Compliance Phase 1 | ✅ COMPLETE |
| 10 | FID-20251203-001 | Player Profile Page | ✅ COMPLETE |
| 11 | FID-20251203-002 | Political System Expansion | ✅ COMPLETE |
| 12 | FID-20251204-AUDIT | Game Production Readiness Audit | ✅ COMPLETE |
| 13 | FID-20251205-003 | ECHO Compliance Phase 2A | ✅ COMPLETE |
| -- | **Next Session** | Select from candidates below | **PLANNED** |

---

## 📋 Candidate FIDs for Next Session

### FID-20251205-004 — ECHO Compliance Phase 2B (Energy Domain)
**Status:** PLANNED **Priority:** P2 **Complexity:** 4 **Estimated:** 3-4h

**Description:** Remove ~75 `as any` type assertions from Energy domain API routes. Requires updating Mongoose model interfaces to include missing fields.

**Acceptance:**
- All `as any` removed from Energy API routes
- Energy model interfaces updated with proper field types
- TypeScript: 0 errors
- Tests remain green

**Targets:**
- `src/app/api/energy/forecasting/demand/route.ts`
- `src/app/api/energy/forecasting/generation/route.ts`
- `src/app/api/energy/analytics/generation/route.ts`
- `src/app/api/energy/analytics/performance/route.ts`
- `src/app/api/energy/reserves/route.ts`
- `src/app/api/energy/subsidies/route.ts`
- `src/app/api/energy/storage/[id]/charge/route.ts`
- `src/app/api/energy/storage/[id]/discharge/route.ts`
- `src/app/api/energy/compliance/emissions/route.ts`
- Energy model interface updates

---

## 📁 FID Reference

Active Feature ID specifications in `dev/fids/`:

```
dev/fids/
├── FID-20251203-002.md          ← Political System Expansion ✅ COMPLETE
├── FID-20251203-001.md          ← Player Profile Page ✅ COMPLETE
├── FID-20251202-001.md          ← Main Page Fixes ✅ COMPLETE
├── FID-20251201-002.md          ← ECHO Compliance Phase 1 ✅ COMPLETE
├── FID-20251201-001.md          ← Crime P1 Backlog ✅ COMPLETE
├── FID-20251127-CRIME.md        ← Crime Domain ✅ COMPLETE
└── archives/                     ← Older completed FIDs
```

---

## 📊 Project Status

| Metric | Value |
|--------|-------|
| **FIDs Complete** | 15/15 (100%) |
| **TypeScript** | 0 errors ✅ |
| **ECHO** | v1.4.0 (OPTIMIZED Release) |
| **Session** | Properly closed |

---

## 🔄 How This File Updates

1. **New work identified?** → Create FID in `dev/fids/`, add to MASTER_PLAN.md
2. **Work starts?** → Move to progress.md (AUTO_UPDATE_PROGRESS)
3. **Work completes?** → Move to completed.md (AUTO_UPDATE_COMPLETED)

This keeps planned.md clean and prevents stale content accumulation.

---

*Auto-maintained by ECHO v1.4.0 with GUARDIAN PROTOCOL v2.1*

