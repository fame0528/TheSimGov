# 🎮 Business & Politics Simulation MMO - Project Overview

**Project Name:** Politics Game  
**Genre:** Multiplayer Business Simulation with Political Integration  
**Created:** November 2025  
**Status:** Architecture Reset - Clean Rebuild Phase  
**Target:** Production-ready web-based MMO  

---

## 📊 Current Codebase Statistics

**Total Lines:** 177,280 LOC  
**Files:** 456+ files  
**Architecture Status:** ⚠️ Requires complete refactor (65-77% duplication)

### Code Distribution
- **Models:** 51,588 LOC (87 files) - Business logic schemas
- **API Routes:** 47,454 LOC (243 files) - Backend endpoints
- **Utilities:** 23,651 LOC (44 files) - Helper functions
- **Components:** 14,422 LOC (51 files) - React UI components
- **Pages:** 6,368 LOC (31 files) - Next.js routes
- **Other:** 33,797 LOC - Config, types, tests

### Known Issues
- **DRY Violations:** ~117,000-137,000 lines of duplicated code
- **API Duplication:** 243 routes with repeated auth/validation/error patterns
- **Component Duplication:** 51 components with repeated fetch/loading/error patterns
- **Model Duplication:** 87 models with repeated validation/virtuals/middleware
- **Missing Infrastructure:** No centralized API client, minimal shared hooks

**Decision Required:** Full refactor vs clean rebuild vs abandon

---

## 🎯 Game Design Vision

### Core Concept
Players build business empires across 6 major industries, then leverage economic power for political influence. Features full MMO persistence with player-to-player economy, company competition, and political campaigns.

### Time System
- **Acceleration:** 168x real-time (1 hour = 1 week in-game)
- **Persistence:** Full world persistence, no resets
- **Political Terms:** 9 real days (Senate/House), 17.5 real days (President)

### Progression System
5-tier company level system with political power integration:
- **Level 1 (Startup):** $5k-$100k starting capital
- **Level 2 (Small Business):** $100k-$5M operations
- **Level 3 (Regional):** $5M-$50M + political donations unlocked
- **Level 4 (National):** $50M-$500M + lobbying power
- **Level 5 (Fortune 500):** $500M-$3B + run for office enabled

---

## 🏭 Implemented Industries (6/6 Complete)

### 1. Manufacturing Industry ✅
**Status:** Backend + UI Complete  
**Scope:** Production lines, inventory, supply chain, quality control, automation  
**Revenue Streams:** B2B contracts, B2C retail, automation efficiency gains  
**Files:** 15+ models/APIs, production management components  

### 2. E-Commerce Industry ✅
**Status:** Backend + UI Complete  
**Scope:** Marketplace platform, fulfillment centers, cloud services, subscriptions, advertising, private label  
**Revenue Streams:** 
- Marketplace commissions (10-20%)
- FBA fulfillment fees
- Cloud services (70% margins)
- Prime subscriptions
- Advertising platform (CPC/CPM)
- Private label products (40-60% margins)
- Data services
**Files:** 9 models, 29 API endpoints, 8 UI components  
**Features:** Seller management, product catalog, AWS-style cloud, subscription MRR/ARR tracking, ad campaigns, profitability analyzer  

### 3. Technology/Software Industry ✅
**Status:** Backend + UI Complete  
**Scope:** Software development, AI research, SaaS products, cloud infrastructure, consulting, education, innovation/IP  
**Revenue Streams:**
- Software product sales
- AI model licensing
- SaaS subscriptions (MRR/ARR)
- Cloud infrastructure services
- Consulting projects
- Course enrollments
- VC funding rounds
- Patent licensing
**Files:** 13 models, 44 API endpoints, 12 UI components  
**Features:** Product releases, AI model training, subscription analytics, cloud resource management, consulting billing, student progress tracking, cap table management, patent portfolio  

### 4. Media Industry ✅
**Status:** Backend + UI Complete  
**Scope:** Influencer marketplace, sponsorships, ad campaigns, monetization strategies  
**Revenue Streams:**
- Sponsored content
- Ad campaign revenue (CPM/CPC)
- Brand partnerships
- Influencer fees
**Files:** 4 models, 10 API endpoints, 4 UI components  
**Features:** Influencer hiring (3-step wizard), sponsorship tracking, multi-platform ad campaigns, ROI/ROAS calculators, monetization settings  

### 5. Energy Industry ✅
**Status:** Backend + UI Complete  
**Scope:** Oil & gas operations, renewable energy, energy trading, grid management  
**Revenue Streams:**
- Oil/gas extraction and sales
- Renewable energy generation
- Energy commodity trading
- Grid services and storage
**Files:** 9 models, 41 API endpoints, 8 UI components  
**Features:** Well management, solar/wind farms, trading strategies, grid optimization, compliance tracking, environmental impact monitoring  

### 6. Healthcare Industry ⏳
**Status:** Models Complete (7 files, 4,112 LOC), APIs Deleted (ECHO violations)  
**Scope:** Hospitals, clinics, medical staff, patients, insurance, compliance, emergency services  
**Revenue Streams:**
- Patient care services
- Insurance billing
- Emergency services
- Quality bonuses
**Files:** 7 models created, 40 API endpoints planned, 10 UI components planned  
**Next Step:** Rebuild APIs with proper architecture  

---

## 🏗️ Core Systems Implemented

### Employee System ✅
**Status:** Complete  
**Features:**
- 12 skill fields (technical, sales, leadership, etc.)
- 6 training program types
- Skill progression (1-100 scale with caps)
- Certification system
- Retention mechanics (satisfaction scoring)
- Poaching system (competitor theft, non-compete clauses)
- Performance reviews
- Salary negotiation with market rates

### Contract System ✅
**Status:** Complete  
**Features:**
- 5 contract types (Government, Private, Retail, Long-term, Project-based)
- NPC competitive bidding (3-7 competitors, 4 AI personalities)
- 168x time acceleration
- Skill-based auto-progression
- 5-dimension quality scoring
- Reputation impact system
- Marketplace with advanced filtering
- Analytics dashboard

### Department System ✅
**Status:** Complete  
**Features:**
- Finance Department: Loans, investments, cashflow projections
- HR Department: Automated hiring, training, retention analytics
- Marketing Department: Campaign system, reputation management
- R&D Department: Innovation queue, efficiency upgrades
- Budget allocation UI
- Cross-department synergies

### Banking System ✅
**Status:** Complete  
**Features:**
- 5 NPC banks with personality traits
- FICO credit scoring (300-850)
- 5 loan types (personal, business, equipment, real estate, line of credit)
- Auto-payment system
- Late fees (30/60/90/120 day escalation)
- Foreclosure mechanics
- Player banking license ($500k, Level 3+)
- Basel III CAR compliance (≥8%)

### Politics Integration ✅
**Status:** Complete  
**Features:**
- Campaign donation system (Level 3+, $5k-$10M caps by level)
- Lobbying system (Level 4+, 10-200 power points)
- Run for office (Level 5: President, Senate, Governor)
- Political influence utilities (13 functions)
- Level-gated political actions
- Outcome generation system

### AI Industry System ✅
**Status:** Phases 1-5.2 Complete  
**Features:**
- AI model training and deployment
- Research lab breakthroughs
- Compute resource trading
- Infrastructure optimization (PUE, cooling, power)
- AGI development system (12 milestones)
- Alignment challenges
- Industry dominance tracking
- Global impact events
- Market share analysis
- Regulatory pressure system

---

## 🎨 Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **State Management:** React hooks, Context API
- **Forms:** React Hook Form
- **Notifications:** react-toastify
- **Icons:** Lucide React
- **Charts:** Recharts (planned)

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes (REST)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js
- **Validation:** Zod schemas
- **Real-time:** Socket.io (planned)

### Development
- **Language:** TypeScript (strict mode)
- **Linting:** ESLint
- **Testing:** Jest + React Testing Library
- **Package Manager:** npm
- **Version Control:** Git

---

## 📁 Project Structure

```
/politics
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (game)/                   # Game pages (companies, contracts, politics)
│   │   ├── ai-companies/         # AI industry pages
│   │   ├── banking/              # Banking pages
│   │   ├── companies/            # Company management
│   │   ├── contracts/            # Contract system
│   │   ├── ecommerce/            # E-commerce pages
│   │   ├── energy/               # Energy industry pages
│   │   ├── manufacturing/        # Manufacturing pages
│   │   ├── media/                # Media industry pages
│   │   └── technology/           # Technology industry pages
│   ├── api/                      # API routes (243 files, needs refactor)
│   │   ├── ai/                   # AI industry endpoints
│   │   ├── banking/              # Banking endpoints
│   │   ├── companies/            # Company CRUD
│   │   ├── contracts/            # Contract endpoints
│   │   ├── departments/          # Department endpoints
│   │   ├── ecommerce/            # E-commerce endpoints
│   │   ├── employees/            # Employee endpoints
│   │   ├── energy/               # Energy endpoints
│   │   ├── manufacturing/        # Manufacturing endpoints
│   │   ├── media/                # Media endpoints
│   │   ├── politics/             # Politics endpoints
│   │   └── technology/           # Technology endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── providers.tsx             # Context providers
│
├── components/                   # React components (51 files)
│   ├── ai/                       # AI industry components
│   ├── auth/                     # Auth forms
│   ├── banking/                  # Banking UI
│   ├── companies/                # Company forms/cards
│   ├── contracts/                # Contract UI (11 components)
│   ├── departments/              # Department dashboards
│   ├── employees/                # Employee management
│   ├── energy/                   # Energy industry UI
│   ├── layout/                   # Navigation, menus
│   ├── locations/                # Location selection
│   ├── manufacturing/            # Manufacturing UI
│   ├── media/                    # Media industry UI
│   ├── politics/                 # Politics UI
│   ├── technology/               # Technology UI
│   └── ui/                       # Shared UI primitives
│
├── lib/                          # Shared libraries
│   ├── auth/                     # Auth utilities
│   ├── db/                       # Database
│   │   ├── models/               # Mongoose models (87 files)
│   │   │   ├── AGIMilestone.ts
│   │   │   ├── AIModel.ts
│   │   │   ├── AIResearchProject.ts
│   │   │   ├── Bank.ts
│   │   │   ├── Company.ts
│   │   │   ├── Contract.ts
│   │   │   ├── ContractBid.ts
│   │   │   ├── Department.ts
│   │   │   ├── Employee.ts
│   │   │   ├── GlobalImpactEvent.ts
│   │   │   ├── Loan.ts
│   │   │   └── ... (74 more models)
│   │   └── mongoose.ts           # MongoDB connection
│   ├── notifications/            # Toast utilities
│   └── utils/                    # Utility functions (44 files)
│       ├── ai/                   # AI utilities
│       ├── banking/              # Banking utilities
│       ├── ecommerce/            # E-commerce utilities
│       ├── energy/               # Energy utilities
│       ├── finance/              # Financial calculations
│       ├── manufacturing/        # Manufacturing utilities
│       └── ... (scattered utilities)
│
├── src/                          # Source files
│   ├── constants/                # Game constants
│   ├── lib/                      # Additional libraries
│   └── types/                    # TypeScript types
│
├── dev/                          # ECHO development tracking
│   ├── planned.md                # Planned features
│   ├── progress.md               # In-progress work
│   ├── completed.md              # Completed features
│   ├── QUICK_START.md            # Session recovery
│   ├── roadmap.md                # Strategic roadmap
│   ├── architecture.md           # Architecture decisions
│   ├── metrics.md                # Performance metrics
│   └── lessons-learned.md        # Development insights
│
├── docs/                         # Documentation
│   ├── API.md                    # API documentation
│   ├── AUTHENTICATION.md         # Auth system docs
│   └── COMPLETION_REPORT_*.md    # Feature completion reports
│
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind configuration
├── package.json                  # Dependencies
└── README.md                     # Project README
```

---

## 🎮 Implemented Features

### Company Management
- ✅ Company creation with industry selection
- ✅ 5-level progression system
- ✅ Financial tracking (revenue, expenses, profit)
- ✅ 70 unique industry × level configurations
- ✅ Real-world cost structures ($5k → $3B)
- ✅ State/location selection
- ✅ Company dashboards

### Employee Management
- ✅ Hire employees with 12 skill fields
- ✅ 6 training program types
- ✅ Skill progression and certifications
- ✅ Retention mechanics (satisfaction, poaching)
- ✅ Performance reviews
- ✅ Salary negotiation

### Contract System
- ✅ 5 contract types with tier scaling
- ✅ Competitive NPC bidding (4 AI personalities)
- ✅ Auto-progression based on employee skills
- ✅ Quality scoring (5 dimensions)
- ✅ Reputation impact (-20 to +20)
- ✅ Marketplace with filtering/sorting
- ✅ Analytics dashboard

### Banking & Finance
- ✅ 5 NPC banks with credit scoring
- ✅ 5 loan types
- ✅ Auto-payment system
- ✅ Late fees and foreclosure
- ✅ Player banking license (Level 3+)
- ✅ Basel III compliance

### Politics
- ✅ Campaign donations (Level 3+)
- ✅ Lobbying system (Level 4+)
- ✅ Run for office (Level 5)
- ✅ Political influence scoring
- ✅ Level-gated actions

### Industry-Specific
- ✅ Manufacturing: Production, inventory, supply chain
- ✅ E-Commerce: Marketplace, fulfillment, cloud, ads
- ✅ Technology: Software, AI, SaaS, consulting, IP
- ✅ Media: Influencers, sponsorships, campaigns
- ✅ Energy: Oil/gas, renewables, trading, grid
- ⏳ Healthcare: Models complete, APIs pending rebuild

---

## 🚧 Architecture Challenges

### Current Issues
1. **API Duplication:** 243 route files repeat auth/validation/error handling
2. **Component Duplication:** 51 components repeat fetch/loading/error patterns
3. **Model Duplication:** 87 models repeat validation/virtuals/middleware
4. **Missing Infrastructure:**
   - No centralized API client
   - Minimal shared hooks (1 file only)
   - Scattered utility functions
   - No shared component library

### Required Refactor
To achieve production quality, need to:
1. Create centralized API client (`lib/api/apiClient.ts`)
2. Build shared hooks library (`lib/hooks/`)
3. Extract common component patterns
4. Consolidate model base classes
5. Centralize validation schemas
6. Implement proper error boundaries
7. Add loading state management
8. Create shared UI component library

### Estimated Impact
- **Current:** 177,280 LOC with 65-77% duplication
- **Target:** 40,000-60,000 LOC with proper abstractions
- **Savings:** ~117,000-137,000 lines eliminated
- **Quality:** Production-ready, maintainable, scalable

---

## 📈 Development Metrics

### Completed Features (via ECHO tracking)
- FID-20251113-EMP: Employee System ✅
- FID-20251113-CON: Contract System ✅
- FID-20251113-DEPT: Department System ✅
- FID-20251113-MFG-P4: Manufacturing Industry ✅
- FID-20251115-BANK-001: NPC Banking ✅
- FID-20251115-LEVEL-001-004: Company Levels ✅
- FID-20251115-AI-001-P5.2: AI Industry ✅
- FID-20251115-TESTING: Test Infrastructure ✅
- FID-20251116-PERFECT: AAA Quality Achievement ✅
- FID-20251117-ECOM-001: E-Commerce Industry ✅
- FID-20251117-TECH-001: Technology Industry ✅
- FID-20251117-MEDIA-001-003: Media Industry ✅
- FID-20251118-ENERGY-001: Energy Industry ✅
- FID-20251119-TECH-002: Tech Industry Enhancement ✅

### TypeScript Quality
- **Current Errors:** 76 baseline (unrelated to new features)
- **Production Code:** 0 errors in all new features
- **Strict Mode:** Enabled
- **Type Safety:** 99% compliant

### Test Coverage
- **Auth Tests:** 25 passing
- **Integration Tests:** 7 passing
- **Overall Coverage:** 16.7% (needs improvement)

---

## 🎯 Strategic Options

### Option A: Full Refactor
**Goal:** Fix existing 177K LOC codebase  
**Time:** 4-6 weeks minimum  
**Risk:** Extremely high (400+ files to touch)  
**Outcome:** Still mixed quality architecture  

### Option B: Clean Rebuild
**Goal:** Restart with proper architecture, preserve knowledge  
**Time:** 2-3 weeks  
**Risk:** Low (proven patterns, clean slate)  
**Outcome:** Production-quality 40-60K LOC  
**What to Keep:**
- Game design documents
- Business logic formulas
- Database schemas (as reference)
- All lessons learned

### Option C: Incremental Migration
**Goal:** Build new architecture alongside old  
**Time:** 3-4 weeks  
**Risk:** Medium (dual maintenance)  
**Outcome:** Gradual improvement, mixed quality during transition  

### Option D: Abandon Project
**Goal:** Cut losses, move on  
**Time:** 0 hours  
**Risk:** None  
**Outcome:** Apply lessons to future projects  

---

## 💡 Key Learnings

### What Worked Well
- ✅ Comprehensive game design with 70 level × industry configurations
- ✅ Complex business logic (quality scoring, skill matching, credit scoring)
- ✅ Real-world research integration (SBA data, industry benchmarks)
- ✅ ECHO development system for tracking and quality
- ✅ TypeScript strict mode preventing type errors
- ✅ Modular industry expansion approach

### What Didn't Work
- ❌ Copy-paste development without abstractions
- ❌ No upfront infrastructure planning
- ❌ Building features before utilities
- ❌ Insufficient code review for DRY violations
- ❌ Missing shared component library from day 1
- ❌ No centralized API client pattern

### Critical Lessons
1. **Build infrastructure first** - Utilities, hooks, API client before features
2. **DRY is non-negotiable** - Every duplication multiplies maintenance cost
3. **Template patterns** - First feature sets the pattern for all others
4. **Abstractions early** - Harder to refactor than build right initially
5. **Code review checkpoints** - Catch violations before they spread

---

## 📚 Documentation

### Game Design
- `dev/roadmap.md` - Strategic roadmap with 6 industries
- `dev/ai-industry-design.md` - AI industry 9-phase plan (683 lines)
- `dev/planned-utilities.md` - Utility function specifications (571 lines)
- `dev/architecture.md` - Technical architecture decisions
- `dev/MASTER_IMPLEMENTATION_PLAN.md` - Phase-by-phase implementation guide

### Archived Specs
- `dev/archives/specs/COMPANY_LEVEL_SYSTEM_SPEC.md` (1,423 lines)
- `dev/archives/specs/BANKING_SYSTEM_SPEC.md` (811 lines)
- `dev/archives/specs/POLITICS_BUSINESS_INTEGRATION.md` (608 lines)

### API Documentation
- `docs/API.md` - REST API endpoints
- `docs/AUTHENTICATION.md` - Auth system documentation
- `docs/ECOMMERCE_API.md` - E-commerce endpoints
- Multiple completion reports in `/docs`

### Development Tracking
- `dev/progress.md` - Active work tracking
- `dev/completed.md` - Completed features log
- `dev/metrics.md` - Development velocity metrics
- `dev/lessons-learned.md` - Insights and improvements
- `dev/QUICK_START.md` - Session recovery guide

---

## 🔧 Development Commands

### Setup
```bash
npm install              # Install dependencies
npm run dev              # Start development server (localhost:3000)
```

### Quality Checks
```bash
npm run type-check       # TypeScript strict mode check
npm test                 # Run test suite
npm run lint             # ESLint check
```

### Database
- **Connection:** MongoDB Atlas or local MongoDB
- **Database Name:** `power`
- **Collections:** User, Company, Employee, Contract, Department, Bank, Loan, and 80+ more

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/power
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

---

## 🎲 Game Economy Design

### Company Costs by Level
| Level | Startup Cost | Industry Examples |
|-------|-------------|-------------------|
| L1 | $5k-$100k | Media influencer, small retail |
| L2 | $100k-$5M | Regional manufacturing, local banks |
| L3 | $5M-$50M | State-wide operations, political donations |
| L4 | $50M-$500M | National presence, lobbying power |
| L5 | $500M-$3B | Fortune 500, run for President |

### Revenue Streams
**Manufacturing:** B2B contracts, retail sales, automation efficiency  
**E-Commerce:** 7 streams (commissions, fees, cloud, subscriptions, ads, private label, data)  
**Technology:** 8 streams (software, AI, SaaS, cloud, consulting, education, VC, patents)  
**Media:** 4 streams (sponsored content, ads, partnerships, influencer fees)  
**Energy:** 4 streams (extraction, generation, trading, grid services)  
**Healthcare:** 4 streams (patient care, insurance, emergency, quality bonuses)  

### Time Economics
- **1 real hour** = 1 game week (168x acceleration)
- **1 real day** = ~3.4 game months
- **Political campaigns:** 26 real hours (~1 day)
- **Senate term:** 9 real days
- **President term:** 17.5 real days

---

## 🚀 Next Steps

### Immediate Actions Required
1. **Strategic Decision:** Choose Option A, B, C, or D above
2. **If Refactor:** Create detailed refactor plan with phasing
3. **If Rebuild:** Extract core business logic, design new architecture
4. **If Abandon:** Document lessons learned for future projects

### Post-Decision Tasks
- Update `dev/progress.md` with chosen path
- Create FID for architecture work
- Set realistic timeline and milestones
- Define success metrics for new approach

---

## 📞 Project Status

**Current State:** Architecture Decision Point  
**Codebase Health:** 177K LOC with 65-77% duplication  
**Production Readiness:** Not production-ready without refactor  
**Next Action:** User decision on strategic direction  

---

**Last Updated:** November 20, 2025  
**Maintained By:** ECHO v1.1.0 Development System  
**Project Repository:** d:/dev/politics  
