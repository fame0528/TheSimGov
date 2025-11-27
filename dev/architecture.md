# 🏗️ Architecture Documentation - TheSimGov

**Last Updated:** 2025-11-21  
**Project:** Clean rebuild with infrastructure-first approach  
**ECHO Version:** v1.1.0

This file documents technical architecture decisions, patterns, and system design. Manually maintained.

---

## 🎯 Technology Stack

### Frontend
- **Framework:** Next.js 16.0.3 with App Router (React 18.3.1)
- **Language:** TypeScript 5.4.5 (strict mode)
- **UI Components:** HeroUI v2.4.23 (built on Tailwind CSS v4.1.17)
- **Styling:** Tailwind CSS v4.1.17 + Custom hero.ts config
- **Animations:** Framer Motion 11.18.2
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context + SWR for data fetching

### Backend
- **Runtime:** Node.js with Next.js API routes
- **API:** RESTful endpoints (App Router route handlers)
- **Authentication:** NextAuth v5 (credentials provider)
- **Session:** JWT-based sessions
- **Validation:** Zod schemas for all inputs
- **Security:** bcrypt password hashing, CSRF protection

### Database
- **Primary DB:** MongoDB Atlas (politics cluster)
- **ODM:** Mongoose 8.8.4
- **Connection:** Pooled connections with error handling
- **Models:** User, Company, Employee, Contract (4 core models)
- **Indexes:** Optimized for common queries

### Infrastructure
- **Deployment:** Vercel (Next.js optimized)
- **Environment:** .env.local for secrets
- **Build Tool:** Turbopack (Next.js 16)
- **Package Manager:** npm

### Development Tools
- **Linting:** ESLint with Next.js config
- **Type Checking:** TypeScript strict mode
- **Code Quality:** ECHO v1.1.0 enforcement
- **Version Control:** Git

---

## 📐 Architecture Patterns

### Infrastructure-First Approach (Core ECHO Principle)

**Philosophy:** Build all shared utilities BEFORE features to prevent duplication.

**Layers (lib/ directory):**
1. **lib/api/** - Centralized API client, error handling, endpoints
2. **lib/hooks/** - Reusable React hooks (data + UI hooks)
3. **lib/utils/** - Pure utility functions (currency, date, validation, etc.)
4. **lib/types/** - TypeScript type definitions
5. **lib/components/shared/** - Reusable UI components
6. **lib/components/layouts/** - Page layouts
7. **lib/contexts/** - React Context providers
8. **lib/db/** - Database connection + Mongoose models

**Benefits:**
- Zero code duplication (enforced from day 1)
- Consistent patterns across all features
- 3-5x faster feature development
- Easy refactoring (change once, applies everywhere)

### Design Patterns

**1. Repository Pattern:**
- Database models in `lib/db/models/`
- Business logic in utility functions
- API routes orchestrate operations

**2. Component Composition:**
- Atomic design principles (atoms → molecules → organisms)
- Shared components in `lib/components/shared/`
- Feature-specific components in `lib/components/{feature}/`

**3. Hook-Based State:**
- Custom hooks for data fetching (useCompany, useEmployee, etc.)
- SWR for caching and revalidation
- Context for global state (auth, theme)

**4. API Client Pattern:**
- Single `apiClient.ts` handles all requests
- Automatic error handling
- Type-safe request/response

### Code Organization

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (game)/              # Protected game pages
│   ├── api/                 # API route handlers
│   ├── page.tsx            # Public landing page
│   └── layout.tsx          # Root layout
├── lib/                     # Infrastructure layer
│   ├── api/                # API client + endpoints
│   ├── hooks/              # React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   └── db/                 # Database models
├── auth.ts                 # NextAuth config
├── proxy.ts                # Route protection
└── middleware.ts           # Route middleware
```

**Naming Conventions:**
- Components: PascalCase (UserCard.tsx)
- Utilities: camelCase (formatCurrency.ts)
- Constants: SCREAMING_SNAKE_CASE (MAX_EMPLOYEES)
- Hooks: camelCase with "use" prefix (useCompany.ts)
- Types/Interfaces: PascalCase (Company, Employee)
- API routes: kebab-case folders ([company-id]/route.ts)

---

## 🔒 Security Considerations

### Authentication & Authorization
- NextAuth v5 for session management
- bcrypt password hashing (12 rounds)
- JWT-based sessions with secure cookies
- Route protection via middleware.ts
- Protected API routes (session validation)

### Input Validation
- Zod schemas for ALL API inputs
- Client-side validation (forms)
- Server-side validation (API routes)
- SQL injection prevention (Mongoose ODM)
- XSS prevention (React automatic escaping)

### OWASP Top 10 Compliance
- ✅ A01 Broken Access Control: Middleware + session checks
- ✅ A02 Cryptographic Failures: bcrypt hashing, JWT encryption
- ✅ A03 Injection: Mongoose ODM (parameterized queries)
- ✅ A04 Insecure Design: Infrastructure-first architecture
- ✅ A05 Security Misconfiguration: Environment variables, strict CSP
- ✅ A06 Vulnerable Components: Regular dependency updates
- ✅ A07 Authentication Failures: NextAuth v5, secure sessions
- ✅ A08 Software/Data Integrity: Type safety, Zod validation
- ✅ A09 Logging Failures: Error tracking (pending implementation)
- ✅ A10 SSRF: Input validation on external requests

### Data Protection
- Passwords never stored plaintext
- Sensitive data encrypted in transit (HTTPS)
- MongoDB connection string in .env.local
- No secrets in client-side code

---

## 📊 Data Architecture

### Current Models (4 Core)

**1. User Model:**
- Authentication (email, password hash)
- Profile (username, created date)
- Relations: owns Companies

**2. Company Model:**
- Company details (name, industry, state, level)
- Financials (cash, revenue, expenses, profit)
- 70 industry × level configurations
- Relations: owned by User, has Employees, has Contracts

**3. Employee Model:**
- Personal info (name, age, education)
- 12 skills (leadership, sales, marketing, etc. - scale 1-100)
- Employment (salary, hire date, company)
- Performance (morale, loyalty, performance rating)
- Relations: employed by Company

**4. Contract Model:**
- Contract details (client, value, duration)
- Requirements (12-skill thresholds)
- Status (bidding, active, in_progress, completed)
- Relations: belongs to Company, assigned Employees

### Planned Models (from dev_backup reference)
- Department (Finance, HR, Marketing, R&D)
- Industry-specific extensions (6 industries)
- Time system (scheduler, events)
- Politics (elections, donations, lobbying)

### Data Flow

```
User Action (UI)
  ↓
Component Event Handler
  ↓
API Call (via apiClient)
  ↓
API Route Handler (/api/*)
  ↓
Zod Validation
  ↓
Business Logic (utility functions)
  ↓
Database Operation (Mongoose)
  ↓
Response (JSON)
  ↓
SWR Cache Update
  ↓
UI Re-render (React state)
```

### Database Design Principles
- Normalized schemas (avoid duplication)
- Indexed fields for common queries
- Virtuals for computed properties
- Pre/post hooks for business logic
- Validation at schema level

---

## ⚡ Performance Considerations

### Caching Strategy
- **SWR:** Client-side data caching (30s revalidation)
- **React Context:** Global state caching
- **MongoDB:** Connection pooling
- **Next.js:** Automatic static optimization

### Query Optimization
- Mongoose indexes on common queries
- Pagination for large datasets
- Lean queries (plain objects vs documents)
- Select only needed fields

### Asset Optimization
- Next.js automatic image optimization
- Tailwind CSS tree-shaking
- HeroUI optimized bundle size
- Code splitting (App Router automatic)

### Scaling Approach
- Serverless API routes (Vercel auto-scaling)
- MongoDB Atlas (managed scaling)
- CDN for static assets
- Future: Redis for session/cache

---

## 🎮 Game Architecture (from dev_backup planning)

### Time System
- **Accelerated time:** 168x speed (1 real hour = 1 game week)
- **Persistent world:** No resets ever (true MMO persistence)
- **Auto-progression:** Companies operate offline
- **Scheduled events:** Payroll, contract deadlines, training completion

### Company Progression
- **5 Levels:** L1 ($5k startup) → L5 ($3B public company)
- **70 Configurations:** 14 industries × 5 levels
- **Level-up requirements:** Revenue, employees, operations thresholds

### Economic Model
- **Revenue sources:** Contracts, investments, passive income
- **Expenses:** Salaries, facilities, departments, loans
- **Banking:** NPC banks, credit scoring (300-850), loans
- **Investments:** Stocks, bonds, real estate (passive playstyle)

### Playstyle Flexibility (All Optional)
- **Business Mogul:** Build companies only (no politics)
- **Pure Politician:** Elections/policy only (no companies)
- **Passive Investor:** Portfolio management (minimal active play)
- **Power Broker:** Business + politics synergy
- **Corruption Empire:** Unethical tactics (high risk/reward)

---

## 🚀 Development Roadmap (from dev_backup)

### Phase 1: Core Systems (MOSTLY COMPLETE)
- ✅ Infrastructure (lib/ directory)
- ✅ Company Foundation
- ✅ Employee Management
- ✅ Contract System
- ✅ Time Progression
- ⏳ Department System (Finance, HR, Marketing, R&D)

### Phase 2: Industries (6 planned)
1. Manufacturing (production, inventory, supply chain)
2. E-Commerce (marketplace, fulfillment, cloud, ads)
3. Media (content, streaming, influencer)
4. Energy (oil/gas, renewables, grid, trading)
5. Healthcare (facilities, pharma, insurance, compliance)
6. Technology/AI (model training, research, GPUs)

### Phase 3: Politics Integration
- Elections (local, state, federal)
- Donations & lobbying
- Policy influence
- Regulatory compliance

### Phase 4: Multiplayer Features
- Real-time updates (Socket.io)
- Player trading
- Guilds/alliances
- Competitive leaderboards

---

**Manually maintained - Updated for clean rebuild**
