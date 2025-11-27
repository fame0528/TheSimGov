# 🛠️ Utility Libraries Integration & Company Features Expansion

**Created:** 2025-11-13  
**Status:** PLANNED  
**Priority:** MEDIUM  
**Complexity:** 2  

---

## 📦 Installed Utility Libraries

### Successfully Installed (November 13, 2025):
```bash
npm install tippy.js @tippyjs/react chance faker @faker-js/faker mathjs uuid currency.js
```

**Packages Added:**
1. ✅ **tippy.js** + **@tippyjs/react** - Beautiful tooltips for stat explanations
2. ✅ **chance** - Random data generation (legacy, for compatibility)
3. ✅ **@faker-js/faker** - Modern fake data generation (NPCs, companies, events)
4. ✅ **mathjs** - Advanced math operations (financial calculations, statistics)
5. ✅ **uuid** - Unique ID generation (transactions, sessions, entities)
6. ✅ **currency.js** - Precise currency calculations (avoid floating point errors)

**Total:** 14 packages added (including dependencies)

---

## 🎯 Utility Integration Plan

### Phase 1: Core Utilities Setup (8-12h)

**FID-20251113-UTIL-001: Utility Helper Functions**
**Estimated:** 8-12 hours

**Description:** Create centralized utility helpers using installed libraries for consistent usage across the codebase.

**Acceptance Criteria:**
- ✅ Currency helper with currency.js (formatting, calculations, conversions)
- ✅ Random data generator with Faker.js (NPCs, companies, events)
- ✅ Math utilities with mathjs (percentages, statistics, complex calculations)
- ✅ UUID helper for entity generation
- ✅ Tooltip wrapper component with Tippy.js
- ✅ All utilities have comprehensive JSDoc and examples
- ✅ TypeScript strict mode passing

**Files to Create:**
```
src/lib/utils/
├── currency.ts          # Currency formatting, calculations, conversions
├── random.ts            # Faker.js wrappers for consistent data generation
├── math.ts              # Complex math operations, statistics
├── id.ts                # UUID generation helpers
└── tooltips.ts          # Tippy.js configuration and helpers

components/common/
├── Tooltip.tsx          # Reusable tooltip component
└── CurrencyDisplay.tsx  # Formatted currency display component
```

**Implementation Details:**

#### `src/lib/utils/currency.ts`
```typescript
import currency from 'currency.js';

/**
 * Currency configuration for USD
 */
const USD = (value: number | string) => currency(value, {
  symbol: '$',
  precision: 2,
  separator: ',',
  decimal: '.',
});

/**
 * Format number as currency
 * @example formatCurrency(1234.56) // "$1,234.56"
 */
export const formatCurrency = (value: number): string => {
  return USD(value).format();
};

/**
 * Format currency with abbreviations (K, M, B)
 * @example formatCurrencyShort(1500000) // "$1.5M"
 */
export const formatCurrencyShort = (value: number): string => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return USD(value).format();
};

/**
 * Add two currency values safely
 */
export const addCurrency = (a: number, b: number): number => {
  return USD(a).add(b).value;
};

/**
 * Calculate percentage of value
 */
export const percentOf = (value: number, percent: number): number => {
  return USD(value).multiply(percent / 100).value;
};
```

#### `src/lib/utils/random.ts`
```typescript
import { faker } from '@faker-js/faker';

/**
 * Generate random NPC employee
 */
export const generateNPC = (role: 'MLEngineer' | 'ResearchScientist' | 'DataEngineer') => {
  const skill = faker.number.int({ min: 1, max: 10 });
  const experience = faker.number.int({ min: 0, max: 20 });
  
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    role,
    skill,
    experience,
    salary: calculateSalary(role, skill, experience),
    loyalty: faker.number.int({ min: 5, max: 10 }),
  };
};

/**
 * Generate random company name
 */
export const generateCompanyName = (industry: string): string => {
  const prefix = faker.company.name();
  const suffixes = {
    Technology: ['AI', 'Labs', 'Systems', 'Tech', 'Solutions'],
    Manufacturing: ['Industries', 'Manufacturing', 'Products', 'Corp'],
    Healthcare: ['Health', 'Medical', 'Care', 'Pharma'],
  };
  
  const suffix = faker.helpers.arrayElement(suffixes[industry] || ['Inc', 'LLC', 'Corp']);
  return `${prefix} ${suffix}`;
};

/**
 * Generate random event description
 */
export const generateEvent = (type: 'positive' | 'negative' | 'neutral') => {
  // Event generation logic
};
```

#### `components/common/Tooltip.tsx`
```typescript
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, placement = 'top' }) => {
  return (
    <Tippy content={content} placement={placement} theme="dark">
      {children}
    </Tippy>
  );
};
```

**Dependencies:** None
**Estimated Time:** 8-12 hours

---

## 🏭 New Industry Implementations

### Phase 2: Manufacturing Industry (40-60h)

**FID-20251113-IND-002: Manufacturing Industry Mechanics**
**Estimated:** 40-60 hours

**Description:** Implement manufacturing-specific gameplay: factory management, production lines, inventory, quality control, supply chain logistics (inspired by Walmart, Toyota, Foxconn models).

**Key Features:**
- **Factory Management:**
  - Purchase/lease factory space
  - Upgrade production lines (automation, efficiency)
  - Manage worker shifts (1st/2nd/3rd shift)
  - Equipment maintenance schedules
  
- **Production System:**
  - Select products to manufacture (configurable SKUs)
  - Raw materials procurement (suppliers, bulk discounts)
  - Production planning (batch sizes, lead times)
  - Quality control (defect rates, recalls)
  
- **Inventory Management:**
  - Raw materials inventory
  - Work-in-progress (WIP) tracking
  - Finished goods warehouse
  - Just-in-Time (JIT) manufacturing option
  
- **Supply Chain:**
  - Supplier relationships (reliability, pricing)
  - Distribution network (warehouses, logistics)
  - Fulfillment speed vs cost tradeoffs
  
- **Revenue Streams:**
  - B2B sales (bulk orders to retailers)
  - B2C direct sales
  - Private label manufacturing
  - Contract manufacturing

**Startup Costs:** $17,500 total
- Startup: $7,000 (factory lease, utilities, insurance)
- Equipment: $9,000 (machinery, assembly lines, tools, safety equipment)
- Licensing: $1,500 (manufacturing permits, environmental compliance, safety certs)
- **Remaining from $10k seed:** -$7,500 (REQUIRES LOAN/INVESTMENT)

**Dependencies:** Employee System, Contract System
**Estimated Time:** 40-60 hours

---

### Phase 3: E-Commerce Platform (50-70h)

**FID-20251113-IND-003: E-Commerce Industry Mechanics (Amazon Model)**
**Estimated:** 50-70 hours

**Description:** Implement multi-faceted e-commerce platform with marketplace, logistics, AWS-style cloud services, streaming (Amazon Prime), and advertising - mirroring Amazon's diversified revenue model.

**Key Features:**
- **Marketplace Platform:**
  - Third-party seller onboarding (take commission %)
  - Product catalog management (millions of SKUs)
  - Search and recommendation algorithms
  - Customer reviews and ratings
  
- **Logistics & Fulfillment:**
  - Fulfillment centers (FBA model)
  - Same-day/next-day delivery options
  - Shipping cost optimization
  - Returns processing
  
- **Cloud Services (AWS-style):**
  - Rent compute capacity to other players
  - Storage-as-a-service
  - Database hosting
  - Monthly recurring revenue
  
- **Subscription Service (Prime-style):**
  - Monthly membership ($X/month)
  - Free shipping benefits
  - Exclusive deals and early access
  - Content streaming (if also Media company)
  
- **Advertising Platform:**
  - Sponsored product placements
  - Display ads on platform
  - Seller advertising tools
  - Revenue from ad spend
  
- **Private Label Products:**
  - Launch own-brand products
  - Compete with third-party sellers
  - Higher margins but reputation risk

**Revenue Streams:**
- Marketplace commissions (10-15% per sale)
- Fulfillment fees (FBA charges)
- Cloud services (recurring)
- Subscription fees (Prime memberships)
- Advertising revenue
- Private label sales

**Startup Costs:** $10,500 total
- Startup: $5,500 (platform dev, cloud hosting, initial marketing)
- Equipment: $4,000 (warehouse automation, fulfillment tech, inventory systems)
- Licensing: $1,000 (e-commerce licenses, payment processing, data privacy compliance)
- **Remaining from $10k seed:** -$500 (BARELY REQUIRES LOAN)

**Strategic Implications:**
- **Conglomerate Model:** Can expand into multiple sectors simultaneously
- **Network Effects:** More sellers = more products = more customers = more sellers
- **Data Advantage:** Customer data powers recommendations and advertising
- **Moat:** Logistics network creates competitive advantage

**Dependencies:** Inventory System, Payment Processing, Subscription Management
**Estimated Time:** 50-70 hours

---

### Phase 4: Healthcare Industry (60-80h)

**FID-20251113-IND-004: Healthcare Industry Mechanics**
**Estimated:** 60-80 hours

**Description:** Implement healthcare company with medical services, pharmaceuticals, insurance, health tech, and regulatory compliance (inspired by UnitedHealth, CVS, Cigna).

**Key Features:**
- **Medical Services:**
  - Operate clinics/hospitals
  - Hire doctors, nurses, specialists
  - Patient appointments and scheduling
  - Treatment quality and outcomes
  
- **Pharmaceuticals:**
  - Drug development pipeline
  - FDA approval process (long timelines)
  - Manufacturing and distribution
  - Patent protection (20-year monopoly)
  
- **Health Insurance:**
  - Sell insurance plans (premiums)
  - Claims processing and payments
  - Risk pool management
  - Provider networks
  
- **Health Technology:**
  - Electronic health records (EHR)
  - Telemedicine platforms
  - Health tracking apps
  - AI diagnostics
  
- **Regulatory Compliance:**
  - HIPAA privacy requirements
  - FDA approvals (drugs, devices)
  - Malpractice insurance
  - Quality certifications

**Revenue Streams:**
- Patient service fees
- Insurance premiums
- Pharmaceutical sales
- SaaS health tech subscriptions
- Government contracts (Medicare/Medicaid)

**Startup Costs:** $20,000 total (HIGHEST)
- Startup: $8,000 (medical facility, insurance, compliance systems)
- Equipment: $7,000 (medical equipment, diagnostic tools, health IT)
- Licensing: $5,000 (medical licenses, accreditation, malpractice insurance, HIPAA)
- **Remaining from $10k seed:** -$10,000 (REQUIRES MAJOR FUNDING)

**Strategic Implications:**
- **Regulated Industry:** High barriers to entry = less competition
- **Recession-Proof:** Healthcare demand is consistent
- **Long Development:** Drug pipelines take 10+ years
- **Political Exposure:** Heavily influenced by healthcare policy

**Dependencies:** Employee System (doctors/nurses), Research System (pharma), Insurance System
**Estimated Time:** 60-80 hours

---

### Phase 5: Energy Industry (70-90h)

**FID-20251113-IND-005: Energy Industry Mechanics**
**Estimated:** 70-90 hours

**Description:** Implement energy company covering oil & gas, renewable energy, utilities, power generation, and energy trading (inspired by ExxonMobil, Saudi Aramco, Shell).

**Key Features:**
- **Oil & Gas:**
  - Exploration (wildcatting, surveys)
  - Drilling and extraction
  - Refining operations
  - Commodity price volatility
  
- **Renewable Energy:**
  - Solar farm installations
  - Wind turbine projects
  - Hydroelectric dams
  - Battery storage
  
- **Utilities:**
  - Power generation (coal, gas, nuclear, renewable)
  - Grid infrastructure
  - Residential/commercial customers
  - Regulated pricing
  
- **Energy Trading:**
  - Commodity futures (oil, gas, electricity)
  - Arbitrage opportunities
  - Weather-based speculation
  - Carbon credit trading
  
- **Environmental:**
  - Carbon emissions tracking
  - Environmental compliance
  - Green energy subsidies
  - Climate policy impacts

**Revenue Streams:**
- Oil/gas sales (volatile prices)
- Electricity sales (regulated utility rates)
- Renewable energy credits
- Energy trading profits
- Government subsidies (green energy)

**Startup Costs:** $28,000 total (HIGHEST)
- Startup: $10,000 (infrastructure, land leases, initial exploration/setup)
- Equipment: $12,000 (drilling equipment, solar panels, turbines, extraction tools)
- Licensing: $6,000 (environmental permits, energy licenses, safety certifications)
- **Remaining from $10k seed:** -$18,000 (REQUIRES MAJOR FUNDING)

**Strategic Implications:**
- **Capital Intensive:** Requires massive upfront investment
- **Long-Term Projects:** Oil fields produce for decades
- **Political Sensitivity:** Subsidies, regulations, geopolitics
- **Commodity Risk:** Price volatility can destroy profitability

**Dependencies:** Infrastructure System, Commodity Trading, Environmental Compliance
**Estimated Time:** 70-90 hours

---

### Phase 6: Media & Entertainment (40-60h)

**FID-20251113-IND-006: Media Industry Mechanics**
**Estimated:** 40-60 hours

**Description:** Implement media company with content creation, streaming platforms, social media, advertising, and entertainment (inspired by Meta, Netflix, Disney).

**Key Features:**
- **Content Production:**
  - Film/TV series production
  - Music creation and distribution
  - Gaming development
  - Podcast networks
  
- **Streaming Platform:**
  - Subscription-based streaming (Netflix model)
  - Ad-supported free tier (Hulu/YouTube model)
  - Content library management
  - Recommendation algorithms
  
- **Social Media:**
  - User-generated content platform
  - Viral algorithm and engagement
  - Influencer partnerships
  - Moderation and safety
  
- **Advertising:**
  - Ad inventory management
  - Targeting and personalization
  - CPM/CPC pricing models
  - Brand partnerships
  
- **IP & Franchises:**
  - Own intellectual property
  - Licensing deals
  - Merchandising revenue
  - Spin-offs and sequels

**Revenue Streams:**
- Subscription fees (streaming)
- Advertising revenue
- Content licensing
- Merchandise sales
- Sponsorships and partnerships

**Startup Costs:** $11,500 total
- Startup: $4,000 (studio setup, content licensing, platform dev)
- Equipment: $5,000 (production equipment, servers, streaming infrastructure)
- Licensing: $2,500 (content rights, broadcast licenses, copyright fees)
- **Remaining from $10k seed:** -$1,500 (REQUIRES SMALL LOAN)

**Strategic Implications:**
- **Hit-Driven:** Success depends on viral content
- **Network Effects:** More users = more creators = more users
- **Attention Economy:** Competing for user time
- **Regulation Risk:** Content moderation, data privacy

**Dependencies:** Content Management System, User System, Recommendation Algorithm
**Estimated Time:** 40-60 hours

---

## 🎮 Complete Company Features Roadmap

### Integrated Plan: Utilities + Employee + Contract + Department + Industry-Specific

**Master Implementation Plan (270-390 hours total):**

#### **Foundation Utilities (8-12h)**
1. ✅ Install utility libraries (DONE)
2. Create currency helpers
3. Create Faker.js wrappers
4. Create math utilities
5. Create tooltip components
6. Create UUID helpers

#### **Core Company Systems (130-170h)**
7. **Employee System** (40-60h)
   - NPC generation using Faker.js
   - Salary calculations using currency.js
   - Stat tooltips using Tippy.js
   - Employee marketplace
   
8. **Contract System** (40-60h)
   - Contract generation using Faker.js
   - Payment calculations using currency.js
   - Bid mathematics using mathjs
   - Contract IDs using uuid
   
9. **Department System** (50-70h)
   - Finance department (P&L with currency.js)
   - HR department (employee management)
   - Marketing department (ROI with mathjs)
   - R&D department (research for Tech/Healthcare/Energy)

#### **Industry-Specific Mechanics (260-350h)**
10. **Technology/AI** (60-80h) - Already designed
11. **Manufacturing** (40-60h) - Factory management, production
12. **E-Commerce** (50-70h) - Marketplace, fulfillment, AWS-style cloud
13. **Healthcare** (60-80h) - Medical services, pharma, insurance
14. **Energy** (70-90h) - Oil/gas, renewables, utilities, trading
15. **Media** (40-60h) - Content, streaming, social, advertising

**Grand Total:** 398-532 hours across all systems

---

## 📊 Industry Comparison Matrix

| Industry | Startup Cost | Difficulty | Time to Profit | Risk | Reward | Political Exposure | Recommended For |
|----------|--------------|------------|----------------|------|--------|-------------------|-----------------|
| **Construction** | $9k | Low | Fast (months) | Medium | Steady | Medium | Beginners |
| **Real Estate** | $6k | Medium | Medium (1-2 years) | Medium | Scalable | Medium | Patient players |
| **Crypto** | $9k | High | Variable (weeks to never) | High | High | High | Risk-takers |
| **Stocks** | $7k | Medium | Fast (days) | Medium | Scalable | Low | Active traders |
| **Retail** | $8.5k | Low | Medium (6-12 months) | Medium | Scalable | Low | Steady growth |
| **Banking** | $9k | Medium | Slow (years) | Low | Steady | High | Conservative |
| **Technology/AI** | $16k | Very High | Slow (2-5 years) | High | High | Very High | Tech enthusiasts |
| **Manufacturing** | $17.5k | High | Slow (1-3 years) | Medium | Scalable | Medium | Strategic planners |
| **E-Commerce** | $10.5k | High | Medium (6-18 months) | High | High | Medium | Growth hackers |
| **Healthcare** | $20k | Very High | Slow (3-10 years) | Low | Steady | Very High | Long-term players |
| **Energy** | $28k | Extreme | Very Slow (5-20 years) | Medium | High | Extreme | Tycoons |
| **Media** | $11.5k | High | Variable (viral or bust) | High | Scalable | High | Creatives |

---

## 🎯 Recommended Implementation Order

**Based on complexity, dependencies, and player engagement:**

1. **Phase 1:** Utilities Setup (8-12h) - Foundation for all systems
2. **Phase 2:** Employee System (40-60h) - Required by all industries
3. **Phase 3:** Contract System (40-60h) - Revenue generation for all
4. **Phase 4:** Department System (50-70h) - Company depth
5. **Phase 5:** Manufacturing (40-60h) - Most accessible advanced industry
6. **Phase 6:** E-Commerce (50-70h) - Diversified gameplay (Amazon model)
7. **Phase 7:** Media (40-60h) - Viral/social gameplay
8. **Phase 8:** Technology/AI (60-80h) - Most complex but highest engagement
9. **Phase 9:** Healthcare (60-80h) - Long-term strategic gameplay
10. **Phase 10:** Energy (70-90h) - Endgame tycoon content

---

*This plan integrates all utility libraries, company systems, and new industries into a comprehensive development roadmap.*

**Created by ECHO v1.0.0 for Business & Politics MMO**  
**Last Updated:** 2025-11-13
