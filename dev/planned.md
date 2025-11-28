# 📋 Planned Features

**Last Updated:** 2025-11-28  
**Single Source of Truth:** [MASTER_PLAN.md](./MASTER_PLAN.md)

---

## ⚠️ IMPORTANT

This file is now kept minimal. All planned work is documented in:

1. **[MASTER_PLAN.md](./MASTER_PLAN.md)** - Execution sequence and phase breakdown
2. **[dev/fids/](./fids/)** - Detailed FID specification files

### Why This Change?

Previously this file contained 2,195 lines of outdated specifications, including:
- FID-POL-005 (Legislative Bills) - **ALREADY COMPLETE** as Phase 10
- FID-20251125-001 specifications - **ALREADY COMPLETE** (Phases 0-8, 10)
- Old industry placeholder plans - **SUPERSEDED** by proper FIDs

The duplicated content caused confusion between what was planned vs. what was already done.

---

## 📊 Current Planned Work

### Active Implementation (See [progress.md](./progress.md))
- **FID-20251125-001C** - Political System (Phases 9, 11 remaining)

### Queued for Implementation (See [MASTER_PLAN.md](./MASTER_PLAN.md))

| Phase | FID | Description | Est. Real Hours |
|-------|-----|-------------|-----------------|
| 2 | FID-20251127-EMPLOYEES | Employee Management Foundation | 3-4h |
| 3 | FID-20251127-ENERGY | Energy Industry | 3-5h |
| 3 | FID-20251127-SOFTWARE | Software Industry | 6-8h |
| 3 | FID-20251127-ECOMMERCE | E-Commerce Industry | 5-7h |
| 4 | FID-20251127-EDTECH | EdTech Industry | 1-2h |
| 4 | FID-20251127-MEDIA | Media Industry | 3-5h |
| 5 | FID-20251127-MANUFACTURING | Manufacturing Industry | 1-2h |
| 5 | FID-20251127-CONSULTING | Consulting Industry | 1-2h |
| 6 | FID-20251127-POLITICS | Politics Expansion | 5-7h |
| 7 | FID-20251127-CRIME | Crime/Underworld Domain | 8-12h |

**Total Remaining:** ~40-55h real (with ECHO efficiency)

---

## 📁 FID Reference

Active Feature ID specifications in `dev/fids/` (11 files):

```
dev/fids/
├── FID-20251125-001C.md         ← Political System (IN PROGRESS - Phases 9, 11)
├── FID-20251127-EMPLOYEES.md    ← Employee foundation (Phase 2)
├── FID-20251127-ENERGY.md       ← Energy industry (Phase 3)
├── FID-20251127-SOFTWARE.md     ← Software industry (Phase 3)
├── FID-20251127-ECOMMERCE.md    ← E-Commerce industry (Phase 3)
├── FID-20251127-EDTECH.md       ← EdTech industry (Phase 4)
├── FID-20251127-MEDIA.md        ← Media industry (Phase 4)
├── FID-20251127-MANUFACTURING.md ← Manufacturing industry (Phase 5)
├── FID-20251127-CONSULTING.md   ← Consulting industry (Phase 5)
├── FID-20251127-POLITICS.md     ← Politics expansion (Phase 6)
├── FID-20251127-CRIME.md        ← Crime domain (Phase 7)
└── archives/                     ← 12 completed FIDs archived
```

---

## 🔄 How This File Updates

1. **New work identified?** → Create FID in `dev/fids/`, add to MASTER_PLAN.md
2. **Work starts?** → Move to progress.md (AUTO_UPDATE_PROGRESS)
3. **Work completes?** → Move to completed.md (AUTO_UPDATE_COMPLETED)

This keeps planned.md clean and prevents stale content accumulation.

---

*Last cleaned: 2025-11-28 (archived 2,195 lines of outdated content)*

