#  Planned Features

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**Updated:** 2025-11-15 (Post-Foundation Clean Slate)  
**ECHO Version:** v1.0.0

---

## 🎯 STATUS: ALL INDUSTRIES READY FOR NEXT PHASE

**COMPLETED SYSTEMS (✅ 100%):**
- ✅ Company Level System (5 levels, 70 configurations) — **BANK-001, LEVEL-001-004, Politics-006**
- ✅ Banking System (NPC banks with credit scoring) — **BANK-001**
- ✅ Politics Integration (L3-5 political power) — **Politics-006, LEVEL-004**
- ✅ Technology/AI Industry Backend (Phases 1-5.2) — **AI-001 through AI-P5.2**
- ✅ Department System (Budget, Projects, Loans, Campaigns) — **DEPT**
- ✅ AGI Development System (12 milestones, alignment challenges) — **AI-P5.1**
- ✅ Industry Dominance & Global Impact (market analysis, monopoly detection) — **AI-P5.2**
- ✅ Manufacturing Industry (Phase 4A) — **MFG-P4**
- ✅ E-Commerce Industry (Phase 4B: Models, APIs, UI) — **ECOM-001**
- ✅ Technology/Software Industry (Phase 4F: 13 models, 44 APIs, 12 UI) — **TECH-001**
- ✅ Media Industry (3 batches: Backend, UI, Dashboard) — **MEDIA-001-003**
- ✅ Energy Industry (Phase 4D: 3 batches, 41 endpoints, 8 components) — **ENERGY-001**
- ✅ All supporting systems (employees, contracts, manufacturing, notifications)

**ACTIVE WORK:**
- None (moved to progress.md)

**NEXT PHASE:**
See progress.md for active work

**COMPLETED SPEC REFERENCES:**
Archived comprehensive planning documents:
- dev/archives/specs/COMPANY_LEVEL_SYSTEM_SPEC.md (1,423 lines)
- dev/archives/specs/BANKING_SYSTEM_SPEC.md (811 lines)
- dev/archives/specs/POLITICS_BUSINESS_INTEGRATION.md (608 lines)

---

## FID Index — Active Planning

### [FID-20251119-MEGA-001] Healthcare Industry + Polish Features (Mega-Batch)
**Status:** PLANNED **Priority:** HIGH **Complexity:** 5/5
**Created:** 2025-11-19 **Estimated:** 25-35h

**Description:**
Complete the final industry (Healthcare) achieving 100% industry coverage (6/6), then implement core polish features (Tutorial/Onboarding + Achievements) to enhance player experience. This mega-batch leverages maximum code reuse from 5 completed industries and delivers a production-ready, polished game experience.

**Part 1: Healthcare Industry**
- 7 Mongoose models (Hospital, MedicalStaff, Patient, InsuranceContract, Treatment, Compliance, EmergencyService) ~2,500-3,000 LOC
- 40 REST API endpoints (facilities, staff, patients, insurance, treatments, compliance, emergency, analytics) ~6,500-8,000 LOC
- 10 React UI components (facility management, patient care, staff, insurance, compliance, emergency, quality, scheduler, analytics, intake) ~4,500-5,500 LOC
- Main Healthcare dashboard with 10-tab integration ~400-500 LOC
- **Total Healthcare:** ~26 files, ~14,000-17,000 LOC

**Part 2: Tutorial/Onboarding System**
- Tutorial state tracking (model + API) ~500 LOC
- 4 tutorial components (overlay, highlight, tooltip, provider) ~1,450 LOC
- 8 tutorial steps (welcome → completion with reward)
- Step configuration and progression logic ~500 LOC
- **Total Tutorial:** ~7 files, ~2,450 LOC

**Part 3: Achievement System**
- Achievement database (2 models: Achievement, UserAchievement) ~450 LOC
- Achievement API (list, progress, unlock, claim) ~400 LOC
- 30-50 achievement definitions (business, industry, financial, progression, special) ~1,200 LOC
- 5 UI components (list, card, modal, notification, showcase) ~1,700 LOC
- Real-time tracking service ~600 LOC
- **Total Achievements:** ~10 files, ~4,350 LOC

**Acceptance Criteria:**
- ✅ Healthcare: All 7 models, 40 endpoints, 10 UI components, main dashboard functional
- ✅ Tutorial: 8-step flow, progress tracking, skip/resume, tooltips, persistence
- ✅ Achievements: 30-50 defined, tracking system, unlock notifications, showcase UI
- ✅ TypeScript strict mode (76 baseline maintained, 0 new production errors)
- ✅ AAA quality standards (complete implementations, comprehensive docs)
- ✅ 100% backend coverage (Enhanced Preflight Matrix for Healthcare)
- ✅ Navigation integration (Healthcare page, Achievements page)

**Approach:**
**Batch 1:** Healthcare Backend (models + APIs) — 5-7h
**Batch 2:** Healthcare UI Components — 6-8h
**Batch 3:** Healthcare Dashboard Integration — 3-4h
**Batch 4:** Tutorial/Onboarding System — 6-8h
**Batch 5:** Achievement System — 5-7h
**Batch 6:** Integration & Polish — 4-5h

**Files:**
- [NEW] 7 Healthcare models (~2,500-3,000 LOC)
- [NEW] 8 Healthcare API route files, 40 endpoints (~6,500-8,000 LOC)
- [NEW] 10 Healthcare UI components (~4,500-5,500 LOC)
- [NEW] 1 Healthcare dashboard page (~400-500 LOC)
- [NEW] 1 Tutorial model + 1 API route (~500 LOC)
- [NEW] 4 Tutorial components (~1,450 LOC)
- [NEW] 1 Tutorial config (~500 LOC)
- [NEW] 2 Achievement models + 1 API route (~850 LOC)
- [NEW] 1 Achievement definitions file (~1,200 LOC)
- [NEW] 5 Achievement UI components (~1,700 LOC)
- [NEW] 1 Achievement tracker service (~600 LOC)
- [MOD] 5-10 files (navigation, dashboard, integration)
- **Total:** ~45 new files, ~21,000-24,000 LOC, 5-10 modified

**Dependencies:**
- ✅ Manufacturing (facility management patterns)
- ✅ E-Commerce (analytics, customer tracking)
- ✅ Technology (service delivery patterns)
- ✅ Media (multi-step wizards)
- ✅ Energy (compliance, emergency response)
- ✅ Employee System (medical staff)
- ✅ Contract System (insurance contracts)

**Enables:**
- 🎯 100% industry coverage (6/6 complete)
- 🎯 Production-ready player experience
- 🎯 Complete onboarding flow
- 🎯 Player engagement through achievements
- 🎯 Full game feature set ready for launch

**Code Reuse:** 75-85% overall (Healthcare facility ~75%, UI components ~80%, Tutorial ~40% new, Achievements ~30% new)

**Time Savings:** ~85% (Traditional 145-175h → With reuse 25-35h, saves 120-140h)

---

**Acceptance Criteria:**
- Main Media dashboard page integrating all 4 components
- Test influencer hiring workflow (browse → filter → hire → track)
- Test sponsorship management workflow (create → deliverables → payment)
- Test ad campaign workflow (create → target → budget → launch)
- Test monetization workflow (configure CPM → select strategy → view analytics)
- API integration verification (all 10 endpoints functional)
- Manual testing documentation (workflows, edge cases, validation)
- Fix any integration issues discovered during testing
- TypeScript strict mode passing (115 baseline maintained)

**Approach:**

**Phase 1 - Main Dashboard Page (~1h):**
- Create `app/(game)/media/page.tsx` (~300-400 lines)
- Server-side Next.js page with authentication
- Tab-based layout integrating 4 components:
  - Tab 1: Influencer Marketplace (browse/hire)
  - Tab 2: Sponsorship Dashboard (manage deals)
  - Tab 3: Ad Campaigns (campaign builder)
  - Tab 4: Monetization Settings (revenue optimization)
- Quick stats overview (total influencers, active sponsorships, campaign spend, revenue)
- Navigation between tabs with state persistence
- Responsive design (mobile/tablet/desktop)

**Phase 2 - Integration Testing (~1h):**
- Test influencer workflow:
  - Browse influencers with filters
  - Hire influencer through 3-step wizard
  - Verify deal creation via API
  - Check database entry created
- Test sponsorship workflow:
  - View active/completed sponsorships
  - Track deliverable progress
  - Verify payment calculations
- Test ad campaign workflow:
  - Select platforms and targeting
  - Configure budget and bidding
  - Verify ROAS calculator accuracy
- Test monetization workflow:
  - Configure CPM multipliers
  - Select strategy
  - Verify analytics display
- API endpoint verification (all 10 working)

**Phase 3 - Documentation & Fixes (~0.5-1h):**
- Document manual testing workflows
- Create testing checklist (workflows, edge cases, validation)
- Fix any integration issues discovered
- Document known limitations/future enhancements
- Update completion report

**Files:**
- [NEW] `app/(game)/media/page.tsx` (~300-400 lines) - Main Media dashboard
- [NEW] `docs/MEDIA_TESTING_WORKFLOW.md` (~200-300 lines) - Testing documentation
- [MOD] Any component fixes if issues discovered during testing

**Dependencies:** 
- FID-20251117-MEDIA-002 (Batch 2 UI) ✅ COMPLETE
- Media Backend (4 models, 10 APIs) ✅ COMPLETE

**Blocks:** None

**Enables:** Complete Media Industry gameplay loop, production-ready Media company features

---

**Current Work:** See progress.md for active work

---

## Industry Expansion Planning

**Active Design Documents:**
- **AI Industry**: dev/ai-industry-design.md (683 lines) — Phases 4-5 pending (AI Research Lab, AGI Company)
- **Utilities**: dev/planned-utilities.md (571 lines) — Partially implemented, remaining helper functions pending

**Next Recommended Phase:**
See dev/roadmap.md Section 4 for complete industry expansion options:
- Phase 4B: E-Commerce Industry (5 subcategories)
- Phase 4C: Healthcare Industry (7 subcategories)
- Phase 4D: Energy Industry (4 subcategories)
- Phase 4E: Media & Entertainment (6 subcategories)
- Phase 4F: Technology/Software (5 subcategories)

**Completed FID Archives:**
- dev/archives/fids/completed/ contains 6 completed planning docs:
  - AI-001 (AI Research & Training) ✅
  - AI-002 (AI Real Estate & Data Centers) ✅
  - AI-003 (AI Software & Hardware Subcategories) ✅
  - BANK-001 (NPC Banking System Foundation) ✅
  - LEVEL-001 (Company Level System Database Foundation) ✅
  - LEVEL-003 (Level Progression Mechanics) ✅

---



**Auto-maintained by ECHO v1.0.0 Auto-Audit System**
