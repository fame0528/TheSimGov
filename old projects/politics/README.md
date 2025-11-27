# 🏛️ Business & Politics Simulation MMO

A multiplayer online game where players build business empires and influence political systems in a shared economy.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and NextAuth secret

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete API documentation with examples
- **[Performance Monitoring](docs/PERFORMANCE_MONITORING.md)** - Performance tracking guide
- **[Authentication](docs/AUTHENTICATION.md)** - NextAuth.js setup and usage
- **[Development Tracking](dev/QUICK_START.md)** - Current project status (ECHO v1.0.0)
- **[Architecture Decisions](dev/architecture.md)** - Technical decisions and patterns

## 🛠️ Tech Stack

### Core Technologies
- **Language:** TypeScript 5.x (strict mode enabled)
- **Framework:** Next.js 15.0 (App Router, Server Actions, React 19)
- **UI Library:** Chakra UI 3.x + Emotion
- **Database:** MongoDB 8.0 + Mongoose 8.x
- **Authentication:** NextAuth.js 5.x (Auth.js)
- **Real-time:** Socket.io 4.x (WebSocket connections)

### State Management
- **Global State:** Zustand (companies, user, notifications)
- **Server State:** SWR (data fetching, caching, revalidation)
- **React Context:** Theme, auth session, Socket.io

### Testing & Quality
- **Unit Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright (cross-browser testing)
- **Type Safety:** TypeScript strict mode (100% compliance)
- **Code Quality:** ESLint + Prettier
- **Performance:** Custom monitoring infrastructure
- **Development:** ECHO v1.0.0 AAA-Quality System

### Deployment
- **Platform:** Vercel (recommended) or Node.js server
- **Database:** MongoDB Atlas (cloud) or local MongoDB
- **Environment:** Node.js 18+ required

## 📁 Project Structure

```
politics/
├── app/                   # Next.js App Router
├── components/           # Reusable React components
├── lib/                  # Application libraries
├── stores/              # Zustand state management
├── context/             # React Context providers
├── types/               # TypeScript type definitions
├── dev/                 # Development tracking (ECHO v1.0.0)
├── docs/                # Project documentation
├── e2e/                 # Playwright E2E tests
└── public/              # Static assets
```

## 🎮 Core Features

### 🏢 Business Simulation
- **Company Management:** Create and grow businesses across 7+ industries
- **Industry Specialization:** Construction, Technology (AI/Software/Hardware), Manufacturing, Real Estate, Banking, Healthcare, Retail
- **Financial Systems:** Loans, credit scores, investments, revenue streams, expenses
- **Employee Operations:** Hire, train, manage skills, retention mechanics
- **Contract System:** Bid on contracts, quality scoring, reputation impact
- **Level Progression:** 5 levels (Startup → Fortune 500) with XP and unlocks
- **Player Banking:** Level 3+ companies can become licensed banks

### 🤖 AI Industry (Technology Subcategory)
- **Research & Development:** Allocate budgets, earn research points
- **Model Training:** Train AI models with compute (GPU/Cloud/Hybrid)
- **AGI Development:** Pursue General Intelligence milestones
- **Market Dominance:** Track market share, antitrust risk, public perception
- **Global Impact:** Manage catastrophic events, alignment scores, safety metrics
- **Industry Rankings:** Compete for top AI company position

### 🏛️ Politics & Governance
- **US Government Structure:** Local (Mayor, City Council), State (Assembly, Senate, Governor), Federal (House, Senate, President)
- **Policy Creation:** Draft policies, vote at all government levels
- **Lobbying System:** Influence legislation, campaign donations
- **Public Opinion:** Reputation tracking, approval ratings
- **Elections:** Run for office, campaign mechanics
- **Political Influence:** Company reputation affects political power

### 🌐 Multiplayer Economy
- **Shared Market:** Dynamic pricing, supply/demand mechanics
- **Competitive Bidding:** NPC competitors with personality types (aggressive, conservative, strategic)
- **Player Syndicates:** Form alliances, joint ventures
- **Poaching Mechanics:** Recruit competitors' employees
- **Leaderboards:** Rankings by revenue, reputation, market cap
- **Real-time Updates:** Socket.io notifications, live events

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 🏗️ Architecture

### Directory Structure
```
politics/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (game)/              # Game pages (dashboard, companies, map, etc.)
│   ├── api/                 # API routes (REST endpoints)
│   └── layout.tsx           # Root layout with providers
├── components/              # React components
│   ├── ai/                  # AI industry components
│   ├── companies/           # Company management UI
│   ├── contracts/           # Contract system UI
│   ├── employees/           # Employee management UI
│   ├── politics/            # Political system UI
│   └── ui/                  # Reusable UI components (Chakra wrappers)
├── lib/                     # Core libraries
│   ├── auth/                # NextAuth.js configuration
│   ├── db/                  # Database (Mongoose models, connection)
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions (logger, currency, math, etc.)
│   └── validations/         # Zod schemas for validation
├── stores/                  # Zustand global stores
├── types/                   # TypeScript type definitions
├── dev/                     # Development tracking (ECHO v1.0.0)
├── docs/                    # Project documentation
└── public/                  # Static assets
```

### Key Design Patterns

**1. Server-Side Data Fetching**
```typescript
// app/(game)/companies/[id]/page.tsx
export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await fetchCompany(params.id); // Server-side fetch
  return <CompanyDashboard company={company} />;
}
```

**2. Client-Side State with SWR**
```typescript
// components/companies/CompanyList.tsx
import useSWR from 'swr';

export function CompanyList() {
  const { data, error, isLoading } = useSWR('/api/companies', fetcher);
  // SWR handles caching, revalidation, error handling
}
```

**3. Global State with Zustand**
```typescript
// stores/companyStore.ts
export const useCompanyStore = create<CompanyStore>((set) => ({
  companies: [],
  addCompany: (company) => set((state) => ({ 
    companies: [...state.companies, company] 
  })),
}));
```

**4. Real-time Updates with Socket.io**
```typescript
// context/SocketContext.tsx
socket.on('notification', (notification) => {
  addNotification(notification); // Zustand store update
});
```

**5. API Routes with Validation**
```typescript
// app/api/companies/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createCompanySchema.parse(body); // Zod validation
  const company = await Company.create(validated);
  return NextResponse.json(company);
}
```

## 📊 Development Workflow (ECHO v1.0.0)

This project follows the ECHO v1.0.0 development system:

- **Complete File Reading:** Every file read in full (0-EOF) before modification
- **Auto-Audit System:** Automated tracking in `/dev` folder (planned.md, progress.md, completed.md)
- **Session Recovery:** Resume work instantly with context restoration
- **AAA Quality Standards:** Production-ready code with comprehensive documentation
- **Chat-Only Reporting:** Structured progress updates via markdown
- **Performance Monitoring:** Built-in infrastructure for render/API/memory tracking

See `/dev/QUICK_START.md` for current project status and active work.

## 🔐 Security

- OWASP Top 10 compliance
- Input validation with Zod schemas
- MongoDB injection prevention
- Rate limiting on API endpoints
- Secure authentication with NextAuth.js

## 📈 Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| **API Response Time** | < 200ms (p95) | ✅ Monitored |
| **Component Render** | < 16ms (60fps) | ✅ Monitored |
| **Memory Usage** | < 100MB/component | ✅ Monitored |
| **Page Load Time** | < 2s (first contentful paint) | ⏳ Optimizing |
| **Socket.io Latency** | < 100ms | ✅ Real-time |
| **TypeScript Compliance** | 100% strict mode | ✅ 1 baseline error |
| **Test Coverage** | > 80% | ⏳ Target |

**Performance Monitoring:** Built-in infrastructure tracks component renders, API calls, and memory usage with automatic baseline calculation and threshold warnings. See [Performance Monitoring Guide](docs/PERFORMANCE_MONITORING.md).

## 🔧 Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/politics  # MongoDB connection string

# Authentication (NextAuth.js)
NEXTAUTH_SECRET=your-secret-key-here           # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000             # Base URL for callbacks

# Optional: External Services
REDIS_URL=redis://localhost:6379               # For caching (future)
LOG_LEVEL=debug                                 # Log level (debug, info, warn, error)

# Testing
TEST_SKIP_AUTH=true                             # Skip auth in tests
NODE_ENV=development                            # Environment (development, production, test)
```

## 🚀 Getting Started - Detailed

### 1. Prerequisites
```bash
# Required
node >= 18.0.0
npm >= 9.0.0
mongodb >= 8.0.0

# Verify installations
node --version
npm --version
mongod --version
```

### 2. Database Setup
```bash
# Start MongoDB (local)
mongod --dbpath /path/to/data/directory

# Or use MongoDB Atlas (cloud) - free tier available
# Get connection string from: https://cloud.mongodb.com
```

### 3. Project Installation
```bash
# Clone repository
git clone <repository-url>
cd politics

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and NextAuth secret

# Generate NextAuth secret
openssl rand -base64 32
# Paste result into NEXTAUTH_SECRET in .env
```

### 4. Development Server
```bash
# Run development server
npm run dev

# Open browser
open http://localhost:3000

# Create account and start playing!
```

### 5. Testing Setup
```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This project uses ECHO v1.0.0 development standards. See `/dev/architecture.md` for technical decisions and coding guidelines.

---

**Built with ECHO v1.0.0 AAA-Quality Development System**
