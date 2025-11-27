# 📋 Planned Features

**Auto-maintained by ECHO v1.0.0 Auto-Audit System**

---


## [FID-20251113-002] Sprint 2: Archetype System & Onboarding
**Status:** PLANNED **Priority:** HIGH **Complexity:** 3
**Created:** 2025-11-13 **Estimated:** 60h

**Description:** Player archetype selection (Innovator, Ruthless Tycoon, Ethical Builder), local government assignment based on state, and guided onboarding flow.

**Acceptance:**
- ✅ Users select archetype during registration
- ✅ System assigns county/city based on state selection
- ✅ Onboarding flow guides users through setup
- ✅ Dashboard shows user info and archetype
- ✅ Database stores archetype and local government data

**Approach:**
1. Extend User schema with archetype and localGovernment fields
2. Create archetype selection UI with descriptions
3. Build local government assignment algorithm (county/city lookup by state)
4. Implement multi-step onboarding wizard
5. Create player dashboard with profile information
6. Build user profile edit page

**Files:**
- [MOD] `lib/db/models/User.ts` - Add archetype, localGovernment fields
- [NEW] `lib/utils/government.ts` - County/city assignment logic
- [NEW] `app/(game)/onboarding/page.tsx` - Onboarding wizard
- [NEW] `app/(game)/dashboard/page.tsx` - Player dashboard
- [NEW] `app/(game)/profile/page.tsx` - User profile
- [NEW] `components/onboarding/ArchetypeSelection.tsx` - Archetype picker
- [NEW] `components/dashboard/PlayerStats.tsx` - Dashboard stats

**Dependencies:** FID-20251113-001

---

## [FID-20251113-003] Sprint 3: Company Creation System
**Status:** PLANNED **Priority:** CRITICAL **Complexity:** 4
**Created:** 2025-11-13 **Estimated:** 70h

**Description:** Company creation mechanics with industry selection, seed capital or loan system, and company dashboard with financial tracking.

**Acceptance:**
- ✅ Users can create one company
- ✅ Company has name, industry, mission, logo
- ✅ Users choose seed capital ($10k-$50k) or loan ($100k, 5% interest)
- ✅ Credit score starts at 650
- ✅ All transactions logged to Transaction collection
- ✅ Dashboard displays company financials

**Approach:**
1. Create Company Mongoose schema
2. Create Transaction Mongoose schema for financial logging
3. Build company creation form (name, industry, mission, logo upload)
4. Implement 6 industry options (Construction, Real Estate, Crypto, Stocks, Retail, Banking)
5. Create seed capital vs. loan decision flow
6. Initialize credit score system
7. Build company dashboard with financial stats
8. Implement transaction logging for all financial operations

**Files:**
- [NEW] `lib/db/models/Company.ts` - Company schema
- [NEW] `lib/db/models/Transaction.ts` - Transaction logging schema
- [NEW] `app/api/companies/route.ts` - Company CRUD API
- [NEW] `app/(game)/companies/new/page.tsx` - Company creation page
- [NEW] `app/(game)/companies/[id]/page.tsx` - Company dashboard
- [NEW] `components/companies/CreateCompanyForm.tsx` - Creation form
- [NEW] `components/companies/CompanyStats.tsx` - Financial dashboard
- [NEW] `components/companies/IndustrySelector.tsx` - Industry picker
- [NEW] `lib/utils/finance.ts` - Financial calculation helpers

**Dependencies:** FID-20251113-002

---

## [FID-20251113-004] Sprint 4: NPC Employee System
**Status:** PLANNED **Priority:** HIGH **Complexity:** 4
**Created:** 2025-11-13 **Estimated:** 70h

**Description:** NPC employee generation with stats (skill, loyalty, salary, morale), hire/fire mechanics, and employee management interface.

**Acceptance:**
- ✅ Users can browse and hire NPC employees
- ✅ Employees have skill (1-10), loyalty (1-10), salary (market-based)
- ✅ Hiring deducts salary from company cash
- ✅ Firing applies severance costs and morale penalties
- ✅ Employee list displays all company employees
- ✅ Stats update in real-time

**Approach:**
1. Create Employee Mongoose schema
2. Build NPC employee generator (randomized stats, market-based salaries)
3. Create employee marketplace/hiring interface
4. Implement hire mechanics (salary deduction, contract creation)
5. Implement fire mechanics (severance calculation, morale impact)
6. Build employee list view (sortable, filterable)
7. Create employee stat tooltips and explanations
8. Implement salary negotiation system

**Files:**
- [NEW] `lib/db/models/Employee.ts` - Employee schema
- [NEW] `lib/utils/npc.ts` - NPC generation logic
- [NEW] `app/api/employees/route.ts` - Employee API
- [NEW] `app/api/employees/hire/route.ts` - Hire endpoint
- [NEW] `app/api/employees/fire/route.ts` - Fire endpoint
- [NEW] `app/(game)/companies/[id]/employees/page.tsx` - Employee list
- [NEW] `components/employees/EmployeeCard.tsx` - Employee display
- [NEW] `components/employees/HireModal.tsx` - Hire dialog
- [NEW] `components/employees/EmployeeStats.tsx` - Stat display

**Dependencies:** FID-20251113-003

---

## [FID-20251113-005] Sprint 5: Basic Contracts & Tutorial Events
**Status:** PLANNED **Priority:** HIGH **Complexity:** 3
**Created:** 2025-11-13 **Estimated:** 60h

**Description:** Tutorial contract system for new companies, simple reputation tracking, event notification system, and first archetype-influenced event.

**Acceptance:**
- ✅ New companies receive 3 tutorial contracts
- ✅ Users can complete contracts and receive payments
- ✅ Reputation changes based on contract choices
- ✅ Archetype influences event outcomes
- ✅ Notifications display contract completions and events
- ✅ Transaction history shows all financial activity

**Approach:**
1. Create Contract Mongoose schema
2. Create Event Mongoose schema
3. Build tutorial contract generator (3-5 simple contracts per new company)
4. Implement contract completion logic
5. Add reputation field to User schema (-100 to +100 scale)
6. Build event notification system (toast/modal UI)
7. Create first archetype-influenced event with branching outcomes
8. Build transaction history page

**Files:**
- [NEW] `lib/db/models/Contract.ts` - Contract schema
- [NEW] `lib/db/models/Event.ts` - Event schema
- [MOD] `lib/db/models/User.ts` - Add reputation field
- [NEW] `lib/utils/events.ts` - Event generation and handling
- [NEW] `app/api/contracts/route.ts` - Contract API
- [NEW] `app/api/contracts/[id]/complete/route.ts` - Completion endpoint
- [NEW] `app/(game)/companies/[id]/contracts/page.tsx` - Contracts list
- [NEW] `app/(game)/transactions/page.tsx` - Transaction history
- [NEW] `components/contracts/ContractCard.tsx` - Contract display
- [NEW] `components/events/EventModal.tsx` - Event notification
- [NEW] `components/common/NotificationToast.tsx` - Toast component

**Dependencies:** FID-20251113-004

---

## 🚀 **MASTER IMPLEMENTATION PLAN - 10 PHASES (650-870h)**

**Source:** dev/MASTER_IMPLEMENTATION_PLAN.md (2,070 lines)  
**Scope:** Complete business simulation system with 6 new industries  
**Time System:** Unified 168x acceleration (1 real hour = 1 game week)  
**Persistence:** Full world persistence (no resets ever)  
**Playstyles:** 5 options (Business Mogul, Pure Politician, Passive Investor, Power Broker, Corruption)

**Total Scope:**
- **Files:** ~120 new, ~50 modified (~35k-45k LOC)
- **Database:** 15 new collections
- **APIs:** ~80 endpoints
- **Components:** ~120 UI components
- **Estimated Time:** 650-870 hours (16-22 weeks at 40h/week)

---

### **PHASE 1: Employee System (40-60h)** - 🚀 IN PROGRESS

*Moved to dev/progress.md - FID-20251113-EMP*

---

### **PHASE 2: Contract System (40-60h)** - ✅ COMPLETED

*Moved to dev/completed.md - FID-20251113-CON (52h actual, 26 files, 8,500 LOC)*

---

### **PHASE 3: Department System (50-70h)** - 🚀 IN PROGRESS

*Moved to dev/progress.md - FID-20251113-DEPT (Started: 2025-11-13)*

---

### **PHASE 4A: Manufacturing Industry (40-60h)**

## [FID-20251113-MANU] Phase 4A: Manufacturing Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 4
**Created:** 2025-11-13 **Estimated:** 40-60h

**Description:** Complete manufacturing system with production lines, inventory, supply chain, quality control, automation upgrades, and B2B/B2C sales channels.

**Acceptance:**
- ✅ Production line system (configure products, set output rates)
- ✅ Inventory management (raw materials, finished goods, warehousing)
- ✅ Supply chain system (supplier relationships, lead times, bulk discounts)
- ✅ Quality control (defect rates, QA processes, reputation impact)
- ✅ Automation upgrades (reduce labor, increase efficiency)
- ✅ B2B contracts (sell to other companies/NPCs)
- ✅ B2C retail integration (sell to consumers)
- ✅ Manufacturing analytics (production efficiency, costs, margins)

**Approach:**
1. Create ProductionLine schema (products, capacity, efficiency)
2. Create Inventory schema (raw materials, finished goods, tracking)
3. Create Supplier schema (relationships, pricing, reliability)
4. Build production scheduling system
5. Implement quality control mechanics (skill-based defect rates)
6. Create automation upgrade system (tiers 1-5, costs, ROI)
7. Build B2B contract system (bulk orders)
8. Integrate B2C retail sales
9. Create manufacturing analytics dashboard

**Files:**
- [NEW] `lib/db/models/ProductionLine.ts`
- [NEW] `lib/db/models/Inventory.ts`
- [NEW] `lib/db/models/Supplier.ts`
- [NEW] `lib/utils/manufacturing/production.ts`
- [NEW] `lib/utils/manufacturing/qualityControl.ts`
- [NEW] `lib/utils/manufacturing/automation.ts`
- [NEW] `app/api/manufacturing/production/route.ts`
- [NEW] `app/api/manufacturing/inventory/route.ts`
- [NEW] `app/api/manufacturing/suppliers/route.ts`
- [NEW] `app/(game)/companies/[id]/manufacturing/production/page.tsx`
- [NEW] `app/(game)/companies/[id]/manufacturing/inventory/page.tsx`
- [NEW] `app/(game)/companies/[id]/manufacturing/analytics/page.tsx`
- Additional 10-15 components

**Dependencies:** FID-20251113-DEPT

---

### **PHASE 4B: E-Commerce Industry (50-70h)**

## [FID-20251113-ECOM] Phase 4B: E-Commerce Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 4
**Created:** 2025-11-13 **Estimated:** 50-70h

**Description:** Full e-commerce platform with product listings, marketplace, payment processing, fulfillment, customer reviews, SEO, and advertising integration.

**Acceptance:**
- ✅ Product catalog system (listings, variants, pricing)
- ✅ Marketplace integration (sell to players/NPCs)
- ✅ Payment processing (transaction fees, chargebacks)
- ✅ Fulfillment system (shipping, tracking, delivery times)
- ✅ Customer review system (ratings, reputation impact)
- ✅ SEO/advertising (traffic generation, conversion rates)
- ✅ Analytics (traffic, conversion, customer lifetime value)

**Approach:**
1. Create ProductListing schema
2. Create Order schema with fulfillment tracking
3. Create CustomerReview schema
4. Build product catalog management
5. Implement marketplace integration
6. Create fulfillment simulation (shipping times, costs)
7. Build review system with moderation
8. Implement advertising campaigns (PPC, display ads)
9. Create e-commerce analytics dashboard

**Files:** 22-28 files (similar structure to Manufacturing)

**Dependencies:** FID-20251113-DEPT

---

### **PHASE 4C: Healthcare Industry (60-80h)**

## [FID-20251113-HEALTH] Phase 4C: Healthcare Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 5
**Created:** 2025-11-13 **Estimated:** 60-80h

**Description:** Healthcare system with facilities (hospitals, clinics), patient care, staffing (doctors, nurses), insurance contracts, regulatory compliance, and quality metrics.

**Acceptance:**
- ✅ Facility management (hospitals, clinics, capacity)
- ✅ Patient care system (admissions, treatments, outcomes)
- ✅ Medical staff management (doctors, nurses, specialists)
- ✅ Insurance contracts (negotiate rates, process claims)
- ✅ Regulatory compliance (HIPAA-like, licensing, inspections)
- ✅ Quality metrics (patient outcomes, satisfaction, mortality rates)
- ✅ Emergency services (random events, surge capacity)

**Approach:**
1. Create HealthcareFacility schema
2. Create Patient schema with care tracking
3. Create InsuranceContract schema
4. Build patient admission/discharge system
5. Implement staffing requirements (ratios, shifts)
6. Create compliance tracking system
7. Build quality metrics dashboard
8. Implement emergency event system

**Files:** 25-30 files

**Dependencies:** FID-20251113-DEPT

---

### **PHASE 4D: Energy Industry (70-90h)**

## [FID-20251113-ENERGY] Phase 4D: Energy Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 5
**Created:** 2025-11-13 **Estimated:** 70-90h

**Description:** Energy sector with extraction (oil, gas), renewable energy (solar, wind), distribution networks, commodity trading, environmental regulations, and grid management.

**Acceptance:**
- ✅ Extraction operations (oil wells, gas fields, production rates)
- ✅ Renewable energy (solar farms, wind turbines, capacity factors)
- ✅ Distribution network (pipelines, transmission lines, capacity)
- ✅ Commodity trading (price volatility, futures contracts)
- ✅ Environmental compliance (emissions, permits, fines)
- ✅ Grid management (load balancing, blackout risks)

**Approach:**
1. Create EnergyFacility schema (extraction, renewable, distribution)
2. Create CommodityContract schema (futures, spot pricing)
3. Build extraction simulation (depletion curves, costs)
4. Implement renewable energy mechanics (weather-dependent)
5. Create commodity trading system
6. Build environmental compliance tracking
7. Implement grid management simulation

**Files:** 28-35 files

**Dependencies:** FID-20251113-DEPT

---

### **PHASE 4E: Media Industry (40-60h)**

## [FID-20251113-MEDIA] Phase 4E: Media Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 4
**Created:** 2025-11-13 **Estimated:** 40-60h

**Description:** Media empire with content creation, advertising revenue, audience engagement, influencer mechanics, streaming platforms, and political propaganda.

**Acceptance:**
- ✅ Content creation (articles, videos, podcasts, shows)
- ✅ Audience metrics (views, engagement, subscribers)
- ✅ Advertising revenue (CPM, sponsorships)
- ✅ Influencer system (hire influencers, brand deals)
- ✅ Political propaganda (bias content, election influence)
- ✅ Content moderation (legal risks, reputation impact)

**Approach:**
1. Create MediaContent schema
2. Create Audience schema with engagement tracking
3. Build content creation pipeline
4. Implement advertising revenue calculations
5. Create influencer partnership system
6. Build political propaganda mechanics
7. Implement content moderation system

**Files:** 18-24 files

**Dependencies:** FID-20251113-DEPT

---

### **PHASE 4F: Technology/AI Industry (60-80h)**

## [FID-20251113-TECH] Phase 4F: Technology/AI Industry System
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 5
**Created:** 2025-11-13 **Estimated:** 60-80h

**Description:** Tech company management with software development, AI research, SaaS products, cloud infrastructure, patent system, and tech startup ecosystem.

**Acceptance:**
- ✅ Software development (products, releases, bugs, patches)
- ✅ AI research (model training, breakthroughs, ethical concerns)
- ✅ SaaS products (subscriptions, churn rates, MRR)
- ✅ Cloud infrastructure (servers, scaling, uptime)
- ✅ Patent system (file patents, licensing, IP protection)
- ✅ Startup ecosystem (VC funding, acquisitions, IPOs)

**Approach:**
1. Create SoftwareProduct schema
2. Create AIResearch schema
3. Create Patent schema
4. Build software development lifecycle
5. Implement AI research progression
6. Create SaaS subscription system
7. Build patent filing/licensing mechanics
8. Implement VC funding and IPO system

**Files:** 30-40 files

**Dependencies:** FID-20251113-DEPT

---

*All Phase 4 industries (A-F) can be developed in parallel after Phase 3 completion. Total Phase 4 time: 260-350h if done sequentially, or 70-90h if done in parallel teams.*

---

**Implementation Notes:**
- All phases follow ECHO v1.0.0 AAA quality standards
- Complete file reading mandatory (line 1-EOF) before any edits
- TypeScript strict mode (0 errors at all times)
- Comprehensive documentation (file headers, JSDoc, inline comments)
- Test coverage for critical paths
- Auto-audit system maintains all tracking files
- Unified 168x time system (1 real hour = 1 game week)
- Persistent world architecture (no resets ever)
- Cross-industry synergies designed in
- NPC competition and market dynamics
- Multiple playstyle support (business/politics/passive/hybrid)

**Next Steps:**
User approval ("code" or "proceed") → Execute Phase 0 (Utilities) → Sequential phases 1-3 → Parallel/sequential Phase 4 industries
