# 🏗️ Architecture & Technical Decisions

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**ECHO Version:** v1.0.0

---

## 🎯 Architecture Overview

### **Frontend Architecture**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** Chakra UI v2
- **State Management:** Zustand (global) + React Context (auth/game)
- **Type Safety:** TypeScript strict mode (100% compliance)
- **Styling:** Emotion (Chakra UI's styling engine)

### **Backend Architecture**
- **API Routes:** Next.js API Routes (serverless functions)
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.io (custom Node.js server)
- **Authentication:** NextAuth.js v5 (Auth.js)
- **Validation:** Zod schemas for runtime type validation

### **Testing Strategy**
- **Unit Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright (multi-browser)
- **Coverage Target:** 80% minimum
- **CI/CD:** Tests run on all pull requests

---

## 🔐 Security Architecture

### **Authentication Flow**
1. User registers with email + first/last name
2. System auto-generates username (firstname_lastname_XXXX)
3. Password hashed with bcrypt (12 rounds)
4. NextAuth.js manages sessions with JWT
5. Middleware protects game routes

### **Security Measures**
- ✅ OWASP Top 10 compliance by design
- ✅ Input validation with Zod schemas
- ✅ MongoDB injection prevention (parameterized queries)
- ✅ Rate limiting on API endpoints
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ No sensitive data in logs or error messages

---

## 🔄 Real-time Architecture (Socket.io)

### **Namespaces**
- `/chat` - Player messaging and chat rooms
- `/elections` - Voting and campaign events
- `/market` - Real-time market price updates

### **Event Flow**
```
Client → Socket.io Client → WebSocket Connection
  ↓
Custom Server (server.js) → Socket.io Namespaces
  ↓
Event Handlers → Business Logic (via API routes)
  ↓
Broadcast to Clients → Real-time UI Updates
```

### **Scalability Considerations**
- Socket.io supports horizontal scaling with Redis adapter
- Room-based broadcasting for efficient updates
- Namespace isolation prevents event conflicts

---

### **Database Schema Strategy**

### **MongoDB Collections**
- `users` - Player accounts with first/last names, state selection, archetype, reputation
- `companies` - Player-owned businesses with industry, departments, credit score
- `employees` - NPC employees with skills, loyalty, salary, morale
- `properties` - Real estate holdings with condition, tenants, income
- `elections` - Political campaigns (local, state, federal) with spending, promises
- `policies` - Laws and regulations (local, state, federal) with economic impacts
- `offices` - Elected positions (mayor, governor, congress, president) with incumbents
- `governments` - Local and state government structures with budgets
- `transactions` - Financial activity logs with type, parties, amounts
- `market_data` - Historical price data for all tradeable assets
- `events` - Active and historical events with choices and outcomes
- `contracts` - Business contracts (construction bids, supply agreements)
- `syndicates` - Player alliances/partnerships with shared resources
- `auctions` - Active auctions for rare assets with bids
- `loans` - Active loans with interest rates, repayment schedules, default risk
- `stocks` - Public company shares with prices, dividends, volumes

### **Data Modeling Principles**
- Embed when data is always accessed together
- Reference when data is large or frequently updated independently
- Denormalize for read-heavy operations (leaderboards)
- Index critical query fields (userId, companyId, timestamps)

---

## 🎮 Game Systems Architecture

### **Company System**
```
Company Creation → Industry Selection → Archetype Selection
  ↓
Operations Management (Hire NPC Employees, Fulfill Contracts, Deliver Services)
  ↓
Department Management (Finance, HR, Marketing, R&D)
  ↓
Financial Tracking (Revenue Streams, Expenses, Profit/Loss, Credit Score)
  ↓
Growth & Expansion (New Markets, Mergers, Acquisitions, Portfolio Diversification)
```

### **Player Archetypes**
- **Innovator**: Focus on R&D, new products, efficiency upgrades
- **Ruthless Tycoon**: Aggressive expansion, hostile takeovers, reputation risk
- **Ethical Builder**: Sustainable growth, employee morale, public trust

Archetypes influence:
- Random events and outcomes
- Reputation mechanics
- Available options in choice-based events
- NPC reactions and opportunities

### **Industry Systems**

**Construction:**
- Bid on NPC/government contracts
- Allocate construction crews (NPC employees)
- Deliver projects on time (reputation impact)
- Risk: Worker strikes, material shortages, delays
- Reward: Steady cash flow, government contracts

**Real Estate:**
- Buy properties (auctions, market, foreclosures)
- Renovate (upgrade value, attract tenants)
- Rent (passive income, tenant management)
- Sell (market timing, capital gains)
- Risk: Market crashes, tenant defaults, property damage
- Reward: Long-term appreciation, passive income

**Crypto:**
- Trade volatile tokens (high frequency)
- Launch ICOs (fundraising for projects)
- Risk: Extreme volatility, hacks, regulation changes
- Reward: Massive gains from speculation

**Stocks:**
- Buy/sell shares (public companies)
- Earn dividends (long-term holdings)
- React to rumors and insider info
- Risk: Market manipulation, crashes, insider trading penalties
- Reward: Portfolio diversification, passive dividends

**Retail/Manufacturing:**
- Produce goods (inventory management)
- Manage supply chains (sourcing, logistics)
- Sell to NPC/player markets (dynamic pricing)
- Risk: Oversupply, demand fluctuations, competition
- Reward: Scalable operations, brand building

**Banking:**
- Offer loans to players/NPCs
- Earn interest (steady income)
- Risk: Loan defaults, credit risk
- Reward: Low volatility, compounding returns

### **Employee System (NPCs)**
```
Employee Stats:
- Skill Level (1-10): affects productivity
- Loyalty (1-10): affects retention, strike risk
- Salary Demand: market-based, skill-dependent
- Morale: influenced by pay, company performance, events

HR Management:
- Hire: skill vs. cost trade-off
- Fire: morale impact, severance costs
- Train: improve skills, increase productivity
- Promote: boost morale, increase salary

Employee Events:
- Strikes (low morale, industry-wide)
- Resignations (competitors poaching)
- Performance reviews (skill increases)
- Union negotiations (wage demands)
```

### **Political System**
```
Player Selects State → Assigned to Local Government
  ↓
Local Elections (Mayor, City Council, County Supervisor)
  ↓
State Elections (Assembly, Senate, Governor)
  ↓
Federal Elections (US House, US Senate, President)
  ↓
Winner Takes Office → Policy Creation (by level) → Policy Voting
  ↓
Implementation → Economic Impact (local/state/federal) → Player Reactions
```

### **Economic System**
```
Player Actions → Supply/Demand Calculations
  ↓
Price Adjustments → Market Updates (Socket.io)
  ↓
Player Decisions → Feedback Loop
  ↓
Policy Changes → Economic Impact → Strategic Responses
```

**Economic Mechanisms:**
- **Dynamic Pricing**: Supply/demand based on player actions
- **Market Cycles**: Boom/bust patterns (algorithmic)
- **Policy Impact**: Taxes, regulations, subsidies affect industries
- **Inflation/Deflation**: Currency value fluctuations
- **Credit System**: Interest rates, credit scores, loan availability
- **Bankruptcy**: Debt > Assets triggers liquidation

### **Event System Architecture**

**Event Categories:**
1. **Business Events**
   - Worker strikes (morale-based)
   - Supply chain disruptions (random/policy-driven)
   - Market crashes (cyclical + random)
   - Competitor actions (NPC companies)
   - Regulatory investigations (policy enforcement)

2. **Political Events**
   - Election campaigns (seasonal cycles)
   - Political scandals (corruption, investigations)
   - Policy shifts (new laws, repeals)
   - International relations (trade agreements, embargoes)

3. **Global Events**
   - Pandemics (economic slowdown, industry impacts)
   - Wars/conflicts (defense spending, trade disruption)
   - Natural disasters (local/regional economic impact)
   - Technology breakthroughs (industry disruption)

4. **Personal Events**
   - Archetype-specific opportunities
   - Reputation-based outcomes
   - Choice-driven consequences
   - Random opportunities/crises

**Event Flow:**
```
Event Triggered (time/condition) → Player Notification
  ↓
Choice Presented (2-4 options) → Consequence Preview
  ↓
Player Decision → Immediate Impact + Long-term Effects
  ↓
Reputation Change → Future Event Probabilities Adjusted
```

### **Reputation & Consequences System**
```
Reputation Factors:
- Business Ethics (layoffs, environmental practices)
- Political Actions (lobbying, corruption)
- Public Relations (charity, scandals)
- Employee Treatment (wages, safety)
- Archetype Alignment (consistent choices)

Reputation Effects:
- Election chances (voters trust/fear)
- Business opportunities (partnerships, contracts)
- Employee morale (attract talent)
- Media coverage (positive/negative events)
- Investigation risk (regulatory scrutiny)
```

---

## 📁 Project Structure Rationale

### **App Router Structure**
```
app/
├── (auth)/        # Route group: unauthenticated pages
├── (game)/        # Route group: authenticated game pages
├── api/           # API routes (RESTful endpoints)
├── layout.tsx     # Root layout (providers, global styles)
└── page.tsx       # Landing page
```

**Benefits:**
- Route groups organize related pages
- Shared layouts reduce duplication
- Middleware can protect route groups
- Clear separation of auth/game contexts

### **Component Organization**
```
components/
├── auth/          # Login, register, auth forms
├── companies/     # Company management UI
├── real-estate/   # Property management UI
├── politics/      # Elections, policies UI
└── ui/            # Generic reusable components
```

**Benefits:**
- Domain-driven organization
- Easy to find related components
- Clear ownership boundaries
- Reusability through ui/ folder

---

## 🧪 Testing Architecture

### **Unit Testing Strategy**
- Test business logic in isolation
- Mock external dependencies (DB, Socket.io)
- Focus on edge cases and error handling
- Snapshot tests for complex UI components

### **E2E Testing Strategy**
- Critical user flows (register, login, create company)
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsiveness tests
- Real-time features (Socket.io events)

### **Performance Testing**
- API response time benchmarks
- Page load metrics (Core Web Vitals)
- Socket.io latency measurements
- Database query performance

---

## 🚀 Deployment Architecture

### **Production Environment**
- **Hosting:** Vercel (Next.js optimized)
- **Database:** MongoDB Atlas (managed service)
- **Real-time:** Custom server deployment (Railway/Render)
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics + Custom logging

### **CI/CD Pipeline**
1. Push to feature branch
2. Run linting + type checking
3. Run unit tests + E2E tests
4. Build Next.js production bundle
5. Deploy preview to Vercel
6. Manual approval for production

---

## 📈 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (p95) | < 200ms | Server logs |
| Page Load (FCP) | < 1.8s | Lighthouse |
| Page Load (LCP) | < 2.5s | Lighthouse |
| Socket.io Latency | < 100ms | Custom monitoring |
| TypeScript Errors | 0 | Build process |
| Test Coverage | > 80% | Jest coverage |
| ESLint Errors | 0 | CI/CD pipeline |

---

## 🔧 Development Tools

### **Required**
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- Git

### **Recommended**
- VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Playwright Test for VS Code
- Postman/Insomnia (API testing)
- MongoDB Compass (database GUI)

---

## 📚 Key Technical Decisions

### **Why Next.js 15 App Router?**
- File-based routing reduces boilerplate
- Server Components improve performance
- Built-in API routes eliminate separate backend
- Excellent TypeScript support
- Vercel deployment optimization

### **Why Socket.io?**
- Battle-tested real-time library
- Automatic reconnection handling
- Room/namespace organization
- Fallback to polling if WebSocket unavailable
- Easy horizontal scaling with Redis

### **Why MongoDB?**
- Flexible schema for evolving game systems
- Excellent performance for read-heavy workloads
- Horizontal scaling with sharding
- Rich query capabilities (aggregation pipeline)
- Managed service availability (Atlas)

### **Why Zustand?**
- Lightweight (< 1KB)
- Simple API (no boilerplate)
- TypeScript-first design
- DevTools integration
- No Provider wrapping needed

---

## 🛡️ Code Quality Standards

### **TypeScript Configuration**
- Strict mode enabled (all strict flags)
- No implicit any allowed
- Unused variables/parameters flagged
- Consistent file naming (camelCase for files, PascalCase for components)

### **Code Review Checklist**
- ✅ TypeScript strict mode passing
- ✅ ESLint with no warnings
- ✅ Unit tests for business logic
- ✅ JSDoc comments on public APIs
- ✅ Error handling implemented
- ✅ Input validation with Zod
- ✅ Security considerations addressed
- ✅ Performance implications reviewed

---

## 🧱 Company Level & Progression System

### Data Models
- `Company` (extended): `level` (1-5), `experience`, `levelName`, `levelHistory[]`, `reputation`, `brandValue`, `operatingCosts` fields
- `Contract` (extended): `tier` (Local, Regional, State, National, Global), `xpReward`
- `CompanyLocation`: location data with limits by level (L1:1, L2:5, L3:30, L4:500, L5:10,000)
- `Scandal`: records negative events impacting reputation

### Constants & Types
- `src/constants/companyLevels.ts`: 70 configurations (14 industries × 5 levels), includes Technology subcategories (AI, Software, Hardware)
- `src/types/companyLevels.ts`: Strongly-typed level config interfaces

### APIs
- `POST /api/companies/[id]/upgrade` → Validates requirements (XP, revenue, employees, cash) and upgrades level
- `POST /api/companies/[id]/add-experience` → Award XP (contracts/revenue milestones)
- `GET /api/companies/[id]/level-info` → Returns requirements, progress, blockers

### Utilities
- `lib/utils/levelProgression.ts` → XP formulas, requirement checks, feature unlocks
- `lib/utils/operatingCosts.ts` → Monthly cost calculations by level (salaries, facilities, marketing, R&D)
- `lib/utils/financialHealth.ts` → Cash runway, debt ratio, warnings
- `lib/utils/contractGeneration.ts` → Contract tiers by level with scaled XP/revenue

### UI Components
- `CompanyLevelDisplay` (progress bars), `UpgradeModal` (checklist), `LevelBadge` (bronze→diamond), `OperatingCostsBreakdown`

### Integration Points
- Contracts completion → XP gain
- Level gates → Politics (donations L3+, lobbying L4+, run for office L5)
- Level gates → Locations cap, employee salary tiers, contract visibility

---

## 🏦 Banking System Architecture

### Data Models
- `CreditScore`: per-company 300–850 score with factor breakdown (payment history, DTI, utilization, age, inquiries)
- `Loan`: principal, rate, term, due dates, status, collateral, payment history
- `Bank` (NPC): type (CreditUnion, Regional, National, Investment, SBA), base rates, policy strictness
- `PlayerBank` (on `Company`): tierOneCapital, CAR, lending policy, portfolio KPIs

### APIs
- `POST /api/banking/apply` → Create loan application, compute approval probability, return offers
- `GET /api/banking/loans` → List loans for company
- `POST /api/banking/payments` → Process due payments, apply late fees
- `POST /api/banking/player/create` → Apply for banking license (Level 3+ Banking)
- `POST /api/banking/player/lend` → Originate player-to-player loan with policy checks

### Utilities
- `lib/utils/creditScoring.ts` → FICO-style scoring, penalties/rewards
- `lib/utils/loanCalculations.ts` → Amortization, APR, payment schedules
- `lib/utils/loanServicing.ts` → Daily cron-compatible servicing (late fees, status transitions)
- `lib/utils/foreclosure.ts` → Collateral seizure/default handling
- `lib/utils/playerBanking.ts` → Capital adequacy, portfolio risk, yield

### Scheduling
- Daily servicing job (Next.js route + serverless cron or dedicated worker) processes payments and delinquencies

### UI Components
- `LoanApplicationForm`, `LoanDashboard`, `CreditScoreDisplay`, `BankComparison`, `BankDashboard`, `LendingPolicyConfig`

### Security & Compliance
- Input validation with Zod on all endpoints
- Rate limiting to prevent application spam
- CAR ≥ 8% enforced for player banks (Basel III style)

### Integration Points
- Company creation: option to start with seed or loan
- Level progression costs → funded via loans
- Defaults → credit score drops, future borrowing harder

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-15*
