# 🎮 COMPLETE GAMEPLAY LOOPS - TheSimGov Master Implementation Plan

**Created:** 2025-12-05  
**Updated:** 2025-12-06  
**Version:** 2.2 (COMPLETE COMPANY TYPE GAMEPLAY)  
**Status:** MASTER PLAN - Complete Game Playability Roadmap  
**ECHO Compliance:** v1.4.0

**Document Stats:**
- **Lines:** 4,496
- **Words:** 22,507
- **Total Company Types:** 100 (18 industries × 5 levels, Tech has 3 subcategories)
- **Industries Covered:** Media, Technology (Software, AI, Hardware), Banking, Energy, Healthcare, Manufacturing, Retail, E-Commerce, Construction, Real Estate, Crypto, Stocks, Consulting, EdTech, Crime, Politics
- **Unique Gameplay Mechanics:** 500+ documented decisions
- **Per-Company Mechanics:** Core loop, decision table, tick processing, unlock conditions

---

# 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [NPM Package Strategy](#npm-package-strategy) ⭐ NEW
4. [Deep Industry Gameplay](#deep-industry-gameplay) ⭐ NEW
5. [Complete Company Type Gameplay Loops](#complete-company-type-gameplay-loops) ⭐⭐ NEW
6. [Per-Industry Utility Functions](#per-industry-utility-functions)
7. [Vision & Game Identity](#vision)
8. [Empire Dependency Graph](#the-empire-dependency-graph)
9. [Critical Gaps](#critical-gaps)
10. [Addiction Loop Design](#addiction-loop-design)
11. [Cross-System Integration](#cross-system-integration)
12. [Implementation Phases](#implementation-phases)
13. [FID Breakdown](#fid-breakdown)
14. [Success Metrics](#success-metrics)
15. [Industry Reference](#industry-breakdown)

---

# 🎯 EXECUTIVE SUMMARY

## Current State (As of 2025-12-06)

| Component | Status | Notes |
|-----------|--------|-------|
| **Tick Processors** | ✅ 11/11 COMPLETE | Banking, Empire, Energy, Manufacturing, Retail, Tech, Media, Consulting, Healthcare, Crime, Politics |
| **Industries Built** | ✅ 14/15 COMPLETE | All industries have models, APIs, components |
| **Logistics Industry** | 🔴 NOT BUILT | Only missing industry - needs Vehicle, Warehouse, Route, Shipment models |
| **TypeScript** | ✅ 0 errors | Clean compilation |
| **Core Game Loop** | 🔴 NOT PLAYABLE | Tick engine exists but no scheduler, no visible money flow |
| **Addiction Loops** | 🔴 NOT DESIGNED | No daily rewards, achievements UI, progression |
| **Cross-System Integration** | 🟡 PARTIAL | Synergy engine calculates but doesn't apply mechanically |
| **Onboarding** | 🔴 NONE | New players have no guidance |

## What's Missing for Playability

The game has **extensive backend infrastructure** but lacks the **"game feel"** that creates engagement:

1. **No visible money flow** - Treasury exists but player can't see it prominently
2. **No tick scheduler** - Game doesn't run automatically 24/7 (CRITICAL: game should run continuously, not just when players are online)
3. **No notifications** - Revenue, events, achievements don't alert the player
4. **No synergy application** - Bonuses calculated but not applied to production
5. **No progression UI** - Levels, XP, achievements exist but no display
6. **No onboarding** - New players lost on first login
7. **No offline progress** - Returning players don't see what happened while away

### 🌐 CORE DESIGN PRINCIPLE: 24/7 PERSISTENT WORLD

**The game world runs continuously, 24 hours a day, 7 days a week, regardless of whether any players are logged in.** This is an MMO-style persistent economy where:

- ⏰ **Ticks process on schedule** - Every X minutes/hours, game month advances for ALL players
- 🏭 **Production continues** - Factories produce, farms grow, data centers compute
- 💰 **Revenue accumulates** - Money flows into treasuries automatically
- 📈 **Markets fluctuate** - Prices change based on global supply/demand
- 🎲 **Events occur** - Random events affect all players
- 🗳️ **Politics evolve** - Elections happen, bills pass, regulations change
- 🔫 **Crime operates** - Drug markets shift, heat decays, turf wars continue
- 🏆 **Leaderboards update** - Rankings change in real-time

**When a player logs in, they see:**
- "While you were away..." summary of what happened
- Accumulated revenue in treasury
- Events that affected their empire
- Position changes on leaderboards

## Estimated Work to Full Playability

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| A | Core Loop UI (Treasury Bar, Notifications, Revenue Ticker) | 16h | P0 |
| B | Logistics Industry (Complete the 15th industry) | 16h | P0 |
| C | Tick Scheduler + Offline Progress | 8h | P0 |
| D | Synergy Wiring (Apply bonuses to production) | 12h | P0 |
| E | Player Progression UI (Achievements, Levels, XP) | 12h | P0 |
| F | Tutorial & Onboarding | 16h | P0 |
| G | Events & Random Encounters | 12h | P1 |
| H | Multiplayer Competition (Leaderboards, Rankings) | 8h | P1 |
| **TOTAL** | **Full Game Playability** | **100h** | |

---

# 📊 CURRENT STATE ANALYSIS

## ✅ What's Built & Working

### Tick Processors (11/11 Complete)

| Processor | File | LOC | What It Does |
|-----------|------|-----|--------------|
| Banking | `bankingProcessor.ts` | 600 | Loan payments, interest, defaults, XP |
| Empire | `empireProcessor.ts` | 450 | Synergies, resource flows, XP |
| Energy | `energyProcessor.ts` | 550 | Power generation, PPA fulfillment, fuel |
| Manufacturing | `manufacturingProcessor.ts` | 500 | Production runs, OEE, inventory |
| Retail | `retailProcessor.ts` | 500 | E-commerce orders, inventory, returns |
| Tech | `techProcessor.ts` | 420 | SaaS subscriptions, MRR, churn |
| Media | `mediaProcessor.ts` | 508 | Content engagement, ads, sponsorships |
| Consulting | `consultingProcessor.ts` | 477 | Projects, milestones, billing |
| Healthcare | `healthcareProcessor.ts` | 763 | R&D, facilities, insurance |
| Crime | `crimeProcessor.ts` | 580 | Heat decay, drug prices, production |
| Politics | `politicsProcessor.ts` | 780 | Bills, campaigns, elections, lobbying |

**Total Tick Processor LOC:** ~5,628 lines

### Industries (14/15 Complete)

| Industry | Models | API | Components | Tick Processor |
|----------|--------|-----|------------|----------------|
| Banking | ✅ Bank, Loan, Deposit | ✅ /api/banking/* | ✅ BankingDashboard | ✅ |
| Energy | ✅ OilWell, SolarFarm, etc. | ✅ /api/energy/* | ✅ EnergyDashboard | ✅ |
| Manufacturing | ✅ Facility, ProductionLine | ✅ /api/manufacturing/* | ✅ ManufacturingDashboard | ✅ |
| Tech (AI) | ✅ AIModel, DataCenter | ✅ /api/ai/* | ✅ AIResearchDashboard | ✅ |
| Tech (Software) | ✅ SoftwareProduct, SaaS | ✅ /api/software/* | ✅ SoftwareDashboard | ✅ |
| Media | ✅ Platform, Content, Ads | ✅ /api/media/* | ✅ MediaDashboard | ✅ |
| Retail/E-Commerce | ✅ ProductListing, Order | ✅ /api/ecommerce/* | ✅ EcommerceDashboard | ✅ |
| Healthcare | ✅ Pharma, Clinic, Hospital | ✅ /api/healthcare/* | ✅ HealthcareDashboard | ✅ |
| EdTech | ✅ Course, Enrollment | ✅ /api/edtech/* | ✅ EdTechDashboard | ❌ (No processor) |
| Consulting | ✅ Project, Milestone | ✅ /api/consulting/* | ✅ ConsultingDashboard | ✅ |
| Politics | ✅ Bill, Contribution | ✅ /api/politics/* | ✅ PoliticsDashboard | ✅ |
| Crime | ✅ PlayerStash, Production | ✅ /api/crime/* | ✅ CrimeDashboard | ✅ |
| Real Estate | ✅ RealEstate | ✅ /api/realestate/* | ✅ RealEstateDashboard | ❌ (No processor) |
| Empire | ✅ Empire, Treasury | ✅ /api/empire/* | ✅ EmpireDashboard | ✅ |
| **Logistics** | 🔴 MISSING | 🔴 MISSING | 🔴 MISSING | 🔴 MISSING |

### Core Systems

| System | Status | Location |
|--------|--------|----------|
| Tick Engine | ✅ Built | `src/lib/game/tick/tickEngine.ts` |
| Synergy Engine | ✅ Built | `src/lib/game/empire/synergyEngine.ts` |
| Achievement Model | ✅ Built | `src/lib/db/models/player/Achievement.ts` |
| User Levels/XP | ✅ Built | In User model |
| Empire Treasury | ✅ Built | `src/lib/db/models/empire/Treasury.ts` |
| GlobalImpactEvent | ✅ Built | `src/lib/db/models/world/GlobalImpactEvent.ts` |
| Leaderboard | ✅ Built | `src/lib/db/models/world/Leaderboard.ts` |

## 🔴 What's NOT Built (Critical for Playability)

### 1. Core Loop UI (Player Can't "Feel" the Game)

| Component | Issue |
|-----------|-------|
| Treasury Bar | Exists in data but not prominently displayed |
| Revenue Ticker | No real-time money flow visualization |
| Notification Toasts | No alerts when things happen |
| Offline Progress Summary | No "while you were away" screen |

### 2. Logistics Industry (The Only Missing Industry)

| What's Needed | Purpose |
|---------------|---------|
| Vehicle model | Trucks, ships, planes |
| Warehouse model | Storage facilities |
| Route model | Delivery routes |
| ShippingContract model | Customer agreements |
| Shipment model | Individual shipments |
| API endpoints | CRUD for all models |
| LogisticsDashboard | UI for management |
| Tick processor | Monthly processing |

### 3. Tick Scheduler (Game Doesn't Run Automatically)

| Issue | Solution |
|-------|----------|
| Tick engine requires manual API call | Need cron job or scheduler |
| No game month advancement | Need automated tick triggering |
| No real-time updates | Need WebSocket or polling |

### 4. Synergy Application (Bonuses Don't Actually Help)

| Issue | Solution |
|-------|----------|
| Synergies calculated but not applied | Wire synergy % to production calculations |
| Cross-industry bonuses decorative | Make them affect actual output/costs |
| No synergy visualization | Show bonus breakdown in industry UIs |

### 5. Player Progression UI (No Visible Progress)

| Issue | Solution |
|-------|----------|
| XP earned but not shown | Add XP bar to header |
| Levels exist but invisible | Add level badge/display |
| Achievements model exists, no UI | Achievement gallery page |
| No unlock notifications | Achievement toast notifications |

### 6. Tutorial & Onboarding (New Players Lost)

| Issue | Solution |
|-------|----------|
| No first-time user guidance | Tutorial overlay system |
| No starting industry recommendation | Guided first purchase |
| No explanation of mechanics | Help tooltips throughout |

---

# 📦 NPM PACKAGE STRATEGY

## ✅ ALREADY INSTALLED (from package.json)

These packages are already in the project and should be leveraged for industry gameplay:

### 🎲 Randomization & Events

| Package | Version | Game Use |
|---------|---------|----------|
| `chance` | ^1.1.13 | Random events, names, dice rolls, probability-based outcomes |
| `@faker-js/faker` | ^10.1.0 | Generate realistic business names, personas, product names |

```typescript
// Example: Random event generation
import Chance from 'chance';
const chance = new Chance();

// Random market event
const marketEvent = {
  type: chance.pickone(['boom', 'crash', 'scandal', 'merger']),
  magnitude: chance.floating({ min: 0.05, max: 0.25 }),
  duration: chance.integer({ min: 1, max: 12 }) // game months
};

// Random employee generation
const employee = {
  name: chance.name(),
  skill: chance.integer({ min: 1, max: 100 }),
  loyalty: chance.integer({ min: 1, max: 100 })
};
```

### 💰 Financial Calculations

| Package | Version | Game Use |
|---------|---------|----------|
| `currency.js` | ^2.0.4 | Precise currency math (avoids floating-point errors) |
| `numeral` | ^2.0.6 | Format large numbers (1.5M, 2.3B, etc.) |

```typescript
// Example: Safe currency calculations
import currency from 'currency.js';

const loanPrincipal = currency(1000000);
const interestRate = 0.075; // 7.5% APR
const monthlyPayment = loanPrincipal.multiply(interestRate / 12);
// Result: $6,250.00 - no floating point errors

// Format for display
import numeral from 'numeral';
const display = numeral(1500000000).format('$0.0a'); // "$1.5b"
```

### 📊 Statistics & ML

| Package | Version | Game Use |
|---------|---------|----------|
| `mathjs` | ^15.1.0 | Complex math, matrix operations, physics simulations |
| `jstat` | ^1.9.6 | Statistical distributions, probability functions |
| `simple-statistics` | ^7.8.8 | Mean, variance, regression, percentiles |
| `ml-regression` | ^6.3.0 | Predict trends, market forecasting, demand curves |

```typescript
// Example: Demand prediction using regression
import { PolynomialRegression } from 'ml-regression';

// Historical price vs sales data
const prices = [10, 15, 20, 25, 30];
const sales = [1000, 800, 600, 400, 200];

const regression = new PolynomialRegression(prices, sales, 2);
const predictedSales = regression.predict(22); // Predict sales at $22

// Example: Statistical market analysis
import { mean, standardDeviation, normalDistribution } from 'jstat';

const marketVolatility = standardDeviation(priceHistory);
const probabilityOfCrash = 1 - normalDistribution.cdf(currentPrice, mean(priceHistory), marketVolatility);
```

### ⚙️ Optimization

| Package | Version | Game Use |
|---------|---------|----------|
| `javascript-lp-solver` | ^0.4.24 | Linear programming for logistics, production scheduling |

```typescript
// Example: Optimal production scheduling
import Solver from 'javascript-lp-solver';

const model = {
  optimize: 'profit',
  opType: 'max',
  constraints: {
    laborHours: { max: 160 },
    materialA: { max: 500 },
    materialB: { max: 300 }
  },
  variables: {
    productX: { profit: 50, laborHours: 2, materialA: 3, materialB: 1 },
    productY: { profit: 40, laborHours: 1, materialA: 2, materialB: 2 }
  }
};

const result = Solver.Solve(model);
// { productX: 60, productY: 40, profit: 4600 }
```

### 📅 Date & Time

| Package | Version | Game Use |
|---------|---------|----------|
| `date-fns` | ^4.1.0 | Game date calculations, quarter boundaries, fiscal years |
| `dayjs` | ^1.11.19 | Lightweight date formatting, "time ago" displays |

```typescript
// Example: Game time calculations
import { addMonths, differenceInDays, startOfQuarter } from 'date-fns';

const gameDate = new Date('2025-06-15');
const nextQuarter = startOfQuarter(addMonths(gameDate, 3));
const daysUntilQuarter = differenceInDays(nextQuarter, gameDate);
// "45 days until Q3"
```

### 🎨 UI/UX Feedback

| Package | Version | Game Use |
|---------|---------|----------|
| `framer-motion` | ^11.15.0 | Animations for revenue tickers, card flips, transitions |
| `react-toastify` | ^11.0.5 | Toast notifications for events, achievements |
| `howler` | ^2.2.4 | Sound effects (ka-ching, alerts, fanfares) |

```typescript
// Example: Revenue notification with sound
import { Howl } from 'howler';
import { toast } from 'react-toastify';

const kaChing = new Howl({ src: ['/sounds/ka-ching.mp3'] });

function onRevenueReceived(amount: number) {
  kaChing.play();
  toast.success(`+${numeral(amount).format('$0,0')} revenue!`, {
    position: 'bottom-right',
    autoClose: 2000
  });
}
```

### 🔧 Utilities

| Package | Version | Game Use |
|---------|---------|----------|
| `lodash` | ^4.17.21 | Deep cloning, grouping, sorting, debouncing |
| `immer` | ^10.1.1 | Immutable state updates for game state |

---

## 📥 RECOMMENDED NEW PACKAGES

These packages would add significant value for deep industry gameplay:

### 1. Economy Simulation Engine

```bash
npm install @awmacleod/skapari-engine
```

| Feature | Use Case |
|---------|----------|
| Market dynamics | Supply/demand curves, price elasticity |
| HR simulation | Hiring, firing, morale, productivity |
| Marketing engine | Campaign effectiveness, brand awareness |
| AI competitors | Procedural competitor behavior |

### 2. Advanced Financial Functions

```bash
npm install financial
```

| Function | Use Case |
|----------|----------|
| `fv()` | Future value of investments |
| `pv()` | Present value calculations |
| `pmt()` | Loan payment calculations |
| `irr()` | Internal rate of return for projects |
| `npv()` | Net present value for business decisions |

### 3. Route Optimization (Logistics)

```bash
npm install @geoapify/route-planner-sdk
```

| Feature | Use Case |
|---------|----------|
| Multi-stop routing | Delivery route optimization |
| Time windows | Delivery scheduling |
| Vehicle constraints | Fleet capacity planning |

---

# 🎮 DEEP INDUSTRY GAMEPLAY

Each industry should have **unique mechanics** that create interesting decisions. This section defines the deep gameplay for each industry using our npm packages.

---

## 🏦 BANKING - Financial Empire

**Core Fantasy:** Be JPMorgan Chase. Control the financial system.

### Mechanics Using NPM Packages:

**1. Credit Scoring System** (`chance`, `jstat`)
```typescript
function calculateCreditScore(applicant: LoanApplicant): number {
  const chance = new Chance();
  
  // Base score from history
  let score = 500 + (applicant.yearsInBusiness * 10);
  
  // Debt-to-income ratio impact
  const dtiPenalty = Math.max(0, (applicant.debtRatio - 0.3) * 200);
  score -= dtiPenalty;
  
  // Add some randomness (market uncertainty)
  score += chance.integer({ min: -20, max: 20 });
  
  // Clamp to valid range
  return Math.max(300, Math.min(850, Math.round(score)));
}
```

**2. Loan Default Prediction** (`ml-regression`, `jstat`)
```typescript
function predictDefaultProbability(creditScore: number, economicIndex: number): number {
  // Use logistic regression model trained on historical data
  const baseDefault = 1 / (1 + Math.exp((creditScore - 600) / 50));
  const economicAdjustment = (100 - economicIndex) / 100 * 0.2;
  
  return Math.min(0.95, baseDefault + economicAdjustment);
}
```

**3. Interest Rate Optimization** (`javascript-lp-solver`)
- Balance between maximizing profit and minimizing default risk
- Solve for optimal rate that maximizes expected revenue

### Player Decisions:
- Set interest rates (higher = more profit but more defaults)
- Choose risk tolerance (aggressive vs conservative lending)
- Target market segments (consumers, small business, corporate)
- Manage liquidity (cash reserves vs loans outstanding)

---

## ⚡ ENERGY - Power Magnate

**Core Fantasy:** Be Exxon + NextEra. Control energy supply.

### Mechanics Using NPM Packages:

**1. Weather-Based Generation** (`chance`, `jstat`)
```typescript
function calculateSolarOutput(capacity: number, gameMonth: number): number {
  const chance = new Chance();
  
  // Seasonal variation (northern hemisphere)
  const seasonalFactor = 0.5 + 0.5 * Math.sin((gameMonth - 3) * Math.PI / 6);
  
  // Daily weather variation (normal distribution)
  const weatherFactor = jstat.normal.sample(0.8, 0.15);
  
  // Cloud cover events
  const cloudCover = chance.bool({ likelihood: 20 }) ? 0.3 : 1.0;
  
  return capacity * seasonalFactor * weatherFactor * cloudCover;
}
```

**2. PPA Contract Optimizer** (`javascript-lp-solver`)
```typescript
function optimizePPAContracts(facilities: EnergyFacility[], demand: number): PPAAllocation {
  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {
      demand: { min: demand },
      ...Object.fromEntries(
        facilities.map(f => [f.id, { max: f.capacity }])
      )
    },
    variables: Object.fromEntries(
      facilities.map(f => [f.id, { 
        cost: f.operatingCost, 
        demand: 1,
        [f.id]: 1 
      }])
    )
  };
  
  return Solver.Solve(model);
}
```

**3. Fuel Price Volatility** (`jstat`, `simple-statistics`)
```typescript
function simulateFuelPrice(currentPrice: number, volatility: number): number {
  // Geometric Brownian Motion for realistic price movements
  const drift = 0.001; // slight upward trend
  const shock = jstat.normal.sample(0, volatility);
  
  return currentPrice * Math.exp(drift + shock);
}
```

### Player Decisions:
- Energy mix (fossil vs renewable vs nuclear)
- Capacity vs demand balance
- Long-term PPA contracts vs spot market
- Infrastructure investment timing

---

## 🏭 MANUFACTURING - Industrial Titan

**Core Fantasy:** Be Ford + Foxconn. Build production empires.

### Mechanics Using NPM Packages:

**1. OEE (Overall Equipment Effectiveness)** (`jstat`, `chance`)
```typescript
function calculateOEE(line: ProductionLine): OEEMetrics {
  const chance = new Chance();
  
  // Availability (planned vs actual runtime)
  const breakdownChance = 1 - (line.maintenance / 100);
  const hadBreakdown = chance.bool({ likelihood: breakdownChance * 100 });
  const availability = hadBreakdown ? chance.floating({ min: 0.5, max: 0.9 }) : 0.95;
  
  // Performance (actual vs theoretical speed)
  const performance = Math.min(1, line.automation / 100 + 0.3);
  
  // Quality (good units vs total)
  const qualityBase = line.qualityControl / 100;
  const quality = qualityBase + jstat.normal.sample(0, 0.05);
  
  return {
    availability,
    performance,
    quality: Math.max(0.8, Math.min(1, quality)),
    oee: availability * performance * quality
  };
}
```

**2. Supply Chain Optimization** (`javascript-lp-solver`)
```typescript
function optimizeSupplyChain(suppliers: Supplier[], demand: MaterialDemand): SupplyPlan {
  const model = {
    optimize: 'totalCost',
    opType: 'min',
    constraints: {
      // Must meet demand
      ...Object.fromEntries(
        Object.entries(demand).map(([material, qty]) => [material, { min: qty }])
      )
    },
    variables: Object.fromEntries(
      suppliers.flatMap(s => 
        Object.entries(s.materials).map(([material, info]) => [
          `${s.id}_${material}`,
          {
            totalCost: info.price + s.shippingCost,
            [material]: 1,
            leadTime: s.leadTime
          }
        ])
      )
    )
  };
  
  return Solver.Solve(model);
}
```

### Player Decisions:
- Automation vs labor investment
- Just-in-time vs buffer inventory
- Quality vs speed tradeoff
- Supplier diversification vs cost optimization

---

## 💻 TECHNOLOGY SECTOR (5 SUBSECTIONS)

**Core Fantasy:** Be OpenAI + Microsoft + NVIDIA + AWS combined. Build the entire digital infrastructure stack.

The Technology sector is the **most complex industry** with 5 distinct subsections, each with unique mechanics:

| Subsection | Models | Core Loop |
|------------|--------|-----------|
| **AI/ML Research** | AIModel, AIResearchProject, Breakthrough, AGIMilestone | Train models → Publish research → Deploy APIs |
| **Software Development** | SoftwareProduct, Bug, Feature, SoftwareRelease | Build products → Ship releases → Fix bugs |
| **SaaS/Cloud Services** | SaaSSubscription, ComputeListing, ComputeContract | Acquire customers → Manage churn → Scale MRR |
| **Infrastructure** | DataCenter, ComputeCluster | Build capacity → Optimize PUE → Sell compute |
| **Innovation & IP** | Patent, ModelListing | File patents → License models → Collect royalties |

---

### 🤖 SUBSECTION 1: AI/ML RESEARCH

**Core Fantasy:** Be OpenAI / DeepMind / Anthropic. Train foundation models.

#### 5-Level Progression (from ai-industry-design.md)

| Level | Name | Setup Cost | Team Size | Compute | Revenue Potential |
|-------|------|------------|-----------|---------|-------------------|
| L1 | Solo AI Consultant | $12k | 1-2 | Cloud credits | $2k-$8k/mo |
| L2 | AI Startup | $85k | 5-15 | 8-16 GPUs | $20k-$150k/mo |
| L3 | AI Platform Company | $750k | 50-200 | 64-256 GPUs | $300k-$3M/mo |
| L4 | AI Research Lab | $15M | 500-2,000 | 1-5k GPUs | $8M-$80M/mo |
| L5 | AGI Company | $250M | 5k-50k | 10k-100k+ GPUs | $100M-$800M+/mo |

#### Mechanics Using NPM Packages:

**1. Model Training Simulation** (`chance`, `jstat`)
```typescript
interface TrainingConfig {
  modelSize: 'Small' | 'Medium' | 'Large'; // 7B, 70B, 400B+
  gpuCount: number;
  datasetSizeGB: number;
  architecture: 'Transformer' | 'CNN' | 'Diffusion' | 'GAN';
}

function simulateTrainingRun(config: TrainingConfig): TrainingResult {
  const chance = new Chance();
  
  // Base training time (days)
  const sizeMultiplier = { Small: 1, Medium: 5, Large: 20 }[config.modelSize];
  const baseDays = (config.datasetSizeGB / 100) * sizeMultiplier / config.gpuCount;
  
  // Random events during training
  const events: TrainingEvent[] = [];
  
  // GPU failure (5% chance per week)
  const weeks = baseDays / 7;
  for (let w = 0; w < weeks; w++) {
    if (chance.bool({ likelihood: 5 })) {
      events.push({ type: 'GPU_FAILURE', impact: 'restart_from_checkpoint', daysLost: 1 });
    }
  }
  
  // Gradient explosion (rare but catastrophic)
  if (chance.bool({ likelihood: 2 })) {
    events.push({ type: 'GRADIENT_EXPLOSION', impact: 'training_failed', daysLost: baseDays });
  }
  
  // Breakthrough discovery (rare positive)
  if (chance.bool({ likelihood: 3 })) {
    events.push({ type: 'BREAKTHROUGH', impact: 'performance_boost', bonus: 0.15 });
  }
  
  // Cost calculation
  const gpuCostPerHour = { Small: 2, Medium: 3, Large: 5 }[config.modelSize];
  const totalHours = baseDays * 24 + events.filter(e => e.daysLost).reduce((a, e) => a + e.daysLost * 24, 0);
  const totalCost = totalHours * config.gpuCount * gpuCostPerHour;
  
  return {
    success: !events.some(e => e.impact === 'training_failed'),
    daysTotal: baseDays + events.reduce((a, e) => a + (e.daysLost || 0), 0),
    cost: totalCost,
    events,
    performanceBonus: events.filter(e => e.bonus).reduce((a, e) => a + e.bonus, 0)
  };
}
```

**2. Research Publication Flow** (`chance`, `jstat`)
```typescript
interface Paper {
  title: string;
  venue: 'NeurIPS' | 'ICML' | 'ICLR' | 'CVPR' | 'arXiv';
  novelty: number; // 1-10
  empiricalStrength: number; // 1-10
  authorReputation: number; // 0-100
}

function simulatePeerReview(paper: Paper): ReviewResult {
  const chance = new Chance();
  
  // Venue acceptance rates
  const acceptanceRates = { NeurIPS: 0.23, ICML: 0.25, ICLR: 0.32, CVPR: 0.25, arXiv: 1.0 };
  const baseRate = acceptanceRates[paper.venue];
  
  // Quality adjustment
  const qualityFactor = (paper.novelty + paper.empiricalStrength) / 20;
  const reputationBonus = paper.authorReputation / 500; // Max 0.2 bonus
  
  const acceptanceProbability = Math.min(0.95, baseRate * qualityFactor * (1 + reputationBonus));
  const accepted = chance.bool({ likelihood: acceptanceProbability * 100 });
  
  // Citation prediction (power law)
  const expectedCitations = accepted 
    ? Math.pow(paper.novelty * paper.empiricalStrength, 1.5) * (paper.venue === 'NeurIPS' ? 3 : 1)
    : 0;
  
  return {
    accepted,
    venue: paper.venue,
    reviewScore: chance.floating({ min: qualityFactor * 4, max: qualityFactor * 6 + 4, fixed: 1 }),
    expectedCitations: Math.round(jstat.normal.sample(expectedCitations, expectedCitations * 0.3)),
    reputationGain: accepted ? (paper.venue === 'NeurIPS' ? 100 : 50) : 10
  };
}
```

**3. Talent Competition System** (`chance`)
```typescript
interface ResearcherOffer {
  salary: number;
  stockOptions: number; // percentage
  computeBudget: number; // $/month
  researchFreedom: number; // 1-10
  companyReputation: number; // 0-100
}

function simulateHiringCompetition(
  yourOffer: ResearcherOffer,
  competitorOffers: ResearcherOffer[],
  researcherPreferences: { salary: number; freedom: number; prestige: number }
): { won: boolean; probability: number } {
  const chance = new Chance();
  
  function scoreOffer(offer: ResearcherOffer): number {
    return (
      offer.salary / 100000 * researcherPreferences.salary +
      offer.researchFreedom * researcherPreferences.freedom +
      offer.companyReputation / 10 * researcherPreferences.prestige +
      offer.computeBudget / 1000 +
      offer.stockOptions * 10
    );
  }
  
  const yourScore = scoreOffer(yourOffer);
  const competitorScores = competitorOffers.map(scoreOffer);
  const totalScore = yourScore + competitorScores.reduce((a, b) => a + b, 0);
  
  const yourProbability = yourScore / totalScore;
  const won = chance.bool({ likelihood: yourProbability * 100 });
  
  return { won, probability: yourProbability };
}
```

#### Player Decisions (AI/ML):
- **Research Focus:** LLM vs Computer Vision vs RL vs Generative
- **Model Size:** Small (fast, cheap) vs Large (expensive, SOTA)
- **Compute Strategy:** Cloud (flexible) vs On-Premise (cheaper at scale)
- **Talent Allocation:** Research papers vs Product shipping
- **Open Source vs Closed:** Reputation vs Revenue

---

### 🖥️ SUBSECTION 2: SOFTWARE DEVELOPMENT

**Core Fantasy:** Be a software company shipping products.

#### Mechanics Using NPM Packages:

**1. Sprint Velocity Simulation** (`jstat`, `chance`)
```typescript
interface Sprint {
  plannedPoints: number;
  teamSize: number;
  teamExperience: number; // 1-10
  technicalDebt: number; // 0-100 (higher = slower)
}

function simulateSprint(sprint: Sprint): SprintResult {
  const chance = new Chance();
  
  // Base velocity per developer
  const baseVelocity = 10 * sprint.teamExperience / 10;
  
  // Technical debt penalty
  const debtPenalty = 1 - (sprint.technicalDebt / 200);
  
  // Random factors (sick days, scope creep, blockers)
  const randomFactor = jstat.normal.sample(1, 0.15);
  
  const actualVelocity = sprint.teamSize * baseVelocity * debtPenalty * randomFactor;
  const completedPoints = Math.min(sprint.plannedPoints, Math.round(actualVelocity));
  
  // Bug introduction (more code = more bugs)
  const bugsIntroduced = chance.integer({ min: 0, max: Math.ceil(completedPoints / 5) });
  
  return {
    completedPoints,
    carryOver: sprint.plannedPoints - completedPoints,
    bugsIntroduced,
    velocityTrend: actualVelocity / sprint.plannedPoints
  };
}
```

**2. Bug Severity Modeling** (`chance`, `simple-statistics`)
```typescript
function triageBugs(bugs: Bug[]): PrioritizedBugs {
  const chance = new Chance();
  
  return bugs.map(bug => {
    // Severity based on component and age
    const severityScore = (
      bug.affectedUsers * 0.4 +
      bug.revenueImpact * 0.3 +
      (100 - bug.ageInDays) * 0.2 +
      (bug.isSecurity ? 50 : 0) * 0.1
    );
    
    // Time estimate using historical data
    const historicalSimilar = getHistoricalBugs(bug.component);
    const estimatedHours = ss.median(historicalSimilar.map(b => b.hoursToFix)) || 4;
    
    return {
      ...bug,
      priority: severityScore > 70 ? 'P0' : severityScore > 40 ? 'P1' : 'P2',
      estimatedHours: estimatedHours * (1 + chance.floating({ min: -0.3, max: 0.5 }))
    };
  }).sort((a, b) => b.severityScore - a.severityScore);
}
```

#### Player Decisions (Software):
- **Ship vs Polish:** Fast releases vs Quality
- **Feature vs Bug:** New features vs Technical debt
- **Team Composition:** Senior (expensive, fast) vs Junior (cheap, mentoring)

---

### ☁️ SUBSECTION 3: SaaS/CLOUD SERVICES

**Core Fantasy:** Be Salesforce / AWS / Stripe. Build recurring revenue.

#### Mechanics Using NPM Packages:

**1. SaaS Metrics Engine** (`currency.js`, `simple-statistics`)
```typescript
interface SaaSMetrics {
  customers: Customer[];
  monthlySubscriptionRevenue: number;
  churnedThisMonth: Customer[];
  newThisMonth: Customer[];
}

function calculateSaaSHealth(metrics: SaaSMetrics): SaaSHealth {
  const mrr = currency(metrics.monthlySubscriptionRevenue);
  const arr = mrr.multiply(12);
  
  // Net Revenue Retention
  const lastMonthCustomers = metrics.customers.filter(c => c.subscriptionAge > 1);
  const lastMonthMRR = lastMonthCustomers.reduce((a, c) => a + c.monthlyPayment, 0);
  const currentMRR = lastMonthCustomers
    .filter(c => !metrics.churnedThisMonth.includes(c))
    .reduce((a, c) => a + c.monthlyPayment + (c.expansion || 0), 0);
  const nrr = lastMonthMRR > 0 ? currentMRR / lastMonthMRR : 1;
  
  // Customer Lifetime Value
  const avgMonthlyRevenue = ss.mean(metrics.customers.map(c => c.monthlyPayment));
  const avgLifespan = 1 / (metrics.churnedThisMonth.length / metrics.customers.length || 0.02);
  const ltv = avgMonthlyRevenue * avgLifespan;
  
  // Customer Acquisition Cost (from marketing spend)
  const cac = metrics.marketingSpend / (metrics.newThisMonth.length || 1);
  
  return {
    mrr: mrr.value,
    arr: arr.value,
    nrr: nrr * 100, // e.g., 115% = good
    ltv,
    cac,
    ltvCacRatio: ltv / cac, // >3 = healthy
    churnRate: metrics.churnedThisMonth.length / metrics.customers.length * 100
  };
}
```

**2. Churn Prediction** (`ml-regression`, `jstat`)
```typescript
function predictChurn(customer: SaaSCustomer): number {
  // Factors: usage frequency, support tickets, payment delays, feature adoption
  const usageScore = Math.min(1, customer.monthlyLogins / 30);
  const satisfactionScore = 1 - (customer.supportTickets / 10);
  const paymentScore = customer.latePayments > 2 ? 0.3 : 1;
  const adoptionScore = customer.featuresUsed / customer.featuresAvailable;
  
  const churnProbability = 1 - (
    usageScore * 0.3 +
    satisfactionScore * 0.3 +
    paymentScore * 0.2 +
    adoptionScore * 0.2
  );
  
  return Math.max(0, Math.min(1, churnProbability));
}

function identifyAtRiskCustomers(customers: SaaSCustomer[]): AtRiskReport {
  const atRisk = customers
    .map(c => ({ customer: c, churnProbability: predictChurn(c) }))
    .filter(r => r.churnProbability > 0.3)
    .sort((a, b) => b.churnProbability - a.churnProbability);
  
  const potentialLoss = atRisk.reduce((a, r) => a + r.customer.monthlyPayment * r.churnProbability, 0);
  
  return {
    atRiskCustomers: atRisk,
    potentialMRRLoss: potentialLoss,
    recommendedActions: atRisk.map(r => ({
      customer: r.customer,
      action: r.churnProbability > 0.7 ? 'URGENT_CALL' : 
              r.churnProbability > 0.5 ? 'OFFER_DISCOUNT' : 'SEND_ENGAGEMENT_EMAIL'
    }))
  };
}
```

#### Player Decisions (SaaS):
- **Pricing Tiers:** Freemium vs Trial vs Enterprise-only
- **Churn Prevention:** Customer success investment
- **Growth vs Profitability:** Burn for growth vs Unit economics

---

### 🏢 SUBSECTION 4: INFRASTRUCTURE (Data Centers)

**Core Fantasy:** Be NVIDIA / AWS / Google Cloud. Own the compute.

#### Mechanics Using NPM Packages:

**1. Data Center PUE Optimization** (`mathjs`, `jstat`)
```typescript
interface DataCenter {
  gpuCount: number;
  gpuType: 'V100' | 'A100' | 'H100';
  coolingSystem: 'air' | 'liquid' | 'immersion';
  location: { lat: number; lng: number }; // affects ambient temp
  powerCostPerKWh: number;
}

function calculatePUE(datacenter: DataCenter, season: 'summer' | 'winter'): number {
  // Base PUE from cooling system
  const basePUE = { air: 1.6, liquid: 1.2, immersion: 1.05 }[datacenter.coolingSystem];
  
  // Seasonal adjustment (warmer = higher PUE)
  const seasonFactor = season === 'summer' ? 1.1 : 0.95;
  
  // Location adjustment (equator = warmer)
  const latFactor = 1 + (90 - Math.abs(datacenter.location.lat)) / 500;
  
  return basePUE * seasonFactor * latFactor;
}

function calculateDataCenterProfitability(datacenter: DataCenter): Profitability {
  const pue = calculatePUE(datacenter, getCurrentSeason());
  
  // GPU specs
  const gpuSpecs = {
    V100: { watts: 300, price: 2.5 },
    A100: { watts: 400, price: 4.0 },
    H100: { watts: 700, price: 8.0 }
  }[datacenter.gpuType];
  
  // Power cost per hour
  const powerCostPerHour = (gpuSpecs.watts / 1000) * pue * datacenter.powerCostPerKWh * datacenter.gpuCount;
  
  // Revenue per hour (assuming 85% utilization)
  const utilization = 0.85;
  const revenuePerHour = gpuSpecs.price * datacenter.gpuCount * utilization;
  
  // Monthly calculations
  const hoursPerMonth = 730;
  const monthlyRevenue = revenuePerHour * hoursPerMonth;
  const monthlyPowerCost = powerCostPerHour * hoursPerMonth;
  const monthlyProfit = monthlyRevenue - monthlyPowerCost;
  
  return {
    pue,
    utilizationRate: utilization,
    revenuePerGPUHour: gpuSpecs.price,
    costPerGPUHour: powerCostPerHour / datacenter.gpuCount,
    monthlyRevenue,
    monthlyPowerCost,
    monthlyProfit,
    margin: monthlyProfit / monthlyRevenue * 100
  };
}
```

**2. Compute Marketplace** (`javascript-lp-solver`)
```typescript
function optimizeComputeAllocation(
  requests: ComputeRequest[],
  availableGPUs: GPUPool[]
): AllocationPlan {
  const model = {
    optimize: 'revenue',
    opType: 'max',
    constraints: {
      // GPU capacity constraints per pool
      ...Object.fromEntries(
        availableGPUs.map(pool => [pool.id, { max: pool.available }])
      )
    },
    variables: {}
  };
  
  // Create variables for each request-pool combination
  requests.forEach(req => {
    availableGPUs.forEach(pool => {
      if (pool.gpuType === req.gpuType) {
        model.variables[`${req.id}_${pool.id}`] = {
          revenue: req.pricePerHour * req.hoursRequested,
          [pool.id]: req.gpusNeeded
        };
      }
    });
  });
  
  return Solver.Solve(model);
}
```

#### Player Decisions (Infrastructure):
- **GPU Generation:** Buy now (V100 cheap) vs Wait (H100 expensive but 4x faster)
- **Location:** Cheap power (Iceland) vs Near customers (low latency)
- **Cooling Investment:** Air (cheap, high PUE) vs Immersion (expensive, low PUE)
- **Capacity Planning:** Overbuild (risk) vs Just-in-time (miss demand)

---

### 💡 SUBSECTION 5: INNOVATION & IP

**Core Fantasy:** Be ARM / Qualcomm. License technology globally.

#### Mechanics Using NPM Packages:

**1. Patent Portfolio Valuation** (`simple-statistics`)
```typescript
interface Patent {
  id: string;
  filingDate: Date;
  claims: number;
  citations: number;
  licensees: string[];
  annualRoyalties: number;
  expirationDate: Date;
}

function valuatePatentPortfolio(patents: Patent[]): PortfolioValuation {
  const now = new Date();
  
  return patents.map(patent => {
    const yearsRemaining = (patent.expirationDate.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000);
    
    // DCF valuation of future royalties
    const discountRate = 0.12; // 12% discount rate
    const presentValue = patent.annualRoyalties * 
      ((1 - Math.pow(1 + discountRate, -yearsRemaining)) / discountRate);
    
    // Citation premium (more citations = more valuable)
    const citationMultiplier = 1 + Math.log10(patent.citations + 1) * 0.2;
    
    return {
      patent,
      presentValue: presentValue * citationMultiplier,
      yearsRemaining,
      strength: patent.claims * patent.citations
    };
  });
}
```

**2. Model Licensing Marketplace** (`chance`)
```typescript
interface ModelListing {
  model: AIModel;
  licenseFee: number; // one-time
  perCallFee: number; // per API call
  exclusivity: boolean;
}

function simulateModelLicenseDeal(
  listing: ModelListing,
  buyer: Company
): DealOutcome {
  const chance = new Chance();
  
  // Buyer interest based on model quality and price
  const qualityScore = listing.model.benchmarkScores.accuracy || 0.8;
  const priceAttractiveness = 1 - (listing.licenseFee / (buyer.budget * 0.1));
  const exclusivityPremium = listing.exclusivity ? 0.3 : 0;
  
  const dealProbability = (qualityScore + priceAttractiveness) / 2 + exclusivityPremium;
  const dealClosed = chance.bool({ likelihood: dealProbability * 100 });
  
  if (dealClosed) {
    // Estimate revenue over 3 years
    const estimatedCalls = buyer.monthlyAPIBudget / listing.perCallFee * 36;
    const totalRevenue = listing.licenseFee + (estimatedCalls * listing.perCallFee);
    
    return { success: true, revenue: totalRevenue, buyer };
  }
  
  return { success: false, revenue: 0, buyer };
}
```

#### Player Decisions (Innovation):
- **Defensive vs Offensive:** Build moat vs Sue competitors
- **License Broadly vs Exclusively:** Volume vs Premium
- **Open Source Strategy:** Give away to create ecosystem

---

### Player Decisions Summary (All Tech Subsections):

| Subsection | Key Tradeoffs |
|------------|---------------|
| **AI/ML** | Research publications vs Product shipping, Model size vs Cost |
| **Software** | Ship fast vs Quality, Features vs Bug fixes |
| **SaaS** | Growth vs Profitability, Freemium vs Enterprise |
| **Infrastructure** | Capacity vs Utilization, GPU generation timing |
| **Innovation** | Open source vs IP protection, Exclusive vs Volume licensing |

---

## 📺 MEDIA - Media Mogul

**Core Fantasy:** Be Disney + TikTok. Control attention.

### Mechanics Using NPM Packages:

**1. Content Engagement Algorithm** (`jstat`, `chance`)
```typescript
function calculateEngagement(content: MediaContent): EngagementMetrics {
  const chance = new Chance();
  
  // Base engagement from quality
  const qualityScore = content.productionValue * content.talentRating / 100;
  
  // Trend multiplier
  const trendBonus = content.topics.some(t => 
    currentTrends.includes(t)) ? 1.5 : 1.0;
  
  // Viral factor (power law distribution)
  const viralChance = Math.pow(qualityScore, 2) * trendBonus;
  const isViral = chance.bool({ likelihood: viralChance * 10 });
  
  const baseViews = content.platform.audienceSize * 0.01;
  const views = isViral ? baseViews * chance.integer({ min: 10, max: 100 }) : baseViews;
  
  return {
    views,
    engagement: qualityScore * (isViral ? 3 : 1),
    revenue: calculateAdRevenue(views, content.platform.cpm)
  };
}
```

**2. Audience Growth Model** (`ml-regression`)
```typescript
function projectAudienceGrowth(platform: MediaPlatform): number[] {
  // S-curve growth model
  const saturationPoint = platform.marketSize;
  const currentAudience = platform.subscribers;
  const growthRate = platform.contentFrequency * platform.avgEngagement / 1000;
  
  const projections = [];
  let audience = currentAudience;
  
  for (let month = 0; month < 12; month++) {
    const growth = growthRate * audience * (1 - audience / saturationPoint);
    audience += growth;
    projections.push(Math.round(audience));
  }
  
  return projections;
}
```

### Player Decisions:
- Content type (news, entertainment, education)
- Platform investment (YouTube, TikTok, streaming)
- Talent acquisition and contracts
- Ad vs subscription revenue model

---

## 🚚 LOGISTICS - Supply Chain King

**Core Fantasy:** Be Amazon Logistics + FedEx. Move everything.

### Mechanics Using NPM Packages:

**1. Route Optimization** (`javascript-lp-solver`)
```typescript
function optimizeDeliveryRoutes(
  warehouse: Warehouse,
  deliveries: Delivery[],
  vehicles: Vehicle[]
): RouteAssignment[] {
  // Simplified Vehicle Routing Problem
  const model = {
    optimize: 'totalDistance',
    opType: 'min',
    constraints: {
      // All deliveries must be assigned
      ...Object.fromEntries(
        deliveries.map(d => [d.id, { equal: 1 }])
      ),
      // Vehicle capacity constraints
      ...Object.fromEntries(
        vehicles.map(v => [`capacity_${v.id}`, { max: v.capacity }])
      )
    },
    variables: {}
  };
  
  // Create decision variables for each vehicle-delivery pair
  vehicles.forEach(v => {
    deliveries.forEach(d => {
      const distance = calculateDistance(warehouse, d.destination);
      model.variables[`${v.id}_${d.id}`] = {
        totalDistance: distance,
        [d.id]: 1,
        [`capacity_${v.id}`]: d.weight
      };
    });
  });
  
  return Solver.Solve(model);
}
```

**2. Warehouse Allocation** (`simple-statistics`)
```typescript
function calculateOptimalInventory(
  product: Product,
  demandHistory: number[]
): InventoryRecommendation {
  const avgDemand = ss.mean(demandHistory);
  const stdDev = ss.standardDeviation(demandHistory);
  const leadTime = product.supplier.leadTimeDays;
  
  // Safety stock = Z-score * StdDev * sqrt(LeadTime)
  const zScore = 1.65; // 95% service level
  const safetyStock = Math.ceil(zScore * stdDev * Math.sqrt(leadTime));
  
  // Reorder point = (Avg Demand * Lead Time) + Safety Stock
  const reorderPoint = Math.ceil(avgDemand * leadTime) + safetyStock;
  
  return {
    safetyStock,
    reorderPoint,
    economicOrderQuantity: calculateEOQ(product, avgDemand)
  };
}
```

### Player Decisions:
- Fleet composition (small vans vs large trucks)
- Warehouse locations (coverage vs cost)
- Delivery speed tiers (same-day, next-day, standard)
- Own fleet vs 3PL partnerships

---

## 🏥 HEALTHCARE - Pharma Baron

**Core Fantasy:** Be Pfizer + HCA. Control health.

### Mechanics Using NPM Packages:

**1. Clinical Trial Simulation** (`jstat`, `chance`)
```typescript
function simulateClinicalTrial(drug: DrugCandidate): TrialResult {
  const chance = new Chance();
  
  // Phase-specific success rates
  const phaseSuccessRates = {
    phase1: 0.63, // Safety
    phase2: 0.31, // Efficacy
    phase3: 0.58, // Large-scale
    approval: 0.85 // FDA review
  };
  
  // Adjust for drug quality
  const adjustedRate = phaseSuccessRates[drug.currentPhase] * 
    (drug.researchQuality / 100);
  
  const passed = chance.bool({ likelihood: adjustedRate * 100 });
  
  // Time to complete (normal distribution)
  const baseMonths = { phase1: 12, phase2: 24, phase3: 36, approval: 18 };
  const duration = Math.round(
    jstat.normal.sample(baseMonths[drug.currentPhase], 6)
  );
  
  return { passed, duration, cost: drug.trialCost * duration };
}
```

**2. Insurance Actuarial Model** (`jstat`, `simple-statistics`)
```typescript
function calculatePremium(demographics: PatientPool): number {
  // Age-based risk factor
  const ageRisk = ss.mean(demographics.ages.map(age => 
    Math.pow(1.02, age - 25) // 2% increase per year over 25
  ));
  
  // Chronic condition multiplier
  const conditionRisk = 1 + (demographics.chronicConditions * 0.3);
  
  // Regional cost adjustment
  const regionalFactor = demographics.region.healthcareCostIndex;
  
  const basePremium = 500; // Base monthly premium
  return basePremium * ageRisk * conditionRisk * regionalFactor;
}
```

### Player Decisions:
- R&D portfolio (safe bets vs moonshots)
- Clinical trial design (speed vs success rate)
- Drug pricing strategy
- Hospital vs clinic vs insurance focus

---

## 🔫 CRIME - Underworld Boss

**Core Fantasy:** Be Pablo Escobar meets Walter White. Build an empire in the shadows.

### Mechanics Using NPM Packages:

**1. Heat Mechanics** (`jstat`, `chance`)
```typescript
function calculateHeat(operation: CrimeOperation): number {
  const chance = new Chance();
  
  // Base heat from operation size
  let heat = operation.size * operation.visibility;
  
  // Random law enforcement attention
  if (chance.bool({ likelihood: heat / 2 })) {
    heat *= chance.floating({ min: 1.2, max: 2.0 });
  }
  
  // Decay over time (half-life model)
  const decayFactor = Math.pow(0.5, operation.daysSinceActivity / 30);
  
  return Math.min(100, heat * decayFactor);
}
```

**2. Drug Price Volatility** (`jstat`, `simple-statistics`)
```typescript
function simulateDrugMarket(
  market: DrugMarket,
  busts: BustEvent[]
): PriceChange {
  // Supply shock from busts
  const supplyShock = busts
    .filter(b => b.drug === market.drug)
    .reduce((acc, b) => acc + b.seizureAmount / market.totalSupply, 0);
  
  // Price response (supply curve)
  const priceMultiplier = 1 + supplyShock * 2;
  
  // Random market noise
  const noise = jstat.normal.sample(1, 0.1);
  
  return {
    newPrice: market.currentPrice * priceMultiplier * noise,
    volatility: supplyShock > 0.1 ? 'high' : 'normal'
  };
}
```

**3. Territory Control** (`chance`)
```typescript
function resolveTurfWar(
  attacker: CrimeOrg,
  defender: CrimeOrg,
  territory: Territory
): TurfWarResult {
  const chance = new Chance();
  
  // Combat strength
  const attackerStrength = attacker.enforcers * attacker.weaponQuality;
  const defenderStrength = defender.enforcers * defender.weaponQuality * 1.2; // Home advantage
  
  // Probabilistic outcome
  const attackerChance = attackerStrength / (attackerStrength + defenderStrength);
  const attackerWins = chance.bool({ likelihood: attackerChance * 100 });
  
  // Casualties (both sides always take losses)
  const casualties = {
    attacker: Math.ceil(attacker.enforcers * chance.floating({ min: 0.1, max: 0.4 })),
    defender: Math.ceil(defender.enforcers * chance.floating({ min: 0.1, max: 0.3 }))
  };
  
  return { winner: attackerWins ? 'attacker' : 'defender', casualties };
}
```

### Player Decisions:
- Product portfolio (risk vs margin)
- Violence vs stealth approach
- Bribes vs avoiding law enforcement
- Territory expansion vs consolidation

---

## 🏛️ POLITICS - Power Broker

**Core Fantasy:** Be the Koch Brothers meets Lyndon Johnson. Shape the world.

### Mechanics Using NPM Packages:

**1. Election Simulation** (`jstat`, `chance`)
```typescript
function simulateElection(
  candidates: Candidate[],
  electorate: Electorate
): ElectionResult {
  const chance = new Chance();
  
  // Calculate vote share based on alignment and spending
  const voteShares = candidates.map(c => {
    const ideologyMatch = 1 - Math.abs(c.ideology - electorate.medianVoter) / 100;
    const spendingEffect = Math.log10(c.campaignSpending + 1) / 8;
    const incumbentBonus = c.isIncumbent ? 0.05 : 0;
    const charisma = c.charisma / 100 * 0.1;
    
    // Add polling noise
    const noise = jstat.normal.sample(0, 0.03);
    
    return ideologyMatch * 0.4 + spendingEffect + incumbentBonus + charisma + noise;
  });
  
  // Normalize to percentages
  const total = ss.sum(voteShares);
  return candidates.map((c, i) => ({
    candidate: c,
    voteShare: voteShares[i] / total
  }));
}
```

**2. Bill Passage Probability** (`jstat`)
```typescript
function calculateBillPassage(bill: Bill, legislators: Legislator[]): number {
  // Count likely votes
  const likelyYes = legislators.filter(l => {
    const ideologyMatch = 1 - Math.abs(l.ideology - bill.ideologyPosition) / 100;
    const lobbyInfluence = bill.lobbyingSpend / l.campaignCost * 0.1;
    const partyPressure = l.party === bill.sponsorParty ? 0.2 : -0.1;
    
    return ideologyMatch + lobbyInfluence + partyPressure > 0.5;
  }).length;
  
  const passageThreshold = legislators.length / 2 + 1;
  
  // Return probability based on how close we are
  const margin = likelyYes - passageThreshold;
  return jstat.normal.cdf(margin, 0, legislators.length * 0.1);
}
```

### Player Decisions:
- Which candidates to back
- Which bills to lobby for/against
- Direct spending vs PAC contributions
- Local vs state vs federal focus

---

# 🏢 COMPLETE COMPANY TYPE GAMEPLAY LOOPS

This section defines the **unique gameplay mechanics for every company type at every level**. The game has 17 industries × 5 levels = 85 unique company configurations, each with distinct gameplay.

**Source:** `old projects/politics/src/constants/companyLevels.ts` (2,296 lines)

---

## 📊 COMPANY PROGRESSION OVERVIEW

Each industry follows a 5-level progression from startup to global empire:

| Level | Stage | Market Reach | Revenue Scale | Employees |
|-------|-------|--------------|---------------|-----------|
| 1 | Startup/Solo | Local | $5K-$50K/mo | 1-5 |
| 2 | Small Business | Regional | $50K-$500K/mo | 5-50 |
| 3 | Mid-Market | Multi-State | $500K-$5M/mo | 50-500 |
| 4 | National Corporation | National | $5M-$100M/mo | 500-10K |
| 5 | Global Empire | Global | $100M-$3B/mo | 10K-500K |

---

## 🎬 MEDIA INDUSTRY

### Level 1: Content Creator ($5K startup)
**Fantasy:** You're a YouTuber in your bedroom  
**Core Loop:** Create content → Build audience → Earn ad revenue

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Content Calendar** | Schedule 1-4 posts/week | Quality vs quantity tradeoff |
| **Niche Selection** | Pick topic (gaming, news, lifestyle) | Each niche has different audience/revenue curves |
| **Platform Choice** | YouTube, TikTok, Twitch, Blog | Platform-specific algorithms and monetization |
| **Engagement** | Respond to comments, build community | Time investment vs growth rate |

**Tick Processing:**
```typescript
// Per-tick content creator simulation
const viewsThisMonth = baseSubscribers * engagementRate * (1 + viralChance);
const adRevenue = viewsThisMonth * cpmRate / 1000;
const sponsorRevenue = hasSponsors ? sponsorDeal : 0;
```

**Unlock at Level 2:** Multi-platform distribution, first employee

---

### Level 2: Media Startup ($75K upgrade)
**Fantasy:** You're a small production company  
**Core Loop:** Produce content → Hire talent → Secure sponsorships

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Talent Management** | Hire content creators, editors | Salary vs revenue share |
| **Sponsorship Pipeline** | Pitch brands for deals | Accept low offers or wait for better |
| **Content Syndication** | License content to platforms | Exclusive vs non-exclusive deals |
| **Ad Network Optimization** | Choose ad partners | CPM vs user experience |

**New Decisions:**
- Hire in-house editor vs freelance
- Take brand deal that might alienate audience
- Pivot content strategy based on analytics

**Unlock at Level 3:** Original productions, licensing deals

---

### Level 3: Media Company ($1M upgrade)
**Fantasy:** You're Vice Media or BuzzFeed  
**Core Loop:** Own IP → License content → Build brands

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Original Productions** | Create shows, podcasts, films | Budget allocation across projects |
| **Licensing Deals** | Sell content to Netflix, Hulu | Exclusive premium vs wide distribution |
| **Brand Extensions** | Merchandise, events, experiences | Revenue diversification |
| **Talent Pipeline** | Develop new creators | Invest in unknown vs poach established |

**New Decisions:**
- Cancel underperforming show or give it time
- Accept acquisition offer from Level 4/5 company
- Enter controversial topics for views

**Unlock at Level 4:** National broadcasting, streaming platform

---

### Level 4: National Media Network ($30M upgrade)
**Fantasy:** You're CBS or HBO  
**Core Loop:** Broadcast nationally → Own distribution → Influence culture

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Broadcast Rights** | Sports, news, entertainment | Bid wars for premium content |
| **Streaming Platform** | Build or buy streaming service | Build vs partner vs acquire |
| **News Division** | 24/7 news coverage | Editorial stance affects audience |
| **Advertising Upfronts** | Sell annual ad commitments | Pricing strategy, guarantees |

**New Decisions:**
- Cover controversial story that might hurt advertiser
- Outbid competitor for sports rights (risky)
- Acquire struggling Level 3 company

**Unlock at Level 5:** Global broadcasting, content monopoly

---

### Level 5: Global Media Empire ($500M upgrade)
**Fantasy:** You're Disney or Warner Bros Discovery  
**Core Loop:** Own IP libraries → Control distribution → Shape culture

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **IP Portfolio Management** | Own franchises worth billions | Exploit vs preserve brand value |
| **Vertical Integration** | Own production + distribution + retail | Antitrust risk vs efficiency |
| **Global Expansion** | Localize content for every market | Local production vs dubbing |
| **Political Influence** | Lobby for favorable media regulations | Regulatory capture strategy |

**Endgame Decisions:**
- Acquire competitor (antitrust scrutiny)
- Spin off division for regulatory compliance
- Take political stance that alienates half of audience

---

## 💻 TECHNOLOGY INDUSTRY

The Technology industry has **3 subcategories**, each with 5 levels (15 company types total).

### 🔷 Software Subcategory

#### Level 1: Freelance Developer ($6K startup)
**Fantasy:** You're a solo coder doing contract work  
**Core Loop:** Find clients → Build projects → Get paid

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Client Pipeline** | Bid on projects (Upwork style) | Low bid for volume vs high bid for quality |
| **Skill Tree** | Specialize in frontend/backend/mobile | Deep expertise vs breadth |
| **Portfolio Building** | Complete projects add reputation | Take interesting work or highest paying |
| **Time Management** | Hours available per month | Overwork for more money (burnout risk) |

**Tick Processing:**
```typescript
// Freelancer revenue model
const projectsCompleted = Math.min(availableHours / avgProjectHours, activeProjects);
const revenue = projectsCompleted * avgProjectValue;
const reputation += projectsCompleted * qualityMultiplier;
```

---

#### Level 2: SaaS Startup ($45K upgrade)
**Fantasy:** You're building the next Slack  
**Core Loop:** Build product → Acquire users → Convert to paid

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Product Roadmap** | Feature backlog prioritization | Customer requests vs vision |
| **Pricing Model** | Freemium, trial, usage-based | Optimize for growth vs revenue |
| **Churn Management** | Retain paying customers | Invest in support vs features |
| **MRR Tracking** | Monthly recurring revenue | Growth rate vs profitability |

**Key Metrics:**
- MRR (Monthly Recurring Revenue)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Churn Rate

---

#### Level 3: Software Company ($600K upgrade)
**Fantasy:** You're Atlassian or Notion  
**Core Loop:** Platform ecosystem → Enterprise sales → Market leadership

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Enterprise Sales** | Long sales cycles, big deals | Sales team investment |
| **Platform APIs** | Third-party integrations | Open ecosystem vs walled garden |
| **M&A Targets** | Acquire smaller competitors | Buy vs build vs partner |
| **International** | Expand to new markets | Localization investment |

---

#### Level 4: Software Platform ($20M upgrade)
**Fantasy:** You're Salesforce or Adobe  
**Core Loop:** Ecosystem lock-in → Acquisitions → Market dominance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Ecosystem Lock-in** | Make switching costly | Balance ethics vs strategy |
| **Acquisition Strategy** | Buy emerging competitors | Valuation vs strategic fit |
| **Developer Relations** | Build third-party app store | Revenue share terms |
| **Enterprise Contracts** | Multi-year deals | Discount for commitment |

---

#### Level 5: Tech Giant ($250M upgrade)
**Fantasy:** You're Microsoft or Google  
**Core Loop:** Platform monopoly → Regulatory navigation → Global influence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Antitrust Defense** | Regulators investigating | Comply, fight, or settle |
| **OS/Platform Control** | Operating system or cloud | Preinstall deals, defaults |
| **Talent Wars** | Compete for top engineers | Salary arms race |
| **Political Lobbying** | Influence tech regulation | Which bills to support/oppose |

---

### 🤖 AI Subcategory

#### Level 1: AI Consultant ($12K startup)
**Fantasy:** You're an ML freelancer  
**Core Loop:** Consulting gigs → Build models → Sell expertise

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Model Fine-tuning** | Customize open-source models | Quick and dirty vs production-grade |
| **Compute Credits** | Cloud GPU budget | Train bigger or save money |
| **Client Education** | Explain AI to non-technical | Premium pricing for simplification |
| **Ethics Position** | Take controversial projects? | Revenue vs reputation |

---

#### Level 2: AI Startup ($85K upgrade)
**Fantasy:** You're building a focused AI product  
**Core Loop:** Train models → Ship product → Iterate on feedback

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Model Training** | Training runs cost $10K-$1M | Model size vs budget |
| **Data Acquisition** | Quality training data | Buy vs scrape vs synthesize |
| **GPU Infrastructure** | Own vs rent compute | CapEx vs OpEx |
| **Benchmark Performance** | Compete on leaderboards | Benchmark gaming vs real quality |

**Training Simulation:**
```typescript
// AI model training events
const trainingEvents = [
  { event: 'normal', probability: 0.7, effect: 'progress += 5%' },
  { event: 'gpu_failure', probability: 0.1, effect: 'progress -= 10%, cost += 20%' },
  { event: 'breakthrough', probability: 0.05, effect: 'progress += 25%' },
  { event: 'overfitting', probability: 0.1, effect: 'quality -= 15%' },
  { event: 'data_leak', probability: 0.05, effect: 'reputation -= 20%' }
];
```

---

#### Level 3: AI Platform ($750K upgrade)
**Fantasy:** You're Hugging Face or Scale AI  
**Core Loop:** API platform → Developer adoption → Enterprise deals

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **API Pricing** | Per-token, per-request, flat | Optimize for adoption vs revenue |
| **Model Zoo** | Host multiple models | Quality curation vs quantity |
| **Enterprise SLAs** | Uptime guarantees | Investment in reliability |
| **Research Papers** | Publish findings | Open research vs competitive advantage |

---

#### Level 4: AI Research Lab ($15M upgrade)
**Fantasy:** You're Anthropic or Cohere  
**Core Loop:** Foundation models → Licensing → Industry leadership

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Foundation Model Training** | $10M-$100M per model | Bet big or iterate small |
| **Safety Research** | AI alignment investment | Move fast vs move safely |
| **Talent Acquisition** | Poach from competitors | Salary wars ($500K+ packages) |
| **Regulatory Positioning** | Shape AI legislation | Advocate for rules that help you |

---

#### Level 5: AGI Company ($250M upgrade)
**Fantasy:** You're OpenAI or DeepMind  
**Core Loop:** AGI pursuit → Supercomputer clusters → Global influence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **AGI Research** | Moonshot capability investments | Timeline estimates |
| **Supercomputer Clusters** | Build massive GPU farms | $1B+ infrastructure |
| **Government Contracts** | Military/intelligence deals | Ethics vs revenue |
| **Existential Risk** | Safety vs capabilities | How fast to push |

**AGI Milestone System:**
```typescript
// AGI capability levels
const agiMilestones = [
  { level: 1, name: 'Task AI', capability: 'Narrow domain expertise' },
  { level: 2, name: 'Multi-Modal', capability: 'Vision + language + code' },
  { level: 3, name: 'Reasoning', capability: 'Multi-step logical reasoning' },
  { level: 4, name: 'Research AI', capability: 'Novel scientific discoveries' },
  { level: 5, name: 'AGI', capability: 'General human-level intelligence' }
];
```

---

### 🔧 Hardware Subcategory

#### Level 1: Repair Shop ($18K startup)
**Fantasy:** You're fixing computers and phones  
**Core Loop:** Repair devices → Build reputation → Upsell services

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Repair Queue** | Jobs waiting for completion | Prioritize by profit or urgency |
| **Parts Inventory** | Stock common components | Tie up capital or lose jobs |
| **Service Tiers** | Standard vs rush pricing | Price discrimination |
| **Data Recovery** | High-margin specialty service | Invest in clean room? |

---

#### Level 2: Hardware Startup ($95K upgrade)
**Fantasy:** You're building a product on Kickstarter  
**Core Loop:** Design product → Crowdfund → Ship to backers

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Prototype Development** | R&D investment | Perfectionism vs shipping |
| **Crowdfunding Campaign** | Kickstarter/Indiegogo | Stretch goals, pricing tiers |
| **Manufacturing Partner** | Find factory in China | Quality vs cost |
| **Fulfillment Logistics** | Ship to backers worldwide | Delays = angry customers |

---

#### Level 3: Hardware Manufacturer ($1.2M upgrade)
**Fantasy:** You're Logitech or Anker  
**Core Loop:** Manufacturing → Distribution → Brand building

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Own Factory vs Contract** | CapEx vs flexibility | Control vs capital efficiency |
| **Product Line Management** | Portfolio of products | New products vs refresh existing |
| **Retail Partnerships** | Best Buy, Amazon | Margin erosion vs volume |
| **Quality Control** | Defect rate management | Inspection investment |

---

#### Level 4: Hardware Brand ($35M upgrade)
**Fantasy:** You're Corsair or Razer  
**Core Loop:** Brand loyalty → Multiple product lines → Retail dominance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Brand Marketing** | Sponsorships, esports, influencers | Brand spend ROI |
| **Product Portfolio** | Keyboards, mice, chairs, PCs | Diversification strategy |
| **D2C vs Retail** | Direct sales margin vs reach | Channel conflict |
| **Price Positioning** | Premium vs value | Margin vs market share |

---

#### Level 5: Global Hardware Leader ($400M upgrade)
**Fantasy:** You're Apple or NVIDIA  
**Core Loop:** Vertical integration → Supply chain control → Industry standard

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Custom Silicon** | Design own chips | Massive R&D investment |
| **Supply Chain Lock-in** | Exclusive supplier deals | Lock competitors out of supply |
| **Ecosystem Integration** | Hardware + software + services | Proprietary vs open |
| **Manufacturing Scale** | Millions of units | Foxconn-scale operations |

---

## 🏦 BANKING INDUSTRY

### Level 1: Community Bank ($18K startup)
**Fantasy:** You're a local credit union  
**Core Loop:** Take deposits → Make loans → Earn interest spread

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Deposit Rates** | Interest paid to savers | Attract deposits vs protect margin |
| **Loan Underwriting** | Approve/deny applications | Risk tolerance |
| **Local Relationships** | Know your customers | Community investment |
| **Regulatory Compliance** | Basic banking rules | Minimum viable compliance |

**Banking Simulation:**
```typescript
// Net Interest Income calculation
const depositRate = 0.02; // 2% paid to depositors
const loanRate = 0.08; // 8% charged to borrowers
const spreadMargin = loanRate - depositRate; // 6%
const netInterestIncome = loanPortfolio * spreadMargin / 12;
```

---

### Level 2: Regional Bank ($175K upgrade)
**Fantasy:** You're a multi-branch bank  
**Core Loop:** Branch network → Diversified lending → Fee income

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Branch Network** | Physical locations | Open/close branches |
| **Loan Portfolio Mix** | Consumer, auto, mortgage, business | Risk diversification |
| **Fee Products** | Overdraft, wire, ATM fees | Customer friendliness vs revenue |
| **ATM Network** | Own vs shared network | Convenience vs cost |

---

### Level 3: State Banking Institution ($5M upgrade)
**Fantasy:** You're a major state bank  
**Core Loop:** Commercial lending → Wealth management → Investment services

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Commercial Loans** | Business lending | Industry exposure limits |
| **Wealth Management** | Investment advisory | AUM growth vs client service |
| **Treasury Services** | Corporate cash management | Enterprise relationships |
| **Risk Management** | Loan loss reserves | Conservative vs aggressive |

---

### Level 4: National Banking Corporation ($100M upgrade)
**Fantasy:** You're US Bank or PNC  
**Core Loop:** National presence → Investment banking → Credit cards

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Investment Banking** | M&A advisory, IPOs | Deal flow cultivation |
| **Credit Card Division** | Issue cards, earn interchange | Rewards programs |
| **Mortgage Origination** | Home loan volume | Sell to GSEs vs hold |
| **Capital Requirements** | Regulatory capital ratios | Growth vs stability |

---

### Level 5: Global Banking Giant ($2B upgrade)
**Fantasy:** You're JPMorgan or Goldman  
**Core Loop:** Global markets → "Too big to fail" → Central bank influence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Trading** | FX, commodities, derivatives | Trading desk P&L |
| **Systemic Importance** | SIFI designation | Regulatory burden vs implicit backing |
| **Central Bank Access** | Fed window, policy influence | Lobbying priorities |
| **Crisis Management** | Bail-in risk, stress tests | Buffer capital levels |

---

## ⚡ ENERGY INDUSTRY

### Level 1: Energy Consultant ($20K startup)
**Fantasy:** You're installing solar panels  
**Core Loop:** Audit homes → Install systems → Earn referrals

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Home Energy Audits** | Assess efficiency | Upsell opportunities |
| **Solar Installation** | Residential projects | Panel supplier choice |
| **Permit Management** | Local regulations | Time vs cost |
| **Financing Partnerships** | Offer customer financing | Revenue share |

---

### Level 2: Energy Company ($165K upgrade)
**Fantasy:** You're a regional power producer  
**Core Loop:** Power generation → PPA contracts → Grid sales

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Generation Assets** | Solar farms, wind turbines | Renewable vs fossil |
| **PPA Negotiation** | Long-term power contracts | Price stability vs upside |
| **Grid Interconnection** | Connect to power grid | Interconnection costs |
| **Renewable Credits** | RECs and carbon credits | Sell or bank for compliance |

---

### Level 3: Regional Energy Provider ($4M upgrade)
**Fantasy:** You're a regional utility  
**Core Loop:** Distribution network → Rate cases → Regulatory relationships

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Distribution Grid** | Power lines, substations | Infrastructure investment |
| **Rate Cases** | Regulatory pricing approval | Justify returns to regulators |
| **Fuel Mix** | Balance generation sources | Reliability vs cost vs green |
| **Demand Response** | Peak load management | Customer incentive programs |

---

### Level 4: National Energy Corporation ($120M upgrade)
**Fantasy:** You're Duke Energy or NextEra  
**Core Loop:** National grid → Energy trading → Regulatory capture

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Energy Trading** | Wholesale power markets | Trading desk strategy |
| **Interstate Transmission** | High-voltage lines | FERC approval process |
| **Nuclear Plants** | Massive baseload generation | Regulatory and safety |
| **Green Transition** | Coal retirement schedule | Stranded asset risk |

---

### Level 5: Global Energy Conglomerate ($3B upgrade)
**Fantasy:** You're ExxonMobil or Shell  
**Core Loop:** Global infrastructure → Geopolitical power → Climate impact

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Oil/Gas Exploration** | Upstream assets | Exploration risk |
| **Refining** | Downstream processing | Crack spreads |
| **Geopolitical Risk** | Operations in unstable regions | Political risk insurance |
| **Energy Transition** | Fossil to renewable pivot | Stranded asset management |

---

## 🏥 HEALTHCARE INDUSTRY

### Level 1: Medical Practice ($35K startup)
**Fantasy:** You're a local doctor's office  
**Core Loop:** See patients → Bill insurance → Manage overhead

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Patient Volume** | Appointments per day | Throughput vs quality |
| **Insurance Mix** | Medicare, Medicaid, private | Payer mix optimization |
| **Billing Accuracy** | Claim coding and submission | Revenue cycle management |
| **Malpractice** | Insurance and risk | Coverage levels |

---

### Level 2: Multi-Specialty Clinic ($145K upgrade)
**Fantasy:** You're an urgent care chain  
**Core Loop:** Multiple services → Patient funnel → Referral network

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Specialty Mix** | Primary, urgent, specialists | Service line profitability |
| **Referral Network** | Relationships with hospitals | Revenue sharing |
| **Diagnostic Equipment** | X-ray, MRI, lab | Buy vs outsource |
| **Patient Experience** | Wait times, satisfaction | Quality scores affect reimbursement |

---

### Level 3: Regional Hospital System ($2.5M upgrade)
**Fantasy:** You're a hospital network  
**Core Loop:** Acute care → Research → Teaching

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Hospital Operations** | Bed capacity, OR utilization | Capital allocation |
| **Research Grants** | NIH funding, clinical trials | Academic vs commercial |
| **Medical Education** | Teaching hospital status | Resident training |
| **Quality Metrics** | CMS star ratings | Bonus payments |

---

### Level 4: National Healthcare Network ($75M upgrade)
**Fantasy:** You're HCA or CommonSpirit  
**Core Loop:** National coverage → Insurance integration → Pharma partnerships

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Payer Contracts** | Insurance negotiations | Network participation |
| **Vertical Integration** | Own insurance company | Risk vs control |
| **Pharmaceutical R&D** | Drug development arm | Long-shot investments |
| **Regulatory Compliance** | HIPAA, FDA, CMS | Compliance infrastructure |

---

### Level 5: Global Healthcare Conglomerate ($1B upgrade)
**Fantasy:** You're UnitedHealth or Johnson & Johnson  
**Core Loop:** Global hospitals → Pharma empire → Health policy influence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Hospital Network** | Facilities worldwide | International expansion |
| **Pharmaceutical Portfolio** | Drug patents, pipelines | R&D vs acquisition |
| **Medical Devices** | Equipment manufacturing | Vertical integration |
| **Health Policy** | Lobby for favorable regulations | Government relations |

---

## 🏭 MANUFACTURING INDUSTRY

### Level 1: Small Workshop ($30K startup)
**Fantasy:** You're a machine shop  
**Core Loop:** Custom orders → Build parts → Deliver quality

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Job Shop** | Custom one-off orders | Pricing individual jobs |
| **Machine Utilization** | Hours of production | Maintenance scheduling |
| **Quality Control** | Inspect finished parts | Quality vs speed |
| **Local Clients** | Build relationships | Repeat business development |

---

### Level 2: Manufacturing Facility ($135K upgrade)
**Fantasy:** You're a small factory  
**Core Loop:** Assembly line → Quality control → Regional distribution

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Assembly Line** | Repetitive production | Line balancing |
| **Inventory Management** | Raw materials, WIP, finished | JIT vs buffer stock |
| **Quality Systems** | ISO certification | Certification investment |
| **Supplier Management** | Vendor relationships | Single source vs diversified |

---

### Level 3: Manufacturing Corporation ($1.5M upgrade)
**Fantasy:** You're a mid-sized manufacturer  
**Core Loop:** Multiple plants → Logistics network → Automation

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Multi-Plant Operations** | Coordinate facilities | Production allocation |
| **Automation Investment** | Robots, CNC, IoT | CapEx vs labor |
| **Supply Chain** | Global sourcing | Risk vs cost |
| **OEE Optimization** | Availability × Performance × Quality | Continuous improvement |

**OEE Calculation:**
```typescript
const oee = availability * performance * quality;
// Target: 85%+ OEE is world-class
// availability = (operatingTime - downtime) / operatingTime
// performance = actualOutput / theoreticalOutput
// quality = goodParts / totalParts
```

---

### Level 4: National Manufacturer ($25M upgrade)
**Fantasy:** You're Caterpillar or Whirlpool  
**Core Loop:** National distribution → Just-in-time → Supply chain mastery

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **National Distribution** | Warehouse network | Fulfillment strategy |
| **Just-in-Time** | Lean manufacturing | Buffer vs efficiency |
| **R&D Investment** | New product development | Innovation pipeline |
| **Labor Relations** | Union negotiations | Wages vs automation |

---

### Level 5: Global Manufacturing Empire ($400M upgrade)
**Fantasy:** You're Toyota or Foxconn  
**Core Loop:** Global supply chain → Industry 4.0 → Vertical integration

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Footprint** | Factories on every continent | Geopolitical risk |
| **Industry 4.0** | Smart factories, IoT | Digital transformation |
| **Vertical Integration** | Own raw materials to finished | Supply chain control |
| **Sustainability** | Carbon footprint reduction | ESG requirements |

---

## 🛒 RETAIL INDUSTRY

### Level 1: Mom & Pop Store ($15K startup)
**Fantasy:** You're a corner store  
**Core Loop:** Stock shelves → Serve customers → Manage cash

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Inventory Selection** | What products to carry | Local demand analysis |
| **Pricing Strategy** | Markup percentage | Competitive positioning |
| **Store Hours** | Operating schedule | Labor vs revenue |
| **Shrinkage** | Theft and spoilage | Loss prevention |

---

### Level 2: Small Retail Business ($65K upgrade)
**Fantasy:** You're a local chain  
**Core Loop:** Multiple locations → Brand building → Loyalty programs

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Store Expansion** | Open new locations | Real estate selection |
| **Brand Marketing** | Local advertising | Marketing ROI |
| **Loyalty Program** | Customer retention | Program design |
| **Vendor Negotiations** | Volume discounts | Supplier relationships |

---

### Level 3: Regional Retail Chain ($700K upgrade)
**Fantasy:** You're HEB or Publix  
**Core Loop:** Distribution centers → Private label → Multi-state presence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Distribution Network** | Central warehousing | DC location strategy |
| **Private Label** | Store brand products | Margin vs brand perception |
| **Category Management** | Shelf space optimization | Data-driven merchandising |
| **Technology** | POS, inventory systems | Tech investment |

---

### Level 4: National Retail Corporation ($25M upgrade)
**Fantasy:** You're Target or Costco  
**Core Loop:** National footprint → E-commerce integration → Supply chain mastery

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Omnichannel** | Online + offline integration | Buy online, pickup in store |
| **Supply Chain** | National logistics | Fulfillment optimization |
| **Real Estate** | Store portfolio management | Close vs invest |
| **Customer Data** | Analytics and personalization | Privacy vs targeting |

---

### Level 5: Global Retail Empire ($350M upgrade)
**Fantasy:** You're Walmart or Amazon  
**Core Loop:** Global brand → Omnichannel dominance → Market leader

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Expansion** | International markets | Localization strategy |
| **E-Commerce Platform** | Compete with Amazon | Technology investment |
| **Supplier Power** | Dictate terms to manufacturers | Ethical considerations |
| **Data Monopoly** | Customer behavior insights | Antitrust scrutiny |

---

## 🛒 E-COMMERCE INDUSTRY

### Level 1: Online Store ($8K startup)
**Fantasy:** You're selling on Shopify  
**Core Loop:** List products → Market → Fulfill orders

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Product Selection** | What to sell | Niche vs broad |
| **Platform Choice** | Shopify, WooCommerce, Etsy | Fees vs features |
| **Marketing** | Paid ads, SEO, social | Customer acquisition cost |
| **Fulfillment** | Pack and ship yourself | Time vs automation |

---

### Level 2: E-Commerce Business ($55K upgrade)
**Fantasy:** You're a growing DTC brand  
**Core Loop:** Multi-channel selling → Automated fulfillment → Regional shipping

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Multi-Channel** | Website + Amazon + eBay | Channel mix |
| **3PL Partners** | Outsource fulfillment | Control vs scale |
| **Customer Service** | Returns, support | Investment in CX |
| **Inventory Forecasting** | Stock planning | Overstock vs stockout |

---

### Level 3: E-Commerce Platform ($500K upgrade)
**Fantasy:** You're becoming a marketplace  
**Core Loop:** Marketplace platform → Third-party sellers → Fulfillment centers

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Marketplace Model** | Host third-party sellers | Platform vs merchant |
| **Fulfillment Network** | Build warehouse network | CapEx investment |
| **Payment Processing** | In-house vs Stripe | Revenue share |
| **Seller Tools** | Analytics, advertising | Ecosystem development |

---

### Level 4: National E-Commerce Leader ($15M upgrade)
**Fantasy:** You're Shopify or Chewy  
**Core Loop:** Same-day delivery → Private label brands → Subscription services

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Fast Shipping** | Same-day, next-day delivery | Logistics investment |
| **Private Label** | Amazon Basics strategy | Brand competition |
| **Subscriptions** | Recurring revenue | Customer lock-in |
| **Data Advantage** | Marketplace insights | Competitive intelligence |

---

### Level 5: Global E-Commerce Giant ($200M upgrade)
**Fantasy:** You're Amazon  
**Core Loop:** Global logistics network → Cloud services → Streaming platform → Market dominance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Logistics** | Worldwide fulfillment | Infrastructure investment |
| **Diversification** | Cloud, streaming, groceries | Portfolio strategy |
| **Regulatory Navigation** | Antitrust scrutiny | Compliance vs growth |
| **Ecosystem Lock-in** | Prime-style membership | Customer lifetime value |

---

## 🏗️ CONSTRUCTION INDUSTRY

### Level 1: Local Contractor ($15K startup)
**Fantasy:** You're a handyman  
**Core Loop:** Find jobs → Complete projects → Build reputation

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Project Pipeline** | Jobs in queue | Bidding strategy |
| **Labor Management** | Hire helpers | Subcontract vs employee |
| **Permits** | Navigate regulations | Compliance costs |
| **Tools/Equipment** | Investment in gear | Buy vs rent |

---

### Level 2: Construction Company ($125K upgrade)
**Fantasy:** You're a small builder  
**Core Loop:** Commercial projects → Multiple crews → Equipment fleet

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Project Management** | Multiple simultaneous jobs | Resource allocation |
| **Crew Scheduling** | Labor utilization | Overtime vs hiring |
| **Equipment Fleet** | Heavy machinery | Lease vs buy |
| **Bonding** | Performance bonds | Financial requirements |

---

### Level 3: Regional Builder ($800K upgrade)
**Fantasy:** You're a regional construction firm  
**Core Loop:** Large developments → Government contracts → Heavy equipment

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Government Bids** | Public sector projects | Compliance requirements |
| **Development Projects** | Multi-building sites | Risk management |
| **Subcontractor Network** | Specialty trades | Relationships vs price |
| **Safety Program** | OSHA compliance | Investment vs liability |

---

### Level 4: National Construction Firm ($12M upgrade)
**Fantasy:** You're Turner Construction  
**Core Loop:** Skyscrapers → Infrastructure projects → National presence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Major Projects** | Skyscrapers, stadiums | Risk profile |
| **Infrastructure** | Roads, bridges, tunnels | Long-term contracts |
| **Design-Build** | In-house architecture | Vertical integration |
| **Technology** | BIM, drones, IoT | Digital construction |

---

### Level 5: Global Construction Giant ($150M upgrade)
**Fantasy:** You're Bechtel or Skanska  
**Core Loop:** Mega projects → International airports → Smart cities → Global leader

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Mega Projects** | $1B+ developments | Risk and reward |
| **International** | Projects worldwide | Currency and political risk |
| **Smart Cities** | Urban planning scale | Technology integration |
| **PPP Deals** | Public-private partnerships | Long-term revenue streams |

---

## 🏠 REAL ESTATE INDUSTRY

### Level 1: Real Estate Agent ($8K startup)
**Fantasy:** You're a licensed realtor  
**Core Loop:** Find listings → Show properties → Close deals

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Listing Pipeline** | Properties to sell | Farming vs referrals |
| **Buyer Relationships** | Qualified leads | Time investment |
| **Commission Splits** | Broker vs agent | Negotiation |
| **Marketing** | Property advertising | Budget allocation |

---

### Level 2: Real Estate Brokerage ($35K upgrade)
**Fantasy:** You're a local brokerage  
**Core Loop:** Multiple agents → Property management → Regional presence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Agent Recruitment** | Build team | Commission structure |
| **Property Management** | Recurring income | Tenant relations |
| **Brand Building** | Local reputation | Marketing investment |
| **Technology** | Listing platforms | Tech vs relationships |

---

### Level 3: Real Estate Firm ($250K upgrade)
**Fantasy:** You're a development company  
**Core Loop:** Commercial real estate → Development projects → Investment properties

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Development** | Build properties | Land acquisition |
| **Commercial Leasing** | Office, retail, industrial | Tenant mix |
| **Investment Properties** | Buy and hold | Cap rate analysis |
| **Financing** | Debt structures | Leverage decisions |

---

### Level 4: National Real Estate Corporation ($5M upgrade)
**Fantasy:** You're CBRE or JLL  
**Core Loop:** National property portfolio → Large-scale development → REIT operations

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Portfolio Management** | Nationwide properties | Asset allocation |
| **REIT Structure** | Tax advantages | Public vs private |
| **Institutional Clients** | Pension funds, endowments | B2B relationships |
| **Market Research** | Real estate analytics | Data-driven decisions |

---

### Level 5: Global Real Estate Empire ($80M upgrade)
**Fantasy:** You're Blackstone Real Estate  
**Core Loop:** Global properties → Mega developments → International markets → Landmark buildings

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Footprint** | Properties worldwide | Currency exposure |
| **Iconic Properties** | Landmark buildings | Trophy assets |
| **Hospitality** | Hotels and resorts | Segment diversification |
| **Urban Development** | City-scale projects | Public-private partnerships |

---

## 💰 CRYPTO INDUSTRY

### Level 1: Crypto Trader ($25K startup)
**Fantasy:** You're day trading crypto  
**Core Loop:** Analyze charts → Trade tokens → Manage risk

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Trading Strategy** | Technical vs fundamental | Approach selection |
| **Portfolio Allocation** | BTC, ETH, altcoins | Risk distribution |
| **Exchange Selection** | CEX vs DEX | Fees vs control |
| **Risk Management** | Stop losses, position sizing | Volatility handling |

---

### Level 2: Crypto Exchange ($115K upgrade)
**Fantasy:** You're running a small exchange  
**Core Loop:** Trading platform → Liquidity pools → Fee revenue

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Trading Pairs** | Which tokens to list | Listing fees vs volume |
| **Liquidity** | Market making | Capital requirements |
| **Security** | Wallet management | Hot vs cold storage |
| **Compliance** | KYC/AML | Regulatory positioning |

---

### Level 3: Crypto Platform ($2M upgrade)
**Fantasy:** You're building DeFi protocols  
**Core Loop:** DeFi protocols → Staking services → Token launches

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Protocol Development** | Smart contracts | Innovation vs security |
| **Yield Farming** | Staking incentives | Tokenomics design |
| **Governance** | DAO structure | Decentralization degree |
| **Auditing** | Security audits | Cost vs trust |

---

### Level 4: Major Crypto Exchange ($40M upgrade)
**Fantasy:** You're Kraken or Gemini  
**Core Loop:** Institutional trading → Custody services → Regulatory compliance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Institutional Services** | OTC desk, prime brokerage | B2B expansion |
| **Custody** | Hold assets for clients | Insurance and security |
| **Regulatory Licenses** | BitLicense, money transmitter | Compliance investment |
| **Derivatives** | Futures, options | Product expansion |

---

### Level 5: Global Crypto Leader ($300M upgrade)
**Fantasy:** You're Coinbase or Binance  
**Core Loop:** Global dominance → Blockchain innovation → Regulatory influence → Market maker

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Operations** | Worldwide presence | Regulatory arbitrage |
| **Blockchain Development** | Own chain (BNB Chain) | Ecosystem control |
| **Regulatory Shaping** | Lobby for favorable rules | Government relations |
| **Market Making** | Liquidity provision | Conflict of interest |

---

## 📈 STOCKS/INVESTMENT INDUSTRY

### Level 1: Independent Trader ($35K startup)
**Fantasy:** You're a retail investor  
**Core Loop:** Research → Trade → Track performance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Research** | Analyze companies | Fundamental vs technical |
| **Trading** | Execute orders | Timing decisions |
| **Portfolio** | Asset allocation | Diversification |
| **Performance** | Track returns | Benchmark comparison |

---

### Level 2: Trading Firm ($200K upgrade)
**Fantasy:** You're a prop trading shop  
**Core Loop:** Multiple traders → Algorithmic trading → Client accounts

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Trader Recruitment** | Hire talent | Compensation structure |
| **Algo Development** | Trading algorithms | Strategy research |
| **Risk Controls** | Position limits | Risk parameters |
| **Technology** | Trading infrastructure | Latency optimization |

---

### Level 3: Investment Firm ($3M upgrade)
**Fantasy:** You're a hedge fund  
**Core Loop:** Fund management → Institutional clients → Research division

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **AUM Growth** | Assets under management | Fundraising |
| **Investment Strategy** | Long/short, macro, quant | Strategy selection |
| **Research Team** | Analyst coverage | Sector expertise |
| **Performance Fees** | 2 and 20 structure | Alignment of incentives |

---

### Level 4: National Brokerage ($50M upgrade)
**Fantasy:** You're Schwab or TD Ameritrade  
**Core Loop:** National platform → IPO underwriting → Market making

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Retail Platform** | Consumer trading app | Feature development |
| **Investment Banking** | IPO and M&A advisory | Deal origination |
| **Market Making** | Provide liquidity | Spread revenue |
| **Wealth Management** | High-net-worth services | Client segments |

---

### Level 5: Global Investment Bank ($500M upgrade)
**Fantasy:** You're Goldman Sachs  
**Core Loop:** Global markets → Derivatives trading → M&A advisory → Systemic importance

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Trading** | Every major market | Geographic strategy |
| **Derivatives** | Complex instruments | Risk management |
| **Advisory** | $100B+ deal flow | Client relationships |
| **Talent** | Best and brightest | Compensation wars |

---

## 📊 SUMMARY: 85+ UNIQUE COMPANY TYPES

| Industry | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|----------|---------|---------|---------|---------|---------|
| **Media** | Content Creator | Media Startup | Media Company | National Network | Global Empire |
| **Tech (Software)** | Freelance Dev | SaaS Startup | Software Company | Software Platform | Tech Giant |
| **Tech (AI)** | AI Consultant | AI Startup | AI Platform | AI Research Lab | AGI Company |
| **Tech (Hardware)** | Repair Shop | Hardware Startup | HW Manufacturer | Hardware Brand | Global HW Leader |
| **Banking** | Community Bank | Regional Bank | State Bank | National Bank | Global Banking Giant |
| **Energy** | Energy Consultant | Energy Company | Regional Provider | National Corp | Global Conglomerate |
| **Healthcare** | Medical Practice | Multi-Specialty | Hospital System | National Network | Global Conglomerate |
| **Manufacturing** | Small Workshop | Mfg Facility | Mfg Corporation | National Mfg | Global Empire |
| **Retail** | Mom & Pop | Small Business | Regional Chain | National Corp | Global Empire |
| **E-Commerce** | Online Store | E-Comm Business | E-Comm Platform | National Leader | Global Giant |
| **Construction** | Local Contractor | Construction Co | Regional Builder | National Firm | Global Giant |
| **Real Estate** | Agent | Brokerage | Firm | National Corp | Global Empire |
| **Crypto** | Trader | Exchange | Platform | Major Exchange | Global Leader |
| **Stocks** | Independent Trader | Trading Firm | Investment Firm | National Brokerage | Global Investment Bank |
| **Consulting** | Solo Consultant | Boutique Firm | Consulting Company | National Firm | Global Consultancy |
| **EdTech** | Tutor | Online Course | EdTech Platform | National EdTech | Global Education |
| **Crime** | Street Dealer | Local Operation | Regional Syndicate | National Cartel | Global Crime Empire |
| **Politics** | Activist | Local Politician | State Official | Federal Politician | President/Global Leader |

**Total: 18 industries × 5 levels = 90 unique company types**  
**Technology has 3 subcategories = 15 types (vs 5 if counted once)**  
**Grand Total: 100 unique company gameplay configurations**

---

## 💼 CONSULTING INDUSTRY

### Level 1: Solo Consultant ($10K startup)
**Fantasy:** You're a freelance business consultant  
**Core Loop:** Find clients → Deliver value → Build reputation

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Client Acquisition** | Networking, referrals | Time investment |
| **Hourly Rate** | $50-$500/hour range | Price vs volume |
| **Specialization** | Industry or functional | Niche vs generalist |
| **Deliverables** | Reports, presentations | Quality vs speed |

---

### Level 2: Boutique Firm ($50K upgrade)
**Fantasy:** You're a small consulting partnership  
**Core Loop:** Team projects → Methodology → Repeat clients

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Team Building** | Hire associates | Leverage ratio |
| **Methodology** | Develop frameworks | IP development |
| **Client Relationships** | Repeat business | Account management |
| **Pricing Model** | Hourly, project, retainer | Revenue predictability |

---

### Level 3: Consulting Company ($500K upgrade)
**Fantasy:** You're Bain Capital sized  
**Core Loop:** Practice areas → Industry verticals → Thought leadership

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Practice Areas** | Strategy, ops, tech, HR | Specialization |
| **Industry Verticals** | Healthcare, finance, etc. | Market focus |
| **Thought Leadership** | Publications, conferences | Brand building |
| **Talent Pipeline** | Campus recruiting | Training investment |

---

### Level 4: National Consulting Firm ($10M upgrade)
**Fantasy:** You're Deloitte Consulting  
**Core Loop:** Enterprise accounts → Global delivery → Digital transformation

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Enterprise Accounts** | Fortune 500 relationships | Partner time allocation |
| **Global Delivery** | Offshore teams | Cost arbitrage |
| **Technology Arm** | Implementation services | Build vs acquire |
| **Government Practice** | Public sector contracts | Compliance investment |

---

### Level 5: Global Consultancy ($100M upgrade)
**Fantasy:** You're McKinsey  
**Core Loop:** CEO relationships → Industry influence → Talent monopoly

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **CEO Advisory** | Board-level relationships | Partner brand |
| **Industry Shaping** | Define best practices | Thought leadership |
| **Alumni Network** | Former consultants in positions | Network effects |
| **Controversy Management** | Ethical scandals | Risk vs reward |

---

## 📚 EDTECH INDUSTRY

### Level 1: Tutor ($5K startup)
**Fantasy:** You're tutoring students  
**Core Loop:** Find students → Teach → Build reputation

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Student Acquisition** | Word of mouth, platforms | Marketing investment |
| **Subject Expertise** | Math, science, test prep | Specialization |
| **Pricing** | Per hour rates | Premium vs volume |
| **Scheduling** | Availability management | Time optimization |

---

### Level 2: Online Course Creator ($25K upgrade)
**Fantasy:** You're selling courses on Udemy  
**Core Loop:** Create courses → Market → Passive income

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Course Creation** | Video, worksheets, quizzes | Production quality |
| **Platform Choice** | Udemy, Skillshare, own site | Revenue share vs control |
| **Marketing** | Ads, affiliates, email | CAC management |
| **Updates** | Keep content current | Maintenance investment |

---

### Level 3: EdTech Platform ($300K upgrade)
**Fantasy:** You're Coursera or Udemy  
**Core Loop:** Platform marketplace → Instructor partnerships → B2B sales

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Instructor Marketplace** | Host third-party courses | Revenue split |
| **B2B Enterprise** | Corporate training contracts | Sales team investment |
| **Certifications** | Credential programs | University partnerships |
| **Content Moderation** | Quality standards | Curation vs quantity |

---

### Level 4: National EdTech Company ($15M upgrade)
**Fantasy:** You're Chegg or 2U  
**Core Loop:** University partnerships → Degree programs → Tutoring network

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **University Partnerships** | Online degree programs | Revenue sharing |
| **Tutoring Platform** | Connect tutors and students | Marketplace dynamics |
| **Test Prep** | SAT, GRE, professional exams | Content investment |
| **Student Outcomes** | Employment, grades | Efficacy metrics |

---

### Level 5: Global Education Giant ($150M upgrade)
**Fantasy:** You're Pearson or Blackboard  
**Core Loop:** Learning management → Textbook publishing → Global curriculum

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **LMS Market** | School and university contracts | Platform stickiness |
| **Publishing** | Textbook and content creation | Digital transformation |
| **Global Expansion** | International markets | Localization |
| **AI Tutoring** | Personalized learning | Technology investment |

---

## 🔫 CRIME INDUSTRY (MMO)

### Level 1: Street Dealer ($2K startup)
**Fantasy:** You're selling on the corner  
**Core Loop:** Buy product → Sell to users → Avoid police

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Product Mix** | Weed, pills, harder drugs | Risk vs reward |
| **Territory** | Street corners | Location selection |
| **Heat Management** | Police attention | When to lay low |
| **Supplier Relationships** | Who to buy from | Loyalty vs price |

**Heat System:**
```typescript
// Heat accumulates with activity, decays over time
heat += activityRisk * visibility;
heat = Math.max(0, heat - decayRate);
if (heat > threshold) { triggerRaid(); }
```

---

### Level 2: Local Operation ($20K upgrade)
**Fantasy:** You're running a small crew  
**Core Loop:** Manage crew → Distribute product → Launder money

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Crew Management** | Recruit, train, discipline | Loyalty vs skill |
| **Distribution Network** | Multiple corners, dealers | Expansion risk |
| **Money Laundering** | Cash businesses | Integration level |
| **Protection** | Bribe cops, hire muscle | Operating costs |

---

### Level 3: Regional Syndicate ($200K upgrade)
**Fantasy:** You're running a city's drug trade  
**Core Loop:** Turf wars → Production facilities → Corrupt officials

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Turf Control** | Territory wars with rivals | Aggression level |
| **Production** | Labs, grow houses | Vertical integration |
| **Corruption** | Police, judges, politicians | Bribery investments |
| **Diversification** | Gambling, protection, theft | Revenue streams |

---

### Level 4: National Cartel ($5M upgrade)
**Fantasy:** You're a major cartel  
**Core Loop:** Interstate trafficking → International smuggling → Legitimate front

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Trafficking Routes** | Interstate distribution | Logistics optimization |
| **International Smuggling** | Cross-border operations | Customs evasion |
| **Legitimate Business** | Real companies for laundering | Front operations |
| **Cartel Politics** | Alliances, wars | Diplomacy vs force |

---

### Level 5: Global Crime Empire ($100M upgrade)
**Fantasy:** You're an international crime syndicate  
**Core Loop:** Global logistics → Financial empire → Political influence

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Global Network** | Operations on every continent | Empire management |
| **Financial Empire** | Banks, investments, crypto | Wealth management |
| **State Capture** | Own politicians, judges | Systemic corruption |
| **Retirement** | Exit strategy | Going legitimate |

---

## 🏛️ POLITICS INDUSTRY

### Level 1: Activist ($1K startup)
**Fantasy:** You're organizing for a cause  
**Core Loop:** Build movement → Raise awareness → Influence policy

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Cause Selection** | What to fight for | Issue positioning |
| **Movement Building** | Recruit supporters | Grassroots organizing |
| **Publicity** | Media attention | Messaging strategy |
| **Fundraising** | Small donations | Donor cultivation |

---

### Level 2: Local Politician ($10K upgrade)
**Fantasy:** You're on city council  
**Core Loop:** Campaign → Win election → Govern → Re-elect

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Campaign Finance** | Raise and spend money | Donor relationships |
| **Voter Outreach** | Door knocking, events | Campaign strategy |
| **Policy Votes** | Council decisions | Constituent vs ideology |
| **Patronage** | Appointments, favors | Political capital |

**Election Simulation:**
```typescript
// Simplified election model
const electionResult = {
  votes: baseSupport + (campaignSpend * adEffectiveness) + (groundGame * turnout),
  win: votes > opponent.votes
};
```

---

### Level 3: State Official ($100K upgrade)
**Fantasy:** You're a state legislator or official  
**Core Loop:** State legislation → Party politics → Higher office ambition

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **State Legislature** | Propose and vote on bills | Legislative strategy |
| **Party Relationships** | Leadership support | Loyalty vs independence |
| **Statewide Profile** | Build name recognition | Media strategy |
| **Campaign Fundraising** | Major donors | Donor network |

---

### Level 4: Federal Politician ($1M upgrade)
**Fantasy:** You're a Congressman or Senator  
**Core Loop:** Federal legislation → National media → Party leadership

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Committee Assignments** | Influence policy areas | Specialization |
| **National Media** | Cable news, national press | Message discipline |
| **Lobbying Relationships** | K Street influence | Money vs principles |
| **Presidential Ambition** | Run for president? | Career calculation |

---

### Level 5: President/Global Leader ($50M upgrade)
**Fantasy:** You're the President  
**Core Loop:** Executive power → Global diplomacy → Historical legacy

| Mechanic | Description | Decision |
|----------|-------------|----------|
| **Executive Orders** | Direct action | Use of power |
| **Foreign Policy** | International relations | Diplomacy vs force |
| **Cabinet** | Appointments | Competence vs loyalty |
| **Legacy** | Historical reputation | Priorities |

---

# 🔧 PER-INDUSTRY UTILITY FUNCTIONS

This section defines the **utility function files** to be created. Each file wraps npm packages to provide game-ready calculations.

## File Structure

```
src/lib/game/utils/
├── index.ts                 # Barrel exports
├── banking/
│   ├── index.ts
│   ├── creditScoring.ts     # Credit scores, risk assessment
│   ├── loanCalculations.ts  # PMT, IRR, NPV, amortization
│   └── interestModels.ts    # Interest rate optimization
├── energy/
│   ├── index.ts
│   ├── weatherGeneration.ts # Solar/wind output based on weather
│   ├── ppaOptimizer.ts      # Contract optimization
│   └── fuelMarket.ts        # Price volatility simulation
├── manufacturing/
│   ├── index.ts
│   ├── oeeCalculator.ts     # Availability, performance, quality
│   ├── supplyChain.ts       # Supplier optimization
│   └── productionScheduler.ts # Linear programming for scheduling
├── technology/
│   ├── index.ts             # Barrel exports for all 5 subsections
│   ├── ai/
│   │   ├── index.ts
│   │   ├── modelTraining.ts    # Training simulation, GPU costs, events
│   │   ├── researchPublishing.ts # Paper submission, peer review, citations
│   │   ├── talentCompetition.ts  # Hiring, poaching, retention
│   │   └── benchmarks.ts       # Model evaluation, leaderboard ranking
│   ├── software/
│   │   ├── index.ts
│   │   ├── sprintVelocity.ts   # Sprint simulation, velocity prediction
│   │   ├── bugTriage.ts        # Severity scoring, time estimation
│   │   └── releaseManagement.ts # Version planning, feature gates
│   ├── saas/
│   │   ├── index.ts
│   │   ├── metricsEngine.ts    # MRR, ARR, NRR, LTV, CAC calculations
│   │   ├── churnPrediction.ts  # At-risk identification, intervention
│   │   └── pricingOptimizer.ts # Tier optimization, discount strategy
│   ├── infrastructure/
│   │   ├── index.ts
│   │   ├── datacenterPUE.ts    # PUE calculation, cooling optimization
│   │   ├── computeMarketplace.ts # Allocation optimization, pricing
│   │   └── capacityPlanning.ts # Demand forecasting, GPU procurement
│   └── innovation/
│       ├── index.ts
│       ├── patentValuation.ts  # DCF, citation analysis, portfolio value
│       └── modelLicensing.ts   # Deal simulation, royalty projection
├── media/
│   ├── index.ts
│   ├── engagementAlgorithm.ts # Content performance prediction
│   ├── audienceGrowth.ts    # S-curve modeling
│   └── adRevenue.ts         # CPM, fill rates, yield
├── logistics/
│   ├── index.ts
│   ├── routeOptimizer.ts    # VRP solver
│   ├── inventoryManager.ts  # Safety stock, EOQ, reorder points
│   └── fleetManager.ts      # Vehicle allocation
├── healthcare/
│   ├── index.ts
│   ├── clinicalTrials.ts    # Phase simulations
│   ├── actuarial.ts         # Premium calculations
│   └── rdProgress.ts        # Drug development pipeline
├── crime/
│   ├── index.ts
│   ├── heatMechanics.ts     # Heat calculation, decay
│   ├── drugMarket.ts        # Price volatility, supply shocks
│   └── turfWar.ts           # Combat resolution
├── politics/
│   ├── index.ts
│   ├── electionSim.ts       # Vote share prediction
│   ├── billPassage.ts       # Lobbying effectiveness
│   └── campaignOptimizer.ts # Spending allocation
├── shared/
│   ├── index.ts
│   ├── randomEvents.ts      # Common event generation using chance
│   ├── marketVolatility.ts  # Price movement simulation
│   ├── currencyUtils.ts     # Safe money math with currency.js
│   └── statistics.ts        # Common statistical functions
└── types/
    └── index.ts             # TypeScript types for all utils
```

**Technology Sector:** 15 utility files across 5 subsections (vs 3 files originally)

## Example Utility File Template

### `src/lib/game/utils/banking/loanCalculations.ts`

```typescript
/**
 * @fileoverview Banking loan calculation utilities
 * @module game/utils/banking/loanCalculations
 * 
 * Uses: financejs, currency.js, jstat
 * 
 * OVERVIEW:
 * Provides production-ready loan calculations for the Banking industry.
 * All monetary calculations use currency.js for precision.
 */

import currency from 'currency.js';
import * as jstat from 'jstat';

// Types
export interface LoanTerms {
  principal: number;
  annualRate: number;
  termMonths: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanAnalysis {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  effectiveRate: number;
  amortizationSchedule: AmortizationRow[];
}

/**
 * Calculate monthly loan payment (PMT formula)
 * 
 * @param principal - Loan amount in dollars
 * @param annualRate - Annual interest rate (e.g., 0.075 for 7.5%)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 * 
 * @example
 * const payment = calculateMonthlyPayment(100000, 0.075, 360);
 * // Returns: 699.21 (for a $100K loan at 7.5% for 30 years)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 12;
  
  if (monthlyRate === 0) {
    return currency(principal).divide(termMonths).value;
  }
  
  const payment = currency(principal)
    .multiply(monthlyRate * Math.pow(1 + monthlyRate, termMonths))
    .divide(Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return payment.value;
}

/**
 * Generate full amortization schedule
 * 
 * @param terms - Loan terms object
 * @returns Complete loan analysis with schedule
 */
export function generateAmortizationSchedule(terms: LoanTerms): LoanAnalysis {
  const monthlyPayment = calculateMonthlyPayment(
    terms.principal,
    terms.annualRate,
    terms.termMonths
  );
  
  const monthlyRate = terms.annualRate / 12;
  let balance = currency(terms.principal);
  const schedule: AmortizationRow[] = [];
  let totalInterest = currency(0);
  
  for (let month = 1; month <= terms.termMonths; month++) {
    const interestPayment = balance.multiply(monthlyRate);
    const principalPayment = currency(monthlyPayment).subtract(interestPayment);
    balance = balance.subtract(principalPayment);
    totalInterest = totalInterest.add(interestPayment);
    
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment.value,
      interest: interestPayment.value,
      balance: Math.max(0, balance.value)
    });
  }
  
  return {
    monthlyPayment,
    totalInterest: totalInterest.value,
    totalPaid: currency(monthlyPayment).multiply(terms.termMonths).value,
    effectiveRate: totalInterest.divide(terms.principal).value,
    amortizationSchedule: schedule
  };
}

/**
 * Calculate probability of loan default based on credit score and economic conditions
 * 
 * @param creditScore - Borrower's credit score (300-850)
 * @param economicIndex - Economic health index (0-100, 100 = perfect economy)
 * @param loanToValue - Loan-to-value ratio (0-1)
 * @returns Probability of default (0-1)
 */
export function calculateDefaultProbability(
  creditScore: number,
  economicIndex: number,
  loanToValue: number = 0.8
): number {
  // Base default rate from credit score (logistic function)
  const baseDefault = 1 / (1 + Math.exp((creditScore - 620) / 40));
  
  // Economic adjustment (worse economy = higher default)
  const economicFactor = 1 + (100 - economicIndex) / 100 * 0.5;
  
  // LTV adjustment (higher LTV = higher risk)
  const ltvFactor = 1 + Math.max(0, loanToValue - 0.8) * 2;
  
  // Combined probability, capped at 95%
  return Math.min(0.95, baseDefault * economicFactor * ltvFactor);
}

/**
 * Calculate optimal interest rate for a loan
 * Balances profit maximization with default risk
 * 
 * @param creditScore - Borrower's credit score
 * @param baseRate - Bank's cost of funds
 * @param riskTolerance - Bank's risk tolerance (0-1, 1 = aggressive)
 * @returns Optimal interest rate to offer
 */
export function calculateOptimalRate(
  creditScore: number,
  baseRate: number,
  riskTolerance: number = 0.5
): number {
  const defaultProb = calculateDefaultProbability(creditScore, 75);
  
  // Risk premium based on default probability
  const riskPremium = defaultProb * (1 - riskTolerance) * 0.1;
  
  // Profit margin (higher for riskier loans)
  const profitMargin = 0.02 + defaultProb * 0.03;
  
  return baseRate + riskPremium + profitMargin;
}
```

### `src/lib/game/utils/shared/randomEvents.ts`

```typescript
/**
 * @fileoverview Shared random event generation utilities
 * @module game/utils/shared/randomEvents
 * 
 * Uses: chance, jstat
 * 
 * OVERVIEW:
 * Provides common random event generation used across all industries.
 * Powers the 24/7 game world with dynamic events.
 */

import Chance from 'chance';
import * as jstat from 'jstat';

const chance = new Chance();

// Types
export type EventSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';
export type EventType = 'opportunity' | 'challenge' | 'neutral';

export interface GameEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  effects: EventEffect[];
  duration: number; // game months
  probability: number; // how rare (0-1)
}

export interface EventEffect {
  target: 'revenue' | 'cost' | 'production' | 'reputation' | 'heat';
  modifier: number; // multiplier (1.0 = no change)
  industries?: string[]; // which industries affected, or all if undefined
}

/**
 * Generate a random market event
 * 
 * @param gameMonth - Current game month (affects seasonality)
 * @returns Generated market event
 */
export function generateMarketEvent(gameMonth: number): GameEvent | null {
  // Only 20% chance of event each tick
  if (!chance.bool({ likelihood: 20 })) {
    return null;
  }
  
  const events: GameEvent[] = [
    {
      id: 'market_boom',
      type: 'opportunity',
      severity: 'moderate',
      title: 'Bull Market Rally',
      description: 'Investor confidence surges across all sectors.',
      effects: [{ target: 'revenue', modifier: 1.15 }],
      duration: chance.integer({ min: 2, max: 6 }),
      probability: 0.1
    },
    {
      id: 'recession',
      type: 'challenge',
      severity: 'major',
      title: 'Economic Recession',
      description: 'Consumer spending contracts significantly.',
      effects: [
        { target: 'revenue', modifier: 0.75 },
        { target: 'cost', modifier: 0.9 } // Costs drop slightly too
      ],
      duration: chance.integer({ min: 6, max: 18 }),
      probability: 0.05
    },
    {
      id: 'tech_breakthrough',
      type: 'opportunity',
      severity: 'moderate',
      title: 'Technology Breakthrough',
      description: 'A new innovation boosts tech sector productivity.',
      effects: [
        { target: 'production', modifier: 1.25, industries: ['technology'] }
      ],
      duration: chance.integer({ min: 3, max: 12 }),
      probability: 0.08
    },
    {
      id: 'energy_crisis',
      type: 'challenge',
      severity: 'major',
      title: 'Energy Crisis',
      description: 'Supply disruptions cause energy prices to spike.',
      effects: [
        { target: 'revenue', modifier: 1.5, industries: ['energy'] },
        { target: 'cost', modifier: 1.3, industries: ['manufacturing', 'logistics'] }
      ],
      duration: chance.integer({ min: 3, max: 9 }),
      probability: 0.06
    },
    {
      id: 'pandemic',
      type: 'challenge',
      severity: 'catastrophic',
      title: 'Global Pandemic',
      description: 'A health crisis disrupts normal business operations.',
      effects: [
        { target: 'revenue', modifier: 0.6 },
        { target: 'revenue', modifier: 1.5, industries: ['healthcare'] },
        { target: 'cost', modifier: 1.2 }
      ],
      duration: chance.integer({ min: 12, max: 24 }),
      probability: 0.02
    },
    {
      id: 'regulatory_change',
      type: 'neutral',
      severity: 'moderate',
      title: 'Major Regulatory Overhaul',
      description: 'New regulations reshape industry compliance requirements.',
      effects: [
        { target: 'cost', modifier: 1.1 }
      ],
      duration: chance.integer({ min: 6, max: 36 }),
      probability: 0.1
    }
  ];
  
  // Weight selection by probability
  const selectedEvent = chance.weighted(
    events,
    events.map(e => e.probability * 100)
  );
  
  return selectedEvent;
}

/**
 * Generate a random natural disaster event
 * 
 * @param region - Affected region
 * @returns Natural disaster event or null
 */
export function generateNaturalDisaster(region: string): GameEvent | null {
  // 5% chance per tick
  if (!chance.bool({ likelihood: 5 })) {
    return null;
  }
  
  const disasters = [
    { name: 'Hurricane', severity: 'major' as EventSeverity, regions: ['coastal'] },
    { name: 'Earthquake', severity: 'catastrophic' as EventSeverity, regions: ['fault_line'] },
    { name: 'Wildfire', severity: 'moderate' as EventSeverity, regions: ['western'] },
    { name: 'Flood', severity: 'moderate' as EventSeverity, regions: ['river', 'coastal'] },
    { name: 'Drought', severity: 'moderate' as EventSeverity, regions: ['agricultural'] }
  ];
  
  const applicable = disasters.filter(d => d.regions.includes(region));
  if (applicable.length === 0) return null;
  
  const disaster = chance.pickone(applicable);
  
  return {
    id: `disaster_${Date.now()}`,
    type: 'challenge',
    severity: disaster.severity,
    title: `${disaster.name} Strikes ${region}`,
    description: `A ${disaster.name.toLowerCase()} has impacted business operations in the region.`,
    effects: [
      { target: 'production', modifier: 0.5 },
      { target: 'cost', modifier: 1.3 }
    ],
    duration: chance.integer({ min: 1, max: 6 }),
    probability: 0.05
  };
}

/**
 * Apply event effects to business metrics
 * 
 * @param baseValue - Original metric value
 * @param events - Active events
 * @param effectType - Which effect to apply
 * @param industry - Industry to check for (optional)
 * @returns Modified value after all event effects
 */
export function applyEventEffects(
  baseValue: number,
  events: GameEvent[],
  effectType: 'revenue' | 'cost' | 'production' | 'reputation',
  industry?: string
): number {
  let modifier = 1.0;
  
  for (const event of events) {
    for (const effect of event.effects) {
      if (effect.target !== effectType) continue;
      
      // Check if effect applies to this industry
      if (effect.industries && industry && !effect.industries.includes(industry)) {
        continue;
      }
      
      modifier *= effect.modifier;
    }
  }
  
  return baseValue * modifier;
}
```

## Utility Function Categories Summary

| Category | Files | Key Functions |
|----------|-------|---------------|
| **Banking** | 3 files | `calculateMonthlyPayment`, `calculateCreditScore`, `calculateDefaultProbability`, `calculateOptimalRate` |
| **Energy** | 3 files | `calculateSolarOutput`, `simulateFuelPrice`, `optimizePPAContracts` |
| **Manufacturing** | 3 files | `calculateOEE`, `optimizeSupplyChain`, `scheduleProduction` |
| **Technology (AI)** | 4 files | `simulateTrainingRun`, `simulatePeerReview`, `simulateHiringCompetition`, `evaluateBenchmarks` |
| **Technology (Software)** | 3 files | `simulateSprint`, `triageBugs`, `planRelease` |
| **Technology (SaaS)** | 3 files | `calculateSaaSHealth`, `predictChurn`, `identifyAtRiskCustomers` |
| **Technology (Infrastructure)** | 3 files | `calculatePUE`, `calculateDataCenterProfitability`, `optimizeComputeAllocation` |
| **Technology (Innovation)** | 2 files | `valuatePatentPortfolio`, `simulateModelLicenseDeal` |
| **Media** | 3 files | `calculateEngagement`, `projectAudienceGrowth`, `calculateAdRevenue` |
| **Logistics** | 3 files | `optimizeRoutes`, `calculateSafetyStock`, `allocateVehicles` |
| **Healthcare** | 3 files | `simulateClinicalTrial`, `calculatePremium`, `projectDrugRevenue` |
| **Crime** | 3 files | `calculateHeat`, `simulateDrugMarket`, `resolveTurfWar` |
| **Politics** | 3 files | `simulateElection`, `calculateBillPassage`, `optimizeCampaignSpending` |
| **Shared** | 4 files | `generateMarketEvent`, `simulatePriceVolatility`, `safeCurrency`, `calculatePercentile` |

**Total Utility Files:** ~43 files (expanded from 31 due to Technology subsections)
**Estimated LOC:** ~5,000-6,000 lines

---

# 🎯 VISION

**TheSimGov** is a business empire MMO where **every industry depends on others**. Players build interconnected empires where:
- **Banking** finances everything
- **Energy** powers operations  
- **Manufacturing** produces goods
- **Logistics** moves products
- **Tech** automates and optimizes (5 subsections: AI, Software, SaaS, Infrastructure, Innovation)
- **Media** influences and advertises
- **Politics** shapes regulations
- **Crime** operates in the shadows

**The Goal:** Build a vertically and horizontally integrated empire like Musk (Tesla → SpaceX → Boring Co → xAI) or Bezos (Amazon → AWS → Blue Origin → Washington Post).

---

# 🏗️ THE EMPIRE DEPENDENCY GRAPH

```
                            ┌─────────────────────────────────────────────┐
                            │              🏦 BANKING                      │
                            │    (Financial Backbone - Finances All)       │
                            └─────────────────────┬───────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
       ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
       │     ⚡ ENERGY       │      │  🏭 MANUFACTURING   │      │   🏠 REAL ESTATE   │
       └────────┬───────────┘      └─────────┬──────────┘      └─────────┬──────────┘
                │                            │                           │
                ▼                            ▼                           ▼
       ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
       │   🚚 LOGISTICS      │      │    💻 TECHNOLOGY    │      │   📺 MEDIA         │
       └────────┬───────────┘      └─────────┬──────────┘      └─────────┬──────────┘
                │                            │                           │
                └─────────────┬──────────────┼───────────────────────────┘
                              ▼              ▼
                 ┌────────────────────┐     ┌────────────────────┐
                 │   🏥 HEALTHCARE    │     │   🎓 EDTECH         │
                 └────────┬───────────┘     └─────────┬──────────┘
                          │                           │
                          └─────────┬─────────────────┘
                                    ▼
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│   🛒 RETAIL         │   │   🎯 CONSULTING     │   │   🏛️ POLITICS      │
└────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                            ▼
                                              ┌────────────────────┐
                                              │   🔫 CRIME          │
                                              └────────────────────┘
```

---

# 🔥 ADDICTION LOOP DESIGN

## The Four Loops of Engagement

For TheSimGov to be truly addictive (in a healthy way), we need **four interlocking engagement loops** operating at different time scales:

### Loop 1: The Minute Loop (Immediate Feedback)

**Purpose:** Instant gratification, dopamine hits, "just one more action"

| Element | Description | Implementation |
|---------|-------------|----------------|
| **Revenue Ticker** | Real-time money counter animation | WebSocket updates every second showing cents/dollars accumulating |
| **Toast Notifications** | Pop-up alerts for events | "Loan payment received: +$45,000" |
| **Sound Effects** | Audio cues for positive actions | Ka-ching for revenue, level-up jingle |
| **Micro-progress Bars** | Visual completion indicators | Production run 78% → 79% → 80% |
| **Action Feedback** | Immediate response to clicks | Button animations, confirmation modals |

**Technical Requirements:**
- WebSocket or Server-Sent Events for real-time updates
- Framer Motion for smooth animations
- Audio API for sound effects
- React Query for optimistic updates

### Loop 2: The Hourly Loop (Session Goals)

**Purpose:** Give players session objectives, reasons to stay

| Element | Description | Implementation |
|---------|-------------|----------------|
| **Daily Challenges** | 3 rotating objectives per day | "Complete 5 loan applications", "Generate 100MW power" |
| **Session Milestones** | Progress markers within session | "Earn $100K this session (current: $67K)" |
| **Synergy Discovery** | Encourage trying new combinations | "New synergy unlocked: Energy + Manufacturing = 5% cost reduction" |
| **Hot Deals** | Time-limited opportunities | "Flash sale: Solar panels 20% off for 2 hours" |
| **Event Responses** | React to random events | "Market crash! Buy low or sell high?" |

**Technical Requirements:**
- Daily challenge system with reset timer
- Session state tracking (localStorage + server sync)
- Event generation engine (GlobalImpactEvent model already exists)
- Timer-based opportunity system

### Loop 3: The Daily Loop (Return Motivation)

**Purpose:** Bring players back every day

| Element | Description | Implementation |
|---------|-------------|----------------|
| **Daily Login Bonus** | Escalating rewards for streaks | Day 1: $10K, Day 7: $100K, Day 30: $1M + rare item |
| **Offline Progress Summary** | "While you were away..." screen | Show tick results, revenue earned, events that occurred |
| **Daily Quests Reset** | New challenges each day | 3 new objectives refreshed at midnight |
| **Industry Cycles** | Some things only happen daily | Market prices update, political polls, media trends |
| **Social Notifications** | Competition updates | "Player X passed you on the leaderboard" |

**Technical Requirements:**
- Login streak tracking in User model
- Offline progress calculation (compare lastLogin to now, simulate ticks)
- Quest system with daily reset
- Push notification capability

### Loop 4: The Weekly/Monthly Loop (Long-term Goals)

**Purpose:** Strategic progression, empire building vision

| Element | Description | Implementation |
|---------|-------------|----------------|
| **Empire Milestones** | Major achievements | "First $1B revenue", "Own all 15 industries", "Control 10% of market" |
| **Political Cycles** | Election seasons | Elections every 4 game months, campaign strategy |
| **Research Breakthroughs** | Long-term R&D payoffs | AI research completing after weeks of investment |
| **Seasonal Events** | Quarterly game events | "Q4 Holiday Rush: Retail 2x revenue" |
| **Leaderboard Seasons** | Competitive resets | Monthly leaderboard with prizes |

**Technical Requirements:**
- Achievement system (model exists, need UI)
- Political cycle engine (model exists, need events)
- Research project completion tracking
- Seasonal event scheduler

---

## Addiction Loop Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ADDICTION LOOP INTEGRATION                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   MINUTE LOOP                 HOURLY LOOP              DAILY LOOP               │
│   ───────────                 ───────────              ──────────               │
│   Revenue Ticker ──────────► Session Goal ──────────► Daily Bonus               │
│   Toast Alerts ────────────► Daily Challenge ───────► Quest Reset               │
│   Sound Effects ───────────► Hot Deals ─────────────► Offline Summary           │
│   Micro-progress ──────────► Event Response ────────► Social Notif              │
│                                    │                       │                    │
│                                    │                       │                    │
│                                    ▼                       ▼                    │
│                              ┌───────────────────────────────────┐              │
│                              │         WEEKLY/MONTHLY LOOP        │              │
│                              │         ──────────────────         │              │
│                              │  Empire Milestones                 │              │
│                              │  Political Cycles                  │              │
│                              │  Research Breakthroughs            │              │
│                              │  Seasonal Events                   │              │
│                              │  Leaderboard Seasons               │              │
│                              └───────────────────────────────────┘              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔗 CROSS-SYSTEM INTEGRATION

## How Industries Interact

The game's depth comes from **meaningful cross-industry synergies**. These aren't just decorative bonuses—they should **mechanically affect gameplay**.

### Synergy Categories

| Category | Description | Mechanical Effect |
|----------|-------------|-------------------|
| **Cost Reduction** | Vertical integration saves money | -X% operating costs when you own supplier |
| **Revenue Boost** | Cross-selling increases sales | +X% revenue when you own marketing channel |
| **Efficiency Gain** | Better tools = better output | +X% production when you own tech provider |
| **Risk Mitigation** | Diversification protects | -X% volatility when you own multiple industries |
| **Unlock Access** | Some options require ownership | "Own a bank to issue loans to your companies" |

### The 15-Industry Synergy Matrix

| From Industry | To Industry | Synergy Type | Bonus |
|---------------|-------------|--------------|-------|
| **Banking** | All | Financing | -5% loan interest rates |
| **Banking** | Crime | Money Laundering | +10% criminal revenue (cleaned) |
| **Energy** | Manufacturing | Power | -8% operating costs |
| **Energy** | Tech | Data Centers | -10% compute costs |
| **Energy** | Crime | Grow Ops | Hidden power consumption |
| **Manufacturing** | Retail | Supply | -5% product cost |
| **Manufacturing** | Logistics | Shipping Volume | -3% shipping costs |
| **Tech** | All | Automation | +5% efficiency |
| **Tech** | Banking | Fraud Detection | -3% loan defaults |
| **Tech** | Healthcare | Medical AI | +10% research speed |
| **Media** | Retail | Marketing | +10% sales |
| **Media** | Politics | Influence | +15% campaign effectiveness |
| **Logistics** | Manufacturing | Supply Chain | -5% material costs |
| **Logistics** | Retail | Delivery | +10% customer satisfaction |
| **Healthcare** | All | Employee Health | +3% workforce productivity |
| **EdTech** | All | Training | +5% employee efficiency |
| **Consulting** | All | Advisory | +5% strategic decisions |
| **Politics** | All | Regulations | -5% compliance costs |
| **Politics** | Crime | Protection | -20% heat generation |
| **Real Estate** | All | Facilities | -5% facility costs |
| **Crime** | Banking | Deposits | Laundered funds as deposits |
| **Crime** | Politics | Bribes | Political influence |

### Synergy Tiers

| Tier | Requirement | Bonus Multiplier |
|------|-------------|------------------|
| **Bronze** | Own 2 synergistic industries | 1.0x base bonus |
| **Silver** | Own 3-4 synergistic industries | 1.5x base bonus |
| **Gold** | Own 5+ synergistic industries | 2.0x base bonus |
| **Platinum** | Own 10+ industries | 2.5x base bonus + unique perks |
| **Diamond** | Own all 15 industries | 3.0x base bonus + "Monopolist" title |

### Implementation: Wiring Synergies to Production

Currently synergies are **calculated but not applied**. Here's how to wire them:

```typescript
// In each tick processor, apply synergies:
async function processManufacturing(company: ICompany, tick: number) {
  const synergyBonus = await calculateSynergyBonus(company.empire, 'manufacturing');
  
  for (const facility of facilities) {
    // Apply synergy to operating costs
    const adjustedOperatingCost = facility.operatingCost * (1 - synergyBonus.costReduction);
    
    // Apply synergy to production efficiency
    const adjustedOutput = facility.baseOutput * (1 + synergyBonus.efficiencyGain);
    
    // Process with adjusted values
    const revenue = adjustedOutput * pricePerUnit;
    const profit = revenue - adjustedOperatingCost;
    
    // Credit treasury
    await updateTreasury(company.empire, profit);
  }
}
```

---

# 📅 IMPLEMENTATION PHASES

## Phase A: Core Loop UI (16 hours) — P0

**Goal:** Make the game "feel" like a game with visible money flow and feedback

| Task | Hours | Deliverable |
|------|-------|-------------|
| Treasury Header Bar | 4h | Fixed header showing current cash, revenue rate |
| Revenue Ticker Animation | 3h | Real-time counter showing money accumulating |
| Toast Notification System | 3h | HeroUI toast for events, achievements, alerts |
| Offline Progress Screen | 4h | "While you were away" modal on login |
| Sound Effects Integration | 2h | Ka-ching, level-up, alert sounds |

**Files Created:**
- `src/components/core/TreasuryBar.tsx`
- `src/components/core/RevenueTicker.tsx`
- `src/components/core/NotificationSystem.tsx`
- `src/components/core/OfflineProgress.tsx`
- `src/lib/utils/audio.ts`

---

## Phase B: Logistics Industry (16 hours) — P0

**Goal:** Complete the 15th and final industry

| Task | Hours | Deliverable |
|------|-------|-------------|
| Mongoose Models (Vehicle, Warehouse, Route, Shipment, ShippingContract) | 4h | 5 models with full schemas |
| TypeScript Types | 1h | IVehicle, IWarehouse, etc. |
| API Endpoints (CRUD) | 4h | /api/logistics/* routes |
| LogisticsDashboard UI | 5h | Fleet, warehouses, routes, contracts |
| Logistics Tick Processor | 2h | Monthly processing |

**Files Created:**
- `src/lib/db/models/logistics/Vehicle.ts`
- `src/lib/db/models/logistics/Warehouse.ts`
- `src/lib/db/models/logistics/Route.ts`
- `src/lib/db/models/logistics/Shipment.ts`
- `src/lib/db/models/logistics/ShippingContract.ts`
- `src/app/api/logistics/*/route.ts`
- `src/components/logistics/LogisticsDashboard.tsx`
- `src/lib/game/tick/logisticsProcessor.ts`

---

## Phase C: Tick Scheduler + Offline Progress (8 hours) — P0

**Goal:** Game runs automatically, players see what happened while away

| Task | Hours | Deliverable |
|------|-------|-------------|
| Cron Job/Scheduler Setup | 2h | node-cron or Vercel cron for automated ticks |
| Tick API Protection | 1h | Auth + rate limiting on tick endpoint |
| Offline Progress Calculation | 3h | Calculate ticks between lastLogin and now |
| WebSocket for Real-time Updates | 2h | Push updates to connected clients |

**Files Created/Modified:**
- `src/lib/game/tick/scheduler.ts`
- `src/app/api/game/tick/route.ts` (modify)
- `src/lib/game/tick/offlineProgress.ts`
- `src/lib/websocket/tickUpdates.ts`

---

## Phase D: Synergy Wiring (12 hours) — P0

**Goal:** Synergies mechanically affect production, not just decorative

| Task | Hours | Deliverable |
|------|-------|-------------|
| Synergy Calculation Service | 3h | Calculate all synergy bonuses for empire |
| Wire to All Tick Processors | 4h | Apply bonuses to costs/revenue |
| Synergy Visualization UI | 3h | Show bonus breakdown in each industry dashboard |
| Synergy Discovery Notifications | 2h | Alert when new synergy unlocked |

**Files Created/Modified:**
- `src/lib/game/empire/synergyCalculator.ts` (enhance)
- `src/lib/game/tick/*.ts` (modify all 11 processors)
- `src/components/empire/SynergyBonusPanel.tsx`
- `src/components/core/SynergyNotification.tsx`

---

## Phase E: Player Progression UI (12 hours) — P0

**Goal:** Players can see and feel their progress

| Task | Hours | Deliverable |
|------|-------|-------------|
| XP Bar Component | 2h | Header component showing current XP, next level |
| Level Badge | 1h | Display current level prominently |
| Achievement Gallery Page | 5h | Grid of achievements with progress/unlocked states |
| Achievement Toast System | 2h | Pop-up when achievement unlocked |
| Progression Stats Page | 2h | Detailed stats, time played, industries owned |

**Files Created:**
- `src/components/player/XPBar.tsx`
- `src/components/player/LevelBadge.tsx`
- `src/app/(dashboard)/achievements/page.tsx`
- `src/components/achievements/AchievementCard.tsx`
- `src/components/achievements/AchievementToast.tsx`
- `src/app/(dashboard)/stats/page.tsx`

---

## Phase F: Tutorial & Onboarding (16 hours) — P0

**Goal:** New players know what to do

| Task | Hours | Deliverable |
|------|-------|-------------|
| First-time User Detection | 1h | Track if user has completed onboarding |
| Welcome Modal | 2h | Introduction to game concept |
| Guided First Industry | 4h | Step-by-step purchase of first business |
| Mechanic Tooltips | 4h | Help icons throughout UI with explanations |
| Tutorial Quest Chain | 5h | 5-step quest teaching core mechanics |

**Files Created:**
- `src/components/tutorial/WelcomeModal.tsx`
- `src/components/tutorial/GuidedTour.tsx`
- `src/components/tutorial/TooltipHelp.tsx`
- `src/lib/tutorial/tutorialSteps.ts`
- `src/components/tutorial/TutorialQuestPanel.tsx`

---

## Phase G: Events & Random Encounters (12 hours) — P1

**Goal:** Keep gameplay fresh with dynamic events

| Task | Hours | Deliverable |
|------|-------|-------------|
| Event Generation Engine | 4h | Random event creation based on player state |
| Event Types (50+ events) | 4h | Market crashes, opportunities, disasters |
| Event Response UI | 2h | Modal for player decisions |
| Event Outcome Processing | 2h | Apply event effects to game state |

**Files Created:**
- `src/lib/game/events/eventGenerator.ts`
- `src/lib/game/events/eventTypes.ts`
- `src/components/events/EventModal.tsx`
- `src/lib/game/events/eventProcessor.ts`

---

## Phase H: Multiplayer Competition (8 hours) — P1

**Goal:** Social competition drives engagement

| Task | Hours | Deliverable |
|------|-------|-------------|
| Leaderboard Page | 3h | Global rankings by net worth, revenue, level |
| Weekly Season System | 2h | Reset and rewards for top players |
| Rival System | 2h | Track specific players, get notifications |
| Competition Notifications | 1h | "Player X passed you!" alerts |

**Files Created:**
- `src/app/(dashboard)/leaderboard/page.tsx`
- `src/lib/game/competition/seasons.ts`
- `src/lib/game/competition/rivals.ts`
- `src/components/social/RivalCard.tsx`

---

# 📋 FID BREAKDOWN

## New FIDs Required

| FID | Name | Phase | Hours | Priority |
|-----|------|-------|-------|----------|
| FID-20251206-001 | Core Loop UI (Treasury, Ticker, Notifications) | A | 16h | P0 |
| FID-20251205-013 | Logistics Industry (Models, API, UI, Processor) | B | 16h | P0 |
| FID-20251206-002 | Tick Scheduler + Offline Progress | C | 8h | P0 |
| FID-20251206-003 | Synergy Wiring (Apply bonuses to production) | D | 12h | P0 |
| FID-20251206-004 | Player Progression UI (XP, Levels, Achievements) | E | 12h | P0 |
| FID-20251206-005 | Tutorial & Onboarding | F | 16h | P0 |
| FID-20251206-006 | Events & Random Encounters | G | 12h | P1 |
| FID-20251206-007 | Multiplayer Competition | H | 8h | P1 |

## Existing FIDs (For Reference)

| FID | Status | Description |
|-----|--------|-------------|
| FID-20251205-009 | ✅ COMPLETE | Banking + Game Tick Engine |
| FID-20251205-010 | ✅ COMPLETE | Core Industry Tick Processors |
| FID-20251205-011 | ✅ COMPLETE | Revenue Industry Tick Processors |
| FID-20251205-012 | ✅ COMPLETE | Specialty Industry Tick Processors |
| FID-20251204-CRIME-MMO | 🔴 PLANNED | Full Dope Wars System (80-120h) |

---

# 📊 INDUSTRY BREAKDOWN

### 1. 🏦 BANKING (Foundation Layer)
**Status:** ✅ CORE COMPLETE (FID-20251205-009)

#### Gameplay Loop
```
Attract Depositors → Set Interest Rates → Evaluate Applicants → Issue Loans → Collect Payments → Profit
       │                    │                    │                  │               │
       ▼                    ▼                    ▼                  ▼               ▼
  Get capital          Balance risk         Credit analysis    Monthly ticks    Handle defaults
```

#### What You Own
- **Bank (Company)** - Your financial institution
- **Deposits** - Customer deposits (you pay interest)
- **Loans** - Issued loans (you earn interest)
- **Settings** - Interest rates, policies, limits

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Loan Interest | Monthly (tick) | % of outstanding loans |
| Late Fees | Per occurrence | When borrowers miss payments |
| Origination Fees | Per loan | % of loan amount |
| Overdraft Fees | Per occurrence | When deposits go negative |

#### Expense Sources
| Expense | Frequency | Description |
|---------|-----------|-------------|
| Deposit Interest | Monthly (tick) | % paid to depositors |
| Defaults | Per default | Lost principal on bad loans |
| Operating Costs | Monthly | Staff, systems, compliance |

#### Synergies
- **→ All Industries:** Provide financing, earn interest
- **→ Real Estate:** Mortgages for property purchases
- **→ Crime:** Money laundering services
- **→ Politics:** Campaign financing for favorable regulations

#### Dependencies
- None (Foundation layer)

#### Game Tick Processing
```typescript
// Every game tick (1 month):
1. Process loan payments due
2. Apply late fees for missed payments
3. Mark defaulted loans (3+ missed)
4. Accrue deposit interest
5. Award XP for successful payments
6. Update bank level/stats
```

---

### 2. ⚡ ENERGY (Infrastructure Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Acquire Resources → Build Infrastructure → Generate Power → Sell to Grid/Clients → Maintain & Expand
       │                    │                    │                  │               │
       ▼                    ▼                    ▼                  ▼               ▼
  Oil/Gas/Solar        Plants/Farms         kWh production     PPAs/Spot        Equipment wear
```

#### What You Own
- **OilWell** - Extract crude oil
- **GasField** - Extract natural gas
- **SolarFarm** - Generate solar power
- **WindTurbine** - Generate wind power
- **PowerPlant** - Convert fuel to electricity
- **EnergyStorage** - Batteries, store excess
- **TransmissionLine** - Move power
- **GridNode** - Grid connection point

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| PPA Contracts | Monthly | Fixed-price agreements |
| Spot Sales | Daily | Market rate sales |
| Capacity Payments | Monthly | Grid stability payments |
| Commodity Sales | Per batch | Oil/gas to refiners |

#### Expense Sources
| Expense | Frequency | Description |
|---------|-----------|-------------|
| Fuel Costs | Per generation | Coal, gas, uranium |
| Maintenance | Monthly | Equipment upkeep |
| Labor | Monthly | Operators, engineers |
| Transmission Fees | Per kWh | Grid access |

#### Synergies
- **→ Manufacturing:** Power factories at discount
- **→ Tech (Data Centers):** Massive power needs
- **→ Real Estate:** Power buildings
- **→ Crime (Grow Ops):** Hidden power consumption
- **← Banking:** Finance infrastructure

#### Dependencies
- **Banking:** Loans for capital-intensive builds
- **Real Estate:** Land for facilities
- **Politics:** Regulations, permits, subsidies

#### Game Tick Processing
```typescript
// Every game tick:
1. Calculate power generation (weather affects solar/wind)
2. Fulfill PPA contracts first
3. Sell excess on spot market
4. Deduct fuel costs
5. Apply maintenance/depreciation
6. Check equipment failures
7. Process commodity production (oil/gas)
```

---

### 3. 🏭 MANUFACTURING (Production Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Secure Suppliers → Setup Production Lines → Manufacture Products → Fulfill Orders → Optimize
       │                    │                    │                  │               │
       ▼                    ▼                    ▼                  ▼               ▼
  Raw materials        Assembly config       OEE metrics         B2B/B2C         Six Sigma
```

#### What You Own
- **ManufacturingFacility** - Factory building
- **ProductionLine** - Individual production lines
- **Supplier** - Raw material suppliers

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Product Sales | Per order | Finished goods |
| Contract Manufacturing | Monthly | OEM for others |
| Licensing | Monthly | License designs to others |

#### Expense Sources
| Expense | Frequency | Description |
|---------|-----------|-------------|
| Raw Materials | Per production run | From suppliers |
| Labor | Monthly | Factory workers |
| Energy | Per kWh used | Power consumption |
| Maintenance | Monthly | Equipment upkeep |
| Quality Control | Per batch | Testing, QA |

#### Synergies
- **→ Retail/E-Commerce:** Supply products
- **→ Logistics:** Shipping contracts
- **→ Tech:** Buy automation software
- **← Energy:** Discounted power
- **← Banking:** Equipment financing

#### Dependencies
- **Energy:** Power for operations
- **Logistics:** Raw material delivery, product shipping
- **Banking:** Working capital

#### Game Tick Processing
```typescript
// Every game tick:
1. Consume raw materials from inventory
2. Calculate production output (OEE)
3. Add finished goods to inventory
4. Fulfill pending orders
5. Pay supplier invoices
6. Deduct energy costs
7. Apply equipment depreciation
```

---

### 4. 💻 TECHNOLOGY (Optimization Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Sub-Industries
1. **AI/ML** - AIModel, AIResearchProject, Breakthrough
2. **Software** - SoftwareProduct, Bug, Feature, SaaSSubscription
3. **Cloud/Infra** - DataCenter, ComputeListing, ComputeContract

#### Gameplay Loop (AI)
```
Train Models → Improve via Research → Deploy to Marketplace → License/Sell → Scale Compute
       │                │                     │                  │              │
       ▼                ▼                     ▼                  ▼              ▼
  GPU hours         Breakthroughs          API access        Revenue         Data centers
```

#### Gameplay Loop (SaaS)
```
Develop Product → Fix Bugs/Add Features → Acquire Customers → Monthly Billing → Retain/Upsell
       │                    │                     │                  │              │
       ▼                    ▼                     ▼                  ▼              ▼
  Engineering          Sprint cycles            Marketing          ARR/MRR        Churn mgmt
```

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| SaaS Subscriptions | Monthly | Recurring revenue |
| AI API Usage | Per call | Pay-per-use |
| Licensing | Per deal | Enterprise licenses |
| Compute Marketplace | Per hour | Rent GPU time |

#### Expense Sources
| Expense | Frequency | Description |
|---------|-----------|-------------|
| Compute Costs | Per hour | GPU/CPU usage |
| Engineering | Monthly | Developer salaries |
| Infrastructure | Monthly | Servers, hosting |
| Customer Support | Monthly | Support staff |

#### Synergies
- **→ All Industries:** Automation, analytics
- **→ Manufacturing:** Industry 4.0, predictive maintenance
- **→ Banking:** Fraud detection, credit scoring AI
- **← Energy:** Power data centers
- **← Banking:** Venture capital

#### Dependencies
- **Energy:** Massive power for data centers
- **Real Estate:** Data center facilities
- **Banking:** Startup/scaling capital

---

### 5. 📺 MEDIA (Influence Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Create Content → Build Audience → Run Ad Campaigns → Monetize → Scale Influence
       │                │                  │              │              │
       ▼                ▼                  ▼              ▼              ▼
  Studios/Talent    Engagement        Brand deals      Revenue       Political sway
```

#### What You Own
- **Platform** - Media distribution platform
- **MediaContent** - Individual content pieces
- **Audience** - Follower/subscriber base
- **AdCampaign** - Advertising campaigns
- **InfluencerContract** - Hired influencers
- **SponsorshipDeal** - Brand partnerships

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Ad Revenue | Per impression | CPM-based |
| Sponsorships | Per deal | Brand partnerships |
| Subscriptions | Monthly | Premium content |
| Licensing | Per deal | Content licensing |

#### Expense Sources
| Expense | Frequency | Description |
|---------|-----------|-------------|
| Content Production | Per piece | Creation costs |
| Talent | Monthly | Creators, journalists |
| Platform Fees | Monthly | Hosting, CDN |
| Marketing | Monthly | Audience acquisition |

#### Synergies
- **→ Retail/E-Commerce:** Marketing reach
- **→ Politics:** Public opinion shaping
- **→ All Industries:** Brand advertising
- **← Tech:** Platform infrastructure
- **← Banking:** Content financing

#### Dependencies
- **Technology:** Streaming, hosting infrastructure
- **Politics:** Content regulations

---

### 6. 🏠 REAL ESTATE (Space Layer)
**Status:** ✅ MODEL EXISTS | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Acquire Property → Develop/Improve → Lease/Sell → Collect Rent → Appreciate/Flip
       │                  │                │              │              │
       ▼                  ▼                ▼              ▼              ▼
  Land/Buildings      Construction      Tenants        Income         Capital gains
```

#### What You Own
- **RealEstate** - Properties (land, buildings)

#### Property Types
| Type | Use Case | Income Model |
|------|----------|--------------|
| Commercial | Offices, retail | Lease |
| Industrial | Factories, warehouses | Lease |
| Residential | Apartments, housing | Rent |
| Data Center | Server facilities | Lease |
| Agricultural | Farms, grow ops | Lease/Use |

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Rent | Monthly | Tenant payments |
| Property Sales | Per sale | Appreciation gains |
| Development Fees | Per project | Building new |

#### Synergies
- **→ All Industries:** Provide facilities
- **→ Crime:** Hidden grow ops, safe houses
- **→ Manufacturing:** Factory space
- **← Banking:** Mortgages
- **← Politics:** Zoning, permits

---

### 7. 🚚 LOGISTICS (Movement Layer)
**Status:** ⏳ MODELS NEEDED | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Build Fleet → Establish Routes → Contract Shipping → Deliver → Optimize Network
       │              │                  │              │              │
       ▼              ▼                  ▼              ▼              ▼
  Trucks/Ships    Warehouses          Customers       Tracking      Efficiency
```

#### What You Would Own
- **Vehicle** - Trucks, ships, planes
- **Warehouse** - Storage facilities
- **Route** - Delivery routes
- **ShippingContract** - Customer agreements

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Shipping Fees | Per delivery | Distance/weight based |
| Storage Fees | Monthly | Warehouse rental |
| Contracts | Monthly | Bulk shipping deals |

#### Synergies
- **→ Manufacturing:** Supply chain
- **→ E-Commerce:** Last-mile delivery
- **→ Crime:** Drug distribution routes
- **← Energy:** Fleet fuel
- **← Banking:** Fleet financing

---

### 8. 🏥 HEALTHCARE (Wellness Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
R&D New Treatments → Clinical Trials → FDA Approval → Manufacture → Distribute → Profit
       │                    │                │              │              │          │
       ▼                    ▼                ▼              ▼              ▼          ▼
  Lab research          Testing          Regulatory     Production     Hospitals    Revenue
```

#### What You Own
- **Pharmaceutical** - Drug development
- **MedicalDevice** - Device development
- **ResearchProject** - R&D initiatives
- **HealthcareInsurance** - Insurance products
- **Clinic** - Outpatient facilities
- **Hospital** - Inpatient facilities

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Drug Sales | Per unit | Pharmaceutical revenue |
| Device Sales | Per unit | Medical device revenue |
| Insurance Premiums | Monthly | Policy revenue |
| Patient Services | Per visit | Clinic/hospital revenue |

#### Synergies
- **→ All Industries:** Employee health benefits
- **→ Crime (Pharma):** Diverted medications
- **← Tech:** Medical AI, telemedicine
- **← Banking:** R&D financing

---

### 9. 🎓 EDTECH (Training Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Create Courses → Enroll Students → Track Progress → Issue Certifications → Scale Platform
       │                │                │                  │                   │
       ▼                ▼                ▼                  ▼                   ▼
  Content dev        Marketing       Engagement          Credentials         Revenue
```

#### What You Own
- **EdTechCourse** - Course content
- **StudentEnrollment** - Student records
- **Certification** - Credential issuance

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Course Sales | Per enrollment | One-time revenue |
| Subscriptions | Monthly | Platform access |
| Certifications | Per credential | Testing fees |
| B2B Training | Per contract | Corporate training |

#### Synergies
- **→ All Industries:** Employee training
- **→ Consulting:** Expertise development
- **← Tech:** Platform infrastructure

---

### 10. 🛒 RETAIL / E-COMMERCE (Sales Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
List Products → Market to Customers → Process Orders → Fulfill & Ship → Handle Returns
       │                 │                  │               │               │
       ▼                 ▼                  ▼               ▼               ▼
  Inventory           Advertising         Cart            Logistics       Support
```

#### What You Own
- **ProductListing** - Items for sale
- **Order** - Customer orders
- **CustomerReview** - Product reviews
- **SEOCampaign** - Marketing campaigns

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Product Sales | Per order | Retail margin |
| Marketplace Fees | Per transaction | Platform cut |
| Advertising | Per impression | Seller promotion |

#### Synergies
- **→ Customers:** Consumer reach
- **← Manufacturing:** Product supply
- **← Logistics:** Delivery fulfillment
- **← Media:** Marketing channels
- **← Banking:** Payment processing

---

### 11. 🎯 CONSULTING (Advisory Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Win Projects → Staff Teams → Deliver Work → Bill Clients → Build Reputation
       │             │              │              │               │
       ▼             ▼              ▼              ▼               ▼
  Business dev    Employees      Milestones     Revenue         References
```

#### What You Own
- **ConsultingProject** - Client engagements

#### Project Types
- Strategy, Operations, Technology, HR, Finance

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Project Fees | Per project | Fixed or T&M |
| Retainers | Monthly | Ongoing advisory |
| Success Fees | Per outcome | Performance bonus |

#### Synergies
- **→ All Industries:** Advisory services
- **← Banking:** Engagement financing
- **← EdTech:** Expertise development

---

### 12. 🏛️ POLITICS (Regulation Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ GAMEPLAY LOOP NEEDED

#### Gameplay Loop
```
Donate to Campaigns → Lobby for Bills → Influence Votes → Win Policy → Benefit from Laws
       │                    │                  │               │               │
       ▼                    ▼                  ▼               ▼               ▼
  Contributions        Lobbyists          Politicians      Legislation     Advantages
```

#### What You Own/Control
- **PoliticalContribution** - Campaign donations
- **LobbyingAction** - Lobbying efforts
- **Bill** - Legislation in progress
- **Unions** - Labor organizations
- **Paramilitaries** - Armed groups

#### Influence Sources
| Source | Mechanism | Effect |
|--------|-----------|--------|
| Campaign Donations | Direct funding | Politician favor |
| Lobbying | Issue advocacy | Bill influence |
| PAC Spending | Ad campaigns | Public opinion |
| Union Control | Labor leverage | Policy pressure |

#### Synergies
- **→ All Industries:** Favorable regulations
- **→ Crime:** Protection, legalization
- **← Banking:** Campaign financing
- **← Media:** Public opinion

---

### 13. 🔫 CRIME (Underground Layer)
**Status:** ✅ MODELS COMPLETE | ⏳ CRIME MMO PLANNED (FID-20251204-CRIME-MMO)

#### Gameplay Loop (Dope Wars)
```
Buy Low → Travel → Sell High → Avoid Heat → Reinvest → Scale Empire
    │         │         │           │           │           │
    ▼         ▼         ▼           ▼           ▼           ▼
 Pricing    Routes    Markets    Encounters    Cash      Production
```

#### What You Own
- **PlayerStash** - Inventory, cash, location (in User model)
- **ProductionFacility** - Grow ops, labs
- **DistributionRoute** - Supply chains
- **Gang/Territory** - Cartel control
- **HeatLevel** - Law enforcement attention
- **LaunderingChannel** - Money cleaning

#### Income Sources
| Source | Frequency | Description |
|--------|-----------|-------------|
| Drug Sales | Per transaction | Price arbitrage |
| Production | Per harvest | Grow/cook profit |
| Distribution | Per route run | Middleman cut |
| Territory Tax | Monthly | Area control |
| Laundering Fees | Per wash | Cleaning service |

#### Synergies
- **→ Banking:** Money laundering
- **→ Politics:** Bribery, legalization
- **→ Real Estate:** Hidden facilities
- **→ Logistics:** Distribution networks
- **← Banking:** Startup capital (loan sharks)

---

## 🔄 GAME TICK SYSTEM

### Tick Architecture
```
┌────────────────────────────────────────────────────────────────────┐
│                       GAME TICK ENGINE                              │
│                                                                     │
│  Frequency: 1 tick = 1 game month (adjustable)                     │
│  Trigger: Scheduled (cron) or Manual (API)                         │
│  Location: src/lib/game/tick/tickEngine.ts                         │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│                    PROCESSORS (11/11 COMPLETE)                      │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │   Banking    │ │    Energy    │ │Manufacturing │               │
│  │  ✅ COMPLETE │ │  ✅ COMPLETE │ │  ✅ COMPLETE │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │    Tech      │ │    Media     │ │    Retail    │               │
│  │  ✅ COMPLETE │ │  ✅ COMPLETE │ │  ✅ COMPLETE │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Healthcare  │ │  Consulting  │ │    Crime     │               │
│  │  ✅ COMPLETE │ │  ✅ COMPLETE │ │  ✅ COMPLETE │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐                                │
│  │   Empire     │ │   Politics   │                                │
│  │  ✅ COMPLETE │ │  ✅ COMPLETE │                                │
│  └──────────────┘ └──────────────┘                                │
│                                                                     │
│  🔴 MISSING: Scheduler (no auto-trigger)                           │
│  🔴 MISSING: WebSocket (no real-time updates)                      │
│  🔴 MISSING: Logistics Processor (industry not built)              │
└────────────────────────────────────────────────────────────────────┘
```

### Per-Industry Tick Processing

| Industry | Processor File | LOC | Status |
|----------|----------------|-----|--------|
| **Banking** | bankingProcessor.ts | 600 | ✅ Complete |
| **Empire** | empireProcessor.ts | 450 | ✅ Complete |
| **Energy** | energyProcessor.ts | 550 | ✅ Complete |
| **Manufacturing** | manufacturingProcessor.ts | 500 | ✅ Complete |
| **Retail** | retailProcessor.ts | 500 | ✅ Complete |
| **Tech** | techProcessor.ts | 420 | ✅ Complete |
| **Media** | mediaProcessor.ts | 508 | ✅ Complete |
| **Consulting** | consultingProcessor.ts | 477 | ✅ Complete |
| **Healthcare** | healthcareProcessor.ts | 763 | ✅ Complete |
| **Crime** | crimeProcessor.ts | 580 | ✅ Complete |
| **Politics** | politicsProcessor.ts | 780 | ✅ Complete |
| **Logistics** | — | — | 🔴 Industry Missing |

---

# 🎯 SUCCESS METRICS

## Game Health Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **D1 Retention** | 50%+ | Users returning after 1 day |
| **D7 Retention** | 30%+ | Users returning after 7 days |
| **D30 Retention** | 15%+ | Users returning after 30 days |
| **Session Length** | 15+ min | Average time in game |
| **Sessions/Day** | 2+ | Daily engagement frequency |
| **Actions/Session** | 20+ | Clicks, purchases, decisions |

## Economy Health Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Industries/User** | 3+ | Average industries owned |
| **Synergies/Empire** | 5+ | Active cross-industry bonuses |
| **Revenue Growth** | 10%+ monthly | Empire revenue increase |
| **Loan Utilization** | 60%+ | Players using banking |
| **Achievement Completion** | 40%+ | Achievements unlocked |

## Technical Health Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **TypeScript Errors** | 0 | Compilation check |
| **API Response Time** | <500ms | P95 latency |
| **Tick Processing** | <5s | Time to process all processors |
| **WebSocket Uptime** | 99%+ | Connection stability |

---

# 📋 QUICK REFERENCE

## What's Complete

| Component | Status | Details |
|-----------|--------|---------|
| Tick Processors | ✅ 11/11 | All industries processing |
| Industries | ✅ 14/15 | Only Logistics missing |
| Models | ✅ 100+ | All schemas defined |
| API Routes | ✅ 50+ | All CRUD endpoints |
| Components | ✅ 30+ | All dashboards built |
| TypeScript | ✅ 0 errors | Clean compilation |

## What's Missing for Playability

| Component | Priority | Hours |
|-----------|----------|-------|
| Core Loop UI | P0 | 16h |
| Logistics Industry | P0 | 16h |
| Tick Scheduler | P0 | 8h |
| Synergy Wiring | P0 | 12h |
| Progression UI | P0 | 12h |
| Tutorial | P0 | 16h |
| Events | P1 | 12h |
| Multiplayer | P1 | 8h |
| **TOTAL** | | **100h** |

## Next Steps

1. **Review this plan** - Get user approval on priorities
2. **Create FID files** - FID-20251206-001 through 007
3. **Implement Phase A** - Core Loop UI (most impactful)
4. **Implement Phase B** - Logistics Industry (complete the 15)
5. **Continue sequentially** - C through H as time permits

---

## 📝 NOTES

1. **All tick processors are COMPLETE** - The backend processing is done
2. **The game doesn't "feel" playable** - Missing UI for engagement
3. **100 hours to full playability** - Focused, prioritized work
4. **Synergies are key** - They make empire building meaningful
5. **Addiction loops create retention** - Four time-scale loops needed
6. **Crime MMO is separate** - 80-120h additional project

---

*Updated 2025-12-06 by ECHO v1.4.0 - Complete Game Playability Roadmap*
