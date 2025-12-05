# FID-20251204-CRIME-MMO: Dope Wars MMO - Complete Drug Empire System

**Status:** IN_PROGRESS  
**Priority:** P0 (Critical - Core Gameplay)  
**Complexity:** 5 (Epic)  
**Estimated:** 80-120h (Multi-phase)  
**Created:** 2025-12-04  
**Started:** 2025-12-04  
**Completed:** —

---

## Summary

Transform the Crime system into a fully-featured **Dope Wars MMO** where players can trade drugs (buy low, sell high across 50 states), build empires (facilities, production, territory), interact with players (P2P marketplace, cartels, turf wars), and progress from street dealer to cartel kingpin. The system integrates with Real Estate, Politics, and Banking systems.

---

## Acceptance Criteria

- [ ] **Street Trading:** Players can buy/sell 8+ drug types across 50 states with dynamic pricing
- [ ] **Travel System:** State-to-state travel with time costs and random encounters
- [ ] **Production Tiers:** 6 facility levels from Closet Grow to Cartel HQ
- [ ] **Plant Lifecycle:** Seed → Vegetative → Flowering → Harvest with quality mechanics
- [ ] **P2P Marketplace:** Player-to-player trading with escrow and reputation system
- [ ] **Heat System:** Wanted levels (0-5 stars) with escalating consequences
- [ ] **Random Encounters:** Police, dealers, opportunities during travel
- [ ] **Cartel System:** Player guilds with territory control and turf wars
- [ ] **Progression:** Level 1-100 with unlocks, upgrades, achievements
- [ ] **Cross-System Integration:** Real Estate for facilities, Politics for laws, Banking for laundering

---

## Implementation Approach

**6-Phase Rollout:**
1. **Phase 11.1 (16-24h):** Street Trading Core - Buy/sell, travel, basic UI
2. **Phase 11.2 (16-24h):** Production Foundation - Facilities, planting, harvesting
3. **Phase 11.3 (12-16h):** P2P Marketplace - Listings, escrow, reputation
4. **Phase 11.4 (8-12h):** Heat & Encounters - Wanted system, random events
5. **Phase 11.5 (16-24h):** Cartels - Guilds, territory, turf wars
6. **Phase 11.6 (12-16h):** Polish & Integration - Achievements, tutorials, balancing

---

## Files

| Action | Path | Description |
|--------|------|-------------|
| NEW | `src/lib/types/crime-mmo.ts` | All MMO interfaces (Stash, Pricing, Production) |
| NEW | `src/lib/db/models/crime/` | Mongoose models (PlayerStash, DrugListing, Cartel) |
| NEW | `src/app/api/crime/trading/` | Street trading API routes |
| NEW | `src/app/api/crime/production/` | Production/harvesting API routes |
| NEW | `src/app/api/crime/marketplace/` | P2P marketplace API routes |
| NEW | `src/app/api/crime/cartels/` | Cartel management API routes |
| NEW | `src/components/crime/trading/` | Street trading UI components |
| NEW | `src/components/crime/production/` | Production facility UI components |
| NEW | `src/components/crime/marketplace/` | P2P marketplace UI components |
| MOD | `src/components/crime/CrimeDashboard.tsx` | Integrate new tabs/sections |
| NEW | `src/hooks/useCrimeTrading.ts` | Trading state management |
| NEW | `src/hooks/useCrimeProduction.ts` | Production state management |

---

## Dependencies

- Real Estate system (for facility locations)
- Banking system (for money laundering integration)
- Politics system (for drug legalization mechanics)
- None blocking - can start immediately

---

## 🎯 Vision Statement

Transform the Crime system into a **fully-featured Dope Wars MMO** where players can:
1. **Trade drugs** (buy low, sell high across states) - Immediate satisfaction
2. **Build empires** (facilities, production, territory) - Long-term progression
3. **Interact with players** (P2P marketplace, cartels, turf wars) - Social/MMO
4. **Progress through tiers** (shack → Breaking Bad operation) - RPG elements

The system should be **addictive, rewarding, and deeply interconnected** with other game systems (Real Estate, Politics, Banking, etc.).

---

## 🎮 Core Gameplay Loops

### Loop 1: Street Hustler (Minutes)
```
See Prices → Buy Drugs → Travel → Sell Higher → Profit → Repeat
```
- **Engagement:** Quick dopamine hits, price arbitrage
- **Time:** 2-5 minutes per cycle
- **Skill:** Market reading, risk assessment

### Loop 2: Producer (Hours)
```
Buy Seeds → Plant → Care → Harvest → Process → Sell → Upgrade → Repeat
```
- **Engagement:** Open loops (plants growing), return to harvest
- **Time:** Hours/days per cycle (with timers)
- **Skill:** Resource management, quality optimization

### Loop 3: Empire Builder (Days/Weeks)
```
Acquire Property → Build Facility → Hire Workers → Scale Production → Control Territory → Dominate Market
```
- **Engagement:** Long-term goals, status, leaderboards
- **Time:** Days to weeks
- **Skill:** Strategic planning, economics

### Loop 4: Cartel Boss (Ongoing)
```
Recruit Players → Form Cartel → Control Regions → Set Prices → Fight Rivals → Political Influence
```
- **Engagement:** Social, competitive, legacy
- **Time:** Ongoing
- **Skill:** Leadership, diplomacy, warfare

---

## 📊 Detailed Systems

### 1. STREET TRADING (Dope Wars Core)

#### Player Stash (Inventory)
```typescript
interface PlayerStash {
  playerId: ObjectId;
  cash: number;                    // Current money
  bankBalance: number;             // Money in bank (safe from mugging)
  currentState: string;            // "CA", "NY", etc.
  currentCity: string;             // "Los Angeles", etc.
  heat: number;                    // 0-100, law enforcement attention
  reputation: number;              // 0-100, affects prices & access
  carryCapacity: number;           // Max units can carry (upgradeable)
  
  inventory: {
    substance: string;             // "Cannabis", "Cocaine", etc.
    strain?: string;               // "OG Kush", "Blue Dream" (for weed)
    quantity: number;
    quality: number;               // 0-100 (affects price)
    avgPurchasePrice: number;      // For P&L tracking
  }[];
  
  // Progression
  level: number;                   // Street level 1-100
  experience: number;
  unlockedSubstances: string[];    // Start with weed, unlock harder drugs
  
  // Stats
  totalProfit: number;
  totalDeals: number;
  successfulDeals: number;
  timesArrested: number;
  timesMugged: number;
}
```

#### Dynamic Pricing Engine
```typescript
interface StatePricing {
  state: string;                   // "CA"
  stateName: string;               // "California"
  
  prices: {
    substance: string;
    basePrice: number;             // Foundation price
    currentPrice: number;          // After modifiers
    trend: 'rising' | 'falling' | 'stable';
    volatility: number;            // 0-100, how much it fluctuates
    demand: number;                // 0-100
    supply: number;                // 0-100 (affected by player production!)
    lastUpdate: Date;
    priceHistory: { price: number; timestamp: Date }[];  // For charts
  }[];
  
  // State modifiers
  legalStatus: {                   // Per substance
    [substance: string]: 'legal' | 'decriminalized' | 'illegal' | 'felony';
  };
  lawEnforcementIntensity: number; // 0-100
  playerProductionVolume: number;  // Affects supply/prices
  
  // Events (temporary modifiers)
  activeEvents: {
    type: string;                  // "drought", "bust", "festival", "legalization_vote"
    substance?: string;
    priceModifier: number;         // 0.5 = half price, 2.0 = double
    expiresAt: Date;
    description: string;
  }[];
}
```

#### Price Fluctuation Mechanics
Prices change based on:
1. **Base regional economics** (CA weed cheap, NY cocaine expensive)
2. **Supply/Demand** (player activity affects this!)
3. **Random events** (busts, droughts, festivals)
4. **Player production** (more facilities = more supply = lower prices)
5. **Time of day** (game time, not real time)
6. **Political events** (legalization votes from Politics system!)

#### Travel System
```typescript
interface TravelRoute {
  fromState: string;
  toState: string;
  distance: number;                // Miles
  baseTravelTime: number;          // Game hours
  baseCost: number;                // Gas, tickets, etc.
  riskLevel: number;               // 0-100, chance of encounter
  
  // Modifiers based on player
  actualTime: number;              // After vehicle/upgrades
  actualCost: number;
  actualRisk: number;              // After heat level applied
  
  // Encounter chances
  encounterTypes: {
    type: 'police_checkpoint' | 'rival_gang' | 'mugging' | 'random_deal';
    chance: number;
  }[];
}
```

#### Random Events (During Travel/Trading)
- **Cops!** - Checkpoint, searches. Options: bribe, run, fight, comply
- **Mugged** - Lose cash/product. Fight back based on weapons
- **Hot Deal** - NPC offers bulk discount
- **Drought** - Substance scarce, prices spike
- **Bust** - Major dealer arrested, supply drops
- **Festival/Concert** - Demand spikes for certain drugs
- **Political** - Legalization vote affects prices

---

### 2. PRODUCTION SYSTEM (Empire Building)

#### Progression Tiers

| Tier | Name | Unlock | Capacity | Quality Cap | Description |
|------|------|--------|----------|-------------|-------------|
| 1 | Closet Grow | Start | 2-4 plants | 40% | Single pot in a closet |
| 2 | Spare Room | Level 5, $5k | 8-12 plants | 55% | Dedicated room with lights |
| 3 | Garage Setup | Level 15, $25k | 20-30 plants | 70% | Hydroponic system |
| 4 | Warehouse | Level 30, $100k | 100+ plants | 85% | Commercial operation |
| 5 | Industrial | Level 50, $500k | 500+ plants | 95% | Full factory |
| 6 | Cartel HQ | Level 75, $2M | 2000+ plants | 100% | Multi-building complex |

#### Growing Process (Cannabis Example)

```
1. ACQUIRE PROPERTY
   └── Buy/rent from Real Estate system
   └── Location affects: risk, cost, capacity
   
2. BUILD FACILITY
   └── Choose type (closet → industrial)
   └── Install equipment (pots, lights, ventilation)
   
3. BUY SUPPLIES (from global marketplace)
   └── Seeds/Clones (different strains = different effects/prices)
   └── Soil/Growing medium
   └── Nutrients/Fertilizer
   └── Equipment upgrades
   
4. PLANT
   └── Each pot = 1 plant slot
   └── Quality affected by: strain, equipment, care
   
5. CARE (Active Engagement - the "open loop")
   └── Water: Check every X hours (timer)
   └── Feed: Apply nutrients on schedule
   └── Prune: Remove dead leaves (mini-game?)
   └── Monitor: Check for pests, disease
   └── Light cycle: Veg (18/6) vs Flower (12/12)
   
   NEGLECT = Lower quality, smaller yield, plant death
   
6. HARVEST (after growth period)
   └── Timing matters: early = less THC, late = more CBD
   └── Yield = base × care_multiplier × equipment_multiplier
   
7. PROCESS
   └── Dry: X days (timer)
   └── Cure: X days (improves quality)
   └── Trim: Labor (hire employees or do manually)
   
8. PACKAGE
   └── Bulk (lower price, faster)
   └── Retail (higher price, more work)
   └── Premium (branded, highest price)
   
9. SELL
   └── Direct (street trading)
   └── Wholesale (to other players)
   └── Marketplace listing
   └── Distribution routes (passive income)
```

#### Substance Types & Production

| Category | Substances | Production Method | Complexity |
|----------|-----------|-------------------|------------|
| **Cannabis** | Weed, Hash, Edibles, Concentrates | Grow → Harvest → Process | Medium |
| **Stimulants** | Cocaine, Meth, Amphetamines | Source → Lab → Cook | High |
| **Opioids** | Heroin, Fentanyl, Pills | Source → Lab → Cut | Very High |
| **Psychedelics** | LSD, Shrooms, DMT | Grow/Synth → Process | Medium |
| **Pharma** | Oxycodone, Xanax, Adderall | Diversion or Counterfeit | High |

#### Equipment & Upgrades

```typescript
interface Equipment {
  type: string;                    // "grow_light", "ventilation", "security"
  tier: number;                    // 1-5
  effects: {
    capacityBonus?: number;        // More plants
    qualityBonus?: number;         // Better product
    speedBonus?: number;           // Faster growth
    riskReduction?: number;        // Less heat
    automationLevel?: number;      // Less manual care needed
  };
  cost: number;
  maintenanceCost: number;         // Per game day
  powerUsage: number;              // Affects heat (high power = suspicious)
}
```

---

### 3. MARKETPLACE SYSTEM (P2P + NPC)

#### Marketplace Types

1. **Local Street Market** (NPC)
   - Buy/sell to NPCs
   - Prices tied to state pricing
   - Quick, low quantities
   - Higher heat gain

2. **Underground Connect** (NPC)
   - Better prices than street
   - Requires reputation
   - Bulk quantities available
   - Introduction required (quest/payment)

3. **Player Marketplace** (P2P)
   - Global listings by players
   - Escrow system for safety
   - Reputation system
   - Price discovery

4. **Wholesale Network** (P2P)
   - B2B between producers
   - Large quantities
   - Contract system
   - Cartel connections

5. **Supply Store** (NPC)
   - Seeds, equipment, supplies
   - Different tiers unlock with level
   - Bulk discounts
   - Rare items rotate

#### Player Listings

```typescript
interface MarketListing {
  sellerId: ObjectId;
  sellerRep: number;               // 0-100
  
  // Product
  substance: string;
  strain?: string;
  quantity: number;
  quality: number;
  
  // Pricing
  pricePerUnit: number;
  bulkDiscounts: { minQty: number; discount: number }[];
  negotiable: boolean;
  
  // Delivery
  deliveryOptions: {
    method: 'pickup' | 'dead_drop' | 'courier' | 'mail';
    locations: string[];           // States available
    cost: number;
    risk: number;
    time: number;                  // Game hours
  }[];
  
  // Listing
  status: 'active' | 'pending' | 'sold' | 'expired';
  visibility: 'public' | 'cartel_only' | 'invite_only';
  expiresAt: Date;
  
  // Escrow
  escrowEnabled: boolean;
  escrowFee: number;               // Percentage
}
```

#### Transaction Flow (P2P)

```
1. BUYER finds listing
2. BUYER initiates purchase
3. BUYER funds escrow (if enabled)
4. SELLER confirms & ships/arranges delivery
5. BUYER confirms receipt
6. Escrow releases to SELLER (minus fees)
7. Both parties rate each other
```

---

### 4. HEAT & LAW ENFORCEMENT

#### Heat Mechanics

Heat is gained by:
- Carrying large quantities (+)
- Traveling with product (+)
- Failed sales (+)
- High-profile activity (+)
- Production facilities (ongoing)
- Violence (major +)

Heat is reduced by:
- Time passing (-)
- Laying low (not dealing) (-)
- Bribes (instant -)
- Lawyers (ongoing -)
- Political connections (-)

#### Heat Levels

| Level | Range | Effects |
|-------|-------|---------|
| Cold | 0-20 | Normal operations |
| Warm | 21-40 | Random checks more common |
| Hot | 41-60 | Active surveillance, checkpoint risk |
| Burning | 61-80 | Raids possible, travel dangerous |
| Most Wanted | 81-100 | Constant pursuit, gameplay severely limited |

#### Encounters

```typescript
interface LawEncounter {
  type: 'checkpoint' | 'traffic_stop' | 'raid' | 'investigation';
  intensity: number;               // 1-10
  
  options: {
    action: string;                // "comply", "bribe", "run", "fight"
    successChance: number;         // Based on stats, heat, inventory
    outcomes: {
      success: EncounterOutcome;
      failure: EncounterOutcome;
    };
  }[];
}

interface EncounterOutcome {
  arrested: boolean;
  inventoryLost: number;           // Percentage
  cashLost: number;
  heatChange: number;
  reputation: number;              // Street cred for fighting back
  injury: number;                  // Health damage
}
```

---

### 5. CARTEL SYSTEM (Social/Guild)

#### Cartel Structure

```typescript
interface Cartel {
  name: string;
  tag: string;                     // 3-5 chars
  
  // Leadership
  boss: ObjectId;                  // Player
  underboss: ObjectId[];
  captains: ObjectId[];
  soldiers: ObjectId[];
  associates: ObjectId[];          // Probationary
  
  // Territory
  controlledStates: string[];
  controlledCities: { state: string; city: string; control: number }[];
  
  // Economics
  treasury: number;
  taxRate: number;                 // % of member earnings to cartel
  
  // Stats
  totalProduction: number;
  marketShare: number;             // % of game economy
  reputation: number;
  heat: number;                    // Cartel-wide heat
  
  // Politics
  politicalInfluence: number;      // Connections to Politics system
  ownedPoliticians: ObjectId[];    // Politician characters/NPCs
  
  // Warfare
  atWar: ObjectId[];               // Other cartels
  alliances: ObjectId[];
}
```

#### Cartel Benefits

- **Tax Income** - Cut of member earnings
- **Protection** - Reduced heat for members
- **Territory Bonuses** - Better prices in controlled areas
- **Shared Resources** - Access to cartel facilities
- **Political Cover** - Reduced law enforcement in controlled areas
- **Muscle** - Help in conflicts
- **Bulk Purchasing** - Supply discounts
- **Prestige** - Status, leaderboards

#### Turf Wars

When cartels fight over territory:
1. War declaration (costs treasury)
2. Control points in cities
3. Sabotage, raids, assassinations
4. Control shifts based on activity
5. Winner takes territory
6. Losing cartel pays tribute or disbands

---

### 6. INTEGRATION WITH OTHER SYSTEMS

#### Real Estate Integration
- **Buy property** for facilities
- **Location quality** affects production (industrial zones vs residential)
- **Property raids** can lose real estate
- **Launder money** through property purchases

#### Banking Integration
- **Store cash** safely (avoid mugging losses)
- **Loans** for startup capital (loan shark style)
- **Money laundering** through business accounts
- **Interest** on deposits (but traceable)

#### Politics Integration
- **Legalization votes** affect prices dramatically
- **Bribe politicians** for favorable laws
- **Campaign donations** for protection
- **Run for office** yourself (politician drug lord)
- **Law changes** affect heat, penalties

#### Business Integration
- **Front businesses** for laundering
- **Legitimate supply chains** for precursors
- **Distribution** through owned businesses

---

## 🎯 Engagement Mechanics (F2P Design)

### Open Loops
1. **Plants growing** - Must return to water/harvest
2. **Listings pending** - Check if sold
3. **Price alerts** - Opportunity to profit
4. **Heat decay** - Can deal again soon
5. **Production cycles** - Facilities producing

### Progression
1. **Level system** (1-100) - Unlocks substances, equipment, tiers
2. **Reputation** - Access to better connects, discounts
3. **Equipment tiers** - Better production
4. **Territory control** - Market influence
5. **Cartel rank** - Leadership, prestige

### Social Hooks
1. **Cartels** - Guild mechanics
2. **P2P marketplace** - Player interaction
3. **Leaderboards** - Competition
4. **Turf wars** - PvP
5. **Trade routes** - Cooperation

### Daily Engagement
1. **Daily login bonus** - Cash, supplies, tips
2. **Flash sales** - Limited time NPC deals
3. **Hot tips** - Price spike notifications
4. **Care timers** - Plants need attention
5. **Events** - Festivals, busts, politics

---

## 📋 Implementation Phases

### Phase 1: Street Trading Core (16-24h)
- PlayerStash model
- StatePricing model with 50 states
- Basic buy/sell from NPCs
- Travel between states
- Heat system basics
- Street Trading UI tab

### Phase 2: Production Foundation (16-24h)
- Production tiers (closet → warehouse)
- Growth mechanics for cannabis
- Care system with timers
- Harvest and processing
- Real Estate integration

### Phase 3: Marketplace (12-16h)
- Player listings
- Escrow system
- Reputation system
- Supply store
- Search and filtering

### Phase 4: Heat & Encounters (8-12h)
- Random encounters
- Law enforcement events
- Bribe/run/fight mechanics
- Arrest and consequences
- Lawyer system

### Phase 5: Cartels (16-24h)
- Cartel creation and management
- Member hierarchy
- Treasury and taxes
- Territory control basics
- Cartel vs cartel mechanics

### Phase 6: Polish & Integration (12-16h)
- Politics integration (legalization)
- Banking integration (loans, laundering)
- Events system
- Leaderboards
- Tutorial system
- UI/UX polish

---

## 📁 File Structure

```
src/
├── lib/
│   ├── db/models/crime/
│   │   ├── PlayerStash.ts           # Player inventory & stats
│   │   ├── StatePricing.ts          # Dynamic 50-state prices
│   │   ├── GrowOperation.ts         # Individual grow ops
│   │   ├── ProductionFacility.ts    # (existing, enhanced)
│   │   ├── Cartel.ts                # Guild system
│   │   ├── TurfWar.ts               # (existing, enhanced)
│   │   └── CrimeTransaction.ts      # Trade history
│   ├── types/
│   │   └── crime.ts                 # All crime types
│   ├── validations/
│   │   └── crime.ts                 # Zod schemas
│   └── utils/
│       └── crime/
│           ├── pricing.ts           # Price calculation
│           ├── travel.ts            # Travel calculations
│           ├── production.ts        # Growing mechanics
│           └── encounters.ts        # Random events
├── app/api/crime/
│   ├── stash/                       # Player inventory
│   ├── trading/                     # Buy/sell NPC
│   ├── travel/                      # State travel
│   ├── pricing/                     # Market prices
│   ├── production/                  # Growing operations
│   ├── marketplace/                 # P2P listings
│   ├── cartels/                     # Cartel management
│   └── encounters/                  # Random events
├── components/crime/
│   ├── trading/                     # Street trading UI
│   │   ├── TradingDashboard.tsx
│   │   ├── StashPanel.tsx
│   │   ├── PricingTable.tsx
│   │   ├── StateSelector.tsx
│   │   ├── BuyModal.tsx
│   │   ├── SellModal.tsx
│   │   └── TravelModal.tsx
│   ├── production/                  # Empire building UI
│   │   ├── GrowRoom.tsx
│   │   ├── PlantCard.tsx
│   │   ├── CarePanel.tsx
│   │   ├── HarvestModal.tsx
│   │   └── FacilityUpgrade.tsx
│   ├── marketplace/                 # P2P trading UI
│   │   ├── ListingBrowser.tsx
│   │   ├── CreateListing.tsx
│   │   └── TransactionHistory.tsx
│   └── cartel/                      # Social UI
│       ├── CartelDashboard.tsx
│       ├── MemberList.tsx
│       └── TerritoryMap.tsx
└── hooks/
    └── useCrimeGame.ts              # Main game state hook
```

---

## 🎨 UI/UX Vision

### Main Crime Dashboard Tabs

```
┌─────────────────────────────────────────────────────────────────┐
│ CRIME EMPIRE                                         💰 $45,230 │
│ Level 23 | Rep: 67 | Heat: 34%                      📦 85/100  │
├─────────────────────────────────────────────────────────────────┤
│ [🏪 Street] [🌿 Grow Ops] [🏭 Empire] [🛒 Market] [👥 Cartel]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STREET TRADING (Active tab)                                    │
│  ┌────────────┐ ┌──────────────────────────────────────────────┐│
│  │ YOUR STASH │ │ CALIFORNIA MARKET              [🗺️ Travel]  ││
│  │            │ │                                              ││
│  │ Cash:      │ │  Drug      Price    Trend   Your Stock      ││
│  │ $45,230    │ │  ────────────────────────────────────────   ││
│  │            │ │  Weed      $15      ▲ +12%  50 units        ││
│  │ Inventory: │ │  Cocaine   $120     ▼ -5%   0 units         ││
│  │ ┌────────┐ │ │  Meth      $85      ── 0%   25 units        ││
│  │ │Weed 50 │ │ │  Heroin    $95      ▲ +3%   0 units         ││
│  │ │Meth 25 │ │ │                                              ││
│  │ └────────┘ │ │  [BUY WEED]  [SELL WEED]                    ││
│  │            │ │                                              ││
│  │ Heat: ███░ │ │  💡 Meth is 40% cheaper in Texas!           ││
│  │       34%  │ │                                              ││
│  └────────────┘ └──────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Daily Active Users in Crime | 60%+ of total | Core engagement |
| Trades per session | 5+ | Loop working |
| Session length | 10+ min | Sticky content |
| Return rate (next day) | 40%+ | Retention |
| Production facility adoption | 30%+ of players | Progression working |
| Cartel membership | 50%+ of L20+ players | Social working |
| P2P transactions | 20%+ of total trades | Economy healthy |

---

*Created by ECHO v1.4.0 - Comprehensive Crime MMO Design*
