# 🗺️ Product Roadmap

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**ECHO Version:** v1.0.0

---

## 🎯 Vision

Build a persistent multiplayer online game where players:
1. Start as entrepreneurs with minimal capital
2. Build and manage companies across multiple industries (6 industries + departments)
3. Compete in a shared multiplayer economy (never resets, full persistence)
4. Influence political systems to benefit their enterprises (unified 168x time system)
5. Become business magnates and political kingmakers (5 viable playstyles)

**Time System:** Unified 168x acceleration (1 real hour = 1 game week, 9-day political terms, 1-day campaigns)  
**Persistence Model:** Full world persistence - companies last forever, no resets ever, all progress permanent  
**Playstyle Options:**
- Business Mogul (companies only, no politics)
- Pure Politician (politics only, no business)
- Passive Investor (stocks/bonds/real estate, minimal management)
- Power Broker (business + politics synergy)
- Corruption Empire (high risk/reward)

---

## 🚀 **MASTER IMPLEMENTATION PLAN OVERVIEW**

**Source:** dev/MASTER_IMPLEMENTATION_PLAN.md (2,070 lines)  
**Total Scope:** 650-870 hours (16-22 weeks at 40h/week)  
**Files:** ~120 new, ~50 modified (~35k-45k LOC)  
**Database:** 15 new collections  
**APIs:** ~80 endpoints  
**Components:** ~120 UI components

**10 Phases:**
- Phase 0: Utilities (8-12h) - Wrapper functions for libraries
- Phase 1: Employee System (40-60h) - Training, retention, poaching, certifications
- Phase 2: Contract System (40-60h) - Bidding, auto-progression, quality scoring
- Phase 3: Department System (50-70h) - Finance, HR, Marketing, R&D
- Phase 4A: Manufacturing (40-60h) - Production, inventory, supply chain
- Phase 4B: E-Commerce (50-70h) - Marketplace, fulfillment, SEO
- Phase 4C: Healthcare (60-80h) - Facilities, patients, insurance, compliance
- Phase 4D: Energy (70-90h) - Extraction, renewables, commodity trading
- Phase 4E: Media (40-60h) - Content, advertising, influencer, propaganda
- Phase 4F: Technology/AI (60-80h) - Software, AI research, SaaS, patents

**Key Systems Added:**
- Employee training (6 types, skill caps, certifications)
- Employee poaching/retention mechanics
- Company reputation system (0-100)
- Loan/financing system (5 types, credit scoring)
- Cashflow management (projections, burn rate)
- Game event system (market crashes, booms, regulations)
- Cross-industry synergies (Tech+Any, Manufacturing+Retail, etc.)
- NPC company AI (3 personalities: Aggressive, Conservative, Balanced)
- Passive investment system (stocks 5-15%, bonds 2-5%, real estate 8-12%)
- Bankruptcy mechanics (insolvency triggers, liquidation, restart)

---

## 🚀 Phase 1: Foundation (MVP) - ✅ COMPLETED

**Goal:** Core authentication and basic company management

### Authentication System - ✅ COMPLETED
- ✅ User registration (email + password + first/last name)
- ✅ US state selection during registration (50 states)
- ✅ Local government assignment (county/city based on state)
- ⏳ **Player archetype selection** (Innovator, Ruthless Tycoon, Ethical Builder) - PLANNED
- ✅ Name validation (2-50 characters each)
- ✅ NextAuth.js integration
- ✅ Password hashing (bcrypt)
- ✅ Session management
- ✅ Protected routes middleware
- ⏳ **Tutorial/onboarding flow** (guide first company creation) - PLANNED

### Basic Company System - ✅ FOUNDATION COMPLETE
- ✅ Create company (name, industry selection, logo, mission statement)
- ✅ 12 industries implemented (Construction, Real Estate, Crypto, Stocks, Retail, Banking, Healthcare, Energy, Manufacturing, AI/Tech, E-Commerce, Media)
- ✅ Company dashboard (stats: cash, employees, revenue, expenses)
- ⏳ Hire/fire NPC employees (with skill, loyalty, salary stats) - PLANNED (Phase 1 of Master Plan)
- ⏳ Basic contracts/orders system - PLANNED (Phase 2 of Master Plan)
- ⏳ **Seed capital or loan system** (starting funds) - PLANNED (Phase 3 Finance Dept)
- ⏳ **Archetype-influenced events** (different outcomes based on player type) - PLANNED
- ⏳ **Simple reputation tracking** (ethical vs. ruthless scale) - PLANNED

### Database Setup - ✅ COMPLETED
- ✅ MongoDB connection
- ✅ User model (Mongoose schema)
- ✅ Company model (12 industries)
- ✅ Transaction model (audit trail)
- ⏳ Employee model - PLANNED (Phase 1)
- ⏳ Contract model - PLANNED (Phase 2)
- ⏳ Department models - PLANNED (Phase 3)

### UI/UX Foundation - ✅ COMPLETED
- ✅ Landing page
- ✅ Login/register pages
- ✅ Player dashboard
- ✅ Company management page
- ✅ Interactive USA map (state selection)
- ✅ Chakra UI theme configuration
- ✅ Responsive design (mobile-first)
- ✅ Modern glassmorphism UI
- ✅ Transaction history view

**Success Criteria:**
- ✅ Players can register with first/last name and state selection
- ✅ Players are assigned to local government (county/city)
- ✅ Players can create one company (12 industries available)
- ✅ Players can view company financials
- ⏳ Players can hire/fire employees - NEXT (Phase 1)
- ⏳ Players can complete contracts - NEXT (Phase 2)

**Status:** 70% complete (4/9 features done). Ready for Master Implementation Plan execution.

---

## 🚧 Phase 1.5: Company Level System + Banking — 🔥 CRITICAL

**Goal:** Establish core progression and capital systems before broad feature build-out.

### 1A: Banking System (12h)
- NPC Banking Foundation (credit scoring, loan types, approval algorithm)
- Loan Servicing & Collections (payments, late fees, defaults, foreclosure)
- Player-Owned Banking (Level 3+, license, lending policy, CAR ≥ 8%)
- Banking UI (applications, dashboards, comparisons)

### 1B: Company Level System (6h)
- 70 level configurations (14 industries × 5 levels); Tech split into AI/Software/Hardware
- XP progression with upgrade validation and history tracking
- Level UI/UX (progress bars, upgrade modal, badges)

### 1C: Technology Subcategories (10.5h)
- AI Research & Training system (projects, jobs, compute clusters, models)
- AI Real Estate & Data Centers (PUE, Tier certifications)
- Software & Hardware subcategory paths (SaaS + Manufacturing mechanics)

**Outcome:**
- Loans unlock realistic growth; levels gate advanced features (politics, M&A, IPO)
- AI path has true L1→L5 journey; Software/Hardware distinct paths
- All industries get clear, gated progression with scaled contracts and costs

**Status:** PLANNED — Highest priority. Executes before Phase 2.

---

## 🏗️ Phase 2: Business Expansion - 🎯 MASTER PLAN ACTIVE

**Goal:** Multi-industry gameplay and financial complexity (650-870h scope)

**Current Status:** Foundation complete (auth, companies, UI). Ready to execute 10-phase master plan starting with utilities, then employee system, contracts, departments, and 6 new industry systems.

### Phase 0: Utilities Setup (8-12h) - ✅ COMPLETE
- ✅ Currency utilities (format, convert, calculate)
- ✅ Random generation utilities (faker wrappers)
- ✅ Math utilities (precision calculations)
- ✅ ID generation utilities (UUID)
- ✅ Tooltip component (tippy.js)
- ✅ CurrencyDisplay component

### Phase 1: Employee System (40-60h) - ✅ COMPLETE
- ✅ 12 skill fields (technical, sales, leadership, etc.)
- ✅ 6 training program types
- ✅ Skill cap system (1-100 scale)
- ✅ Certification system
- ✅ Employee retention mechanics
- ✅ Poaching protection system
- ✅ Salary negotiation with market rates
- ✅ Performance review system
- ✅ Promotion/demotion mechanics

### Phase 2: Contract System (40-60h) - ✅ COMPLETE
- ✅ 5 contract types (Government, Private, Retail, Long-term, Project)
- ✅ Competitive bidding system (NPC competitors)
- ✅ Auto-progression formulas (employee skill → completion)
- ✅ Quality scoring (1-100, affects reputation)
- ✅ Reputation impact (+/- based on performance)
- ✅ Contract marketplace with filtering
- ✅ Contract analytics (win rate, profitability)
- ✅ Penalty system (late delivery, poor quality)

### Phase 3: Department System (50-70h) - ✅ COMPLETE
- ✅ **Finance Department**
  - ✅ Loan management (5 types: business, credit line, equipment, VC, emergency)
  - ✅ Credit score tracking (300-850 scale)
  - ✅ Cashflow projections (12-month forecast)
  - ✅ Passive investments (stocks 5-15%, bonds 2-5%, real estate 8-12%)
  - ✅ Dividend system (quarterly/monthly payouts)
  - ✅ Bankruptcy mechanics
- ✅ **HR Department**
  - ✅ Automated job postings
  - ✅ Training program management
  - ✅ Retention analytics dashboard
- ✅ **Marketing Department**
  - ✅ Campaign creation (budget, duration, target)
  - ✅ Reputation impact calculations
  - ✅ Customer acquisition cost (CAC) tracking
- ✅ **R&D Department**
  - ✅ Innovation queue (research projects)
  - ✅ Efficiency upgrades (reduce costs, increase output)
  - ✅ Product development pipeline

### Phase 4A: Manufacturing Industry (40-60h) - ✅ COMPLETE
- ✅ Production line system
- ✅ Inventory management (raw materials, finished goods)
- ✅ Supply chain system (suppliers, lead times, bulk discounts)
- ✅ Quality control (defect rates, QA processes)
- ✅ Automation upgrades (tiers 1-5)
- ✅ B2B contracts (sell to companies/NPCs)
- ✅ B2C retail integration

### Phase 4B: E-Commerce Industry (50-70h) - ✅ COMPLETE
- ✅ Product catalog system (listings, variants, pricing)
- ✅ Marketplace integration (sell to players/NPCs)
- ✅ Payment processing (transaction fees, chargebacks)
- ✅ Fulfillment system (shipping, tracking, delivery)
- ✅ Customer review system (ratings, reputation impact)
- ✅ SEO/advertising (traffic generation, conversion)
- ✅ Analytics (traffic, conversion, CLV)
- ✅ 9 models + CloudCustomer (~4,750 LOC)
- ✅ 29 API endpoints (~7,992 LOC)
- ✅ 8 UI components (~2,971 LOC)
- ✅ Sub-phase 3 complete (testing skipped)

### Phase 4C: Healthcare Industry (60-80h) - ⏳ PLANNED
- [ ] Facility management (hospitals, clinics, capacity)
- [ ] Patient care system (admissions, treatments, outcomes)
- [ ] Medical staff management (doctors, nurses, specialists)
- [ ] Insurance contracts (negotiate rates, process claims)
- [ ] Regulatory compliance (licensing, inspections)
- [ ] Quality metrics (patient outcomes, satisfaction)
- [ ] Emergency services (random events, surge capacity)

### Phase 4D: Energy Industry (70-90h) - ✅ COMPLETED (2025-11-19, ~8h actual, 89% time savings)
- ✅ Extraction operations (oil wells, gas fields) — OilGasOperations component + 8 endpoints
- ✅ Renewable energy (solar farms, wind turbines) — RenewableEnergyDashboard component + 8 endpoints
- ✅ Distribution network (pipelines, transmission lines) — GridInfrastructureDashboard component + 6 endpoints
- ✅ Commodity trading (price volatility, futures) — CommodityTradingPlatform component + 9 endpoints
- ✅ Environmental compliance (emissions, permits, fines) — EnvironmentalCompliance component + 6 endpoints
- ✅ Grid management (load balancing, blackout risks) — GridInfrastructureDashboard (blackout risk scoring, N-1 contingency)
- ✅ 8-tab integrated dashboard (app/(game)/energy/page.tsx, 335 lines)
- ✅ 100% backend coverage (41/41 endpoints verified via Enhanced Preflight Matrix)
- ✅ TypeScript: 76 baseline maintained (0 production errors)
- ✅ 3 batches: Backend (59 endpoints, 2.0h), Components (8 UI, 4,995 LOC, 4.2h), Dashboard (335 LOC, 1.5h)

### Phase 4E: Media Industry (40-60h) - ⏳ PLANNED
- [ ] Content creation (articles, videos, podcasts, shows)
- [ ] Audience metrics (views, engagement, subscribers)
- [ ] Advertising revenue (CPM, sponsorships)
- [ ] Influencer system (hire influencers, brand deals)
- [ ] Political propaganda (bias content, election influence)
- [ ] Content moderation (legal risks, reputation)

### Phase 4F: Technology/Software Industry (60-80h) - 🚀 NEXT TARGET
- [ ] Software development (products, releases, bugs, patches)
- [ ] AI research (model training, breakthroughs, ethics)
- [ ] SaaS products (subscriptions, churn rates, MRR)
- [ ] Cloud infrastructure (servers, scaling, uptime)
- [ ] Patent system (file patents, licensing, IP protection)
- [ ] Startup ecosystem (VC funding, acquisitions, IPOs)

**Strategic Priority:** Unlocks -10% cost synergies for all future industries

### Advanced Company Management - ⏳ PLANNED (Integrated into Phases 1-4)
- [ ] Multiple companies per player (portfolio management)
- [ ] Company departments (Finance, HR, Marketing, R&D)
- [ ] Loans and credit system (credit score affects rates)
- [ ] Balance sheets and financial reports (income statements)
- [ ] Bankruptcy mechanics (debt > assets = liquidation)
- [ ] Merger & acquisition system (due diligence, valuation)
- [ ] Cross-industry synergies (bonuses for diversification)
- [ ] NPC company competition (3 AI personalities)

### Financial Systems - ⏳ PLANNED (Phase 3 Finance Department)
- [ ] **Bank integration**
  - [ ] Loans (varying interest rates, repayment schedules)
  - [ ] Credit score system (affects borrowing ability)
  - [ ] Loan defaults and penalties
- [ ] **Revenue streams**
  - [ ] Sales (products/services)
  - [ ] Rents (real estate passive income)
  - [ ] Dividends (stock holdings)
  - [ ] Interest (bank deposits, loans to others)
  - [ ] Government contracts (subsidies, projects)
- [ ] **Expense management**
  - [ ] Employee salaries (fixed costs)
  - [ ] Maintenance and operations
  - [ ] Taxes (corporate, property, capital gains)
  - [ ] Loan repayments (principal + interest)
- [ ] **Investment diversification** (risk management)

**Success Criteria:**
- ✅ Players can manage companies in 12 industries (foundation complete)
- ⏳ Players can manage 6 advanced industries with unique mechanics
- ⏳ Financial systems are balanced and engaging
- ⏳ Economic simulation feels realistic
- ⏳ Risk/reward is clear and meaningful

**Current Status:** ✅ Phase 0-3 + 4A-4B COMPLETE (Utilities, Employees, Contracts, Departments, Manufacturing, E-Commerce). Next: Phase 4F (Technology/Software Industry).

---

## 🏛️ Phase 3: Politics & Governance

**Goal:** Introduce political systems and player influence

### Election System
- [ ] Election cycles (seasonal)
- [ ] **Local government elections**
  - [ ] Mayor elections (city level)
  - [ ] City Council elections
  - [ ] County Supervisor elections
- [ ] **State government elections**
  - [ ] State Assembly elections (districts)
  - [ ] State Senate elections (districts)
  - [ ] Governor elections (statewide)
- [ ] **Federal government elections**
  - [ ] US House of Representatives (congressional districts)
  - [ ] US Senate (statewide, 2 per state)
  - [ ] President (electoral college system)
- [ ] Campaign system (spending, promises, ads)
- [ ] Voting mechanics (players vote in their jurisdiction)
- [ ] Winner determination and inauguration
- [ ] Term limits and re-election

### Policy System
- [ ] Policy creation interface (for elected officials at each level)
- [ ] **Local policies** (city/county level)
  - [ ] Zoning regulations
  - [ ] Local business taxes
  - [ ] City services and budgets
- [ ] **State policies** (state level)
  - [ ] State taxes (income, sales, corporate)
  - [ ] Industry regulations
  - [ ] State subsidies and grants
- [ ] **Federal policies** (national level)
  - [ ] Federal taxes
  - [ ] National regulations
  - [ ] Tariffs and trade
  - [ ] Federal spending and bailouts
- [ ] Policy voting (legislative process by level)
- [ ] Jurisdictional enforcement (policies apply to correct level)

### Lobbying & Influence
- [ ] Donate to candidates (campaign contributions)
- [ ] Fund Political Action Committees (PACs)
- [ ] Push for favorable laws (lobbying actions)
- [ ] **Corruption mechanics**
  - [ ] Scandals (exposure risk based on actions)
  - [ ] Investigations (regulatory, criminal)
  - [ ] Penalties (fines, asset freezes, criminal charges)
- [ ] Reputation impact on elections (trust/fear dynamics)

### Regulatory System
- [ ] **NPC regulators** (enforce rules, investigations)
- [ ] **Antitrust actions** (break up monopolies)
- [ ] **Fines and penalties** (violations, fraud)
- [ ] **Asset freezes** (pending investigations)
- [ ] **Compliance requirements** (industry-specific)

### Public Opinion
- [ ] **Reputation system** (multi-dimensional)
  - [ ] Business ethics (employee treatment, environment)
  - [ ] Political ethics (corruption, transparency)
  - [ ] Public relations (charity, community)
  - [ ] Archetype consistency (aligned actions)
- [ ] Media events and coverage (positive/negative)
- [ ] Public trust mechanics (affects elections, business)
- [ ] Scandal and recovery system (time-based reputation repair)

**Success Criteria:**
- ✅ Elections feel meaningful and competitive
- ✅ Policies directly impact player profits
- ✅ Lobbying creates strategic depth
- ✅ Reputation matters for elections and business

---

## 🌍 Phase 4: Multiplayer Dynamics

**Goal:** Rich player interactions and shared economy

### Real-time Features (Socket.io)
- [ ] Chat system (global, company, private)
- [ ] Live market price updates
- [ ] Election results broadcasts
- [ ] Notification system (events, alerts)

### Multiplayer Economy
- [ ] Dynamic pricing (supply/demand)
- [ ] Player-to-player trading
- [ ] Shared resource markets
- [ ] Price manipulation detection

### Social Systems
- [ ] Syndicates/alliances (player groups)
- [ ] Joint ventures and partnerships
- [ ] Auction system (rare assets)
- [ ] Negotiation mechanics
- [ ] Hostile takeovers

### Competitive Features
- [ ] Leaderboards (net worth, industry dominance, political influence)
- [ ] Rankings and achievements
- [ ] Competitive events
- [ ] Seasonal rewards

**Success Criteria:**
- ✅ Multiplayer feels vibrant and active
- ✅ Real-time updates are smooth (< 100ms latency)
- ✅ Players collaborate and compete meaningfully
- ✅ Economy self-balances through player actions

---

## 🎮 Phase 5: Advanced Industries

**Goal:** Expand industry variety and depth

### New Industries
- [ ] **Crypto industry**
  - [ ] Trade volatile tokens (high-frequency speculation)
  - [ ] Launch ICOs (fundraising for projects)
  - [ ] Wallet hacks (security risk events)
  - [ ] Regulatory crackdowns (policy-driven)
- [ ] **Manufacturing** (already partially in Phase 2, expand here)
  - [ ] Automation upgrades (reduce labor costs)
  - [ ] International supply chains (tariff exposure)
  - [ ] Quality control (defect rates affect reputation)
- [ ] **Banking industry**
  - [ ] Offer loans to players/NPCs (interest income)
  - [ ] Default risk management (credit analysis)
  - [ ] Reserve requirements (regulatory compliance)
  - [ ] Banking crises (liquidity events)
- [ ] **Energy industry**
  - [ ] Oil extraction/refining (commodity prices)
  - [ ] Renewable energy (solar, wind, subsidies)
  - [ ] Environmental regulations (compliance costs)
  - [ ] Energy market volatility
- [ ] **Technology industry**
  - [ ] Software development (product launches)
  - [ ] Hardware manufacturing (supply chain complexity)
  - [ ] Innovation cycles (R&D breakthroughs)
  - [ ] Patent system (IP protection)

### Industry Depth
- [ ] Unique mechanics per industry
- [ ] Risk/reward profiles
- [ ] Industry-specific events
- [ ] Cross-industry synergies
- [ ] Market cycles and trends

**Success Criteria:**
- ✅ Each industry feels distinct and engaging
- ✅ Players can specialize or diversify effectively
- ✅ Industry balance prevents dominant strategies
- ✅ Economic cycles create strategic opportunities

---

## 📜 Phase 6: Events & Narrative

**Goal:** Add drama, unpredictability, and story elements

### Event System
- [ ] Business events (strikes, disruptions, crashes)
- [ ] Political events (elections, scandals, policy shifts)
- [ ] Global events (pandemics, wars, embargoes)
- [ ] Random events (opportunities and crises)

### Narrative Choices
- [ ] **Archetype-specific event paths**
  - [ ] Innovator: R&D breakthroughs, efficiency opportunities
  - [ ] Ruthless Tycoon: hostile takeovers, aggressive expansion
  - [ ] Ethical Builder: community projects, sustainable growth
- [ ] **Choice-based events with branching outcomes**
  - [ ] 2-4 options per event (different risk/reward profiles)
  - [ ] Immediate consequences + long-term effects
  - [ ] Archetype alignment bonuses (consistent choices rewarded)
- [ ] Reputation impact from decisions (multi-dimensional scoring)
- [ ] **Story progression milestones**
  - [ ] First $1M net worth
  - [ ] First election win
  - [ ] First company acquisition
  - [ ] Industry dominance achievement

### Dynamic World
- [ ] **NPC competitors** (AI-controlled companies)
  - [ ] Compete for contracts and resources
  - [ ] React to player actions (rivalry, partnership)
  - [ ] Organic growth/decline patterns
  - [ ] Potential acquisition targets
- [ ] **Economic cycles**
  - [ ] Boom periods (easy credit, high growth)
  - [ ] Bust periods (defaults, bankruptcies)
  - [ ] Sector rotations (industry-specific cycles)
  - [ ] Policy-driven shifts (tax changes, regulations)
- [ ] **Political shifts**
  - [ ] Election results change policy landscape
  - [ ] Regime changes (new administrations)
  - [ ] International relations (trade agreements/wars)
- [ ] **Long-term consequences**
  - [ ] Reputation decay/growth over time
  - [ ] Compounding effects of choices
  - [ ] Historical record (player legacy)

**Success Criteria:**
- ✅ Events feel impactful and dramatic
- ✅ Player choices matter
- ✅ World feels alive and dynamic
- ✅ Replayability is high due to variability

---

## 🧪 Phase 7: Polish & Optimization

**Goal:** Production-ready quality and performance

### Performance
- [ ] API response time < 200ms (p95)
- [ ] Page load < 2s (LCP)
- [ ] Socket.io latency < 100ms
- [ ] Database query optimization
- [ ] Caching strategy (Redis)

### Testing
- [ ] 80%+ test coverage
- [ ] E2E tests for critical flows
- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit (OWASP compliance)
- [ ] Accessibility audit (WCAG 2.1 AA)

### UX/UI Polish
- [ ] Animations and transitions (60fps)
- [ ] Loading states and skeletons
- [ ] Error handling and recovery
- [ ] Onboarding tutorial
- [ ] Help system and tooltips

### Documentation
- [ ] API documentation
- [ ] Player guides
- [ ] Developer documentation
- [ ] Deployment guides
- [ ] Contributing guidelines

**Success Criteria:**
- ✅ Performance targets met consistently
- ✅ Zero critical bugs in production
- ✅ Players understand how to play without asking
- ✅ Code is maintainable and documented

---

## 📈 Success Metrics

### Player Engagement
- Daily Active Users (DAU)
- Average session duration
- Retention rates (D1, D7, D30)
- Feature usage statistics

### Economic Health
- Active companies per player
- Transaction volume
- Market price stability
- Industry diversity

### Technical Quality
- API uptime (99.9% target)
- Error rate (< 0.1%)
- Performance metrics (Core Web Vitals)
- Test coverage (> 80%)

---

## 🔮 Future Possibilities

### Post-Launch Features
- [ ] Mobile app (React Native)
- [ ] Clan/guild system
- [ ] Tournaments and seasons
- [ ] Advanced analytics dashboard
- [ ] API for third-party tools
- [ ] Mod support
- [ ] Internationalization (i18n)

### Monetization (If Applicable)
- [ ] Premium memberships
- [ ] Cosmetic items (company logos, office themes)
- [ ] Ad-free experience
- [ ] Early access to new features

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-13*
