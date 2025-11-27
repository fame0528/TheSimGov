# 🚀 MASTER IMPLEMENTATION PLAN - Complete Company System
## Business & Politics MMO - Comprehensive Development Roadmap

**Created:** 2025-11-13  
**ECHO Version:** v1.0.0  
**Status:** READY FOR IMPLEMENTATION  
**Total Estimated Time:** 650-870 hours (16-22 weeks at 40h/week)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Architecture Overview](#architecture-overview)
4. [Phase Breakdown](#phase-breakdown)
5. [Feature Specifications](#feature-specifications)
6. [Database Schema Design](#database-schema-design)
7. [API Endpoints](#api-endpoints)
8. [UI Components](#ui-components)
9. [Implementation Order](#implementation-order)
10. [Dependencies & Blockers](#dependencies--blockers)
11. [Testing Strategy](#testing-strategy)
12. [Success Metrics](#success-metrics)

---

## 📊 EXECUTIVE SUMMARY

### Project Scope
**Objective:** Build complete company management system with 6 core systems (Utilities, Employee, Contract, Department, Industry-Specific Mechanics, Technology/AI) across 12 industries.

**Playstyle Flexibility:**
- **Business Mogul:** Focus entirely on building company empire (ignore politics)
- **Pure Politician:** Focus on elections/policy (no business required)
- **Investor:** Build passive investment portfolio, earn dividends without management
- **Power Broker:** Integrate business + politics for maximum influence
- **All optional:** Players choose their own path

### Key Deliverables
- ✅ **A. Utility Libraries** (8-12h) - Currency, random, math, tooltips, IDs
- ✅ **B. Employee System** (40-60h) - NPC hiring, skills, loyalty, salaries
- ✅ **C. Contract System** (40-60h) - Bidding, fulfillment, revenue generation
- ✅ **D. Department System** (50-70h) - Finance, HR, Marketing, R&D
- ✅ **E. Industry-Specific Mechanics** (260-350h) - 6 new industries
- ✅ **F. Technology/AI Implementation** (60-80h) - Full AI company simulation

### Total Scope
- **Estimated Time:** 458-632 hours of core development
- **Additional Buffer:** +40% for testing/polish = 650-870 hours total
- **Timeline:** 16-22 weeks (solo developer, 40h/week)
- **Files:** ~120 new files, ~50 modified files
- **Lines of Code:** ~35,000-45,000 LOC
- **Database Collections:** 15 new models

---

## 🎯 CURRENT STATE

### Completed Features (~180h actual)
- ✅ **FID-20251113-001:** Sprint 1 Authentication (4h)
- ✅ **FID-20251113-006:** Seed Data - 51 states, 7,569 positions (6.5h)
- ✅ **FID-20251113-007:** Modern UI & Interactive Map (3h)
- ✅ **FID-20251113-008:** Companies Foundation (10h)
- ✅ **FID-20251113-UTIL:** Phase 0 - Utility Libraries (8-12h)
- ✅ **FID-20251113-EMP:** Phase 1 - Employee System (40-60h)
- ✅ **FID-20251113-CON:** Phase 2 - Contract System (40-60h)
- ✅ **FID-20251113-DEPT:** Phase 3 - Department System (50-70h)
- ✅ **FID-20251113-MFG:** Phase 4A - Manufacturing Industry (40-60h)

### Infrastructure Status
- ✅ MongoDB + Mongoose configured
- ✅ NextAuth.js v5 authentication
- ✅ TypeScript strict mode (0 errors)
- ✅ Chakra UI + Tailwind CSS
- ✅ Utility libraries installed (tippy.js, faker, mathjs, uuid, currency.js)
- ✅ Protected routes middleware
- ✅ API route structure established

### Industries Available
**Original 6:**
1. Construction ($9k total → $1k remaining)
2. Real Estate ($6k total → $4k remaining)
3. Crypto ($9k total → $1k remaining)
4. Stocks ($7k total → $3k remaining)
5. Retail ($8.5k total → $1.5k remaining)
6. Banking ($9k total → $1k remaining)

**New 6 (Planned):**
7. Technology/AI ($16k total → -$6k, requires loan)
8. Manufacturing ($17.5k total → -$7.5k, requires loan)
9. E-Commerce ($10.5k total → -$500, barely requires loan)
10. Healthcare ($20k total → -$10k, highest licensing)
11. Energy ($28k total → -$18k, HIGHEST cost)
12. Media ($11.5k total → -$1.5k, requires small loan)

---

## 🏗️ ARCHITECTURE OVERVIEW

### Time Progression & Simulation

**Real-Time Game Mechanics:**
- **Pure real-time progression** (no time jumps or skips)
- **Accelerated timescale:** 1 real hour = 1 game day (24x speed)
- Server tick system runs every 15 minutes (96 ticks/day)
- Auto-processes: Contract progress, training completion, loan interest, employee salaries

**Simulation Mechanics:**
- **Passive Progression:** Companies earn/spend while offline (unlimited)
  - Contracts continue progressing based on assigned employees
  - Training completes automatically when duration elapsed
  - Salaries/costs deducted on schedule
  - Players catch up on notifications when logging back in
- **Market Cycles:** Monthly economic cycles affect contract availability, prices (30 real hours = 1 game month)
- **Seasonal Events:** Holiday bonuses, tax season, industry-specific peaks

**Auto-Deductions (Game Time):**
- Employee salaries (every Friday in-game)
- Loan interest payments (1st of each month in-game)
- Facility maintenance costs (weekly in-game)
- Department budgets (monthly in-game)

**Unified Game Time Conversion:**
- 1 real hour = 1 game week (168x acceleration)
- 8.75 real hours = 1 game month (~1 working day)
- 4.4 real days = 1 game year

---

### Unified Fast-Paced Time System (Politics + Business)

**The Solution:** Everything runs on **ultra-accelerated timeline** for engaging gameplay (1 real hour = 1 game week).

**⚠️ CRITICAL: PERSISTENT WORLD - NO RESETS EVER**
- Game world runs **continuously forever** (no seasons, no wipes, no resets)
- Companies persist indefinitely (can grow for months/years)
- Political history accumulates (laws, terms, scandals all permanent)
- Economy evolves organically (no artificial resets)
- NPCs remember past interactions (reputation persists)
- Player progress never deleted (true MMO persistence)

**Political Elections (Fast-Paced):**
- Senate terms: **2 game years** = 8.8 real days (~1.3 weeks)
- House terms: **2 game years** = 8.8 real days (~1.3 weeks)
- Presidential terms: **4 game years** = 17.5 real days (~2.5 weeks)
- Governor terms: **4 game years** = 17.5 real days
- State Legislature terms: **2 game years** = 8.8 real days

**Election Cycles:**
- Elections happen every **2 game years** (8.8 real days)
- Campaign season: **3 game months** = 26 real hours (~1 day)
- Primary season: **1 game month** = 8.75 real hours (one session)
- General election: Fixed date (e.g., "First Tuesday in November" in-game)

**Why This Works:**

✅ **Fast & Engaging:** ~1 day campaigns = intense, exciting bursts
✅ **Quick Feedback:** 8-17 day terms = see results of your policies fast
✅ **High Turnover:** Elections every 9 days = dynamic political landscape
✅ **Session-Friendly:** Campaign in one intense gaming session
✅ **Retention:** Players see meaningful progress every few days

**Political-Business Integration (Optional):**

**Note:** Business and politics are **fully independent systems**. Players can:
- Build companies without ever running for office
- Run for office without ever creating a company
- Combine both for synergistic benefits
- Focus on passive investments instead of active management

1. **Campaign Financing (If using business):**
   - Build profitable company over 5-6 real days
   - Fund 1-day intense campaign blitz
   - Win election → serve 8-17 day term
   - Example: Day 1-6 (build company) → Day 7 (campaign) → Day 8-16 (term)
   - **Alternative:** Run for office with $0 (grassroots campaign, donations from other players)

2. **Government Contracts:**
   - Elected officials award contracts to companies
   - Contracts execute quickly (30 game days = 30 real hours = ~1.25 days)
   - Immediate impact and rewards

3. **Lobbying & Legislation:**
   - Lobby for bills during legislative sessions
   - Bills pass/fail within hours-days
   - See immediate company benefits

4. **Term Strategy:**
   - **Short terms (8-9 days):** Focus on quick wins, corruption, cash out
   - **Long terms (17 days):** Build reputation, pass major reforms
   - Multiple election cycles per month = many chances to run

5. **Multi-Company + Politics:**
   - Manage both simultaneously (companies auto-progress)
   - Pass laws → immediate company boosts
   - Fast consequences (get caught? Lose next election in 9 days)

**UI Display (Single Clock):**
```
┌─────────────────────────────────────────────────────┐
│  📅 Game Date: Week 52, 2026 (Year 1)                   │
│  ⏰ Real Time Played: 52 hours (2.2 days)               │
│  🗳️ Next Election: 2 game weeks (2 real hours)          │
│  📊 Your Term Ends: 4 game months (1.5 real days)       │
└─────────────────────────────────────────────────────┘
```

**Progression Examples:**

**Playstyle A: Business Mogul (No Politics)**
- Day 1: Create company, start earning
- Week 1-2: Build multi-company empire across industries
- Month 1+: Passive income from established companies, focus on optimization
- **Never run for office** - just build business empire indefinitely

**Playstyle B: Pure Politician (No Business)**
- Day 1: Skip company creation, declare candidacy immediately
- Campaign using personal funds or donations from other players
- Win office, earn government salary ($174k/year Senator = ~$20/game-hour)
- Focus 100% on legislation, votes, political alliances
- **Never touch business side** - viable path to success

**Playstyle C: Passive Investor**
- Day 1: Create company, earn initial capital ($50k-100k)
- Day 2-3: Invest in stocks, bonds, real estate portfolio
- Week 1+: Collect quarterly dividends (auto-deposited)
- **Minimal active management** - check in weekly, rebalance portfolio
- Combine with politics (fund campaigns from dividends)

**Playstyle D: Power Broker (Integrated)**
- Day 1-7: Build company empire, accumulate wealth
- Day 8: Campaign using company profits
- Day 9-16: Serve term, pass laws favoring your companies
- Companies grow 2x faster due to favorable regulations
- **Maximum synergy** - business + politics = exponential growth

**Playstyle E: Corruption Empire**
- Build companies + win office
- Award government contracts to your own companies (self-dealing)
- Pass subsidies for your industries
- Risk: Ethics violations, impeachment, reputation loss
- Reward: Massive short-term profits

**Day 17+ (All Playstyles):**
- **Companies persist forever** (keep growing indefinitely, no wipes)
- **Political history accumulates** (your past terms/scandals follow you)
- **Wealth compounds over time** (true long-term progression)
- **World evolves organically** (economy changes based on all player actions)
- Run for re-election or retire from politics (companies unaffected)
- Elections every 9 days = always new opportunities
- Portfolio grows indefinitely with compound returns

**Month 1+ (Veteran Players):**
- Established business empires (dozens of companies)
- Political dynasties (multiple terms, loyal voter base)
- Market dominance in specific industries
- Historical reputation (known for corruption or reform)
- Mentorship of new players (sell companies, form alliances)
- **No progress loss ever** - your empire is permanent

**Benefits:**

- **Addiction Loop:** Progress visible every gaming session
- **Low Commitment:** Miss a few days? Not catastrophic
- **High Stakes:** Every decision matters (term ends soon!)
- **Replayability:** Multiple political runs per month
- **Business Synergy:** Companies grow while you campaign/govern
- **Persistent Companies:** Businesses last forever, grow across election cycles
- **Flexible Playstyles:** Focus on business, politics, or both (all viable)

---

### System Architecture
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Companies │  │Politics  │  │  Market  │   │
│  │  Page    │  │   Page   │  │   Page   │  │   Page   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                     COMPONENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Employee │  │ Contract │  │Department│  │ Industry │   │
│  │Components│  │Components│  │Components│  │Components│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Employees │  │Contracts │  │Departments│ │Industries│   │
│  │   API    │  │   API    │  │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Utility  │  │  NPC     │  │ Contract │  │Department│   │
│  │Helpers   │  │Generator │  │  Engine  │  │  Logic   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Employee │  │ Contract │  │Department│  │ Industry │   │
│  │  Model   │  │  Model   │  │  Model   │  │  Models  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│              MongoDB + Mongoose ORM                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (UI) 
  → Component Event Handler
  → API Call (fetch/axios)
  → API Route Handler
  → Validation (Zod)
  → Business Logic (utility functions)
  → Database Operation (Mongoose)
  → Transaction Logging
  → Response
  → UI Update (state/hooks)
  → Real-time Updates (StatusBar refresh)
```

---

## 📅 PHASE BREAKDOWN

### **PHASE 0: Foundation - Utility Libraries** (8-12h) ✅ COMPLETE
**FID-20251113-UTIL-001**

**Objective:** Create centralized utility wrappers for all installed libraries.

**Deliverables:**
- ✅ Currency helpers (currency.js wrappers)
- ✅ Random data generators (Faker.js wrappers)
- ✅ Math utilities (mathjs wrappers)
- ✅ UUID helpers
- ✅ Tooltip components (Tippy.js)
- ✅ Currency display components

**Files:** 7 new files (COMPLETE)
**Dependencies:** None (libraries already installed)
**Blocks:** All other phases (use these utilities)

---

### **PHASE 1: Employee System** (40-60h) ✅ COMPLETE
**FID-20251113-EMP-001**

**Objective:** Complete NPC employee system with hiring, firing, skill management.

**Deliverables:**
- ✅ Employee Mongoose schema
- ✅ NPC generation engine
- ✅ Employee marketplace UI
- ✅ Hire/fire mechanics
- ✅ Salary calculations
- ✅ Skill/loyalty/morale tracking
- ✅ Employee management dashboard

**Files:** 15-20 new files (COMPLETE)
**Dependencies:** PHASE 0 (Utilities) ✅
**Blocks:** PHASE 3 (Departments), PHASE 4 (Industry Mechanics)

---

### **PHASE 2: Contract System** (40-60h) ✅ COMPLETE
**FID-20251113-CON-001**

**Objective:** Contract bidding, fulfillment, and revenue generation.

**Deliverables:**
- ✅ Contract Mongoose schema
- ✅ Contract generator (industry-specific)
- ✅ Bidding mechanics (compete with NPCs/players)
- ✅ Fulfillment tracking
- ✅ Payment processing
- ✅ Contract marketplace
- ✅ Company revenue dashboard

**Files:** 15-20 new files (COMPLETE)
**Dependencies:** PHASE 0 (Utilities) ✅, PHASE 1 (Employees) ✅
**Blocks:** None (revenue source)

---

### **PHASE 3: Department System** (50-70h) ✅ COMPLETE
**FID-20251113-DEP-001**

**Objective:** 4 company departments with unique mechanics.

**Deliverables:**
- ✅ Department Mongoose schema
- ✅ Finance department (P&L, budgeting, loans)
- ✅ HR department (recruitment, training, morale)
- ✅ Marketing department (campaigns, customer acquisition, brand)
- ✅ R&D department (research projects, innovation)
- ✅ Employee assignment to departments
- ✅ Department upgrade system

**Files:** 20-25 new files (COMPLETE)
**Dependencies:** PHASE 0 (Utilities) ✅, PHASE 1 (Employees) ✅
**Blocks:** PHASE 4 (R&D needed for Tech/Healthcare/Energy)

---

### **PHASE 4A: Manufacturing Industry** (40-60h) ✅ COMPLETE
**FID-20251113-IND-MFG**

**Objective:** Factory management, production, inventory, supply chain.

**Deliverables:**
- ✅ ManufacturingCompany schema extension (ManufacturingFacility, ProductionLine, etc.)
- ✅ Factory management system
- ✅ Production line mechanics
- ✅ Inventory tracking (raw materials, WIP, finished goods)
- ✅ Quality control system
- ✅ Supply chain logistics
- ✅ B2B/B2C sales

**Files:** 18-22 new files (COMPLETE)
**Dependencies:** PHASE 1 (Employees) ✅, PHASE 2 (Contracts) ✅, PHASE 3 (Departments) ✅

---

### **PHASE 4B: E-Commerce Industry** (50-70h)
**FID-20251113-IND-ECOM**

**Objective:** Amazon-style marketplace, logistics, cloud services, subscriptions.

**Deliverables:**
- ECommerceCompany schema extension
- Marketplace platform (third-party sellers)
- Logistics & fulfillment (FBA model)
- Cloud services (AWS-style)
- Subscription system (Prime-style)
- Advertising platform
- Private label products

**Files:** 22-28 new files
**Dependencies:** PHASE 1 (Employees), PHASE 2 (Contracts), PHASE 3 (Departments)

---

### **PHASE 4C: Healthcare Industry** (60-80h)
**FID-20251113-IND-HEALTH**

**Objective:** Medical services, pharmaceuticals, insurance, health tech.

**Deliverables:**
- HealthcareCompany schema extension
- Medical services (clinics, hospitals)
- Pharmaceutical pipeline (drug development, FDA)
- Health insurance system
- Health technology (EHR, telemedicine)
- Regulatory compliance (HIPAA, FDA)
- Patient care mechanics

**Files:** 25-30 new files
**Dependencies:** PHASE 1 (Employees), PHASE 2 (Contracts), PHASE 3 (Departments, R&D)

---

### **PHASE 4D: Energy Industry** (70-90h)
**FID-20251113-IND-ENERGY**

**Objective:** Oil/gas, renewables, utilities, power generation, trading.

**Deliverables:**
- EnergyCompany schema extension
- Oil & gas mechanics (exploration, drilling, refining)
- Renewable energy (solar, wind, hydro)
- Utilities (power generation, grid)
- Energy trading (commodities, futures)
- Environmental compliance
- Carbon emissions tracking

**Files:** 28-35 new files
**Dependencies:** PHASE 1 (Employees), PHASE 2 (Contracts), PHASE 3 (Departments, R&D)

---

### **PHASE 4E: Media Industry** (40-60h)
**FID-20251113-IND-MEDIA**

**Objective:** Content creation, streaming, social media, advertising.

**Deliverables:**
- MediaCompany schema extension
- Content production system
- Streaming platform mechanics
- Social media features
- Advertising system
- IP & franchise management
- Viral content mechanics

**Files:** 18-24 new files
**Dependencies:** PHASE 1 (Employees), PHASE 2 (Contracts), PHASE 3 (Departments, Marketing)

---

### **PHASE 4F: Technology/AI Industry** (60-80h)
**FID-20251113-IND-TECH**

**Objective:** Complete AI company simulation (full implementation of ai-industry-design.md).

**Deliverables:**
- AICompany schema extension
- AI model training system
- Research & publication mechanics
- ML talent management
- Infrastructure (GPU compute)
- Product deployment (APIs, licensing)
- Competition & leaderboards

**Files:** 30-40 new files
**Dependencies:** PHASE 1 (Employees), PHASE 2 (Contracts), PHASE 3 (Departments, R&D)
**Complexity:** HIGHEST (most detailed industry)

---

## 📝 FEATURE SPECIFICATIONS

### A. UTILITY LIBRARIES (8-12h)

#### **FID-20251113-UTIL-001: Utility Helper Functions**

**Files to Create:**

1. **`src/lib/utils/currency.ts`** (~120 lines)
```typescript
/**
 * Currency utilities using currency.js
 * - formatCurrency(value): "$1,234.56"
 * - formatCurrencyShort(value): "$1.5M"
 * - addCurrency(a, b): Precise addition
 * - subtractCurrency(a, b): Precise subtraction
 * - multiplyCurrency(value, multiplier): Precise multiplication
 * - percentOf(value, percent): Calculate percentage
 * - calculateTax(amount, taxRate): Tax calculation
 * - calculateInterest(principal, rate, years): Interest calculation
 */
```

2. **`src/lib/utils/random.ts`** (~250 lines)
```typescript
/**
 * Random data generation using Faker.js
 * - generateNPCEmployee(role, skillLevel): Employee with realistic stats
 * - generateCompanyName(industry): Industry-appropriate name
 * - generateContractDescription(industry, difficulty): Realistic contract
 * - generateEvent(type, severity): Random game event
 * - generateCustomerName(): Realistic customer
 * - generateProductName(industry): Industry-specific product
 * - seedRandom(seed): Reproducible randomness
 */
```

3. **`src/lib/utils/math.ts`** (~150 lines)
```typescript
/**
 * Mathematical operations using mathjs
 * - calculateROI(investment, returns): Return on investment
 * - calculateNPV(cashflows, discountRate): Net present value
 * - calculateCompoundInterest(principal, rate, time): Compound growth
 * - calculatePercentageChange(oldValue, newValue): % change
 * - calculateAverage(values): Mean
 * - calculateMedian(values): Median
 * - calculateStandardDeviation(values): Std dev
 * - clamp(value, min, max): Constrain value
 */
```

4. **`src/lib/utils/id.ts`** (~60 lines)
```typescript
/**
 * UUID generation helpers
 * - generateTransactionId(): Unique transaction ID
 * - generateContractId(): Unique contract ID
 * - generateSessionId(): Unique session ID
 * - generateEventId(): Unique event ID
 * - isValidUUID(id): Validate UUID format
 */
```

5. **`src/lib/utils/tooltips.ts`** (~80 lines)
```typescript
/**
 * Tippy.js configuration
 * - defaultTooltipConfig: Standard tooltip settings
 * - errorTooltipConfig: Error-specific styling
 * - infoTooltipConfig: Info-specific styling
 * - employeeStatTooltip(stat): Explain employee stat
 * - industryTooltip(industry): Industry description
 * - costBreakdownTooltip(costs): Cost breakdown
 */
```

6. **`components/common/Tooltip.tsx`** (~100 lines)
```typescript
/**
 * Reusable tooltip component wrapper
 * - <Tooltip content="..." placement="top">
 * - Support for HTML content
 * - Dynamic positioning
 * - Theme integration
 */
```

7. **`components/common/CurrencyDisplay.tsx`** (~80 lines)
```typescript
/**
 * Formatted currency display component
 * - <CurrencyDisplay value={1000} format="short" />
 * - Color coding (positive green, negative red)
 * - Tooltip with full value on abbreviations
 * - Trend indicators (↑↓→)
 */
```

**Acceptance Criteria:**
- ✅ All utilities have comprehensive JSDoc
- ✅ Examples provided for each function
- ✅ TypeScript strict mode passes
- ✅ Unit tests for currency calculations (precision critical)
- ✅ Tooltip components integrate with Chakra UI theme

---

### B. EMPLOYEE SYSTEM (40-60h)

#### **FID-20251113-EMP-001: Complete NPC Employee System**

**Database Schema:**

```typescript
// src/lib/db/models/Employee.ts
interface IEmployee extends Document {
  // Identity
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;              // Optional avatar URL
  
  // Employment
  company: Types.ObjectId;      // Reference to Company
  role: EmployeeRole;           // 'MLEngineer' | 'Manager' | 'Sales' | etc.
  department?: Types.ObjectId;  // Reference to Department (optional)
  hiredAt: Date;
  firedAt?: Date;
  
  // Skills (1-10 scale)
  skill: number;                // Core job skill
  experience: number;           // Years of experience (0-30)
  productivity: number;         // Work output multiplier (1-10)
  
  // Attributes
  loyalty: number;              // 1-10, affects retention
  morale: number;               // 1-10, affects productivity
  satisfaction: number;         // 1-10, overall happiness
  poachable: boolean;           // Visible to competitors if true
  poachResistance: number;      // 1-10, based on loyalty + compensation
  lastPoachAttempt?: Date;      // Track poaching attempts
  
  // Compensation
  salary: number;               // Annual salary
  bonus: number;                // Annual bonus target
  equity: number;               // Stock options %
  
  // Performance
  contractsCompleted: number;
  projectsCompleted: number;
  revenueGenerated: number;
  performanceRating: number;    // 1-5 scale
  
  // Training & Development
  trainingHistory: {
    programName: string;
    startDate: Date;
    completedDate?: Date;
    skillGain: number;          // Skill points gained
    cost: number;
    type: 'Technical' | 'Leadership' | 'Sales' | 'Soft Skills' | 'Industry-Specific';
  }[];
  totalTrainingInvestment: number;  // Total $ spent on training
  skillCap: number;             // Maximum skill achievable (7-10, talent-based)
  learningRate: number;         // 1-10, affects training effectiveness
  trainingCooldown?: Date;      // Can't train again until this date
  certifications: string[];     // Earned certifications
  
  // AI-Specific (for Technology industry)
  researchAbility?: number;     // AI research skill
  codingSkill?: number;         // Programming ability
  hasPhD?: boolean;
  publications?: number;
  hIndex?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

type EmployeeRole = 
  // General roles
  | 'Manager' | 'Sales' | 'Marketing' | 'Finance' | 'HR' | 'Legal'
  // Manufacturing
  | 'FactoryWorker' | 'QualityControl' | 'SupplyChain' | 'ProductionManager'
  // E-Commerce
  | 'Developer' | 'LogisticsManager' | 'CustomerService' | 'DataAnalyst'
  // Healthcare
  | 'Doctor' | 'Nurse' | 'Researcher' | 'Administrator'
  // Energy
  | 'Engineer' | 'Geologist' | 'FieldWorker' | 'Technician'
  // Media
  | 'ContentCreator' | 'Editor' | 'SocialMediaManager' | 'Designer'
  // Technology
  | 'MLEngineer' | 'ResearchScientist' | 'DataEngineer' | 'MLOps' | 'ProductManager';
```

**Salary Calculation Formula:**
```typescript
baseSalary = ROLE_BASE_SALARY[role]
skillMultiplier = 1 + (skill - 5) * 0.1  // Skill 10 = 1.5x, skill 1 = 0.6x
experienceBonus = experience * 2000      // $2k per year of experience
finalSalary = (baseSalary * skillMultiplier) + experienceBonus

// Example: ML Engineer, skill 8, 5 years experience
// baseSalary = $120,000
// skillMultiplier = 1 + (8 - 5) * 0.1 = 1.3
// experienceBonus = 5 * $2,000 = $10,000
// finalSalary = ($120,000 * 1.3) + $10,000 = $166,000
```

**Files to Create:**

1. **Models & Validation:**
   - `src/lib/db/models/Employee.ts` (~350 lines)
   - `src/lib/validations/employee.ts` (~200 lines)

2. **API Endpoints:**
   - `app/api/employees/route.ts` - GET (list), POST (hire)
   - `app/api/employees/[id]/route.ts` - GET, PATCH, DELETE
   - `app/api/employees/[id]/fire/route.ts` - POST (fire with severance)
   - `app/api/employees/[id]/train/route.ts` - POST (enroll in training)
   - `app/api/employees/[id]/training-history/route.ts` - GET (view history)
   - `app/api/employees/marketplace/route.ts` - GET (available NPCs)
   - `app/api/employees/generate/route.ts` - POST (generate NPCs)

3. **Utility Functions:**
   - `src/lib/utils/employees.ts` - NPC generation, salary calculations
   - `src/lib/constants/roles.ts` - Role definitions and base salaries

4. **UI Components:**
   - `components/employees/EmployeeCard.tsx` - Display employee stats
   - `components/employees/EmployeeList.tsx` - List all employees
   - `components/employees/EmployeeMarketplace.tsx` - Browse available NPCs
   - `components/employees/HireModal.tsx` - Hire confirmation dialog
   - `components/employees/FireModal.tsx` - Fire confirmation with severance
   - `components/employees/EmployeeStatsTooltip.tsx` - Stat explanations
   - `components/employees/SalaryNegotiation.tsx` - Offer/counter-offer
   - `components/employees/TrainingModal.tsx` - Enroll in training programs
   - `components/employees/TrainingHistory.tsx` - View employee training history
   - `components/employees/TrainingProgress.tsx` - Track active training
   - `components/employees/SkillProgressChart.tsx` - Visualize skill growth over time

5. **Pages:**
   - `app/(game)/companies/[id]/employees/page.tsx` - Employee management
   - `app/(game)/companies/[id]/employees/marketplace/page.tsx` - Hiring marketplace

**Acceptance Criteria:**
- ✅ Generate 100+ unique NPCs per role with Faker.js
- ✅ Hire employees with salary deduction from company cash
- ✅ Fire employees with severance calculation (2 weeks salary per year worked)
- ✅ Employee stats tooltips explain each metric
- ✅ Skill/loyalty/morale affect performance (productivity multiplier)
- ✅ Real-time employee count in StatusBar
- ✅ Sortable/filterable employee list (by role, skill, salary, department)
- ✅ Salary negotiation with counter-offers
- ✅ **Training System:**
  - Enroll employees in training programs (HR Department)
  - Training duration affects employee availability (can't work on contracts)
  - Skill increases based on: baseSkillIncrease × learningRate × (1 + random(-0.2, +0.3))
  - Employees have skill caps (7-10) determined by talent (can't train beyond cap)
  - Advanced training unlocks certifications (boosts salary/performance)
  - Training cooldown prevents spam (14-30 days between programs)
  - Loyalty boost for companies investing in employee development (+0.5-1.0)
  - Training history visible in employee profile
  - ROI tracking (skill gain vs. training cost)
- ✅ **Employee Poaching & Retention:**
  - Competitor companies can attempt to poach high-skill employees (skill > 7, loyalty < 5)
  - Poach offer = 1.2-1.8x current salary + sign-on bonus
  - Employee decides based on: offer amount, current loyalty, company reputation
  - Counter-offer mechanic (match or beat poach offer to retain)
  - Successful poach costs reputation (-5) for poaching company
  - Retention bonuses (one-time payments to boost loyalty)
  - Non-compete clauses (prevent poaching for 90 days, costs 10% more salary)
- ✅ Transaction logging for all hire/fire/salary/training/poaching events

---

### C. CONTRACT SYSTEM (40-60h)

#### **FID-20251113-CON-001: Contract Bidding & Fulfillment**

**Database Schema:**

```typescript
// src/lib/db/models/Contract.ts
interface IContract extends Document {
  // Identity
  title: string;
  description: string;
  industry: IndustryType;
  
  // Parties
  client: string;               // NPC or Player company name
  provider?: Types.ObjectId;    // Company that won the contract
  
  // Status
  status: 'Open' | 'Bidding' | 'Awarded' | 'InProgress' | 'Completed' | 'Failed' | 'Cancelled';
  
  // Bidding
  bids: {
    company: Types.ObjectId;
    amount: number;
    proposedDuration: number;   // Days
    bidAt: Date;
  }[];
  winningBid?: Types.ObjectId;
  biddingDeadline: Date;
  
  // Contract Terms
  paymentAmount: number;
  duration: number;             // Days
  difficulty: 1 | 2 | 3 | 4 | 5;
  requiredEmployees: number;
  requiredSkillLevel: number;   // Minimum employee skill required
  
  // Fulfillment
  progress: number;             // 0-100%
  startedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  
  // Outcomes
  qualityScore?: number;        // 0-100, affects reputation
  onTime: boolean;
  customerSatisfaction?: number; // 1-5 stars
  
  // Rewards/Penalties
  basePayment: number;
  bonusPayment: number;         // For exceeding expectations
  penaltyAmount: number;        // For late/poor quality
  reputationChange: number;     // +/- reputation points
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Contract Difficulty Calculation:**
```typescript
difficulty = Math.ceil((paymentAmount / 10000) + (duration / 30))
// $50k, 60 days → difficulty 8 (capped at 5)
// Difficulty affects required employee skill and completion complexity
```

**Files to Create:**

1. **Models & Validation:**
   - `src/lib/db/models/Contract.ts` (~400 lines)
   - `src/lib/validations/contract.ts` (~250 lines)

2. **API Endpoints:**
   - `app/api/contracts/route.ts` - GET (list), POST (create/admin)
   - `app/api/contracts/[id]/route.ts` - GET, PATCH, DELETE
   - `app/api/contracts/[id]/bid/route.ts` - POST (submit bid)
   - `app/api/contracts/[id]/award/route.ts` - POST (award to bidder)
   - `app/api/contracts/[id]/start/route.ts` - POST (begin work)
   - `app/api/contracts/[id]/complete/route.ts` - POST (submit completion)
   - `app/api/contracts/marketplace/route.ts` - GET (available contracts)

3. **Utility Functions:**
   - `src/lib/utils/contracts.ts` - Contract generation, bid evaluation
   - `src/lib/constants/contractTemplates.ts` - Industry-specific templates

4. **UI Components:**
   - `components/contracts/ContractCard.tsx` - Contract display
   - `components/contracts/ContractList.tsx` - All contracts
   - `components/contracts/ContractMarketplace.tsx` - Browse available
   - `components/contracts/BidModal.tsx` - Submit bid
   - `components/contracts/ContractProgress.tsx` - Progress tracker
   - `components/contracts/ContractCompletion.tsx` - Submit work
   - `components/contracts/BidComparison.tsx` - Compare bids

5. **Pages:**
   - `app/(game)/companies/[id]/contracts/page.tsx` - Contract management
   - `app/(game)/contracts/marketplace/page.tsx` - Public marketplace

**Contract Progression Mechanics:**
- **Auto-Progress:** Contracts progress based on assigned employee productivity
  - `dailyProgress = (employeeSkill × productivity × hoursWorked) / contractDifficulty`
  - Multiple employees can work same contract (additive progress)
- **Employee Availability:** Employees working on contracts can't be trained/assigned elsewhere
- **Progress Tracking:** Real-time % completion, estimated completion date
- **Quality Decay:** Unattended contracts lose quality over time (requires active management)
- **Rush Jobs:** Pay 2x employee overtime for 1.5x progress speed (but -10% quality)
- **Subcontracting:** Hire NPC contractors at premium cost (no skill gain for employees)

**Acceptance Criteria:**
- ✅ Generate 20+ contracts per industry daily (replenishing pool)
- ✅ Bidding system with competitor NPCs (3-7 NPCs bid per contract)
- ✅ Award contract to lowest qualified bid (skill requirements check)
- ✅ Progress tracking with employee assignment (employees work on contract)
- ✅ **Auto-progress calculation runs 4x daily** (passive contract completion)
- ✅ Quality score based on employee skill + time management
- ✅ Payment on completion with bonuses/penalties
- ✅ Reputation changes affect future contract offers (+3 to -5 per contract)
- ✅ Transaction logging for all payments
- ✅ Contract completion affects company revenue metrics and reputation

---

### D. DEPARTMENT SYSTEM (50-70h)

#### **FID-20251113-DEP-001: Finance, HR, Marketing, R&D**

**Database Schema:**

```typescript
// src/lib/db/models/Department.ts
interface IDepartment extends Document {
  // Identity
  name: string;
  type: 'Finance' | 'HR' | 'Marketing' | 'R&D';
  company: Types.ObjectId;
  
  // Staff
  manager?: Types.ObjectId;     // Employee assigned as manager
  employees: Types.ObjectId[];  // All employees in department
  budget: number;               // Monthly budget allocation
  
  // Performance
  efficiency: number;           // 1-10, affects output
  level: number;                // 1-5, unlocks features
  experience: number;           // XP towards next level
  
  // Department-Specific Data
  // Finance
  financialReports?: {
    month: Date;
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  }[];
  
  // HR
  recruitmentPipeline?: {
    role: EmployeeRole;
    count: number;
    budget: number;
  }[];
  trainingPrograms?: {
    name: string;
    type: 'Technical' | 'Leadership' | 'Sales' | 'Soft Skills' | 'Industry-Specific';
    duration: number;           // Days
    cost: number;               // Per employee
    baseSkillIncrease: number;  // Base skill points (modified by learningRate)
    prerequisites?: {
      minSkill: number;
      minExperience: number;
      requiredCertifications?: string[];
    };
    certification?: string;      // Award upon completion
    availableSlots: number;      // Max employees per cohort
    enrolledEmployees: Types.ObjectId[];
    startDate?: Date;
    active: boolean;
  }[];
  trainingBudget: number;        // Allocated monthly training budget
  totalTrainingSpend: number;    // Lifetime training investment
  
  // Marketing
  campaigns?: {
    name: string;
    budget: number;
    duration: number;
    reach: number;
    conversions: number;
    ROI: number;
  }[];
  brandValue: number;
  customerAcquisitionCost: number;
  
  // R&D
  projects?: {
    name: string;
    type: string;
    budget: number;
    progress: number;
    assignedResearchers: Types.ObjectId[];
  }[];
  patentCount: number;
  innovationScore: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Department Mechanics:**

**Finance Department:**
- **Cashflow Management:**
  - Real-time cashflow tracking (revenue - expenses)
  - Cashflow projections (7, 30, 90 day forecasts)
  - Burn rate alerts (days until cash runs out)
  - Emergency credit line (auto-activates if cash < $1k, 25% APR penalty)
- P&L statement generation (monthly auto-generated reports)
- Budget allocation to other departments (% of revenue allocation)
- **Loan & Financing System:**
  - Business loans ($10k-$1M, 5-15% APR based on reputation + risk)
  - Line of credit (revolving credit up to 2x monthly revenue)
  - Equipment financing (specific to industry needs)
  - Venture capital (high-growth industries, equity dilution)
  - Interest payments auto-deducted monthly from cash
  - Credit score (0-850) affects loan approval + rates
  - Default triggers bankruptcy proceedings
- **Investment Opportunities (Passive Income):**
  - **Stocks:** Buy shares in NPC companies (5-15% annual returns, volatile)
  - **Bonds:** Government/corporate bonds (2-5% annual returns, stable)
  - **Real Estate:** Rental properties (8-12% annual returns, appreciation)
  - **Index Funds:** Diversified portfolios (7-10% annual returns, low risk)
  - **Dividends:** Quarterly payouts to company cash (auto-deposited)
  - **Portfolio Dashboard:** Track ROI, rebalance allocations, auto-invest
  - **Passive Playstyle:** Invest $100k → earn $8k-12k/year passive income → reinvest
- Tax planning and optimization (quarterly estimated taxes, deductions)
- Audit risk management (higher revenue = higher audit chance)

**HR Department:**
- Recruitment campaigns (bulk hiring)
- Training programs (skill development over time)
  - **Technical Training:** +0.5-1.5 skill points, 14-30 days, $2k-$8k
  - **Leadership Training:** +0.3-1.0 skill points + morale boost, 7-14 days, $3k-$10k
  - **Sales Training:** +0.5-1.2 skill points (sales roles), 10-21 days, $2.5k-$6k
  - **Soft Skills:** +0.2-0.8 skill + loyalty boost, 5-10 days, $1k-$3k
  - **Industry Certifications:** +1.0-2.0 skill cap increase, 30-90 days, $5k-$20k
  - **Advanced Degrees:** +1.5-3.0 skill cap increase, 180-365 days, $30k-$100k (MBA, PhD)
- Mentorship programs (pair senior with junior employees)
- Morale boosters (events, benefits)
- Performance reviews (identify training needs)
- Retention strategies (career development paths)
- Salary benchmarking
- Succession planning (develop future leaders)

**Marketing Department:**
- Marketing campaigns (increase customer base)
- Brand building (improves contract terms)
- Customer acquisition (contracts/revenue)
- Market research (unlock new industries/products)
- Social media management (viral potential)
- ROI tracking

**R&D Department:**
- Research projects (unlock innovations)
- Product development (new offerings)
- Process improvements (efficiency gains)
- Patent filing (IP protection)
- Collaboration with universities (talent pipeline)
- Technology breakthroughs (competitive advantage)

**Files to Create:**

1. **Models & Validation:**
   - `src/lib/db/models/Department.ts` (~500 lines)
   - `src/lib/validations/department.ts` (~300 lines)

2. **API Endpoints:**
   - `app/api/departments/route.ts` - GET, POST (create)
   - `app/api/departments/[id]/route.ts` - GET, PATCH, DELETE
   - `app/api/departments/[id]/assign/route.ts` - POST (assign employee)
   - `app/api/departments/[id]/budget/route.ts` - PATCH (update budget)
   - `app/api/departments/[id]/upgrade/route.ts` - POST (level up)
   - `app/api/departments/finance/reports/route.ts` - GET (P&L)
   - `app/api/departments/hr/recruit/route.ts` - POST (recruitment campaign)
   - `app/api/departments/hr/training/route.ts` - GET (available programs), POST (create program)
   - `app/api/departments/hr/training/[id]/route.ts` - GET, PATCH, DELETE
   - `app/api/departments/hr/training/[id]/enroll/route.ts` - POST (enroll employee)
   - `app/api/departments/hr/training/[id]/complete/route.ts` - POST (mark complete)
   - `app/api/departments/marketing/campaign/route.ts` - POST (launch campaign)
   - `app/api/departments/rd/project/route.ts` - POST (start project)

3. **Utility Functions:**
   - `src/lib/utils/departments/finance.ts` - P&L, loans, taxes
   - `src/lib/utils/departments/hr.ts` - Recruitment, training
   - `src/lib/utils/departments/marketing.ts` - Campaigns, ROI
   - `src/lib/utils/departments/rd.ts` - Research, innovation

4. **UI Components:**
   - `components/departments/DepartmentCard.tsx` - Overview
   - `components/departments/DepartmentList.tsx` - All departments
   - `components/departments/FinanceDashboard.tsx` - P&L, budgets
   - `components/departments/HRDashboard.tsx` - Recruitment, training
   - `components/departments/MarketingDashboard.tsx` - Campaigns, metrics
   - `components/departments/RDDashboard.tsx` - Projects, patents
   - `components/departments/BudgetAllocation.tsx` - Allocate funds
   - `components/departments/EmployeeAssignment.tsx` - Assign to dept

5. **Pages:**
   - `app/(game)/companies/[id]/departments/page.tsx` - Department hub
   - `app/(game)/companies/[id]/departments/[deptId]/page.tsx` - Dept detail

**Acceptance Criteria:**
- ✅ Create 4 departments (Finance, HR, Marketing, R&D)
- ✅ Assign employees to departments (affects their work)
- ✅ Budget allocation system (distribute company funds)
- ✅ Department leveling (1-5, unlocks features)
- ✅ Finance: Generate monthly P&L reports
- ✅ HR: Recruitment campaigns hire multiple employees
- ✅ **HR: Training Programs**
  - Create custom training programs (name, type, duration, cost, skill gain)
  - Enroll multiple employees in cohorts (1-10 per program)
  - Track training progress (days remaining, expected completion)
  - Auto-complete training and apply skill gains
  - Award certifications upon completion
  - Training ROI metrics (skill gain per $ spent)
  - Mentorship programs (pair senior + junior, faster skill growth)
  - Department level unlocks advanced training types (Level 3: Certifications, Level 5: Degrees)
- ✅ Marketing: Campaigns increase contract availability/quality
- ✅ R&D: Projects unlock industry-specific innovations
- ✅ Each department affects company metrics differently

---

### E. INDUSTRY-SPECIFIC MECHANICS (260-350h)

#### **PHASE 4A: Manufacturing Industry** (40-60h)
**FID-20251113-IND-MFG**

**Extended Schema:**
```typescript
interface IManufacturingCompany extends ICompany {
  industry: 'Manufacturing';
  
  // Factory Infrastructure
  factories: {
    name: string;
    location: string;
    size: 'Small' | 'Medium' | 'Large';
    capacity: number;           // Units per day
    utilization: number;        // 0-100%
    maintenanceStatus: 'Good' | 'Fair' | 'Poor';
    lastMaintenance: Date;
  }[];
  
  // Production
  productLines: {
    productName: string;
    SKU: string;
    productionCostPerUnit: number;
    sellingPricePerUnit: number;
    demandLevel: 'Low' | 'Medium' | 'High';
    qualityRating: number;      // 1-5 stars
  }[];
  
  // Inventory
  rawMaterials: {
    materialName: string;
    quantity: number;
    costPerUnit: number;
    supplier: string;
    leadTime: number;           // Days to restock
  }[];
  workInProgress: number;       // Units being manufactured
  finishedGoods: number;        // Units ready to sell
  
  // Supply Chain
  suppliers: {
    name: string;
    reliability: number;        // 1-10
    priceCompetitiveness: number; // 1-10
    leadTime: number;
  }[];
  
  // Quality Control
  defectRate: number;           // % of units with defects
  returnRate: number;           // % of sold units returned
  qualityScore: number;         // 1-100
  
  // Metrics
  unitsProducedTotal: number;
  unitsSoldTotal: number;
  averageMargin: number;        // %
}
```

**Key Mechanics:**
1. **Factory Management:** Purchase/upgrade factories, manage capacity
2. **Production Planning:** Schedule batches, optimize throughput
3. **Inventory Control:** JIT vs stockpiling strategies
4. **Quality Management:** Reduce defects, handle recalls
5. **Supply Chain:** Supplier relationships, bulk discounts
6. **Sales Channels:** B2B contracts, B2C direct sales

**Files:** 18-22 files (schemas, APIs, components, pages)

---

#### **PHASE 4B: E-Commerce Industry** (50-70h)
**FID-20251113-IND-ECOM**

**Extended Schema:**
```typescript
interface IECommerceCompany extends ICompany {
  industry: 'E-Commerce';
  
  // Marketplace
  platform: {
    name: string;
    url: string;
    activeSellerCount: number;
    productListings: number;
    monthlyVisitors: number;
    conversionRate: number;     // %
  };
  
  // Third-Party Sellers
  sellers: {
    sellerName: string;
    productsCount: number;
    salesVolume: number;
    commissionRate: number;     // %
    rating: number;             // 1-5 stars
  }[];
  
  // Logistics
  fulfillmentCenters: {
    location: string;
    capacity: number;           // Packages per day
    utilization: number;        // 0-100%
    averageShippingTime: number; // Hours
  }[];
  
  // Cloud Services (AWS-style)
  cloudServices: {
    computeCapacity: number;    // vCPUs
    storageCapacity: number;    // TB
    bandwidth: number;          // GB/month
    customersCount: number;
    monthlyRevenue: number;
  };
  
  // Subscription (Prime-style)
  subscription: {
    name: string;
    monthlyFee: number;
    subscriberCount: number;
    benefits: string[];
    churnRate: number;          // %
  };
  
  // Advertising
  adPlatform: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  
  // Private Label
  privateLabelProducts: {
    productName: string;
    salesVolume: number;
    margin: number;             // %
  }[];
  
  // Metrics
  grossMerchandiseValue: number; // Total GMV
  takeRate: number;             // % of GMV as revenue
}
```

**Key Mechanics:**
1. **Marketplace Platform:** Onboard sellers, manage catalog
2. **Logistics Network:** Fulfillment centers, shipping optimization
3. **Cloud Services:** Rent compute to other players (recurring revenue)
4. **Subscriptions:** Prime-style membership with benefits
5. **Advertising:** Sponsored products, display ads
6. **Private Label:** Launch own-brand products

**Files:** 22-28 files

---

#### **PHASE 4C: Healthcare Industry** (60-80h)
**FID-20251113-IND-HEALTH**

**Extended Schema:**
```typescript
interface IHealthcareCompany extends ICompany {
  industry: 'Healthcare';
  
  // Medical Services
  facilities: {
    facilityType: 'Clinic' | 'Hospital' | 'SpecialtyCare';
    location: string;
    capacity: number;           // Patients per day
    staffCount: number;
    rating: number;             // 1-5 stars
  }[];
  
  // Pharmaceuticals
  drugPipeline: {
    drugName: string;
    stage: 'Preclinical' | 'Phase1' | 'Phase2' | 'Phase3' | 'FDAReview' | 'Approved';
    startDate: Date;
    estimatedApproval: Date;
    developmentCost: number;
    patentExpiry?: Date;
  }[];
  
  // Insurance
  insurancePlans: {
    planName: string;
    monthlyPremium: number;
    enrollees: number;
    claimsRatio: number;        // Claims paid / premiums collected
    profitMargin: number;
  }[];
  
  // Health Tech
  healthTechProducts: {
    productName: string;
    type: 'EHR' | 'Telemedicine' | 'HealthApp' | 'Diagnostics';
    customers: number;
    monthlyRevenue: number;
  }[];
  
  // Compliance
  complianceStatus: {
    HIPAA: boolean;
    FDA: boolean;
    accreditation: string[];
    lastAudit: Date;
    violations: number;
  };
  
  // Metrics
  patientsServed: number;
  drugsApproved: number;
  insuranceRevenue: number;
  governmentContracts: number;
}
```

**Key Mechanics:**
1. **Medical Services:** Operate clinics, hire doctors/nurses
2. **Drug Development:** 10-year pipeline, FDA approvals
3. **Insurance:** Sell plans, manage risk pools
4. **Health Tech:** EHR, telemedicine, AI diagnostics
5. **Compliance:** HIPAA, FDA, malpractice management
6. **Government Contracts:** Medicare/Medicaid revenue

**Files:** 25-30 files

---

#### **PHASE 4D: Energy Industry** (70-90h)
**FID-20251113-IND-ENERGY**

**Extended Schema:**
```typescript
interface IEnergyCompany extends ICompany {
  industry: 'Energy';
  
  // Oil & Gas
  oilGasOperations: {
    fieldName: string;
    type: 'Oil' | 'Gas' | 'Both';
    productionRate: number;     // Barrels/day or MCF/day
    reserves: number;           // Estimated remaining
    extractionCost: number;     // $/barrel
  }[];
  
  // Renewable Energy
  renewableAssets: {
    assetType: 'Solar' | 'Wind' | 'Hydro' | 'Geothermal';
    location: string;
    capacity: number;           // MW
    generationRate: number;     // MWh/day
    subsidiesReceived: number;
  }[];
  
  // Utilities
  utilities: {
    serviceArea: string;
    customersCount: number;
    gridCapacity: number;       // MW
    reliability: number;        // Uptime %
    regulatedRate: number;      // $/kWh
  }[];
  
  // Trading
  tradingPortfolio: {
    commodity: 'Oil' | 'Gas' | 'Electricity' | 'CarbonCredits';
    position: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
  }[];
  
  // Environmental
  carbonEmissions: number;      // Tons CO2/year
  carbonCredits: number;
  environmentalCompliance: boolean;
  greenEnergyPercent: number;
  
  // Metrics
  totalProduction: number;
  totalRevenue: number;
  costPerUnit: number;
}
```

**Key Mechanics:**
1. **Exploration & Drilling:** Find oil/gas, manage extraction
2. **Renewable Projects:** Build solar/wind farms
3. **Utilities:** Power generation, grid management
4. **Energy Trading:** Commodity futures, arbitrage
5. **Environmental:** Carbon tracking, compliance
6. **Regulations:** Permits, subsidies, policies

**Files:** 28-35 files

---

#### **PHASE 4E: Media Industry** (40-60h)
**FID-20251113-IND-MEDIA**

**Extended Schema:**
```typescript
interface IMediaCompany extends ICompany {
  industry: 'Media';
  
  // Content Production
  contentLibrary: {
    title: string;
    type: 'Film' | 'Series' | 'Music' | 'Podcast' | 'Game';
    productionCost: number;
    releaseDate: Date;
    viewsCount: number;
    rating: number;             // 1-5 stars
    revenueGenerated: number;
  }[];
  
  // Streaming Platform
  streamingService: {
    name: string;
    subscriberCount: number;
    monthlyFee: number;
    contentCount: number;
    churnRate: number;
    adSupportedTier: boolean;
  };
  
  // Social Media
  socialPlatform: {
    platformName: string;
    monthlyActiveUsers: number;
    contentCreators: number;
    adRevenue: number;
    engagementRate: number;     // %
  };
  
  // Advertising
  adInventory: {
    impressionsAvailable: number;
    CPM: number;                // Cost per 1000 impressions
    fillRate: number;           // %
    monthlyRevenue: number;
  };
  
  // IP & Franchises
  intellectualProperty: {
    franchiseName: string;
    valueEstimate: number;
    licensingRevenue: number;
    merchandiseSales: number;
    sequelsPlanned: number;
  }[];
  
  // Viral Metrics
  viralContent: {
    title: string;
    initialViews: number;
    peakViews: number;
    viralityScore: number;      // 1-100
    revenueMultiplier: number;
  }[];
  
  // Metrics
  totalViews: number;
  averageRating: number;
  hitRate: number;              // % of successful content
}
```

**Key Mechanics:**
1. **Content Creation:** Produce films, music, games
2. **Streaming:** Netflix-style subscription service
3. **Social Media:** User-generated content platform
4. **Advertising:** Sell ad inventory
5. **IP Management:** Build franchises, licensing
6. **Viral Growth:** Content can go viral (exponential reach)

**Files:** 18-24 files

---

#### **PHASE 4F: Technology/AI Industry** (60-80h)
**FID-20251113-IND-TECH**

**Full implementation of `dev/ai-industry-design.md` (650 lines)**

**Extended Schema:**
```typescript
interface IAICompany extends ICompany {
  industry: 'Technology';
  
  // Research & Development
  researchFocus: 'LLM' | 'ComputerVision' | 'ReinforcementLearning' | 'GenerativeAI';
  researchBudget: number;
  researchPoints: number;
  publications: number;
  citations: number;
  
  // Model Portfolio
  models: {
    name: string;
    architecture: 'Transformer' | 'CNN' | 'RNN' | 'Diffusion';
    size: 'Small' | 'Medium' | 'Large';
    parameters: number;
    status: 'Training' | 'Completed' | 'Deployed';
    trainingProgress: number;
    trainingCost: number;
    benchmarkScores: object;
    deployed: boolean;
    apiEndpoint?: string;
    pricing?: number;
  }[];
  
  // Infrastructure
  computeType: 'OnPremise' | 'Cloud' | 'Hybrid';
  gpuCount: number;
  gpuUtilization: number;
  cloudCredits: number;
  storageCapacity: number;
  
  // Product Metrics
  apiCalls: number;
  activeCustomers: number;
  uptime: number;
  
  // Reputation
  industryRanking: number;
  acquisitionOffers: number;
}
```

**Key Mechanics:**
1. **Model Training:** Train LLMs, vision models (weeks-months)
2. **Research:** Publish papers, gain citations
3. **Talent Wars:** Hire ML engineers, compete for PhDs
4. **GPU Management:** On-premise vs cloud, cost optimization
5. **Product Deployment:** API services, enterprise licenses
6. **Competition:** Leaderboards, benchmarks, acquisitions

**Files:** 30-40 files (most complex industry)

---

## 🗄️ DATABASE SCHEMA DESIGN

**⚠️ Persistent World Design Principles:**
- **No hard deletes:** Soft delete pattern (deleted: boolean, deletedAt: Date)
- **Audit trails:** Full history of all major actions (permanent record)
- **Archival strategy:** Old data compressed but never removed
- **Scalability:** Schema designed for multi-year growth (billions of records)
- **Data retention:** Everything persists indefinitely (companies, elections, transactions)

### Core Collections

1. **User** (existing) - Authentication, profile
2. **Company** (existing) - Company data, financials, reputation
   - **Reputation System:**
     - `reputation: number` (0-100) - Affects contract quality, employee retention, loan terms
     - `reputationHistory: { date: Date, change: number, reason: string }[]`
     - Gained from: Completing contracts on time/high quality, employee satisfaction, years in business
     - Lost from: Failed contracts, employee churn, regulatory violations
   - **Bankruptcy & Failure:**
     - `cashflow: number` - Running total of cash position
     - `insolvent: boolean` - Triggered when cash < 0 for 7 consecutive game days
     - `bankruptcyDate?: Date` - When bankruptcy proceedings began
     - Bankruptcy triggers: Auto-fire all employees (with 0 severance), cancel all contracts (reputation -50), liquidate assets at 30% value
     - Player can restart with new company (keeps account, loses everything else)
3. **Transaction** (existing) - Financial audit trail

### New Collections (Phase 1-4)

4. **Employee** - NPC workforce
5. **Contract** - Bidding, fulfillment, payments
6. **Department** - Finance, HR, Marketing, R&D
7. **ManufacturingData** - Industry-specific data
8. **ECommerceData** - Marketplace, logistics, cloud
9. **HealthcareData** - Medical, pharma, insurance
10. **EnergyData** - Oil/gas, renewables, trading
11. **MediaData** - Content, streaming, social
12. **AIData** - Models, research, infrastructure
13. **GameEvent** - Random events (market crashes, industry booms, regulatory changes)
   - `eventType: 'Market' | 'Regulatory' | 'Natural' | 'Economic' | 'Industry'`
   - `severity: 'Minor' | 'Moderate' | 'Major' | 'Crisis'`
   - `affectedIndustries: string[]` - Which industries impacted
   - `effects: { type: string, value: number }[]` - Contract prices +20%, employee morale -10%, etc.
   - `duration: number` - How long effect lasts (game days)
   - `probability: number` - Chance to occur each game week (0-1)
14. **Notification** - User notifications
15. **AuditLog** - Admin tracking

### Relationships

```
User (1) ──── (N) Company
Company (1) ──── (N) Employee
Company (1) ──── (N) Department
Company (1) ──── (N) Contract
Company (1) ──── (1) IndustryData (Manufacturing/ECommerce/etc.)
Department (1) ──── (N) Employee
Contract (N) ──── (N) Employee (assigned to work)
Employee (1) ──── (N) Transaction (salary payments)
Contract (1) ──── (N) Transaction (payments)
Company (1) ──── (N) Event
User (1) ──── (N) Notification
```

---

## 🔌 API ENDPOINTS

### Employee Endpoints
- `GET /api/employees` - List all employees (paginated, filtered)
- `POST /api/employees` - Hire employee (deduct salary from cash)
- `GET /api/employees/:id` - Get employee details
- `PATCH /api/employees/:id` - Update employee (salary, department)
- `DELETE /api/employees/:id` - Fire employee (severance payment)
- `POST /api/employees/:id/fire` - Fire with custom terms
- `GET /api/employees/marketplace` - Browse available NPCs
- `POST /api/employees/generate` - Generate new NPCs (admin)

### Contract Endpoints
- `GET /api/contracts` - List contracts (with filters)
- `POST /api/contracts` - Create contract (admin/system)
- `GET /api/contracts/:id` - Get contract details
- `POST /api/contracts/:id/bid` - Submit bid
- `POST /api/contracts/:id/award` - Award contract
- `POST /api/contracts/:id/start` - Start work
- `POST /api/contracts/:id/complete` - Submit completion
- `GET /api/contracts/marketplace` - Public contracts

### Department Endpoints
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department
- `GET /api/departments/:id` - Get department
- `PATCH /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department
- `POST /api/departments/:id/assign` - Assign employee
- `PATCH /api/departments/:id/budget` - Update budget
- `POST /api/departments/:id/upgrade` - Level up
- `GET /api/departments/finance/reports` - P&L reports
- `POST /api/departments/hr/recruit` - Recruitment campaign
- `POST /api/departments/marketing/campaign` - Launch campaign
- `POST /api/departments/rd/project` - Start research project

### Industry-Specific Endpoints
*(Each industry adds 8-15 endpoints)*

**Manufacturing:**
- `POST /api/manufacturing/factories` - Create factory
- `POST /api/manufacturing/production` - Schedule production
- `GET /api/manufacturing/inventory` - View inventory
- `POST /api/manufacturing/purchase-materials` - Buy raw materials
- `GET /api/manufacturing/quality-report` - Quality metrics

**E-Commerce:**
- `POST /api/ecommerce/sellers` - Onboard seller
- `POST /api/ecommerce/fulfillment` - Create fulfillment center
- `POST /api/ecommerce/cloud-services` - Launch cloud service
- `POST /api/ecommerce/subscription` - Manage Prime-style service
- `GET /api/ecommerce/advertising` - Ad platform metrics

**Healthcare:**
- `POST /api/healthcare/facilities` - Open clinic/hospital
- `POST /api/healthcare/drugs` - Start drug development
- `POST /api/healthcare/insurance-plan` - Create insurance plan
- `POST /api/healthcare/health-tech` - Launch health tech product
- `GET /api/healthcare/compliance` - Compliance status

**Energy:**
- `POST /api/energy/exploration` - Start exploration
- `POST /api/energy/renewable-project` - Build solar/wind farm
- `POST /api/energy/trading` - Execute commodity trade
- `GET /api/energy/environmental` - Carbon emissions report

**Media:**
- `POST /api/media/content` - Produce content
- `POST /api/media/streaming` - Launch streaming service
- `POST /api/media/social-platform` - Create social platform
- `GET /api/media/analytics` - Content performance

**Technology/AI:**
- `POST /api/ai/model-training` - Start model training
- `POST /api/ai/research-project` - Begin research
- `POST /api/ai/hire-ml-engineer` - Hire AI talent
- `POST /api/ai/deploy-model` - Deploy to production
- `GET /api/ai/leaderboard` - AI company rankings

---

## 🎨 UI COMPONENTS

### Shared Components (Built in Phase 0)
- `<Tooltip>` - Tippy.js wrapper
- `<CurrencyDisplay>` - Formatted currency
- `<ProgressBar>` - Visual progress indicator
- `<StatCard>` - Metric display card
- `<ConfirmDialog>` - Confirmation modal
- `<DataTable>` - Sortable/filterable table

### Employee Components
- `<EmployeeCard>` - Individual employee display
- `<EmployeeList>` - All employees table
- `<EmployeeMarketplace>` - Browse NPCs
- `<HireModal>` - Hire confirmation
- `<FireModal>` - Fire with severance
- `<EmployeeStatsTooltip>` - Stat explanations
- `<SalaryNegotiation>` - Offer/counter-offer

### Contract Components
- `<ContractCard>` - Contract overview
- `<ContractList>` - All contracts
- `<ContractMarketplace>` - Public contracts
- `<BidModal>` - Submit bid
- `<ContractProgress>` - Track progress
- `<ContractCompletion>` - Submit work
- `<BidComparison>` - Compare bids

### Department Components
- `<DepartmentCard>` - Department overview
- `<DepartmentList>` - All departments
- `<FinanceDashboard>` - P&L, budgets
- `<HRDashboard>` - Recruitment, training
- `<MarketingDashboard>` - Campaigns
- `<RDDashboard>` - Research projects
- `<BudgetAllocation>` - Allocate funds
- `<EmployeeAssignment>` - Assign to dept

### Industry Components
*(Each industry adds 10-15 specialized components)*

---

## 🔗 CROSS-INDUSTRY SYNERGIES

### Strategic Advantages for Owning Multiple Companies

**Technology + Any Industry:**
- AI company can provide analytics/optimization to other companies (-10% costs)
- Cloud services reduce IT overhead for all owned companies
- Proprietary software gives competitive edge in contracts

**Manufacturing + Retail/E-Commerce:**
- Vertical integration (produce + sell = higher margins)
- Guaranteed distribution channel
- Private label products at cost

**Energy + Manufacturing:**
- Reduced energy costs for factories (-15% production costs)
- Priority power allocation during shortages
- Carbon credit trading between companies

**Media + Any Industry:**
- Free advertising for owned companies (worth $10k-$50k/month)
- Brand synergies (cross-promotion)
- Crisis management (reputation damage control)

**Healthcare + Any Industry:**
- Employee health benefits reduce turnover (-20% churn)
- Insurance for owned companies at cost
- Occupational health reduces workplace incidents

**Banking/Finance + Any Industry:**
- Internal loans at 0% interest
- Investment opportunities for other companies
- Financial advisory services

**Political Office + Any Industry:**
- **Direct Policy Benefits:** Pass laws favoring your industries (subsidies, tax breaks)
- **Insider Trading:** Advance knowledge of upcoming regulations (legal in-game)
- **Contract Access:** Government contracts worth 10x normal contracts
- **Regulatory Capture:** Weaken competitors via targeted regulations
- **Risk:** Ethics violations if too blatant (impeachment, reputation loss)
- **Balance:** Political actions have cooldowns (can't spam bills)

**Implementation Notes:**
- Synergies unlock at Company Reputation > 50
- Multi-company management UI shows synergy bonuses
- Tax implications for inter-company transactions
- Political benefits require actual elected office (not just donations)

---

## 📊 IMPLEMENTATION ORDER

### Recommended Sequence (Based on Dependencies)

**Week 1-2: Foundation**
1. ✅ Phase 0: Utility Libraries (8-12h)
   - Currency, random, math, tooltips, IDs
   - Shared UI components

**Week 3-5: Core Systems**
2. ✅ Phase 1: Employee System (40-60h)
   - NPC generation, hiring, management
3. ✅ Phase 2: Contract System (40-60h)
   - Bidding, fulfillment, revenue

**Week 6-8: Company Depth**
4. ✅ Phase 3: Department System (50-70h)
   - Finance, HR, Marketing, R&D

**Week 9-11: Manufacturing & E-Commerce**
5. ✅ Phase 4A: Manufacturing (40-60h)
6. ✅ Phase 4B: E-Commerce (50-70h)

**Week 12-14: Media & Healthcare**
7. ✅ Phase 4E: Media (40-60h)
8. ✅ Phase 4C: Healthcare (60-80h)

**Week 15-17: Energy & Technology**
9. ✅ Phase 4D: Energy (70-90h)
10. ✅ Phase 4F: Technology/AI (60-80h)

**Week 18-22: Polish & Testing**
11. Integration testing
12. Performance optimization
13. UI/UX polish
14. Documentation
15. Bug fixes

---

## 🔗 DEPENDENCIES & BLOCKERS

### Critical Path

```
PHASE 0 (Utilities)
  ↓
PHASE 1 (Employees) ← Required by all industries
  ↓
PHASE 2 (Contracts) ← Revenue generation
  ↓
PHASE 3 (Departments) ← Company structure
  ↓
PHASE 4A-F (Industries) ← Can be done in parallel
```

### Dependency Matrix

| Phase | Depends On | Blocks |
|-------|-----------|--------|
| 0: Utilities | None | All |
| 1: Employees | 0 | 2, 3, 4A-F |
| 2: Contracts | 0, 1 | None |
| 3: Departments | 0, 1 | 4A-F (R&D) |
| 4A: Manufacturing | 1, 2, 3 | None |
| 4B: E-Commerce | 1, 2, 3 | None |
| 4C: Healthcare | 1, 2, 3 (R&D) | None |
| 4D: Energy | 1, 2, 3 (R&D) | None |
| 4E: Media | 1, 2, 3 | None |
| 4F: Technology | 1, 2, 3 (R&D) | None |

---

## 🔄 DATA MIGRATION STRATEGY

### Phased Rollout Approach

**Phase 0-3 (Core Systems):**
- No breaking changes to existing Company schema
- Add new collections (Employee, Contract, Department) without affecting current gameplay
- Existing companies continue functioning normally

**Phase 4 (Industries):**
- Industry-specific data stored in separate collections (ManufacturingData, etc.)
- Linked via `companyId` reference (non-breaking)
- Old industries remain functional, new industries opt-in

**Migration Scripts:**
- `scripts/migrations/001-add-reputation.ts` - Add reputation field to existing companies (default: 50)
- `scripts/migrations/002-add-cashflow.ts` - Calculate initial cashflow from current cash balance
- `scripts/migrations/003-backfill-transactions.ts` - Create transaction history from existing data

**Backwards Compatibility:**
- All new fields optional or have sensible defaults
- API endpoints versioned (`/api/v1/...`)
- Frontend gracefully handles missing data

---

## 🧪 TESTING STRATEGY

### Unit Tests
- **Utilities:** Currency calculations, random generation
- **Models:** Schema validation, virtuals, methods
- **APIs:** Request validation, authorization, business logic

### Integration Tests
- **Employee Flow:** Hire → Assign → Fire → Severance
- **Contract Flow:** Browse → Bid → Award → Complete → Payment
- **Department Flow:** Create → Budget → Assign → Upgrade

### E2E Tests
- **Complete Workflows:** Create company → Hire → Get contract → Complete → Revenue
- **Industry Flows:** Each industry's unique gameplay loop
- **Multi-company:** Cross-company interactions (poaching, bidding)

### Performance Tests
- **API Response Times:** < 200ms p95
- **Database Queries:** < 50ms for indexed queries
- **Page Load:** < 2s LCP
- **Concurrent Users:** Support 100+ simultaneous users

---

## 📈 SUCCESS METRICS

### Development Metrics
- **Velocity:** 40-50h per phase (on schedule)
- **Quality:** 0 TypeScript errors, 80%+ test coverage
- **Documentation:** 100% JSDoc coverage

### Gameplay Metrics
- **Engagement:** Average session > 30 minutes
- **Retention:** 60% day-7 retention
- **Monetization:** (Future) conversion rate > 5%
- **Persistent World Metrics:**
  - Average company age (goal: months/years, not days)
  - Player return rate after 30/60/90 days (long-term retention)
  - Cross-generational wealth (companies passed down/sold)
  - Economic evolution (market concentration, industry dominance shifts)
  - Political legacy (laws still in effect after months)
  - Historical reputation (players known for past actions)
- **Playstyle Distribution:**
  - % Business-only players (never run for office)
  - % Politics-only players (never create companies)
  - % Hybrid players (both systems)
  - % Passive investors (minimal active management)
  - Average session length per playstyle
- **Political-Business Integration:**
  - Campaign spending vs. company revenue correlation
  - Policy passage rate for company owners vs. non-owners
  - Voter engagement in political system
  - Cross-system retention (players active in BOTH politics and business)
  - Persistence: Average company lifespan (goal: months-years, not days)
- **Competition:**
  - 5-10 NPC companies per industry (dynamic market)
  - **NPC Company AI Behavior:**
    - Aggressive (bids low, poaches employees, expands fast, high risk)
    - Conservative (high bids, loyal employees, slow growth, stable)
    - Balanced (moderate strategy, adapts to market)
    - NPCs make decisions every game week (bid on contracts, hire/fire, train employees)
    - NPCs can fail (bankruptcy) and new NPCs spawn to replace them
    - **Persistent NPC history:** Successful NPCs grow into major rivals over weeks/months
    - **Legacy NPCs:** Top companies become permanent fixtures (Amazon/Google equivalents)
    - **Dynamic economy:** Market conditions evolve based on collective player/NPC actions
    - Top NPC companies become "rivals" with special interactions
  - Player companies compete for contracts, employees, market share
  - Industry rankings updated every game week (7 real hours)
  - Market concentration prevents monopolies (max 30% market share triggers antitrust)

### Technical Metrics
- **Performance:** API p95 < 200ms
- **Reliability:** 99.9% uptime
- **Scalability:** Support 10,000+ companies

### Performance Monitoring
- **Database Indexes:**
  - Employee: `{ company: 1, skill: -1 }` - Fast employee lookups
  - Contract: `{ status: 1, industry: 1, biddingDeadline: 1 }` - Contract marketplace queries
  - Transaction: `{ company: 1, createdAt: -1 }` - Financial history
- **Caching Strategy:**
  - Redis for contract marketplace (5 min TTL)
  - Redis for company leaderboards (15 min TTL)
  - In-memory cache for static data (role salaries, industry configs)
- **Background Jobs:**
  - Contract auto-progress: Every 15 minutes (priority: HIGH)
  - Training completion: Every 15 minutes (priority: MEDIUM)
  - Salary deductions: Every 7 real hours (priority: HIGH)
  - Loan interest: Every 30 real hours (priority: MEDIUM)
  - Event generation: Every real hour (priority: LOW)
  - NPC AI decisions: Every 7 real hours (priority: MEDIUM)

---

## ⚠️ RISK MITIGATION

### Identified Risks & Solutions

**Risk 1: Real-time simulation complexity**
- **Mitigation:** Start with 15-minute tick system, can reduce to 5 minutes if performance allows
- **Fallback:** Increase tick interval to 30 minutes if server load too high

**Risk 2: Player confusion with accelerated time**
- **Mitigation:** Clear UI showing "Game Time" vs "Real Time" conversion
- **Solution:** Tutorial explains time system, tooltips show both timescales

**Risk 3: Passive progression exploits**
- **Mitigation:** Cap offline progression benefits (contracts can fail if unattended)
- **Solution:** "Away" status reduces efficiency by 20% (encourages active play)

**Risk 4: NPC competition overwhelming players**
- **Mitigation:** NPCs have "difficulty levels" based on player company age
- **Solution:** New players face weaker NPCs, competition scales with success

**Risk 5: Database performance with 10k+ companies**
- **Mitigation:** Comprehensive indexing strategy (see Performance Monitoring)
- **Solution:** Sharding plan ready if needed (by industry or geography)

**Risk 6: Feature creep during implementation**
- **Mitigation:** Strict adherence to phase plan, "nice-to-haves" go in backlog
- **Solution:** Post-v1.0 roadmap for enhancements (mergers, IPOs, international)

---

## 🎯 NEXT STEPS

**Immediate Actions:**
1. ✅ Review this master plan with user
2. ✅ Get approval to proceed with Phase 0 (Utilities)
3. ✅ Create FID-20251113-UTIL-001 in planned.md
4. ✅ Begin implementation upon approval

**When Ready:**
User says **"code"** or **"proceed"** to trigger implementation of Phase 0.

---

**Created by ECHO v1.0.0 for Business & Politics MMO**  
**Last Updated:** 2025-11-13  
**Status:** READY FOR IMPLEMENTATION ✅
