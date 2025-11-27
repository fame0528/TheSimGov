# 🎮 Company Level & Progression System - Complete Specification

**Created:** 2025-11-15  
**Version:** 1.0.0  
**ECHO:** v1.0.0  
**Status:** COMPREHENSIVE PLANNING COMPLETE

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Complete Cost Structure](#complete-cost-structure)
4. [Level Mechanics](#level-mechanics)
5. [Technology Subcategories](#technology-subcategories)
6. [Employee & Operating Costs](#employee--operating-costs)
7. [Contract Scaling](#contract-scaling)
8. [Politics Integration](#politics-integration)
9. [Additional Systems](#additional-systems)
10. [Implementation Plan](#implementation-plan)
11. [Database Schema](#database-schema)
12. [API Contracts](#api-contracts)
13. [UI/UX Specifications](#uiux-specifications)

---

## 🎯 Executive Summary

### **The Problem**
Original system had static companies with single startup costs. No growth mechanics, no progression, limited depth, and unrealistic scaling.

### **The Solution**
**5-Level Company Progression System** providing extreme depth:
- 70 unique configurations (14 industries × 5 levels each)
- Mom & Pop shops ($5k) → Fortune 500 giants ($3B)
- RPG-style XP progression with multiple requirements
- Technology subcategories (AI, Software, Hardware) with distinct paths
- Political influence unlocked at higher levels
- Complete economic modeling with operating costs

### **Key Achievements**
✅ **Extreme Depth**: 70 progression paths from startup to Fortune 500  
✅ **Perfect Accessibility**: 4 industries start under $10k (Media, Software, Real Estate, E-Commerce)  
✅ **Realistic Scaling**: Based on real-world research (SBA, industry data)  
✅ **AI Properly Evaluated**: $12k consultant → $250M AGI company  
✅ **Politics Integration**: Business success → political power  
✅ **Replayability**: Multiple paths to dominance  
✅ **Banking Justification**: All industries require loans/credit system  

---

## 🏗️ System Overview

### **Core Concept**
Companies start small and grow through 5 distinct levels, each requiring:
1. **Experience Points (XP)** - Earned through contracts, revenue milestones, achievements
2. **Minimum Employees** - Headcount requirements (1 → 10,000+)
3. **Revenue Threshold** - Total revenue generated (all-time tracking)
4. **Upgrade Capital** - Cash on hand for expansion costs

### **Level Progression Path**
```
Level 1: Startup/Local
├── $5k-$50k startup cost
├── 1-5 employees
├── Local market only
└── Basic operations

Level 2: Small Business
├── $45k-$200k upgrade cost
├── 5-50 employees
├── Regional market
└── Basic automation unlocked

Level 3: Regional Corporation
├── $250k-$5M upgrade cost
├── 50-500 employees
├── Multi-state presence
└── R&D, franchising unlocked

Level 4: National Corporation
├── $5M-$120M upgrade cost
├── 500-10,000 employees
├── National dominance
└── M&A, IPO unlocked

Level 5: Fortune 500 / Global Giant
├── $80M-$3B upgrade cost
├── 10,000-500,000 employees
├── Global operations
└── Industry influence, lobbying, market manipulation
```

---

## 💰 Complete Cost Structure

### **All Industries - All 5 Levels**

| Industry | L1 (Startup) | L2 (Small) | L3 (Regional) | L4 (National) | L5 (Fortune 500) |
|----------|-------------|-----------|--------------|--------------|-----------------|
| **Media** | $5,000 | $75,000 | $1,000,000 | $30,000,000 | $500,000,000 |
| **Software** | $6,000 | $45,000 | $600,000 | $20,000,000 | $250,000,000 |
| **Real Estate** | $8,000 | $35,000 | $250,000 | $5,000,000 | $80,000,000 |
| **E-Commerce** | $8,000 | $55,000 | $500,000 | $15,000,000 | $200,000,000 |
| **AI** | $12,000 | $85,000 | $750,000 | $15,000,000 | $250,000,000 |
| **Construction** | $15,000 | $125,000 | $800,000 | $12,000,000 | $150,000,000 |
| **Retail** | $15,000 | $65,000 | $700,000 | $25,000,000 | $350,000,000 |
| **Hardware** | $18,000 | $95,000 | $1,200,000 | $35,000,000 | $400,000,000 |
| **Banking** | $18,000 | $175,000 | $5,000,000 | $100,000,000 | $2,000,000,000 |
| **Energy** | $20,000 | $165,000 | $4,000,000 | $120,000,000 | $3,000,000,000 |
| **Crypto** | $25,000 | $115,000 | $2,000,000 | $40,000,000 | $300,000,000 |
| **Manufacturing** | $30,000 | $135,000 | $1,500,000 | $25,000,000 | $400,000,000 |
| **Healthcare** | $35,000 | $145,000 | $2,500,000 | $75,000,000 | $1,000,000,000 |
| **Stocks/Trading** | $35,000 | $200,000 | $3,000,000 | $50,000,000 | $500,000,000 |

### **Accessibility Analysis ($10k Seed Capital)**

**✅ IMMEDIATE ACCESS (tiny/no loan):**
- Media L1: $5k (Have $5k left!)
- Software L1: $6k (Have $4k left!)
- Real Estate L1: $8k (Need $2k loan)
- E-Commerce L1: $8k (Need $2k loan)

**✅ SMALL LOAN ($2k-$15k):**
- AI, Construction, Retail, Hardware, Banking, Energy

**⚠️ SIGNIFICANT CAPITAL ($15k-$25k loan):**
- Crypto, Manufacturing, Healthcare, Stocks

---

## 🎯 Level Mechanics

### **Experience Point (XP) System**

**XP Gain Sources:**
| Activity | XP Gained | Frequency |
|----------|-----------|-----------|
| Contract completion | 50-500 XP | Per contract (value-based) |
| Monthly profit milestone | 100 XP | Per $10k profit |
| Employee training completion | 25 XP | Per employee |
| Market expansion | 200 XP | Per new location/region |
| R&D breakthrough | 500 XP | Per innovation |
| Customer satisfaction | 100 XP | Per milestone |
| Political influence | 150 XP | Per successful lobbying (L3+) |

**XP Requirements by Level:**
```typescript
const XP_REQUIREMENTS = {
  Level_1_to_2: 1000 XP,
  Level_2_to_3: 5000 XP,
  Level_3_to_4: 25000 XP,
  Level_4_to_5: 100000 XP
};
```

### **Level Up Requirements (Example: Retail)**

**Level 1 → Level 2:**
- ✅ XP: 1,000 earned
- ✅ Employees: 4 hired
- ✅ Revenue: $200,000 total generated
- ✅ Cash: $65,000 for upgrade

**Level 2 → Level 3:**
- ✅ XP: 5,000 earned
- ✅ Employees: 20 hired
- ✅ Revenue: $2,000,000 total generated
- ✅ Cash: $700,000 for upgrade

**Level 3 → Level 4:**
- ✅ XP: 25,000 earned
- ✅ Employees: 150 hired
- ✅ Revenue: $25,000,000 total generated
- ✅ Cash: $25,000,000 for upgrade

**Level 4 → Level 5:**
- ✅ XP: 100,000 earned
- ✅ Employees: 2,000 hired
- ✅ Revenue: $500,000,000 total generated
- ✅ Cash: $350,000,000 for upgrade

### **Features Unlocked Per Level**

| Level | Features | Market Reach | Max Employees | Politics |
|-------|----------|--------------|---------------|----------|
| **L1** | • Basic operations<br>• Manual management<br>• Local contracts only | Local (city) | 1-5 | No influence |
| **L2** | • Basic automation<br>• Regional contracts<br>• Employee training<br>• Marketing campaigns | Regional (state) | 5-50 | No influence |
| **L3** | • Advanced automation<br>• Multi-location mgmt<br>• R&D department<br>• Franchise opportunities | Multi-state | 50-500 | • Campaign donations<br>• Attend fundraisers |
| **L4** | • National operations<br>• M&A capabilities<br>• IPO possibility<br>• Brand licensing | National | 500-10,000 | • Lobbying power<br>• PAC creation<br>• Influence legislation |
| **L5** | • Global operations<br>• Fortune 500 status<br>• Market manipulation<br>• Industry leadership | Global | 10,000-500,000 | • Shape federal policy<br>• Regulatory capture<br>• Run for office |

---

## 🤖 Technology Subcategories

### **Three Distinct Paths Under Technology Parent**

**AI Companies:**
| Level | Name | Cost | Description | Employees | Key Features |
|-------|------|------|-------------|-----------|--------------|
| L1 | AI Consultant | $12k | Solo ML engineer, freelance consulting | 1-2 | • Simple ML models<br>• Small business consulting<br>• Cloud credits |
| L2 | AI Startup | $85k | Y-Combinator style AI product company | 5-15 | • Proprietary models<br>• First AI product<br>• Seed funding |
| L3 | AI Platform | $750k | Established AI company, enterprise clients | 50-200 | • API platform<br>• Enterprise solutions<br>• Multi-product line |
| L4 | AI Research Lab | $15M | Anthropic/Cohere level research company | 500-2,000 | • Foundation models<br>• Top researchers/PhDs<br>• Industry leader |
| L5 | AGI Company | $250M | OpenAI/DeepMind level, shaping AI future | 5,000-50,000 | • AGI pursuit<br>• Supercomputer clusters<br>• Global influence |

**Software Companies:**
| Level | Name | Cost | Description | Employees | Key Features |
|-------|------|------|-------------|-----------|--------------|
| L1 | Freelance Dev | $6k | Solo developer, contract work | 1 | • Client projects<br>• Basic tools<br>• Remote work |
| L2 | SaaS Startup | $45k | Software product with small team | 5-15 | • SaaS product<br>• Recurring revenue<br>• Product-market fit |
| L3 | Software Company | $600k | Enterprise software, established product | 50-200 | • Enterprise clients<br>• Multiple products<br>• Sales team |
| L4 | Software Platform | $20M | Salesforce/HubSpot-level platform | 500-5,000 | • Platform ecosystem<br>• Developer tools<br>• Market leader |
| L5 | Tech Giant | $250M | Microsoft/Oracle-level software empire | 10,000-100,000 | • Global dominance<br>• OS/platform control<br>• Industry standard |

**Hardware Companies:**
| Level | Name | Cost | Description | Employees | Key Features |
|-------|------|------|-------------|-----------|--------------|
| L1 | Repair Shop | $18k | Local electronics repair, small devices | 1-3 | • Repair services<br>• Basic tools<br>• Local market |
| L2 | Hardware Startup | $95k | IoT device, consumer electronics prototype | 5-20 | • Product prototype<br>• Manufacturing setup<br>• Kickstarter/crowdfund |
| L3 | Hardware Manufacturer | $1.2M | Factory production, established product line | 100-500 | • Manufacturing facility<br>• Distribution network<br>• Brand recognition |
| L4 | Hardware Brand | $35M | National consumer electronics brand | 1,000-10,000 | • Major retail presence<br>• Multiple product lines<br>• Brand loyalty |
| L5 | Global Hardware | $400M | Apple/Samsung/Dell-level manufacturing | 50,000-500,000 | • Global supply chain<br>• Vertical integration<br>• Industry leader |

---

## 💼 Employee & Operating Costs

### **Employee Salary Tiers by Company Level**

**CRITICAL:** Operating costs scale with company level. Level 5 companies cannot pay Level 1 salaries.

| Level | Employee Tier | Salary Range | Description |
|-------|--------------|-------------|-------------|
| **L1** | Entry-Level | $30k-$50k/year | Manual labor, basic skills, trainees |
| **L2** | Experienced | $60k-$100k/year | Skilled workers, specialists |
| **L3** | Senior/Manager | $100k-$150k/year | Managers, experts, team leads |
| **L4** | Senior Leadership | $150k-$500k/year | VPs, Directors, Senior Managers |
| **L5** | C-Suite Executives | $500k-$5M/year | CEO, CFO, CTO, top executives |

### **Operating Costs Structure**

```typescript
interface CompanyLevelConfig {
  level: 1 | 2 | 3 | 4 | 5;
  
  // Operating costs (monthly)
  monthlyOperatingCosts: {
    salaries: number;         // Total payroll (employees × avg salary)
    facilities: number;       // Rent, utilities, maintenance
    marketing: number;        // Ad spend, PR, brand building
    compliance: number;       // Legal, regulatory (↑ at L4-5)
    rAndD: number;           // Innovation costs (L3+ only)
    overhead: number;        // Insurance, admin, misc
    total: number;           // Sum of all above
  };
  
  // Revenue expectations
  estimatedMonthlyRevenue: number;  // Expected revenue range
  profitMargin: number;              // Target profit % (20-50%)
  
  // Financial health thresholds
  minCashReserve: number;    // Required cash buffer
  maxDebtRatio: number;      // Debt-to-equity limit
}
```

### **Example: Retail Industry Operating Costs**

| Level | Salaries | Facilities | Marketing | Compliance | R&D | Overhead | Total | Revenue | Margin |
|-------|---------|-----------|-----------|------------|-----|----------|-------|---------|--------|
| **L1** | $5k | $2k | $1k | $500 | $0 | $1k | $9.5k | $15k | 37% |
| **L2** | $30k | $10k | $5k | $2k | $0 | $3k | $50k | $80k | 38% |
| **L3** | $500k | $100k | $50k | $20k | $30k | $50k | $750k | $1.2M | 38% |
| **L4** | $10M | $3M | $2M | $500k | $1M | $1M | $17.5M | $30M | 42% |
| **L5** | $250M | $50M | $40M | $10M | $20M | $20M | $390M | $650M | 40% |

**Key Insights:**
- Profit margins improve at higher levels (economies of scale)
- But absolute overhead increases dramatically
- Cash flow management becomes critical
- Debt service can crush unprofitable companies

---

## 📜 Contract Scaling

### **Contract Value Tiers by Company Level**

**CRITICAL:** Contracts must scale with company level to make progression meaningful.

| Level | Contract Tier | Value Range | Duration | Complexity |
|-------|--------------|-------------|----------|------------|
| **L1** | Local Contracts | $1k-$10k | 1-4 weeks | Simple, single-location |
| **L2** | Regional Contracts | $10k-$100k | 1-3 months | Multi-location, moderate |
| **L3** | State Contracts | $100k-$1M | 3-12 months | Complex, multi-state |
| **L4** | National Contracts | $1M-$50M | 6-24 months | Enterprise, nationwide |
| **L5** | Global Mega-Deals | $50M-$1B+ | 12-60 months | International, transformative |

### **Contract Filtering Rules**

```typescript
// L1 companies: Only see L1 contracts (prevent overwhelm)
if (company.level === 1) {
  contracts = contracts.filter(c => c.tier === 'Local');
}

// L2 companies: See L1-L2 contracts (can choose easier or harder)
if (company.level === 2) {
  contracts = contracts.filter(c => ['Local', 'Regional'].includes(c.tier));
}

// L3-L4 companies: See L2-L4 contracts (no longer see tiny deals)
if (company.level >= 3 && company.level <= 4) {
  contracts = contracts.filter(c => ['Regional', 'State', 'National'].includes(c.tier));
}

// L5 companies: See L3-L5 contracts only (Fortune 500 don't do $5k jobs)
if (company.level === 5) {
  contracts = contracts.filter(c => ['State', 'National', 'Global'].includes(c.tier));
}
```

### **XP Rewards Scale with Contract Value**

```typescript
function calculateContractXP(contractValue: number, quality: number): number {
  const baseXP = Math.floor(contractValue / 1000); // $1k = 1 XP
  const qualityMultiplier = quality / 100; // Quality 0-100 → 0-1x
  const xp = baseXP * (1 + qualityMultiplier);
  
  return Math.min(xp, 5000); // Cap at 5000 XP per contract
}

// Examples:
// $10k contract, 80% quality = 10 * 1.8 = 18 XP
// $1M contract, 90% quality = 1000 * 1.9 = 1900 XP
// $100M contract, 100% quality = 100000 * 2 = 5000 XP (capped)
```

---

## 🏛️ Politics Integration

### **Political Influence by Company Level**

**CRITICAL:** This is a politics game! Business progression must feed into political power.

```typescript
interface PoliticalInfluence {
  canDonateToCampaigns: boolean;
  maxDonationAmount: number;
  canLobby: boolean;
  lobbyingPowerPoints: number;
  canInfluenceTradePolicy: boolean;
  canInfluenceTaxPolicy: boolean;
  governmentContractAccess: boolean;
  canRunForOffice: boolean;
}

const POLITICAL_INFLUENCE_BY_LEVEL: Record<CompanyLevel, PoliticalInfluence> = {
  1: {
    canDonateToCampaigns: false,
    maxDonationAmount: 0,
    canLobby: false,
    lobbyingPowerPoints: 0,
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true, // Can bid on small local contracts
    canRunForOffice: false
  },
  2: {
    canDonateToCampaigns: true,
    maxDonationAmount: 5000, // $5k max to local candidates
    canLobby: false,
    lobbyingPowerPoints: 0,
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true,
    canRunForOffice: false
  },
  3: {
    canDonateToCampaigns: true,
    maxDonationAmount: 50000, // $50k to state candidates
    canLobby: true,
    lobbyingPowerPoints: 10, // Influence local/state policy
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true,
    canRunForOffice: true // Can run for local office (mayor, council)
  },
  4: {
    canDonateToCampaigns: true,
    maxDonationAmount: 500000, // $500k to federal candidates
    canLobby: true,
    lobbyingPowerPoints: 50, // Shape federal legislation
    canInfluenceTradePolicy: true,
    canInfluenceTaxPolicy: true,
    governmentContractAccess: true,
    canRunForOffice: true // Can run for state office (governor, congress)
  },
  5: {
    canDonateToCampaigns: true,
    maxDonationAmount: 10000000, // $10M to presidential campaigns
    canLobby: true,
    lobbyingPowerPoints: 200, // Write legislation directly
    canInfluenceTradePolicy: true,
    canInfluenceTaxPolicy: true,
    governmentContractAccess: true,
    canRunForOffice: true // Can run for president (billionaire route)
  }
};
```

### **Politics-Business Integration Examples**

**Level 3: Campaign Donations**
- Donate to mayoral/city council candidates
- Attend fundraisers (networking events)
- Gain favor with local politicians
- **Benefit:** Easier city permits, zoning approvals, local tax breaks

**Level 4: Lobbying Power**
- Hire professional lobbyists
- Push for favorable legislation (corporate tax cuts, industry deregulation)
- Influence state and federal policy
- **Benefit:** Industry-wide advantages, weakened competitors, subsidies

**Level 5: Regulatory Capture**
- Write legislation directly (industry "experts" consulted)
- Shape trade policy (tariffs favoring your industries)
- Control regulatory agencies (appoint friendly commissioners)
- **Endgame Option:** Sell companies, run for President with fortune
- **Benefit:** Total industry domination, legal monopoly status

---

## 🎯 Additional Systems

### **1. Location/Geography System**

```typescript
interface CompanyLocation {
  id: string;
  city: string;
  state: string;
  country: string; // For L5 global expansion
  type: 'Headquarters' | 'Branch' | 'Factory' | 'Warehouse' | 'Store';
  openedAt: Date;
  monthlyRevenue: number;
  employees: number;
  monthlyOperatingCost: number;
  status: 'Active' | 'Under Construction' | 'Closed';
}

// Requirements by level
const LOCATION_REQUIREMENTS = {
  1: { min: 1, max: 1, reach: 'Local' },      // Single HQ only
  2: { min: 2, max: 5, reach: 'Regional' },   // Expand within state
  3: { min: 10, max: 30, reach: 'Multi-state' }, // Regional dominance
  4: { min: 100, max: 500, reach: 'National' },  // National presence
  5: { min: 1000, max: 10000, reach: 'Global' }  // Global empire
};
```

**Location Expansion Gameplay:**
- Each location has construction time (1 week - 6 months)
- Location costs vary by city (NYC expensive, Cleveland cheap)
- Each location generates revenue but has operating costs
- Strategic decisions: Saturate one region vs spread thin nationally

### **2. Brand/Reputation System**

```typescript
interface CompanyReputation {
  brandValue: number;          // $0 - $100B (separate from company value)
  reputation: number;          // 0-100 score
  publicSentiment: 'Loved' | 'Liked' | 'Neutral' | 'Disliked' | 'Hated';
  
  // Reputation dimensions
  productQuality: number;      // 0-100
  customerService: number;     // 0-100
  employeeTreatment: number;   // 0-100
  environmentalImpact: number; // 0-100 (ESG score)
  socialResponsibility: number; // 0-100
  
  // Scandal tracking
  scandalHistory: Array<{
    type: 'ProductRecall' | 'Lawsuit' | 'EnvironmentalDamage' | 'LaborViolation' | 'DataBreach';
    severity: 1-10;
    occurredAt: Date;
    recoveredFrom: boolean;
  }>;
}

// Reputation effects
const REPUTATION_EFFECTS = {
  90-100: { xpMultiplier: 1.2, hiringBonus: 0.3, pricingPower: 1.15 },
  70-89:  { xpMultiplier: 1.1, hiringBonus: 0.1, pricingPower: 1.05 },
  50-69:  { xpMultiplier: 1.0, hiringBonus: 0, pricingPower: 1.0 },
  30-49:  { xpMultiplier: 0.9, hiringBonus: -0.2, pricingPower: 0.9 },
  0-29:   { xpMultiplier: 0.75, hiringBonus: -0.4, pricingPower: 0.75 }
};
```

### **3. Multi-Company Portfolio Management**

**Players can own multiple companies:**
- Portfolio dashboard showing all companies
- Cross-company synergies (bonuses for related industries)
- Resource sharing (employees, capital)
- Conglomerate formation (Level 5 across 3+ industries)

**Synergy Examples:**
- **Manufacturing + Retail**: Vertical integration, 20% cost reduction
- **AI + Healthcare**: AI-powered medical products, +30% revenue
- **Media + E-Commerce**: Built-in marketing channel, -50% ad costs
- **Banking + Real Estate**: Captive financing, guaranteed loan approvals

### **4. M&A System (Level 3+ Feature)**

```typescript
interface Acquisition {
  targetCompany: Company;
  offerPrice: number;
  valuation: number;
  dueDiligence: {
    financialHealth: 'Strong' | 'Moderate' | 'Weak';
    legalRisks: Risk[];
    culturalFit: number; // 0-100
  };
  negotiationPhase: 'Initial' | 'Bidding' | 'Accepted' | 'Rejected';
  financingSource: 'Cash' | 'Stock' | 'Debt' | 'Mixed';
}

// Level requirements for M&A
const MA_CAPABILITIES = {
  3: { canAcquire: true, maxTargetLevel: 2, hostileTakeover: false },
  4: { canAcquire: true, maxTargetLevel: 3, hostileTakeover: true },
  5: { canAcquire: true, maxTargetLevel: 4, hostileTakeover: true }
};
```

### **5. IPO System (Level 4-5 Feature)**

```typescript
interface IPO {
  company: Company;
  sharePrice: number;
  sharesOffered: number;
  valuationTarget: number;
  investorDemand: 'High' | 'Moderate' | 'Low';
  lockupPeriod: number; // Months before founder can sell
  
  // Post-IPO
  publicOwnership: number; // % public float
  quarterlyEarningsRequired: boolean; // Must report profits
  stockPrice: number; // Market-driven
  dividendPolicy: 'None' | 'Quarterly' | 'Annual';
}

// Benefits of going public
const IPO_BENEFITS = {
  massiveCapitalRaise: true,    // $100M-$10B injection
  brandPrestige: 50,             // +50 reputation boost
  acquisitionCurrency: true,     // Use stock for M&A
  founderWealth: 'Significant'   // Sell shares for personal fortune
};

// Drawbacks of going public
const IPO_DRAWBACKS = {
  quarterlyPressure: true,       // Must hit earnings targets
  disclosureRequirements: true,  // Financials become public
  vulnerableToTakeover: true,    // Competitors can buy shares
  shareholderDemands: true       // Dividends, growth expectations
};
```

### **6. Bankruptcy/Downgrade Mechanics**

```typescript
interface BankruptcyTrigger {
  debtServiceRatio: number;     // Monthly debt payment / revenue
  cashReserveRatio: number;     // Cash / monthly operating costs
  revenueDecline: number;       // % revenue drop over 6 months
}

const BANKRUPTCY_THRESHOLDS = {
  debtServiceRatio: 0.5,        // Debt service > 50% of revenue = warning
  cashReserveRatio: 2.0,        // < 2 months cash runway = critical
  revenueDecline: 0.3           // 30% revenue drop = distressed
};

// Bankruptcy options
enum BankruptcyOption {
  Chapter11Restructure,         // Reorganize debt, keep company
  Chapter7Liquidation,          // Sell assets, distribute to creditors
  FireSale,                     // Sell to competitor at discount
  LevelDowngrade,               // Drop 1 level, lay off employees, survive
  GovernmentBailout             // Level 4-5 only, political connections required
}
```

### **7. Crisis Management System**

```typescript
interface CompanyCrisis {
  type: 'ProductRecall' | 'Lawsuit' | 'DataBreach' | 'EnvironmentalDisaster' | 'PRScandal' | 'ExecutiveScandal';
  severity: 1-10;
  
  // Impact
  reputationDamage: number;     // -10 to -50 reputation
  financialCost: number;        // Fines, settlements, recalls
  durationWeeks: number;        // How long crisis lasts
  
  // Response options
  responseStrategy: 'Deny' | 'Apologize' | 'Deflect' | 'BribeOfficials' | 'ScapegoatEmployee';
  prCampaign: boolean;          // Spend $ to rebuild reputation
  legalDefense: 'Settle' | 'FightInCourt';
  
  // Outcomes (based on response)
  recoveryTime: number;         // Weeks to restore reputation
  permanentDamage: number;      // Unrecoverable reputation loss
}

// Crisis frequency by level
const CRISIS_PROBABILITY = {
  1: 0.01,  // 1% chance per month (small, under radar)
  2: 0.02,  // 2% chance
  3: 0.05,  // 5% chance (more scrutiny)
  4: 0.10,  // 10% chance (high profile targets)
  5: 0.15   // 15% chance (constant media attention)
};
```

---

## 📋 Implementation Plan

### **Phase 1: Foundation (Core Level System)**
**FID:** FID-20251115-001  
**Complexity:** 4/5  
**Estimate:** 2.5 hours  
**Priority:** CRITICAL

**Deliverables:**
1. Complete `src/constants/companyLevels.ts` with all 70 level configurations
2. Create `src/types/companyLevels.ts` with TypeScript interfaces
3. Update `src/models/Company.ts` schema with level fields
4. Update company creation API to initialize at Level 1
5. Basic level display in CompanyCard component
6. Full documentation

**Files:**
- [NEW] `src/constants/companyLevels.ts` (~800 lines)
- [NEW] `src/types/companyLevels.ts` (~50 lines)
- [MOD] `src/models/Company.ts` - Add level system fields
- [MOD] `src/constants/industries.ts` - Reference Level 1 costs only
- [MOD] `app/api/companies/route.ts` - Initialize Level 1
- [MOD] `components/companies/CompanyCard.tsx` - Display level

**Acceptance Criteria:**
- ✅ All 70 level configs defined with costs, requirements, features
- ✅ Company schema includes level, experience, levelName fields
- ✅ New companies start at Level 1 with proper initialization
- ✅ Level badge displays on company cards
- ✅ TypeScript 0 errors maintained

---

### **Phase 2: Progression Mechanics**
**FID:** FID-20251115-002  
**Complexity:** 4/5  
**Estimate:** 2 hours  
**Priority:** CRITICAL

**Deliverables:**
1. Level upgrade API endpoint with full validation
2. Add experience API endpoint
3. Level info API endpoint
4. XP gain logic from contracts/revenue
5. Level history tracking

**Files:**
- [NEW] `app/api/companies/[id]/upgrade/route.ts` (~150 lines)
- [NEW] `app/api/companies/[id]/add-experience/route.ts` (~60 lines)
- [NEW] `app/api/companies/[id]/level-info/route.ts` (~80 lines)
- [NEW] `lib/utils/levelProgression.ts` (~120 lines)
- [MOD] `app/api/contracts/[id]/complete/route.ts` - Add XP gain
- [MOD] Revenue calculation logic - Track totalRevenueGenerated

**Acceptance Criteria:**
- ✅ Companies can upgrade levels when requirements met
- ✅ XP awarded for contracts, revenue, achievements
- ✅ Level history tracked (date, cost paid)
- ✅ Validation prevents invalid upgrades
- ✅ API returns detailed blocker information

---

### **Phase 3: UI/UX Implementation**
**FID:** FID-20251115-003  
**Complexity:** 3/5  
**Estimate:** 1.5 hours  
**Priority:** HIGH

**Deliverables:**
1. CompanyLevelDisplay component with progress bars
2. UpgradeModal component with requirements
3. Level badge styling
4. Company detail page integration

**Files:**
- [NEW] `components/companies/CompanyLevelDisplay.tsx` (~120 lines)
- [NEW] `components/companies/UpgradeModal.tsx` (~200 lines)
- [NEW] `components/companies/LevelBadge.tsx` (~40 lines)
- [MOD] `components/companies/CompanyForm.tsx` - Show L1 costs
- [MOD] `app/(game)/companies/[id]/page.tsx` - Integrate display

**Acceptance Criteria:**
- ✅ Level progress visualized with progress bars
- ✅ Upgrade modal shows all requirements with status
- ✅ Features unlocked clearly displayed
- ✅ Level badges color-coded (bronze → gold → platinum)
- ✅ Mobile-responsive design

---

### **Phase 4: Employee Tiers & Operating Costs**
**FID:** FID-20251115-004  
**Complexity:** 4/5  
**Estimate:** 2 hours  
**Priority:** HIGH

**Deliverables:**
1. Employee salary tiers by company level
2. Operating cost calculations per level
3. Monthly expense tracking
4. Financial health warnings (low cash, high debt)

**Files:**
- [NEW] `lib/utils/operatingCosts.ts` (~200 lines)
- [MOD] `src/models/Company.ts` - Add operating cost fields
- [MOD] `src/models/Employee.ts` - Add salary tier field
- [NEW] `lib/utils/financialHealth.ts` (~150 lines)
- [NEW] `components/companies/OperatingCostsBreakdown.tsx` (~100 lines)

**Acceptance Criteria:**
- ✅ Employees cost appropriate salaries for company level
- ✅ Operating costs calculated monthly
- ✅ Warnings displayed for financial distress
- ✅ Profit margin tracking per level
- ✅ Cash flow projections accurate

---

### **Phase 5: Contract Scaling**
**FID:** FID-20251115-005  
**Complexity:** 3/5  
**Estimate:** 1.5 hours  
**Priority:** HIGH

**Deliverables:**
1. Contract tiers (Local, Regional, State, National, Global)
2. Contract filtering by company level
3. Scaled XP rewards
4. Tiered contract generation

**Files:**
- [MOD] `lib/db/models/Contract.ts` - Add tier field
- [MOD] `lib/utils/contractProgression.ts` - Scale XP by value
- [NEW] `lib/utils/contractGeneration.ts` (~150 lines)
- [MOD] `app/api/contracts/marketplace/route.ts` - Filter by level

**Acceptance Criteria:**
- ✅ Contracts filtered appropriately by company level
- ✅ XP rewards scale with contract value
- ✅ Contract difficulty matches company capabilities
- ✅ Level 5 companies don't see $5k contracts
- ✅ Level 1 companies not overwhelmed by $100M deals

---

### **Phase 6: Politics Integration**
**FID:** FID-20251115-006  
**Complexity:** 4/5  
**Estimate:** 2.5 hours  
**Priority:** MEDIUM

**Deliverables:**
1. Political influence tracking by level
2. Campaign donation system
3. Lobbying power mechanics
4. Government contract access
5. "Run for Office" option (Level 5)

**Files:**
- [NEW] `lib/db/models/PoliticalContribution.ts` (~100 lines)
- [NEW] `lib/db/models/LobbyingAction.ts` (~120 lines)
- [NEW] `lib/utils/politicalInfluence.ts` (~200 lines)
- [NEW] `app/api/politics/donate/route.ts` (~100 lines)
- [NEW] `app/api/politics/lobby/route.ts` (~150 lines)
- [NEW] `components/politics/PoliticalInfluencePanel.tsx` (~150 lines)

**Acceptance Criteria:**
- ✅ Level 3+ can donate to campaigns
- ✅ Level 4+ can lobby for legislation
- ✅ Level 5 can run for political office
- ✅ Political influence displayed on dashboard
- ✅ Lobbying actions affect game policies

---

### **Phase 7: Location/Geography System**
**FID:** FID-20251115-007  
**Complexity:** 5/5  
**Estimate:** 3 hours  
**Priority:** MEDIUM

**Deliverables:**
1. Location schema and management
2. Multi-location operations
3. Location-specific revenue/costs
4. Geographic expansion UI

**Files:**
- [NEW] `lib/db/models/CompanyLocation.ts` (~150 lines)
- [NEW] `lib/utils/locationManagement.ts` (~200 lines)
- [NEW] `app/api/companies/[id]/locations/route.ts` (~120 lines)
- [NEW] `components/companies/LocationsMap.tsx` (~200 lines)
- [NEW] `components/companies/LocationCard.tsx` (~80 lines)

**Acceptance Criteria:**
- ✅ Companies can open new locations
- ✅ Each location has construction time
- ✅ Location costs vary by city
- ✅ Geographic map visualization
- ✅ Location-specific performance tracking

---

### **Phase 8: Brand/Reputation System**
**FID:** FID-20251115-008  
**Complexity:** 4/5  
**Estimate:** 2 hours  
**Priority:** MEDIUM

**Deliverables:**
1. Reputation scoring (0-100)
2. Brand value calculation
3. Scandal system
4. PR campaign mechanics

**Files:**
- [MOD] `src/models/Company.ts` - Add reputation fields
- [NEW] `lib/db/models/Scandal.ts` (~100 lines)
- [NEW] `lib/utils/reputationManagement.ts` (~250 lines)
- [NEW] `components/companies/ReputationDashboard.tsx` (~150 lines)

**Acceptance Criteria:**
- ✅ Reputation affects XP gain, hiring, pricing
- ✅ Scandals damage reputation
- ✅ PR campaigns can rebuild reputation
- ✅ Brand value separate from company value
- ✅ ESG scoring implemented

---

### **Phase 9: Advanced Features (M&A, IPO, Multi-Company)**
**FID:** FID-20251115-009  
**Complexity:** 5/5  
**Estimate:** 4 hours  
**Priority:** LOW (Post-MVP)

**Deliverables:**
1. M&A system (Level 3+)
2. IPO mechanics (Level 4-5)
3. Multi-company portfolio management
4. Industry synergies

**Files:** ~15-20 new files, ~2000 lines of code

**Acceptance Criteria:**
- ✅ Level 3+ can acquire competitors
- ✅ Level 4-5 can go public (IPO)
- ✅ Portfolio dashboard shows all companies
- ✅ Cross-company synergies calculated
- ✅ Conglomerate bonuses applied

---

### **Phase 10: Crisis & Bankruptcy Systems**
**FID:** FID-20251115-010  
**Complexity:** 4/5  
**Estimate:** 2.5 hours  
**Priority:** LOW (Post-MVP)

**Deliverables:**
1. Crisis event system
2. Bankruptcy mechanics
3. Level downgrade option
4. Company recovery system

**Files:** ~10 new files, ~1500 lines of code

**Acceptance Criteria:**
- ✅ Random crises occur based on level
- ✅ Bankruptcy options available
- ✅ Level downgrade as alternative to closure
- ✅ Recovery mechanics balanced
- ✅ Government bailout option (Level 4-5)

---

## 💾 Database Schema

### **Updated Company Schema**

```typescript
interface ICompany extends Document {
  // Existing fields
  name: string;
  owner: ObjectId;
  industry: IndustryType;
  subcategory?: 'AI' | 'Software' | 'Hardware'; // Technology only
  cash: number;
  employees: ObjectId[];
  
  // NEW: Level System Fields
  level: 1 | 2 | 3 | 4 | 5;
  levelName: string; // "Mom & Pop Store", "AI Startup", etc.
  
  // Experience/Progression
  experience: number;
  experienceToNextLevel: number;
  
  // Requirements tracking
  totalRevenueGenerated: number; // All-time revenue
  totalContractsCompleted: number;
  locationsCount: number;
  marketReach: 'Local' | 'Regional' | 'National' | 'Global';
  
  // Caps/Limits (based on level)
  maxEmployees: number;
  maxLocations: number;
  revenueMultiplier: number; // 1.0 - 2.0x based on level
  
  // Operating Costs (monthly)
  monthlyOperatingCosts: {
    salaries: number;
    facilities: number;
    marketing: number;
    compliance: number;
    rAndD: number;
    overhead: number;
    total: number;
  };
  
  // Financial Health
  profitMargin: number; // Target %
  cashReserve: number; // Months of runway
  debtRatio: number; // Debt / equity
  
  // Reputation & Brand
  brandValue: number;
  reputation: number; // 0-100
  publicSentiment: 'Loved' | 'Liked' | 'Neutral' | 'Disliked' | 'Hated';
  
  // Political Influence (based on level)
  politicalInfluence: {
    canDonateToCampaigns: boolean;
    maxDonationAmount: number;
    canLobby: boolean;
    lobbyingPowerPoints: number;
  };
  
  // History
  levelHistory: Array<{
    level: number;
    achievedAt: Date;
    costPaid: number;
  }>;
  
  // Locations
  locations: ObjectId[]; // References to CompanyLocation documents
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### **New Schemas**

**CompanyLocation:**
```typescript
interface ICompanyLocation extends Document {
  company: ObjectId;
  city: string;
  state: string;
  country: string;
  type: 'Headquarters' | 'Branch' | 'Factory' | 'Warehouse' | 'Store';
  openedAt: Date;
  monthlyRevenue: number;
  employees: number;
  monthlyOperatingCost: number;
  status: 'Active' | 'Under Construction' | 'Closed';
}
```

**PoliticalContribution:**
```typescript
interface IPoliticalContribution extends Document {
  company: ObjectId;
  candidate: string;
  amount: number;
  electionType: 'Local' | 'State' | 'Federal';
  date: Date;
  returnOnInvestment: number; // Policies enacted that benefit company
}
```

**LobbyingAction:**
```typescript
interface ILobbyingAction extends Document {
  company: ObjectId;
  policyTarget: string;
  powerPointsSpent: number;
  successProbability: number;
  outcome: 'Pending' | 'Success' | 'Failure';
  benefit: string; // Description of what was gained
  createdAt: Date;
}
```

---

## 🔌 API Contracts

### **Level Management Endpoints**

**GET /api/companies/[id]/level-info**
```typescript
Request: GET /api/companies/123/level-info
Headers: { Authorization: 'Bearer <token>' }

Response: {
  currentLevel: {
    level: 2,
    levelName: "Small Retail Business",
    experience: 750,
    experienceToNextLevel: 5000,
    features: ["Basic automation", "Regional contracts", ...],
    maxEmployees: 50,
    maxLocations: 5
  },
  nextLevel: {
    level: 3,
    levelName: "Regional Retail Chain",
    upgradeCost: 700000,
    requirements: {
      xpRequired: 5000,
      minEmployees: 20,
      minRevenue: 2000000
    },
    features: ["Advanced automation", "Multi-location management", ...]
  },
  progress: {
    xpProgress: 750 / 5000 = 15%,
    employeesProgress: 12 / 20 = 60%,
    revenueProgress: 1500000 / 2000000 = 75%,
    cashProgress: 500000 / 700000 = 71%
  },
  canUpgrade: false,
  blockers: [
    "Need 250 more XP",
    "Need 8 more employees",
    "Need $500,000 more revenue",
    "Need $200,000 more cash"
  ]
}
```

**POST /api/companies/[id]/upgrade**
```typescript
Request: POST /api/companies/123/upgrade
Headers: { Authorization: 'Bearer <token>' }
Body: { confirmUpgrade: true }

Response: {
  success: true,
  company: { /* Updated company with level 3 */ },
  levelUp: {
    fromLevel: 2,
    toLevel: 3,
    costPaid: 700000,
    achievedAt: "2025-11-15T10:30:00Z",
    newFeatures: ["Advanced automation", "R&D department", ...],
    newMaxEmployees: 500,
    newMaxLocations: 30
  }
}

Error Response (requirements not met): {
  success: false,
  error: "Upgrade requirements not met",
  blockers: ["Need 250 more XP", "Need $200,000 more cash"]
}
```

**POST /api/companies/[id]/add-experience**
```typescript
Request: POST /api/companies/123/add-experience
Headers: { Authorization: 'Bearer <token>' }
Body: {
  source: "CONTRACT_COMPLETION",
  amount: 150,
  metadata: { contractId: "contract_456", contractValue: 150000 }
}

Response: {
  success: true,
  company: {
    experience: 900, // Was 750, now 750 + 150
    experienceToNextLevel: 5000
  },
  levelUpEligible: false, // Still need 4100 more XP
  message: "+150 XP from contract completion"
}
```

---

## 🎨 UI/UX Specifications

### **CompanyLevelDisplay Component**

```tsx
<Box p={6} bg="white" borderRadius="lg" shadow="md">
  <HStack justify="space-between" mb={4}>
    <HStack>
      <Badge 
        colorScheme={getLevelColor(company.level)} 
        fontSize="lg" 
        px={3} 
        py={1}
      >
        Level {company.level}
      </Badge>
      <Text fontSize="2xl" fontWeight="bold">
        {company.levelName}
      </Text>
    </HStack>
    
    {company.level < 5 && (
      <Button
        colorScheme="green"
        size="lg"
        onClick={handleUpgradeClick}
        isDisabled={!canUpgrade}
        leftIcon={<ArrowUpIcon />}
      >
        Upgrade to Level {company.level + 1}
      </Button>
    )}
  </HStack>
  
  {/* XP Progress Bar */}
  <VStack align="stretch" spacing={2} mb={4}>
    <HStack justify="space-between">
      <Text fontSize="sm" fontWeight="medium">
        Experience Progress
      </Text>
      <Text fontSize="sm" color="gray.600">
        {company.experience.toLocaleString()} / {company.experienceToNextLevel.toLocaleString()} XP
      </Text>
    </HStack>
    <Progress
      value={(company.experience / company.experienceToNextLevel) * 100}
      colorScheme="purple"
      size="lg"
      borderRadius="full"
    />
    <Text fontSize="xs" color="gray.500">
      {((company.experience / company.experienceToNextLevel) * 100).toFixed(1)}% to next level
    </Text>
  </VStack>
  
  {/* Current Level Stats */}
  <SimpleGrid columns={4} spacing={4} mb={6}>
    <Stat>
      <StatLabel>Employees</StatLabel>
      <StatNumber>{company.employees.length} / {company.maxEmployees}</StatNumber>
    </Stat>
    <Stat>
      <StatLabel>Locations</StatLabel>
      <StatNumber>{company.locationsCount} / {company.maxLocations}</StatNumber>
    </Stat>
    <Stat>
      <StatLabel>Market Reach</StatLabel>
      <StatNumber>{company.marketReach}</StatNumber>
    </Stat>
    <Stat>
      <StatLabel>Revenue Multiplier</StatLabel>
      <StatNumber>{company.revenueMultiplier}x</StatNumber>
    </Stat>
  </SimpleGrid>
  
  {/* Features Unlocked */}
  <Box>
    <Text fontSize="md" fontWeight="medium" mb={2}>
      Features Unlocked
    </Text>
    <Wrap spacing={2}>
      {currentLevelConfig.features.map(feature => (
        <WrapItem key={feature}>
          <Badge colorScheme="blue" px={2} py={1}>
            ✓ {feature}
          </Badge>
        </WrapItem>
      ))}
    </Wrap>
  </Box>
</Box>
```

### **UpgradeModal Component**

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="2xl">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>
      Upgrade to Level {nextLevel.level}: {nextLevel.levelName}
    </ModalHeader>
    <ModalCloseButton />
    
    <ModalBody>
      <VStack align="stretch" spacing={6}>
        {/* Cost Display */}
        <Box p={4} bg="blue.50" borderRadius="md">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Upgrade Cost
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {formatCurrency(nextLevel.upgradeCost)}
            </Text>
          </HStack>
        </Box>
        
        {/* Requirements Checklist */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={3}>
            Requirements
          </Text>
          
          <RequirementItem
            label="Experience Points"
            current={company.experience}
            required={nextLevel.xpRequired}
            format="number"
            met={company.experience >= nextLevel.xpRequired}
          />
          
          <RequirementItem
            label="Employees Hired"
            current={company.employees.length}
            required={nextLevel.minEmployees}
            format="number"
            met={company.employees.length >= nextLevel.minEmployees}
          />
          
          <RequirementItem
            label="Total Revenue Generated"
            current={company.totalRevenueGenerated}
            required={nextLevel.minRevenue}
            format="currency"
            met={company.totalRevenueGenerated >= nextLevel.minRevenue}
          />
          
          <RequirementItem
            label="Cash on Hand"
            current={company.cash}
            required={nextLevel.upgradeCost}
            format="currency"
            met={company.cash >= nextLevel.upgradeCost}
          />
        </Box>
        
        {/* New Features */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={3}>
            New Features Unlocked
          </Text>
          <UnorderedList spacing={2}>
            {nextLevel.features.map(feature => (
              <ListItem key={feature} color="green.600">
                {feature}
              </ListItem>
            ))}
          </UnorderedList>
        </Box>
        
        {/* Benefits Preview */}
        <SimpleGrid columns={2} spacing={4}>
          <Stat>
            <StatLabel>Max Employees</StatLabel>
            <StatNumber>{nextLevel.maxEmployees}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +{nextLevel.maxEmployees - currentLevel.maxEmployees}
            </StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Max Locations</StatLabel>
            <StatNumber>{nextLevel.maxLocations}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +{nextLevel.maxLocations - currentLevel.maxLocations}
            </StatHelpText>
          </Stat>
        </SimpleGrid>
        
        {/* Blockers (if any) */}
        {blockers.length > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Requirements Not Met</AlertTitle>
              <AlertDescription>
                <UnorderedList mt={2}>
                  {blockers.map(blocker => (
                    <ListItem key={blocker}>{blocker}</ListItem>
                  ))}
                </UnorderedList>
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </ModalBody>
    
    <ModalFooter>
      <Button variant="ghost" mr={3} onClick={onClose}>
        Cancel
      </Button>
      <Button
        colorScheme="green"
        onClick={handleConfirmUpgrade}
        isDisabled={!canUpgrade}
        isLoading={upgrading}
        loadingText="Upgrading..."
      >
        Confirm Upgrade
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

---

## 📊 Success Metrics

### **Game Balance Targets**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Average Time to L2** | 1-2 weeks real time | Player analytics |
| **Average Time to L3** | 1-2 months real time | Player analytics |
| **Average Time to L4** | 3-6 months real time | Player analytics |
| **Average Time to L5** | 6-12 months real time | Player analytics |
| **% Players Reaching L5** | 5-10% | Completion rate |
| **Banking System Usage** | 90%+ players take loans | Financial tracking |
| **Political Engagement** | 50%+ L3+ companies donate | Politics analytics |

### **Technical Quality Targets**

| Metric | Target | Status |
|--------|--------|--------|
| **TypeScript Errors** | 0 | Maintained |
| **API Response Time** | < 200ms p95 | Monitor |
| **Database Query Time** | < 50ms p95 | Optimize |
| **Page Load Time** | < 2s LCP | Monitor |
| **Test Coverage** | > 80% | Improve |

---

## 🎯 Next Steps

### **Immediate Actions:**

1. **Review & Approve This Spec** - User validates design decisions
2. **Update /dev Folder** - Archive old files, create fresh baselines
3. **Create Implementation FIDs** - Break into 10 phases with proper tracking
4. **Begin Phase 1** - Core level system foundation (2.5h)

### **Long-Term Roadmap:**

**Sprint 1 (Weeks 1-2):** Phases 1-3 (Core level system + UI)  
**Sprint 2 (Weeks 3-4):** Phases 4-5 (Operating costs + contract scaling)  
**Sprint 3 (Weeks 5-6):** Phase 6 (Politics integration)  
**Sprint 4 (Weeks 7-10):** Phases 7-8 (Locations + reputation)  
**Sprint 5 (Weeks 11-14):** Phases 9-10 (Advanced features + crisis/bankruptcy)

---

**Total Implementation Time:** ~22 hours across 10 phases  
**Complexity:** Medium-High (4/5 overall)  
**Database Cleanup Required:** Yes (can delete and remake)  
**Backwards Compatibility:** Not required (local development only)

---

*Specification maintained by ECHO v1.0.0*  
*Created: 2025-11-15*  
*Status: COMPREHENSIVE PLANNING COMPLETE - Ready for approval and implementation*
