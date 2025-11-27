# 🔗 AI/Tech Sector Dependency Map & Build Order
**Created:** 2025-11-23  
**Status:** Complete Dependency Analysis  
**Purpose:** Map ALL dependencies between models to determine correct implementation order

---

## 🎯 **YOUR QUESTION ANSWERED**

> **"In order to build infrastructure yourself, do you need to own real estate or how does that interconnect and work?"**

**YES - Real Estate is REQUIRED before Data Center construction!**

### **Hard Dependency Chain:**

```
Company (exists)
    ↓
RealEstate (MUST acquire property first)
    ↓
DataCenter (REQUIRES realEstate reference)
    ↓
ComputeListing (REQUIRES datacenter reference)
    ↓
ComputeContract (REQUIRES listing reference)
```

**Critical Code Evidence from DataCenter.ts:**
```typescript
realEstate: {
  type: Schema.Types.ObjectId,
  ref: 'RealEstate',
  required: [true, 'Real estate reference is required'],  // ← BLOCKING
  index: true,
},
```

**This is NOT optional - you CANNOT create a data center without owning/leasing real estate first.**

---

## 📊 **COMPLETE DEPENDENCY GRAPH**

### **Level 0: Foundational Models (No Dependencies)**
These can be created independently:

1. **Company** - Base entity (already exists in project)
2. **Employee** - Base entity (already exists in project)
3. **Transaction** - Audit trail (already exists in project)

### **Level 1: Property Acquisition (Depends on Company)**

**RealEstate Model:**
- **Hard Dependencies:** 
  - `company: Types.ObjectId` (REQUIRED)
- **Soft Dependencies:** None
- **Creates:** Property ownership/lease for future data centers

**Acquisition Flow:**
```typescript
// Step 1: Company must exist
const company = await Company.findById(companyId);

// Step 2: Acquire real estate (Purchase/Lease/BuildToSuit)
const property = await RealEstate.create({
  company: company._id,
  name: "Northern Virginia DC Site",
  propertyType: 'Suburban',
  acquisitionType: 'Purchase',
  size: 10,  // acres
  powerCapacityMW: 50,
  powerCostPerKWh: 0.08,
  // ... other fields
});

// Step 3: Apply for permits
await property.applyForPermit('Construction');
await property.applyForPermit('Environmental');

// Step 4: Check zoning compliance
const compliance = property.checkZoningCompliance('datacenter');
if (!compliance.compliant) {
  throw new Error(`Zoning issues: ${compliance.issues.join(', ')}`);
}
```

### **Level 2: Infrastructure Construction (Depends on RealEstate)**

**DataCenter Model:**
- **Hard Dependencies:**
  - `company: Types.ObjectId` (REQUIRED)
  - `realEstate: Types.ObjectId` (REQUIRED - BLOCKING!)
- **Soft Dependencies:** None
- **Creates:** Physical compute infrastructure

**Construction Flow:**
```typescript
// CANNOT create data center without real estate!
const dataCenter = await DataCenter.create({
  company: company._id,
  realEstate: property._id,  // ← MUST reference acquired property
  name: "NoVA Data Center 1",
  tierCertification: 3,  // Tier III (99.982% uptime)
  powerCapacityMW: 25,   // Cannot exceed property.powerCapacityMW (50)
  coolingSystem: 'Liquid',
  rackCount: 500,
  constructionPhase: 'Planning',
  // ... other fields
});

// Construction phases MUST complete in order:
// Planning → Foundation → Shell → Mechanical → IT Equipment → Testing → Operational
```

**CRITICAL VALIDATION:**
- Data center `powerCapacityMW` cannot exceed `RealEstate.powerCapacityMW`
- Property must have approved construction permits
- Zoning must permit data center use
- Property cannot be occupied by another data center (unless multi-tenant)

### **Level 3: Marketplace Listings (Depends on DataCenter)**

**ComputeListing Model:**
- **Hard Dependencies:**
  - `seller: Types.ObjectId` (Company REQUIRED)
  - `datacenter: Types.ObjectId` (DataCenter REQUIRED - BLOCKING!)
- **Soft Dependencies:** None
- **Creates:** Marketplace offering for GPU rental

**Listing Flow:**
```typescript
// CANNOT list compute without operational data center!
const listing = await ComputeListing.create({
  seller: company._id,
  datacenter: dataCenter._id,  // ← MUST reference operational DC
  gpuSpec: {
    type: 'H100',
    count: 100,  // Cannot exceed dataCenter.gpuCount
    memoryPerGPU: 80,
    computePower: 2000,
    interconnect: 'NVLink',
  },
  pricingModel: 'OnDemand',
  pricePerGPUHour: 3.50,
  slaTerms: {
    tier: 'Gold',
    uptimeGuarantee: 99.9,
    // ... auto-populated from tier
  },
  // ... other fields
});
```

**CRITICAL VALIDATION:**
- Data center must be in `Operational` phase (not Planning/Construction)
- `gpuSpec.count` cannot exceed `DataCenter.gpuCount`
- Location derived from `DataCenter.location`
- Seller reputation based on historical `actualUptime` from data center

### **Level 4: Contracts & Transactions (Depends on Listings)**

**ComputeContract Model:**
- **Hard Dependencies:**
  - `buyer: Types.ObjectId` (Company REQUIRED)
  - `seller: Types.ObjectId` (Company REQUIRED)
  - `listing: Types.ObjectId` (ComputeListing REQUIRED)
- **Soft Dependencies:** Transaction (for payments)
- **Creates:** Binding GPU rental agreement

**Contract Flow:**
```typescript
// Buyer purchases compute from seller's listing
const contract = await ComputeContract.create({
  buyer: buyerCompany._id,
  seller: listing.seller,
  listing: listing._id,
  gpuHours: 1000,  // 100 GPUs × 10 hours
  pricePerGPUHour: listing.pricePerGPUHour,
  totalCost: 1000 * 3.50,  // $3,500
  status: 'Active',
  // ... SLA terms copied from listing
});

// Create payment transaction
await Transaction.create({
  company: buyerCompany._id,
  type: 'expense',
  amount: -3500,
  description: `Compute purchase: ${contract._id}`,
});

await Transaction.create({
  company: listing.seller,
  type: 'revenue',
  amount: 3500,
  description: `Compute sale: ${contract._id}`,
});
```

---

## 🏗️ **PARALLEL SYSTEMS (Independent of Infrastructure)**

These systems have their own dependency chains:

### **AI Model Training System**
```
Company
    ↓
Employee (ML Engineers, optional)
    ↓
AIModel (can train without owned infrastructure - can rent compute!)
    ↓
ModelListing (sell trained models)
```

**Key Insight:** You can train AI models WITHOUT owning data centers by:
1. Renting compute from marketplace (ComputeContract as buyer)
2. Using cloud providers (simulated)
3. Using hybrid approach (own + rent)

### **Research Lab System**
```
Company
    ↓
Employee (Research Scientists, required)
    ↓
ResearchProject
    ↓
AGIMilestone progression
```

### **Talent System**
```
Company
    ↓
Employee (hire ML Engineers, Research Scientists, etc.)
    ↓
ResearchProject assignment
    ↓
AIModel training
```

---

## 🎮 **GAMEPLAY IMPLICATIONS**

### **Strategic Choices:**

**1. Vertical Integration Path (Own Everything):**
```
Step 1: Raise capital ($50M+)
Step 2: Buy real estate ($5M-$20M)
Step 3: Build Tier 3 data center ($25M-$75M)
Step 4: Install GPUs ($10M-$50M)
Step 5: List excess compute on marketplace
Step 6: Train models on owned infrastructure
Result: Full control, high CAPEX, long payback
```

**2. Asset-Light Path (Rent Everything):**
```
Step 1: Raise seed capital ($2M-$5M)
Step 2: Hire ML engineers ($500k/year)
Step 3: Rent compute from marketplace ($100k-$500k/training run)
Step 4: Train models quickly
Step 5: Sell models on marketplace
Result: Fast time-to-market, low CAPEX, high OPEX
```

**3. Hybrid Path (Rent-to-Own):**
```
Step 1: Start with rented compute
Step 2: Generate revenue from model sales
Step 3: Buy real estate with profits
Step 4: Build small data center
Step 5: Gradually reduce rental dependency
Result: Balanced risk, scaling with revenue
```

### **Economic Trade-offs:**

| Aspect | Own Infrastructure | Rent Infrastructure |
|--------|-------------------|---------------------|
| **CAPEX** | $50M-$150M | $0 |
| **OPEX** | $2M-$10M/year (power, maintenance) | $5M-$25M/year (rental) |
| **Time to Launch** | 18-36 months (construction) | Immediate |
| **Flexibility** | Locked in (sunk cost) | Flexible (cancel anytime) |
| **Unit Economics** | $1-2/GPU/hr (owned cost) | $3-5/GPU/hr (market price) |
| **Breakeven** | 24-48 months | N/A |
| **Upside** | Sell excess capacity | None |
| **Downside** | Stranded assets if demand drops | Only pay for what you use |

---

## 🔄 **CROSS-SYSTEM DEPENDENCIES**

### **Real Estate ↔ Data Center:**
```typescript
// Bi-directional reference
RealEstate.dataCenters = [DataCenter._id, ...];  // One property, multiple DCs
DataCenter.realEstate = RealEstate._id;           // Each DC has one property

// Validation rules:
// - Cannot exceed property.powerCapacityMW across all DCs on same property
// - Property must have approved permits
// - Zoning must allow data center use
```

### **Data Center ↔ Compute Listing:**
```typescript
// One-to-many relationship
DataCenter → ComputeListing[]  // One DC can have multiple listings

// Validation rules:
// - Total listed GPU hours cannot exceed DC capacity
// - DC must be Operational (not under construction)
// - Listing.location = DataCenter.location.region
```

### **Compute Listing ↔ Compute Contract:**
```typescript
// One-to-many relationship
ComputeListing → ComputeContract[]  // One listing, multiple contracts

// Validation rules:
// - Sum(contract.gpuHours) cannot exceed listing.totalGPUHours
// - Listing must be Active status
// - SLA terms copied from listing to contract
```

### **Company ↔ Transaction:**
```typescript
// One-to-many relationship
Company → Transaction[]  // All financial operations logged

// Created by:
// - Real estate purchase/lease payments
// - Data center construction costs
// - Employee salaries
// - Compute marketplace sales/purchases
// - Model marketplace sales/purchases
```

---

## 📋 **IMPLEMENTATION ORDER (Phased Approach)**

### **Phase 1: Foundation Models (Week 1-2)**
**Goal:** Core entities with zero external dependencies

1. ✅ Company (already exists)
2. ✅ Employee (already exists)
3. ✅ Transaction (already exists)
4. **AIModel** (can exist standalone, rent compute)
5. **ResearchProject** (requires Company + Employee)

**Why First:** These enable asset-light gameplay (rent infrastructure, train models, sell models).

### **Phase 2: Property & Construction (Week 3-4)**
**Goal:** Enable vertical integration path

6. **RealEstate** (requires Company)
7. **DataCenter** (requires RealEstate)

**Why Second:** Unlocks infrastructure ownership path. Players can now build DCs.

### **Phase 3: Marketplace (Week 5-6)**
**Goal:** Enable compute trading between players

8. **ComputeListing** (requires DataCenter)
9. **ComputeContract** (requires ComputeListing)
10. **ModelListing** (requires AIModel)

**Why Third:** Creates dynamic player-to-player economy.

### **Phase 4: Advanced Systems (Week 7-8)**
**Goal:** Deep simulation features

11. **AGIMilestone** (requires ResearchProject)
12. **GlobalImpactEvent** (requires AGI milestones)
13. **Industry Dominance** tracking

**Why Last:** Polish features that enhance endgame.

---

## 🚨 **CRITICAL BLOCKING DEPENDENCIES**

### **CANNOT Create Without:**

| Model | MUST Have First | Reason |
|-------|-----------------|--------|
| DataCenter | RealEstate | Physical location required, power capacity sourced from property |
| ComputeListing | DataCenter | GPUs must be housed somewhere, location derived from DC |
| ComputeContract | ComputeListing | Cannot rent compute without active listing |
| ModelListing | AIModel | Cannot sell model that doesn't exist |

### **CAN Create Without (Soft Dependencies):**

| Model | Optional But Useful | Benefit |
|-------|---------------------|---------|
| AIModel | DataCenter (can rent) | Trains faster/cheaper on owned infrastructure |
| ResearchProject | DataCenter | Can use rented compute for experiments |
| Employee | DataCenter | Can hire before building infrastructure |

---

## 💡 **DESIGN DECISIONS TO MAKE**

### **Question 1: Enforce Real Estate Requirement?**

**Option A: Strict Enforcement (Recommended)**
- Cannot create DataCenter without RealEstate reference
- Forces players through acquisition decision (Purchase/Lease/BuildToSuit)
- Realistic simulation of infrastructure economics
- PRO: Realistic, strategic depth
- CON: Higher complexity barrier

**Option B: Relaxed (Allow Abstraction)**
- Can create DataCenter directly, property auto-created
- Simplifies early game
- PRO: Faster to market
- CON: Loses property economics gameplay

**RECOMMENDATION:** **Option A (Strict)** - The property acquisition choice is strategically interesting and the real estate economics are already fully implemented in legacy.

### **Question 2: Multi-Tenancy Support?**

**Can one RealEstate property host multiple DataCenters?**

**Evidence from Code:**
```typescript
// RealEstate.ts
dataCenters: [
  {
    type: Schema.Types.ObjectId,
    ref: 'DataCenter',
  },
],  // ← Array suggests multi-tenant support!
```

**ANSWER:** **YES - One property can have multiple data centers**

**Gameplay Implications:**
- Buy large property (100 acres)
- Build DC1 (Tier 3, 25 MW) - $50M
- Build DC2 (Tier 4, 25 MW) - $75M
- Total power: 50 MW (within property.powerCapacityMW limit)
- Phase construction over time as demand grows

### **Question 3: Can You Operate Without Real Estate?**

**ANSWER:** **YES - If you only rent compute, never sell**

**Asset-Light Strategy:**
```typescript
// Never create RealEstate or DataCenter
// Only create as BUYER:
const contract = await ComputeContract.create({
  buyer: myCompany._id,
  seller: otherCompany._id,  // Rent from other players
  listing: theirListing._id,
  // ... train models using rented GPUs
});

const model = await AIModel.create({
  company: myCompany._id,
  computeSource: 'Rented',  // Track where compute came from
  // ... train using rented capacity
});

const modelListing = await ModelListing.create({
  seller: myCompany._id,
  baseModel: model._id,
  // ... sell trained model for profit
});
```

**This is a VALID strategy:** Rent compute → Train models → Sell models → Never own infrastructure.

---

## 🎯 **FINAL ANSWER TO YOUR QUESTION**

> **"Do you need to own real estate to build infrastructure?"**

**YES - 100% REQUIRED**

**Code Proof:**
```typescript
// DataCenter.ts line 164-169
realEstate: {
  type: Schema.Types.ObjectId,
  ref: 'RealEstate',
  required: [true, 'Real estate reference is required'],  // ← BLOCKING!
  index: true,
},
```

**Workflow:**
1. **Company exists** (already have)
2. **Acquire RealEstate** (Purchase $5M-$20M OR Lease $50k-$200k/month OR BuildToSuit partnership)
3. **Apply for permits** (Construction, Environmental - 45-90 days)
4. **Check zoning** (Industrial/DataCenter zones required)
5. **Build DataCenter** (24-36 months, $25M-$150M depending on tier)
6. **Install GPUs** (varies by vendor)
7. **List excess compute** (optional - monetize idle capacity)

**BUT:** You can play the game WITHOUT owning real estate by renting compute from other players' data centers!

**Two Paths:**
- **Path A (Vertical Integration):** Company → RealEstate → DataCenter → Own GPUs → Low unit costs, high CAPEX
- **Path B (Asset-Light):** Company → Rent Compute → Train Models → Sell Models → High unit costs, zero CAPEX

Both are valid strategies with different risk/reward profiles!

---

*Generated by ECHO v1.3.0 with GUARDIAN PROTOCOL - Complete Dependency Analysis*
*Cross-referenced with actual model schemas from legacy implementation*
