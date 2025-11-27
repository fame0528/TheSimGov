# 📋 Planned Features

**Last Updated:** 2025-11-27

This file tracks features that have been planned but not yet started. Features move from here to `progress.md` when implementation begins.

---

## Guidelines

- Features are added automatically via AUTO_UPDATE_PLANNED()
- Each feature has a unique FID (Feature ID) in format: FID-YYYYMMDD-XXX
- Status values: PLANNED
- Priority: HIGH, MEDIUM, LOW
- Complexity: 1-5 (1=simple, 5=complex)

---

## 🎯 NEXT PLANNED FEATURES

**Update (2025-11-25):** [FID-20251125-001A] Political Core Framework started (tracked in `progress.md`). Integration validation (FID-20251125-003 – 66/66 tests) completed; syncing metrics & preparing to initiate [FID-20251125-001B] Advanced Engagement.

### ⚠️ CRITICAL: Politics-First Priority Shift

**USER DIRECTIVE:** "This game is a political simulation first. The business aspect is secondary to it. EVERYTHING is fueled by the political side."

**Strategic Realignment:** Political System implementation takes absolute priority. Business systems (companies, employees, contracts, industries) are tools for gaining political power, not the end goal. The core gameplay loop is: Build Business → Gain Wealth → Political Donations/Lobbying → Win Elections → Control Government.

---

## [FID-POL-005] Legislative Bill Submission & Voting System
**Status:** PLANNED **Priority:** CRITICAL **Complexity:** 5/5  
**Created:** 2025-11-25 **Estimated:** 20-25h (real: ~1.5-2h with ECHO)

**Description:**
Complete legislative system enabling players to submit bills in Senate/House, vote on legislation, participate in debates, lobby other players for votes, and watch bills enact real game mechanic changes (tax rates, budgets, regulations). This system "drives the entire realism of the game" per user directive - bills passed by players directly modify game economy, political landscape, and industry mechanics. Includes bill creation wizard (5-step process), weighted voting (Senate 1 vote/player, House weighted by delegation size), lobby payment mechanics ($120k/senator, $23k/house seat), debate system with persuasion effects, policy enactment engine, and anti-abuse mechanisms.

**Legacy Status:** NOT in legacy code or roadmap. System reverse-engineered from 6 screenshots showing working legislative mechanics. This is NEW feature critical to political realism vision.

**Complete Feature List (From Screenshot Analysis):**

**Core Legislative Mechanics:**
- ✅ **Bill Creation Wizard** (5-step process):
  - Step 1: Select chamber (Senate or House) - must hold elected seat
  - Step 2: Choose policy area (15 bill types: Custom, IntelligenceBudget, TaxReform, TradeAgreement, Regulation, Zoning, Labor, Environmental, Healthcare, Education, Defense, Infrastructure, SocialProgram, CriminalJustice, Immigration)
  - Step 3: Write bill text (title, description, effects, economic position)
  - Step 4: Recruit co-sponsors (other elected players for credibility)
  - Step 5: Review and submit (24-hour voting window starts)

- ✅ **Bill Numbering System**:
  - Senate bills: S.#### (e.g., S.1001, S.1002)
  - House bills: H.R.#### (e.g., H.R.501, H.R.502)
  - Sequential numbering per chamber per game year
  - Bill sponsor and state/party displayed (e.g., "Matthew Salvini R-NJ")

- ✅ **Voting Mechanics**:
  - **Senate voting**: 1 vote per senator (100 total votes)
  - **House voting**: Weighted by delegation size (1-52 votes per representative, 436 total)
  - Vote options: Aye, Nay, Abstain, No Vote
  - 24-hour voting window (7 in-game days at 168x acceleration)
  - Real-time vote tallies visible (e.g., "7 Ayes, 18 Nays, 3 Abstains")
  - Quorum requirement: ≥50% of chamber must vote
  - Passage requirement: Ayes > Nays (simple majority)

- ✅ **Lobby Influence System**:
  - 10 lobby types (Defense, Healthcare, Oil/Gas, Renewable, Tech, Banking, Manufacturing, Agriculture, Labor, Environmental)
  - Lobby payment offers displayed per bill (e.g., "Defense Industry Lobby: $120k if you vote NAY")
  - Payment calculation: Base payment × seat count × lobby alignment
  - Senate payment: $120,000 per senator (if vote matches lobby preference)
  - House payment: $23,000 per house seat (weighted by delegation)
  - Payment timing: After voting deadline, only if voted as lobby desired
  - Multiple lobbies per bill (players can receive payments from multiple lobbies)

- ✅ **Debate System**:
  - Each player can submit up to 3 debate statements per bill
  - Statement positions: FOR, AGAINST, NEUTRAL
  - Max 2,000 characters per statement
  - All voters see debate before voting (influence factor)
  - Persuasion mechanic: High-quality arguments can shift votes ±5%
  - Debate participation tracked (affects reputation and future lobbying power)

- ✅ **Policy Effects & Enactment**:
  - Bills define specific game mechanic changes (e.g., Intelligence Budget: Mainserved → Privatized)
  - Economic policy positioning (Far Left ↔ Far Right scale)
  - Tax policy changes (affects all company.expenses.taxes)
  - Budget allocation changes (Intelligence, Defense, Infrastructure spending levels)
  - Regulatory changes (Environmental, Labor, Industry-specific costs)
  - Trade policy changes (Tariffs, export/import costs)
  - Automatic application when bill passes with quorum + simple majority

- ✅ **Vote Visualization**:
  - Hemicycle diagram showing vote distribution
  - Color-coded votes (Green = Aye, Red = Nay, Yellow = Abstain)
  - Individual senator/representative names listed by vote
  - Visual vote tallies with percentages

- ✅ **Leadership Displays**:
  - Senate Majority Leader shown (e.g., "Sean Oppenheimer, Majority Leader")
  - House Speaker shown (e.g., "Christina Nelson, Speaker")
  - Party compositions visible (D/R breakdown)

**Bill Model Schema (~350 lines):**
```typescript
interface Bill {
  billNumber: string;              // "S.1001" or "H.R.501"
  chamber: 'senate' | 'house';
  sponsor: ObjectId;               // Player who submitted bill
  sponsorState: string;            // "NJ", "CA", etc.
  sponsorParty: 'D' | 'R' | 'I';
  title: string;                   // "The G.O.O.F.Y. Act"
  description: string;             // Full bill text
  billType: BillType;              // Custom, IntelligenceBudget, TaxReform, etc.
  economicPosition: number;        // -100 (Far Left) to +100 (Far Right)
  
  // Co-sponsors
  coSponsors: ObjectId[];          // Other elected players
  
  // Voting window
  submittedAt: Date;
  votingDeadline: Date;            // 24 hours after submission
  status: 'open' | 'closed' | 'passed' | 'failed';
  
  // Vote tracking
  votes: {
    playerId: ObjectId;
    vote: 'aye' | 'nay' | 'abstain';
    votedAt: Date;
    seatCount: number;             // 1 for Senate, delegation size for House
    lobbyPayments: LobbyPayment[]; // Payments received for this vote
  }[];
  
  // Vote tallies
  ayeCount: number;
  nayCount: number;
  abstainCount: number;
  totalVotes: number;
  requiredQuorum: number;          // 50 for Senate, 218 for House
  
  // Lobby influence
  lobbyPositions: {
    lobbyType: LobbyType;
    position: 'support' | 'oppose';
    paymentPerSenator: number;     // $120,000
    paymentPerHouseSeat: number;   // $23,000
    totalOffered: number;
    totalPaid: number;
  }[];
  
  // Debate
  debateStatements: {
    playerId: ObjectId;
    position: 'for' | 'against' | 'neutral';
    text: string;                  // Max 2000 chars
    submittedAt: Date;
    upvotes: number;
  }[];
  
  // Policy effects (enacted if passed)
  effects: {
    taxRateChange?: number;        // ±% change to corporate tax
    budgetAllocations?: {
      intelligence?: number;
      defense?: number;
      infrastructure?: number;
      healthcare?: number;
      education?: number;
    };
    regulatoryChanges?: {
      environmental?: number;      // ±% compliance cost
      labor?: number;              // ±% labor cost
      industrySpecific?: {
        industry: string;
        costModifier: number;
      }[];
    };
    tradePolicy?: {
      tariffs?: { country: string; rate: number }[];
      exportIncentives?: number;
    };
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Lobby Payment Model (~100 lines):**
```typescript
interface LobbyPayment {
  billId: ObjectId;
  playerId: ObjectId;
  lobbyType: LobbyType;
  lobbyPosition: 'support' | 'oppose';
  playerVote: 'aye' | 'nay' | 'abstain';
  seatCount: number;
  basePayment: number;             // $120k for Senate, $23k per House seat
  totalPayment: number;            // basePayment × seatCount
  paid: boolean;
  paidAt?: Date;
}

enum LobbyType {
  Defense = 'defense',
  Healthcare = 'healthcare',
  OilGas = 'oil_gas',
  Renewable = 'renewable',
  Technology = 'technology',
  Banking = 'banking',
  Manufacturing = 'manufacturing',
  Agriculture = 'agriculture',
  Labor = 'labor',
  Environmental = 'environmental'
}

enum BillType {
  Custom = 'custom',
  IntelligenceBudget = 'intelligence_budget',
  TaxReform = 'tax_reform',
  TradeAgreement = 'trade_agreement',
  Regulation = 'regulation',
  Zoning = 'zoning',
  Labor = 'labor',
  Environmental = 'environmental',
  Healthcare = 'healthcare',
  Education = 'education',
  Defense = 'defense',
  Infrastructure = 'infrastructure',
  SocialProgram = 'social_program',
  CriminalJustice = 'criminal_justice',
  Immigration = 'immigration'
}
```

**Vote Weighting Rules:**
- **Senate**: 1 vote per senator, total 100 votes
- **House**: Votes weighted by state delegation size
  - California delegation: 52 seats (1 rep = 52 votes)
  - Wyoming delegation: 1 seat (1 rep = 1 vote)
  - Total: 436 votes (435 voting + 1 DC non-voting)
  - Example: Rep from CA voting Aye = +52 to Aye count

**Anti-Abuse Mechanisms:**
- Bill submission limits: Max 3 active bills per player
- Daily bill cap: Max 10 bills per chamber per day
- Cooldown: 24-hour cooldown between bill submissions
- Vote manipulation detection: Flag players voting identically on 20+ consecutive bills (bot detection)
- Spam prevention: Bill text min 100 characters, max 10,000 characters
- Debate abuse: Max 3 statements per bill per player, rate limit 1 statement per 5 minutes

**Acceptance Criteria:**
- ✅ Bill creation wizard (5-step process with validation)
- ✅ Bill numbering (S.#### and H.R.#### sequential per chamber/year)
- ✅ Eligibility checks (must hold elected seat, from specific state, active company, Level 3+)
- ✅ Co-sponsor recruitment (invite other elected players)
- ✅ Voting mechanics (Senate 1 vote, House weighted by delegation)
- ✅ 24-hour voting window (7 in-game days at 168x acceleration)
- ✅ Vote options (Aye/Nay/Abstain/No Vote)
- ✅ Quorum enforcement (≥50% must vote)
- ✅ Passage rules (Ayes > Nays for simple majority)
- ✅ Lobby influence (10 lobby types with payment offers)
- ✅ Lobby payment calculation ($120k/senator, $23k/house seat)
- ✅ Lobby payment processing (after deadline, only if voted as lobby desired)
- ✅ Debate system (3 statements max, 2000 char limit, FOR/AGAINST/NEUTRAL positions)
- ✅ Persuasion mechanic (debate quality affects vote probability ±5%)
- ✅ Policy effect definitions (tax, budget, regulatory, trade changes)
- ✅ Policy enactment engine (auto-apply changes when bill passes)
- ✅ Vote visualization (hemicycle diagram with color-coded votes)
- ✅ Real-time vote tallies (Aye/Nay/Abstain counts)
- ✅ Leadership displays (Majority Leader, Speaker)
- ✅ Anti-abuse mechanisms (submission limits, cooldowns, spam detection)
- ✅ TypeScript strict mode: 0 errors
- ✅ Complete JSDoc documentation
- ✅ ECHO compliance: Complete file reading, AAA quality, GUARDIAN protocol

**Approach:**

**Phase 1: Database Models** (~4h → real: 20min)
- Bill model (~350 lines with complete schema)
- LobbyPayment model (~100 lines)
- DebateStatement model (~100 lines)
- Extend PoliticalOffice model with bill submission eligibility

**Phase 2: Core API Endpoints** (~6h → real: 30min)
- /api/politics/bills (GET list, POST create)
- /api/politics/bills/[id] (GET details, PATCH update, DELETE withdraw)
- /api/politics/bills/[id]/vote (POST cast vote)
- /api/politics/bills/[id]/debate (POST submit statement, GET statements)
- /api/politics/bills/[id]/lobby (GET lobby positions, POST register lobby interest)
- /api/politics/bills/eligible (GET eligible chambers for player)

**Phase 3: Voting Engine** (~4h → real: 20min)
- Vote weighting utility (Senate 1, House delegation-based)
- Quorum calculation (50% of chamber)
- Passage determination (Ayes > Nays)
- Near-miss recount logic (<0.5% margin triggers recount)

**Phase 4: Lobby System** (~3h → real: 15min)
- Lobby position generator (which lobbies care about each bill type)
- Payment calculation engine ($120k × senators, $23k × house seats)
- Payment processing (after deadline, conditional on vote match)

**Phase 5: Debate System** (~2h → real: 10min)
- Statement submission validation (3 max, 2000 chars)
- Persuasion scoring (statement quality → vote shift ±5%)
- Statement display ordering (upvotes, recency)

**Phase 6: Policy Enactment** (~3h → real: 15min)
- Effect definition parser (from bill.effects)
- Game mechanic modifier engine (apply tax/budget/regulatory changes)
- Enactment transaction logging (audit trail)

**Phase 7: UI Components** (~8h → real: 45min)
- BillCreationWizard (~300 lines, 5-step flow)
- BillBrowser (~250 lines, list active bills)
- BillDetailView (~400 lines, full bill with vote/debate/lobby)
- VotingInterface (~200 lines, Aye/Nay/Abstain buttons)
- DebateSection (~250 lines, statement list + submission)
- LobbyOffers (~150 lines, display payment offers)
- VoteVisualization (~200 lines, hemicycle diagram)

**Files:**
- [NEW] `src/lib/db/models/Bill.ts` (~400 lines)
- [NEW] `src/lib/db/models/LobbyPayment.ts` (~120 lines)
- [NEW] `src/lib/db/models/DebateStatement.ts` (~100 lines)
- [MOD] `src/lib/db/models/PoliticalOffice.ts` (~30 lines extend)
- [NEW] `src/lib/utils/politics/billVoting.ts` (~300 lines)
- [NEW] `src/lib/utils/politics/lobbySystem.ts` (~250 lines)
- [NEW] `src/lib/utils/politics/policyEnactment.ts` (~200 lines)
- [NEW] `src/app/api/politics/bills/route.ts` (~200 lines)
- [NEW] `src/app/api/politics/bills/[id]/route.ts` (~150 lines)
- [NEW] `src/app/api/politics/bills/[id]/vote/route.ts` (~180 lines)
- [NEW] `src/app/api/politics/bills/[id]/debate/route.ts` (~150 lines)
- [NEW] `src/app/api/politics/bills/[id]/lobby/route.ts` (~120 lines)
- [NEW] `src/app/api/politics/bills/eligible/route.ts` (~80 lines)
- [NEW] `src/components/politics/BillCreationWizard.tsx` (~300 lines)
- [NEW] `src/components/politics/BillBrowser.tsx` (~250 lines)
- [NEW] `src/components/politics/BillDetailView.tsx` (~400 lines)
- [NEW] `src/components/politics/VotingInterface.tsx` (~200 lines)
- [NEW] `src/components/politics/DebateSection.tsx` (~250 lines)
- [NEW] `src/components/politics/LobbyOffers.tsx` (~150 lines)
- [NEW] `src/components/politics/VoteVisualization.tsx` (~200 lines)

**Total:** 18 files, ~3,850 LOC

**Dependencies:**
- FID-POL-004 (Election System) - MUST complete first to have elected players
- Existing government structure (Senate/House seats from seed data)
- Socket.io for real-time vote updates (optional but recommended)

**Integration with Existing Systems:**
- Elections: Only elected players can submit bills (check PoliticalOffice.currentHolder)
- Company levels: Level 3+ required to participate in legislation
- Lobbying: Extends existing lobbying mechanics with bill-specific payments
- Time system: 24-hour voting window = 7 in-game days at 168x acceleration
- Economy: Policy effects modify company.expenses.taxes and other game mechanics

**Strategic Importance:**
Per user: "This system needs to be extensive because this system basically drives the entire realism of the game." Legislative system is the ENGINE of political gameplay - bills passed by players directly control game economy, regulations, and industry mechanics. Makes politics CONSEQUENTIAL, not cosmetic.

**Note:** This system discovered via screenshot analysis, not present in legacy code/roadmap. Critical addition to political realism vision.

---

---

## [FID-20251125-001] Complete Political System - Full US Government Simulation
**Status:** PLANNED **Priority:** CRITICAL **Complexity:** 5/5
**Created:** 2025-11-25 **Estimated:** 40-60h (8-12h real time with ECHO)

**Description:**
Complete implementation of FULL political system vision from legacy design spec. This is the CORE ENGINE of the game - business success converts to political power which drives all other systems. Includes complete US government simulation (Local/State/Federal), elections, lobbying, legislation, government contracts, campaign mechanics, and "run for office" system culminating in Presidential campaigns for Level 5 billionaires.

**Legacy Status (Verified via Code Review):**
- **Partial Implementation Exists:** 3 API endpoints (/donate, /lobby, /eligibility), 2 models (PoliticalContribution, LobbyingAction), utilities, 1 component
- **Design Spec Complete:** 608-line POLITICS_BUSINESS_INTEGRATION.md with full system design
- **Roadmap Confirms:** Phase 3 planned complete political system (elections, policies, regulatory, public opinion)
- **This FID:** Implement COMPLETE vision (not just what exists, but what was DESIGNED)

**Complete Feature List (From Design Spec + Roadmap):**

**Core Political Systems:**
- ✅ **Campaign Donation System** (Level 3+: $500-$50k local, Level 4+: $10k-$500k state/federal, Level 5: $100k-$10M+ presidential)
- ✅ **Lobbying System** (Level 3: 10 power points local, Level 4: 50 points state/federal, Level 5: 200 points regulatory capture)
- ✅ **Run for Office** (Level 3: Mayor/City Council, Level 4: Governor/Senator/Representative, Level 5: President)
- ✅ **Government Contracts** (Level 1-5: $5k local → $50B defense contracts with political favoritism scoring)
- ✅ **Political Influence Calculations** (logarithmic donation scaling, multi-factor lobbying probability, reputation impact)
- ✅ **Legislation System** (6 types: Tax, Regulation, Subsidy, Trade, Labor, Environment with industry-specific outcomes)
- ✅ **Election Mechanics** (polling, campaign spending, debates, voter demographics, scandal system)
- ✅ **Regulatory Capture** (Level 5 only: appoint agency heads, write legislation directly, create monopolies)
- ✅ **Political ROI Tracking** (measure $ gained from favorable policies vs political spending)
- ✅ **Moral Dilemma System** (bribery, tax loopholes, monopoly abuse with reputation consequences)

**Government Structure (3-Tier US System):**
- **Local Level** (Level 3+ access):
  * Offices: Mayor, City Council, County Commissioner
  * Powers: Zoning approvals, permit expediting, local tax incentives
  * Campaign costs: $50k-$5M
  * Election frequency: Every 4 game years (9.5 real days at 168x speed)
  
- **State Level** (Level 4+ access):
  * Offices: Governor, State Assembly, State Senate
  * Powers: State regulations, tax codes, trade policies, subsidies
  * Campaign costs: $5M-$100M
  * Election frequency: Every 4-6 game years
  
- **Federal Level** (Level 4-5 access):
  * Offices: U.S. House, U.S. Senate (L4+), President (L5 only)
  * Powers: Federal legislation, international trade, regulatory agencies, defense contracts
  * Campaign costs: House $2M-$15M, Senate $10M-$150M, President $100M-$2B
  * Election frequency: House 2 years, Senate 6 years, President 4 years (all in-game time)

**Political Influence by Company Level:**

**Level 1-2: No Political Power**
- Companies too small to matter
- Focus entirely on business survival
- Must reach Level 3 to enter politics

**Level 3: Local Politics Entry ($5M-$50M companies)**
- Campaign donations: $500-$50,000 to local candidates
- Lobbying power: 10 points (local zoning, permits, tax breaks)
- Run for office: Mayor, City Council (requirement: $50k+ net worth)
- Benefits: Expedited permits (6 months → 2 weeks), favorable zoning, local contracts
- Example: Retail company donates $20k to mayor → gets 3 new store permits approved fast

**Level 4: State & Federal Politics ($50M-$500M companies)**
- Campaign donations: $10,000-$500,000 to state/federal candidates
- Lobbying power: 50 points (shape actual legislation)
- Run for office: Governor, U.S. Senator, U.S. Representative
- PAC creation: Bundle donations across industry
- Trade policy influence: Push for tariffs, trade deals, import restrictions
- Tax policy influence: Corporate tax cuts, industry-specific credits, loopholes
- Benefits: Industry-wide protection, massive tax savings, market advantages
- Example: Manufacturing company lobbies for 25% steel tariffs → $50M/year revenue boost from eliminated competition

**Level 5: National Politics & Regulatory Capture ($500M-$3B+ companies)**
- Campaign donations: $100k-$10M+ to Presidential/Congressional leadership
- Lobbying power: 200 points (regulatory capture - write laws directly)
- Run for office: President of United States (requirement: $500M+ net worth)
- Regulatory capture: Appoint industry allies to agencies (EPA, FDA, FCC, SEC)
- Super PACs: Unlimited independent expenditure
- Government contracts: $500M-$50B defense/infrastructure (political favoritism)
- International influence: Shape U.S. trade policy globally
- ENDGAME: Billionaire runs for President while owning business empire
- Example: Oil company donates $5M to President → Energy Secretary approves $2B in drilling permits + subsidies

**Lobbying Mechanics:**

**Success Probability Formula:**
```typescript
baseProbability = legislationDifficulty[type]  // Tax: 50%, Environment: 35%, etc.
+ levelBonus (company.level - 3) * 5%
+ spendingBonus log10(influencePoints) * 10%
+ totalInfluenceBonus (lifetimeDonations / 50)
+ reputationBonus (reputation - 50) * 0.5%
= finalProbability (capped 5% min, 95% max)
```

**Legislation Types & Outcomes:**
- **Tax** (50% base difficulty): Corporate tax cuts, loopholes, credits → direct profit boost
- **Subsidy** (60% easier): Industry subsidies, R&D grants → free government money
- **Regulation** (45% harder): Reduce environmental/labor rules → lower operating costs
- **Trade** (40% hardest): Tariffs, import restrictions → eliminate foreign competition
- **Labor** (55% moderate): Weaken unions, reduce worker protections → lower labor costs
- **Environment** (35% hardest): Deregulate pollution limits → cost savings but reputation hit

**Return on Investment Examples:**
| Political Action | Cost | Benefit | ROI | Payback |
|-----------------|------|---------|-----|---------|
| Local permit expedition | $10k donation | Save $50k delays | 5x | Immediate |
| State tax credit lobbying | $100k lobbying | $2M/year savings | 20x | 6 weeks |
| Federal tariff protection | $500k donations | $50M/year revenue | 100x | 3 months |
| Regulatory capture | $5M political spending | $500M monopoly profits | 100x | 1 year |

**Government Contract System:**

**Contract Tiers:**
- Level 1: Small local ($5k-$50k) - Open bidding
- Level 2: County contracts ($50k-$250k) - 5+ employees required
- Level 3: State contracts ($250k-$5M) - Political connections help (30% of score)
- Level 4: Federal contracts ($5M-$500M) - Lobbying/donations almost required (40% of score)
- Level 5: Mega defense ($500M-$50B) - Regulatory capture essential (50% of score)

**Bid Scoring Formula:**
```typescript
finalScore = 
  technicalScore * 0.4        // Actual capability
+ priceScore * 0.3            // Bid competitiveness
+ politicalScore * 0.3        // Donations + lobbying + revolving door
```

**Political Score Calculation:**
```typescript
politicalScore = 
  recentDonations * 0.5       // $ to officials overseeing agency (max 50 pts)
+ lobbyingPower * 0.3         // Influence points spent (max 30 pts)
+ formerOfficials * 20        // Hired ex-government employees (max 20 pts)
```

**Campaign & Election Mechanics:**

**Requirements by Office:**
| Office | Min Net Worth | Min Reputation | Campaign Budget | Election Cycle |
|--------|--------------|----------------|-----------------|----------------|
| Mayor (Small) | $50k | 60 | $50k-$500k | 4 years |
| Mayor (Large) | $500k | 70 | $500k-$5M | 4 years |
| Governor | $5M | 75 | $5M-$100M | 4 years |
| U.S. House | $2M | 70 | $2M-$15M | 2 years |
| U.S. Senator | $10M | 80 | $10M-$150M | 6 years |
| President | $500M | 85 | $100M-$2B | 4 years |

**Election Probability:**
```typescript
winProbability = 50%  // Baseline
+ spendingAdvantage log2(yourFunds / opponentFunds) * 10% (max +20%)
+ billionaireBonus (netWorth > $1B ? +10% : 0)
+ reputationBonus (reputation - 50) * 0.3%
+ priorOfficeBonus (hasExperience ? +15% : 0)
- scandalPenalty (scandals.severity * 2%)
+ economicConditions (-10% to +10% random)
= final chance (0-100%)
```

**Moral Dilemma Scenarios:**

**Scenario 1: Tax Loophole Bill**
```
Senator (you donated $100k to) introduces tax bill
↓
Creates loophole saving your company $5M/year
BUT increases middle class taxes to compensate
↓
CHOICE:
A) Support bill (save $5M, reputation -10)
B) Oppose publicly (lose $5M, reputation +20)
C) Support privately + oppose publicly (save $5M, rep -5, exposure risk)
```

**Scenario 2: Bribery Offer**
```
Mayor requests $50k "donation" for re-election
In exchange: Blocks competitor's building permit
↓
CHOICE:
A) Pay bribe (eliminate competitor, rep -20, legal risk 30%)
B) Report to authorities (lose advantage, rep +30)
C) Pay + leak to media (destroy mayor AND competitor, high risk/reward)
```

**Scenario 3: Monopoly Antitrust**
```
Your L5 company has 80% market share
Department of Justice announces investigation
↓
CHOICE:
A) Spend $10M lobbying to kill investigation (90% success, rep -30)
B) Fight in court ($50M cost, 50/50 outcome, could lose company)
C) Voluntary breakup (keep reputation, lose market power)
D) Bribe Attorney General (95% success, rep -50, prison risk 40%)
```

**Scenario 4: Presidential Run**
```
You built $10B business empire
Run for President?
↓
CHOICE:
A) Self-fund $1B campaign (keep control, 60% win)
B) Accept corporate donations (80% win, owe favors)
C) Stay in business (keep empire, no political power)
D) Sell companies + run as "outsider" (90% win, lose business)
```

**Victory Conditions:**

1. **Business Dominance:** Own L5 companies in 5+ industries, 50%+ market share in 3, net worth > $100B
2. **Political Power:** Elected President OR control 50+ Congress members OR Cabinet Secretary
3. **Ultimate Power:** Elected President WHILE owning $10B+ empire (American Oligarch achievement)
4. **Moral Victor:** Net worth > $10B + reputation > 90 + never bribed/corrupted (hardest path)

**Acceptance Criteria:**
- ✅ Complete US government structure (Local/State/Federal with 15+ office types)
- ✅ Campaign donation system (Level 3-5 with caps $500-$10M+)
- ✅ Lobbying mechanics (10-200 power points, 6 legislation types, probability formula)
- ✅ Run for office system (Mayor → Governor → Senator → President progression)
- ✅ Government contract bidding (political favoritism scoring 30-50%)
- ✅ Election simulation (polling, spending, debates, scandals, voter turnout)
- ✅ Regulatory capture (L5 only: agency appointments, direct legislation writing)
- ✅ Political influence calculations (logarithmic scaling, multi-factor probability)
- ✅ ROI tracking ($ gained from policies vs political spending)
- ✅ Moral dilemma system (4+ scenarios with reputation consequences)
- ✅ Victory condition tracking (4 endgame paths)
- ✅ TypeScript strict mode: 0 errors
- ✅ Complete JSDoc documentation
- ✅ ECHO compliance: Complete file reading, AAA quality, GUARDIAN protocol

**Approach:**

**Phase 1: Database Models & Types** (6-8h → 1-1.5h real)
- Election model (office, candidates, polls, results, spending)
- PoliticalOffice model (officeholder, term start/end, jurisdiction)
- Legislation model (bill text, type, sponsors, status, economic impact)
- CampaignDonation model (already exists, extend with office targeting)
- LobbyingAction model (already exists, extend with outcome tracking)
- GovernmentContract model (bidding, political scoring, awards)
- Scandal model (type, severity, discovery, reputation damage)

**Phase 2: Political Utility Functions** (8-10h → 1.5-2h real)
- politicalInfluence.ts (already exists ~400 lines, extend to 800+ lines)
  * Add election probability calculations
  * Add government contract scoring
  * Add regulatory capture mechanics
  * Add scandal generation/resolution
- elections.ts (NEW ~600 lines)
  * Campaign simulation engine
  * Polling mechanics
  * Voter turnout modeling
  * Debate simulation
- legislation.ts (NEW ~400 lines)
  * Bill drafting/voting mechanics
  * Economic impact calculations
  * Lobbying outcome generation
- contracts.ts (NEW ~300 lines)
  * Political favoritism scoring
  * Bid evaluation engine
  * Award determination

**Phase 3: API Endpoints** (10-12h → 2-2.5h real)
- /api/politics/donate (already exists, enhance)
- /api/politics/lobby (already exists, enhance with outcomes)
- /api/politics/eligibility (already exists)
- /api/politics/elections (NEW - list upcoming, register candidate)
- /api/politics/elections/[id]/campaign (NEW - spend funds, polling)
- /api/politics/elections/[id]/vote (NEW - cast vote, view results)
- /api/politics/offices (NEW - view all offices, current holders)
- /api/politics/legislation (NEW - view bills, sponsor, vote)
- /api/politics/legislation/[id]/lobby (NEW - lobbying actions)
- /api/politics/contracts (NEW - view available, bid, awards)
- /api/politics/contracts/[id]/bid (NEW - submit bid with political score)
- /api/politics/scandals (NEW - active scandals, reputation damage)

**Phase 4: Frontend Components** (12-16h → 2.5-3.5h real)
- PoliticalDashboard.tsx (~400 lines) - Overview of political power, donations, lobbying, offices held
- CampaignManager.tsx (~500 lines) - Run for office, spending, polling, debate prep
- ElectionResults.tsx (~300 lines) - View results, vote breakdowns, winner announcements
- LegislationBrowser.tsx (~400 lines) - Browse bills, lobbying interface, vote tracking
- LobbyingInterface.tsx (~350 lines) - Select legislation, allocate influence points, probability display
- GovernmentContractBidding.tsx (~450 lines) - View contracts, submit bids, political scoring breakdown
- PoliticalInfluencePanel.tsx (already exists ~300 lines, enhance to 500+)
- ScandalManager.tsx (~250 lines) - Active scandals, damage control, reputation recovery
- VictoryTracker.tsx (~200 lines) - Progress toward 4 endgame conditions

**Phase 5: Pages & Integration** (4-6h → 1h real)
- /game/politics/page.tsx (already exists as placeholder, build out to 400+ lines)
- /game/politics/elections/page.tsx (NEW - elections browser)
- /game/politics/legislation/page.tsx (NEW - bills and lobbying)
- /game/politics/contracts/page.tsx (NEW - government contracts)
- /game/politics/campaign/[id]/page.tsx (NEW - campaign management)

**Files:**
- [NEW] `src/lib/db/models/Election.ts` (~350 lines)
- [NEW] `src/lib/db/models/PoliticalOffice.ts` (~200 lines)
- [NEW] `src/lib/db/models/Legislation.ts` (~300 lines)
- [NEW] `src/lib/db/models/GovernmentContract.ts` (~400 lines)
- [NEW] `src/lib/db/models/Scandal.ts` (~150 lines)
- [MOD] `src/lib/db/models/PoliticalContribution.ts` (~50 lines extend)
- [MOD] `src/lib/db/models/LobbyingAction.ts` (~100 lines extend)
- [MOD] `src/lib/utils/politicalInfluence.ts` (400 → 800 lines)
- [NEW] `src/lib/utils/elections.ts` (~600 lines)
- [NEW] `src/lib/utils/legislation.ts` (~400 lines)
- [NEW] `src/lib/utils/governmentContracts.ts` (~300 lines)
- [NEW] `src/app/api/politics/elections/route.ts` (~200 lines)
- [NEW] `src/app/api/politics/elections/[id]/campaign/route.ts` (~250 lines)
- [NEW] `src/app/api/politics/elections/[id]/vote/route.ts` (~150 lines)
- [NEW] `src/app/api/politics/offices/route.ts` (~120 lines)
- [NEW] `src/app/api/politics/legislation/route.ts` (~200 lines)
- [NEW] `src/app/api/politics/legislation/[id]/lobby/route.ts` (~180 lines)
- [NEW] `src/app/api/politics/contracts/route.ts` (~200 lines)
- [NEW] `src/app/api/politics/contracts/[id]/bid/route.ts` (~250 lines)
- [NEW] `src/app/api/politics/scandals/route.ts` (~150 lines)
- [NEW] `src/components/politics/PoliticalDashboard.tsx` (~400 lines)
- [NEW] `src/components/politics/CampaignManager.tsx` (~500 lines)
- [NEW] `src/components/politics/ElectionResults.tsx` (~300 lines)
- [NEW] `src/components/politics/LegislationBrowser.tsx` (~400 lines)
- [NEW] `src/components/politics/LobbyingInterface.tsx` (~350 lines)
- [NEW] `src/components/politics/GovernmentContractBidding.tsx` (~450 lines)
- [MOD] `src/components/politics/PoliticalInfluencePanel.tsx` (300 → 500 lines)
- [NEW] `src/components/politics/ScandalManager.tsx` (~250 lines)
- [NEW] `src/components/politics/VictoryTracker.tsx` (~200 lines)
- [MOD] `src/app/(game)/politics/page.tsx` (placeholder → 400+ lines)
- [NEW] `src/app/(game)/politics/elections/page.tsx` (~350 lines)
- [NEW] `src/app/(game)/politics/legislation/page.tsx` (~400 lines)
- [NEW] `src/app/(game)/politics/contracts/page.tsx` (~350 lines)
- [NEW] `src/app/(game)/politics/campaign/[id]/page.tsx` (~300 lines)

**Total:** ~40 files, ~12,000+ LOC

**Dependencies:**
- FID-002 (Company System) ✅ COMPLETE
- FID-003 (Employee System) ✅ COMPLETE
- FID-004 (Contract System) ✅ COMPLETE
- FID-20251120-003 (HeroUI Migration) ✅ COMPLETE
- Existing political utilities (politicalInfluence.ts, models) ✅ EXISTS

**Blocks:** 
- All Advanced Industries (Healthcare, Media, Energy become political tools)
- Multiplayer features (political alliances, cooperative lobbying)
- Victory conditions (endgame requires political power)

**Strategic Importance:**
This is the CORE of the game. Business systems are merely the vehicle for political power. Once implemented, all other features (industries, multiplayer, events) will be framed as tools for political domination, not standalone systems.

> NOTE: This original monolithic FID is now subdivided for phased delivery into FID-20251125-001A (Core Framework & Phase 1) and FID-20251125-001B (Advanced Engagement & Phase 2). Both new FIDs inherit and reorganize the acceptance criteria below to ensure incremental AAA implementation and legacy parity. The original entry remains for historical planning context.

---


## [FID-20251125-001B] Political Advanced Engagement (Campaign Engine, Events, Endorsements, Dynamic Difficulty, Achievements)
**Status:** PLANNED **Priority:** HIGH **Complexity:** 5/5
**Created:** 2025-11-25 **Estimated:** 26-34h (4-5h real with ECHO)

**Description:** Builds atop 001A foundation to deliver addicting, high-frequency interaction loops: campaign 26h phase machine (4×6.5h), real-time polling/ad/debate scheduling, scandal & crisis generator, dynamic difficulty scaling for AI opponents, endorsement & social influence system, achievement + notification dispatch, advanced lobbying probability (multi-factor reputation/net worth modifiers), and refined election resolution (near-miss recount logic). Implements offline queue & deferred resolution to maintain fairness while maximizing engagement intensity.

**Scope (Included):**
- CampaignPhaseMachine with deterministic phase transitions + hooks.
- Polling Engine (25m cadence) & AdSpend cycles (8.5m) with budget efficiency modifiers.
- Debate Scheduler (hours 6/15/22 real-time triggers) + performance scoring.
- Election Night counting steps (3.5m granular tallies) + near-miss recount algorithm.
- Scandal System (capped frequency, severity tiers, exposure probability) + mitigation actions.
- Crisis & Event generator (Minor/Medium/Major/Annual) weighted by crimePercentile & economic volatility.
- Endorsements System (requests, stacking rules, cooldowns, reciprocal effects on polling).
- Dynamic Difficulty scaling (opponent AI: spending strategy, scandal response, adaptive polling shifts).
- Achievements Engine (campaign wins, legislation passed, influence milestones) + notification batching & offline summary.
- Advanced Lobbying probability extension (adds reputationBonus, priorSuccessBonus, economicConditionModifier).
- Leaderboard integration (influence & election performance) stubbed if global system pending.
- Extended offline autopilot: strategic ad buying, minimal polling engagement, scandal containment.

**Out of Scope:** Any monetization-specific mechanics (VIP modifiers, crystal spend hooks) unless pre-existing; multiplayer alliances (future phase); corruption/shadow operations (separate FIDs).

**Acceptance Criteria:**
- ✅ CampaignPhaseMachine executes full 26h cycle accurately under acceleration with restart & early termination (withdraw) paths.
- ✅ Polling engine returns smooth trend lines (log-smoothing) without offline volatility spikes; offline periods queued & resumed with catch-up buff logic.
- ✅ Debate events produce performance delta impacting polling via documented formula (oratorySkill, preparationSpend, random seed ±2%).
- ✅ Election resolution implements near-miss recount if margin <0.5% producing adjusted final within ±0.25% variance of initial tally.
- ✅ Scandal system enforces max active scandals per campaign (e.g. 1 major, 2 minor) and properly applies reputation & polling penalties with mitigation actions.
- ✅ Events/crises generator distinguishes severity tiers; annual events accumulate historical impact log.
- ✅ Endorsements apply stacking diminishing returns (1.0, 0.6, 0.36, ...) with cooldown enforcement (1 game year) and reciprocal bonus matching.
- ✅ Dynamic difficulty adjusts opponent spend ratios & messaging priorities based on player dominance; documented scaling thresholds.
- ✅ Achievement engine records criteria and emits notifications; offline summary aggregates queued notifications ≤ 50 for login digest.
- ✅ Advanced lobbying probability function matches documented multi-factor formula & passes unit tests across representative scenarios.
- ✅ All new utilities & engines unit tested (target ≥80% coverage for core logic) with deterministic seed injection.
- ✅ Zero new TypeScript errors; DRY maintained (no duplicate calculation blocks).
- ✅ Documentation updates appended to existing scaling/time docs + new sections for dynamic systems (Campaign Engine, Events, Endorsements).

**Approach (Phased):**
1. Engine & Scheduler layering (campaign phase + polling + ad cycles).
2. Debate & Election Night resolution modules.
3. Scandal + Crisis event systems (weighted selection + mitigation subroutines).
4. Endorsements & Dynamic Difficulty integration.
5. Achievement + Notification batching subsystem.
6. Advanced lobbying extension (merge with baseline without duplication).
7. Offline queue/defer logic expansion & fairness audit.
8. Documentation & test coverage expansion; DRY final audit.

**Dependencies:** Requires completion of FID-20251125-001A; baseline formulas, derived metrics, time utilities, and offline protection primitives available.

**Files (Planned NEW/MOD):**
- NEW `src/lib/utils/politics/campaignEngine.ts`
- NEW `src/lib/utils/politics/pollingEngine.ts`
- NEW `src/lib/utils/politics/debateEngine.ts`
- NEW `src/lib/utils/politics/electionResolution.ts`
- NEW `src/lib/utils/politics/scandalEngine.ts`
- NEW `src/lib/utils/politics/crisisEvents.ts`
- NEW `src/lib/utils/politics/endorsements.ts`
- NEW `src/lib/utils/politics/dynamicDifficulty.ts`
- NEW `src/lib/utils/politics/achievements.ts`
- MOD `src/lib/utils/politics/lobbyingBase.ts` (advanced factors)
- MOD `src/lib/utils/politics/offlineProtection.ts` (extended queue handling)
- MOD `docs/POLITICS_SCALING.md` (add dynamic systems sections)

**Risks & Mitigations:** Complexity layering → phased integration tests; polling volatility → smoothing + seed control; performance overhead → pure functional segmentation + memoization where necessary.

**Success Metrics:** Engagement loop latency < 100ms per tick (polling/ad cycles), deterministic test suite passes, coverage ≥80%, fairness offline audit passes (no negative net influence drift during offline grace).

**Notes:** Completion of 001B unlocks player-visible “addiction loop” while preserving fairness & deterministic scaling from 001A.

---

---

## [FID-TBD] Media Industry Frontend Components
**Status:** PLANNED **Priority:** HIGH **Complexity:** 4/5
**Estimated:** 6-8h

**Description:**
Complete Media Industry frontend component stack (5-6 components) integrating with backend APIs. Follow Healthcare implementation pattern: HeroUI components, SWR data fetching, comprehensive JSDoc, TypeScript strict mode.

**Components:**
- Content creation/streaming platforms
- Broadcasting networks  
- Publishing houses
- Social media platforms
- Advertising agencies

**Dependencies:**
- Media backend APIs (if not complete, build backend first)
- FID-20251120-003 (HeroUI Migration) ✅ COMPLETED

---

## [FID-TBD] Energy Industry Frontend Components  
**Status:** PLANNED **Priority:** HIGH **Complexity:** 4/5
**Estimated:** 8-10h

**Description:**
Complete Energy Industry frontend component stack (6-7 components) integrating with backend APIs. Covers oil & gas, renewable energy, power generation, energy storage, grid management.

**Components:**
- Oil & gas operations
- Renewable energy (solar, wind)
- Power generation
- Energy storage
- Grid management

**Dependencies:**
- Energy backend APIs (if not complete, build backend first)
- FID-20251120-003 (HeroUI Migration) ✅ COMPLETED

---

*All other features moved to progress.md or completed.md*

**AUDIT COMPLETE: Current Politics Rewrite = 20/20 features (100% COMPLETE)**
**BUT: MISSING MAJOR LEGACY MMO FEATURES - Requires Full Parity Implementation**

**✅ CONFIRMED COMPLETE (20/20 major features - 100% COMPLETE):**
- ✅ [FID-001] Infrastructure-First Foundation (55 files, 3,850 LOC)
- ✅ [FID-002] Company Foundation System (5-level progression, 70 industry configs)
- ✅ [FID-003] Employee Management (12-skill system, training, morale)
- ✅ [FID-004] Contract System (revenue engine, NPC marketplace)
- ✅ [FID-005] Time Progression (scheduler, payroll, deadlines)
- ✅ [FID-006] Department System UI (4 dashboards, 28 API endpoints)
- ✅ [FID-20251123-001] AI/Tech Sector (Phases 1-3 complete, 29 files, 13+ APIs)
- ✅ [FID-20251122-003] Models Consolidation (fixed 50 TypeScript errors)
- ✅ [FID-20251122-002] Breakthrough & Patent Backend
- ✅ [FID-20251122-001] Complete AI Industry L1-L5 (9 utilities, 5,942 LOC)
- ✅ [FID-20251121-003] AI Industry Complete Stack (types/models/utils/APIs/frontend)
- ✅ [FID-007] Banking & Loans System (18 files, 5,200 LOC - FINAL FEATURE)
- ✅ Auth System (NextAuth v5, MongoDB integration)

**📁 Codebase Reality:** 276+ TypeScript files, extensive implementation across all systems

**🚨 LEGACY FEATURE PARITY GAP IDENTIFIED:**
**Current Implementation:** Focused business simulation (company management, employees, contracts, departments, AI industry)
**Legacy Vision:** Comprehensive MMO with politics, multiplayer, events, advanced industries (Healthcare, Media, Technology, Crypto, Energy, Manufacturing, E-Commerce)

**❌ MISSING LEGACY FEATURES (CRITICAL GAPS):**
1. **Political System** - Complete US government simulation (elections, lobbying, policy, regulations)
2. **Multiplayer Features** - Real-time Socket.io features (chat, notifications, trading)
3. **Event System** - Dynamic events, news, market fluctuations
4. **Advanced Industries** - Healthcare, Media, Crypto, Energy, Manufacturing, E-Commerce
5. **Social Systems** - Alliances, syndicates, competitive rankings
6. **AGI Alignment** - Political lobbying mechanics, ethical scoring
7. **E-Commerce Platform** - 9-model marketplace system
8. **Real-time Economy** - Player-driven markets, supply chains

**🎯 STATUS:** PROJECT REQUIRES COMPREHENSIVE LEGACY FEATURE PARITY IMPLEMENTATION
**Next Action:** Create FID-20251123-002 for complete legacy feature parity implementation

---

---

## 🚀 **PHASED DEVELOPMENT ROADMAP**

### **PHASE 1: Core Business Systems (Complete Foundation)** - 208-308h total

**Status:** 5/7 systems complete (71%) → **AUDIT: 7/7 SYSTEMS COMPLETE (100%)**

#### ✅ FID-001: Infrastructure-First Foundation (COMPLETED)
- Utility infrastructure preventing DRY violations
- apiClient, hooks, components, types, contexts
- MongoDB, NextAuth v5, Chakra UI integration
- **Result:** 55 files, ~3,850 LOC, 1h 48m (vs 14-18h estimated)

#### ✅ FID-002: Company Foundation System (COMPLETED)
- 5-level progression, 70 industry×level configs
- **AUDIT CONFIRMED:** Company model (412 lines), API routes, UI components, pages
- **Files:** 10+ files, comprehensive CRUD + level-up logic
- **Status:** FULLY IMPLEMENTED (not tracked in completed.md)

#### ✅ FID-003: Employee Management System (COMPLETED)
- 12-skill system, training, morale, retention
- **AUDIT CONFIRMED:** Employee model (751 lines), API routes, components, pages
- **Features:** Skills progression, performance tracking, marketplace hiring
- **Status:** FULLY IMPLEMENTED (not tracked in completed.md)

#### ✅ FID-004: Contract System (COMPLETED)
- Revenue engine with NPC marketplace, 5 tiers
- **AUDIT CONFIRMED:** Contract model (480 lines), API routes, components, pages
- **Features:** Bid/accept system, deadline tracking, payment processing
- **Status:** FULLY IMPLEMENTED (not tracked in completed.md)

#### ✅ FID-005: Time Progression System (COMPLETED)
- Scheduler, payroll, deadlines, skill decay
- **AUDIT CONFIRMED:** Time engine, payroll API, tick/pause/fast-forward endpoints
- **Status:** FULLY IMPLEMENTED (not tracked in completed.md)

#### ✅ FID-006: Department System UI (COMPLETED)
**Status:** CONFIRMED COMPLETE via code review
**Result:** 4 dashboards + shared components, 5 pages, 28 API endpoints, ~3,000 LOC

**Components Created:**
- DepartmentCard, DepartmentsList, KPIGrid (shared)
- FinanceDashboard (P&L, loans, investments, cashflow)
- HRDashboard (recruitment, training programs, employee development)
- MarketingDashboard (campaigns, analytics, brand metrics)
- RDDashboard (research projects, patents, innovation pipeline)
- BudgetAllocation modal

**Pages Created:**
- /game/departments (overview)
- /game/departments/finance, /hr, /marketing, /rd (details)

**API Endpoints:** 28 routes for CRUD, finance operations, HR management, marketing campaigns, R&D projects

**Result:** Complete department system with HeroUI, TypeScript strict, JSDoc documentation

#### ✅ FID-20251123-001: Complete AI/Tech Sector Implementation (PHASES 1-3 COMPLETE)
**Status:** CONFIRMED: Extensive implementation exists (29 AI files, 13+ API directories, 10+ models)
**Phases Complete:** Foundation, Infrastructure, Marketplaces
**Files:** 29+ components, 13+ API endpoints, 10+ models, extensive utilities
**Status:** MOSTLY COMPLETE (not properly tracked in completed.md)

---

### **PHASE 2: Industry-Specific Mechanics** - 460-640h total (real: ~20-30h)

**Status:** 1/6 industries implemented → **AUDIT: AI/Tech COMPLETE, others pending**

**Implementation Order (by dependency):**
1. Manufacturing (40-60h) - Production, inventory, supply chain
2. E-Commerce (50-70h) - Marketplace, fulfillment, cloud services
3. Media (40-60h) - Content, streaming, influencer system
4. Energy (70-90h) - Oil/gas, renewables, commodity trading, grid
5. Healthcare (60-80h) - Facilities, pharma, insurance, compliance
6. **Technology/AI (60-80h)** - Model training, research, GPU infrastructure ⚠️ **LARGELY COMPLETE**

All industries share common dependencies:
- ✅ Company Foundation (FID-002) - CONFIRMED COMPLETE
- ✅ Employee System (FID-003) - CONFIRMED COMPLETE
- ✅ Contract System (FID-004) - CONFIRMED COMPLETE
- ✅ Department System (FID-006) - CONFIRMED COMPLETE
- ⏳ Banking System (FID-007) - **REQUIRED for financing industry costs**

---

## 🎯 **IMMEDIATE NEXT FEATURES**

*Note: FID-007 Banking System completed 2025-11-23. Moved to completed.md.*

---

*Note: FID-20251126-001 Registration Enhancement completed 2025-11-26. Moved to completed.md.*

---

**Company Name System:**
- ✅ **Uniqueness validation:** Real-time check before company creation (prevent duplicates)
- ✅ **Profanity filter:** Server-side validation with comprehensive word list
- ✅ **Name generator button:** Dice icon (🎲) generates industry-aware company names using @faker-js/faker
- ✅ **Validation feedback:** Clear error messages for duplicates/profanity
- ✅ **Case-insensitive matching:** "Apple Inc" blocks "apple inc", "APPLE INC", etc.

**Character Name System:**
- ✅ **Name generator buttons:** Dice icons next to firstName/lastName fields
- ✅ **Gender-aware generation:** Uses @faker-js/faker with selected gender for appropriate names
- ✅ **Separate generators:** Independent buttons for first/last names (not forced combo)
- ✅ **Tooltip guidance:** "Generate random name" on hover

**Account Fields (Database & UI):**
- ✅ **Gender:** Required dropdown (Male/Female only - simplified per user requirement)
- ✅ **Date of Birth:** Required date picker with:
  - Age validation (must be 18+)
  - Clear age display ("Age: 24" next to field)
  - Error messaging for underage
- ✅ **Ethnicity:** Optional dropdown with 7 options:
  - White
  - Black/African American
  - Asian
  - Hispanic/Latino
  - Native American
  - Middle Eastern
  - Pacific Islander
  - Other (optional selection)
- ✅ **Background:** Optional textarea with:
  - Max 500 characters (validated)
  - Character counter display (e.g., "342/500")
  - Placeholder: "Your character's background story..."
  - Background generator button (🎲) creates narrative from templates
- ✅ **Avatar/Image:** Required portrait selection OR upload with validation

**Background Generator System:**
- ✅ **Narrative templates:** 15-20 pre-written templates (200-400 chars each)
- ✅ **Template structure:** "Born in [city], [name] worked as a [job] before entering politics. Known for [buzzword] and [buzzword]."
- ✅ **Dynamic substitution:** Uses @faker-js/faker for cities, jobs, buzzwords
- ✅ **Gender integration:** Pronouns match selected gender (he/she/they)
- ✅ **Ethnicity awareness:** Cultural context when ethnicity selected
- ✅ **Randomization:** Uses chance package for template selection
- ✅ **One-click generation:** Dice button fills entire background field instantly

**Avatar System (Pre-Generated Portraits):**
- ✅ **Portrait catalog:** 42-70 pre-generated images (7 ethnicities × 2 genders × 3-5 variations each)
- ✅ **Portrait style:** Professional congressional official headshots:
  - Navy suit/blazer
  - American flag lapel pin
  - Gray gradient background
  - Studio lighting
  - Photorealistic quality
  - 1024×1024px resolution
- ✅ **Portrait selection UI:**
  - Grid display filtered by selected gender/ethnicity
  - Click to select with visual feedback (checkmark overlay)
  - Preview in circular avatar (150×150px)
  - Auto-filter when user changes gender/ethnicity
  - 3-5 variations per combination for user choice
- ✅ **Upload option:**
  - Drag-drop or click to upload custom image
  - Client-side validation: jpg/png/gif only, max 5MB, min 200×200px
  - Server-side validation: File type, size, dimensions, person-only (no logos/icons)
  - Image preview before submission
  - Progress indicator during upload
  - Saved to `/public/avatars/[userId]-[timestamp].jpg`
- ✅ **File organization:**
  - Pre-generated: `/public/portraits/{gender}-{ethnicity}-{number}.jpg`
  - Thumbnails: `/public/portraits/thumbs/` (150×150px for grid display)
  - User uploads: `/public/avatars/` (validated and stored)
- ✅ **Selection interface:**
  - Tab 1: "Choose Portrait" (filtered grid of presets)
  - Tab 2: "Upload Your Own" (custom upload form)
  - Current selection always visible (circular avatar preview)

**Portrait Generation Workflow (User's Responsibility):**
- ✅ **Prompts file created:** `/dev/prompts/character_portrait_prompts.txt`
- ✅ **14 detailed prompts:** 7 male + 7 female covering all ethnicities
- ✅ **Prompt specifications:**
  - Professional congressional headshot style
  - Navy suit/blazer with American flag lapel pin
  - Gray gradient background
  - Studio lighting, photorealistic
  - 1024×1024px, Leonardo Phoenix/Diffusion XL
  - Negative prompts: cartoon, anime, illustration, logos, multiple people
- ✅ **File naming convention:** `{gender}-{ethnicity}-{number}.jpg` (e.g., male-black-01.jpg)
- ✅ **Generation settings:** Leonardo AI with quality control checklist
- ✅ **Estimated generation:** 2-3h for 42-70 images (user's task, blocks avatar selector testing)

**Acceptance Criteria:**
- ✅ Company name uniqueness: Real-time validation prevents duplicates (case-insensitive)
- ✅ Profanity filter: Server-side check blocks offensive names (comprehensive word list)
- ✅ Name generators: Dice buttons use @faker-js/faker for first/last/company names (gender-aware)
- ✅ Gender field: Required dropdown (Male/Female) with proper validation
- ✅ DOB field: Required date picker with 18+ validation and age display
- ✅ Ethnicity field: Optional dropdown with 7 options + Other
- ✅ Background field: Optional textarea, max 500 chars, character counter, generator button
- ✅ Background generator: 15-20 templates with @faker-js/faker integration for dynamic content
- ✅ Portrait catalog: portraitCatalog.ts with 42-70 entries (14 combinations × 3-5 variations)
- ✅ Portrait selector: Filtered grid by gender/ethnicity, visual selection, preview
- ✅ Image upload: Drag-drop, validation (type/size/dimensions), preview, progress
- ✅ Avatar validation: Must be person image (not icon/gravatar), 200×200 min, 5MB max
- ✅ Database schema: User model extended with 5 new fields (gender, dateOfBirth, ethnicity, background, imageUrl)
- ✅ Company model: Unique index on name field (case-insensitive)
- ✅ API validation: Server-side checks for all new fields
- ✅ TypeScript strict mode: 0 errors
- ✅ Complete JSDoc documentation
- ✅ ECHO compliance: Utility-first architecture, zero duplication, complete implementation

**Approach:**

**Phase 1: Shared Utilities** (~2h → real: ~15min)
- Create `src/lib/utils/profanityFilter.ts` (~100 lines)
  - `containsProfanity(text: string): boolean`
  - `filterProfanity(text: string): string`
  - Comprehensive profanity word list (200+ words)
- Create `src/lib/utils/nameGenerator.ts` (~150 lines)
  - `generateFirstName(gender: 'Male' | 'Female'): string` using @faker-js/faker
  - `generateLastName(): string`
  - `generateCompanyName(industry?: string): string`
  - Industry-aware company name generation (optional enhancement)
- Create `src/lib/utils/backgroundGenerator.ts` (~200 lines)
  - 15-20 narrative templates (200-400 chars each)
  - `generateBackground(gender, ethnicity?): string`
  - Uses @faker-js/faker for cities, jobs, buzzwords
  - Uses chance package for random template selection
  - Gender pronoun matching (he/she/they based on selection)

**Phase 2: Database Schema Updates** (~1h → real: ~10min)
- Update `src/lib/db/models/user.ts`:
  - Add `gender: { type: String, enum: ['Male', 'Female'], required: true }`
  - Add `dateOfBirth: { type: Date, required: true }` (validate 18+ in pre-save hook)
  - Add `ethnicity: { type: String, enum: [7 options], required: false }`
  - Add `background: { type: String, maxlength: 500, required: false }`
  - Add `imageUrl: { type: String, required: false }` (portrait path or upload URL)
- Update `src/lib/db/models/company.ts`:
  - Add unique index: `name: { type: String, unique: true, required: true }`
  - Case-insensitive index for duplicate prevention

**Phase 3: Type Definitions** (~30min → real: ~5min)
- Create `src/lib/types/portraits.ts` (~60 lines)
  - `type Gender = 'Male' | 'Female'`
  - `type Ethnicity = 'White' | 'Black' | 'Asian' | 'Hispanic' | 'Native American' | 'Middle Eastern' | 'Pacific Islander' | 'Other'`
  - `interface PresetPortrait { id, gender, ethnicity, filename, thumbnailUrl, fullUrl }`
  - `interface AvatarSelection { type: 'preset' | 'upload', portraitId?, uploadUrl? }`
- Update `src/lib/types/index.ts`: Export portrait types

**Phase 4: Backend APIs** (~2h → real: ~15min)
- Create `src/lib/utils/portraitCatalog.ts` (~150 lines)
  - Portrait catalog array: 42-70 entries mapping gender/ethnicity to filenames
  - `getPortraitsBySelection(gender, ethnicity): PresetPortrait[]`
  - `getDefaultPortrait(gender, ethnicity): PresetPortrait`
  - File paths: `/public/portraits/{gender}-{ethnicity}-{number}.jpg`
- Create `src/app/api/upload/avatar/route.ts` (~150 lines)
  - POST endpoint for avatar upload
  - Validation: file type (jpg/png/gif), size (max 5MB), dimensions (min 200×200px)
  - Image processing: resize if needed, optimize quality
  - Save to `/public/avatars/[userId]-[timestamp].jpg`
  - Return avatar URL for database storage
- Update `src/app/api/auth/register/route.ts`:
  - Add validation for new fields (gender, DOB, ethnicity, background, imageUrl)
  - Age validation: calculate age from DOB, must be ≥18
  - Profanity check on background text
  - Image URL validation (preset path OR upload path)
- Update/create company creation API:
  - Add uniqueness check before creation (case-insensitive)
  - Profanity filter on company name
  - Return clear error messages for duplicates/profanity

**Phase 5: Frontend Components** (~2.5h → real: ~20min)
- Create `src/components/shared/PortraitSelector.tsx` (~200 lines)
  - Grid display of portraits filtered by gender/ethnicity
  - Click to select with visual feedback (checkmark overlay)
  - Auto-update when gender/ethnicity changes
  - Props: selectedGender, selectedEthnicity, onSelect
- Create `src/components/shared/ImageUpload.tsx` (~150 lines)
  - Drag-drop or click to upload
  - Image preview before upload
  - Client-side validation (type, size, dimensions)
  - Progress indicator during upload
  - Error messaging for validation failures
- Create `src/components/shared/AvatarSelector.tsx` (~180 lines)
  - Tabs: "Choose Portrait" | "Upload Your Own"
  - Current selection preview (circular avatar 150×150px)
  - Integration with PortraitSelector and ImageUpload
  - Props: selectedGender, selectedEthnicity, currentAvatar, onAvatarChange
- Create `src/components/shared/NameGeneratorButton.tsx` (~80 lines)
  - Dice icon button (🎲)
  - Calls appropriate name generator (first/last/company)
  - Updates field value on click
  - Tooltip: "Generate random name"
  - Props: generatorType, gender?, onGenerate
- Create `src/components/shared/BackgroundGeneratorButton.tsx` (~80 lines)
  - Dice icon button (🎲)
  - Calls background generator with gender/ethnicity params
  - Updates background textarea on click
  - Tooltip: "Generate random background"
  - Props: gender, ethnicity?, onGenerate
- Update `src/app/registration/page.tsx`:
  - Add gender dropdown (Male/Female) with validation
  - Add DOB date picker with age display and 18+ validation
  - Add ethnicity dropdown (7 options + Other, optional)
  - Add background textarea (max 500 chars, character counter)
  - Add AvatarSelector component
  - Add name generator buttons next to firstName/lastName fields
  - Add background generator button
  - Client-side validation before submission
  - Clear error messaging for all validations
- Update company creation page:
  - Add company name generator button (industry-aware)
  - Real-time uniqueness validation (debounced API call)
  - Profanity filter feedback (instant rejection with error message)
  - Clear error states for duplicates/profanity

**Phase 6: Portrait Generation** (User's Task, ~2-3h)
- User generates 42-70 images via Leonardo AI using prompts from `/dev/prompts/character_portrait_prompts.txt`
- File naming: `{gender}-{ethnicity}-{number}.jpg` (e.g., male-white-01.jpg, female-black-03.jpg)
- Save to `/public/portraits/`
- Optional: Create 150×150px thumbnails → `/public/portraits/thumbs/`
- Update `src/lib/utils/portraitCatalog.ts` with all image entries
- Quality control: Verify all 14 combinations covered with 3-5 variations each

**Phase 7: Testing & QA** (~1h → real: ~10min)
- Create `tests/utils/profanityFilter.test.ts`: Test detection, false positives, case insensitivity
- Create `tests/utils/nameGenerator.test.ts`: Test gender-specific names, company names, randomness
- Create `tests/utils/backgroundGenerator.test.ts`: Test templates, character limits, substitutions
- Integration tests: Avatar upload flow, registration with new fields, company uniqueness validation
- Manual testing: All generators, validators, upload flow, portrait selection
- Acceptance: 85%+ test coverage, all critical paths tested

**Files:**
- [NEW] `src/lib/utils/profanityFilter.ts` (~100 lines)
- [NEW] `src/lib/utils/nameGenerator.ts` (~150 lines)
- [NEW] `src/lib/utils/backgroundGenerator.ts` (~200 lines)
- [NEW] `src/lib/types/portraits.ts` (~60 lines)
- [NEW] `src/lib/utils/portraitCatalog.ts` (~150 lines)
- [NEW] `src/app/api/upload/avatar/route.ts` (~150 lines)
- [NEW] `src/components/shared/PortraitSelector.tsx` (~200 lines)
- [NEW] `src/components/shared/ImageUpload.tsx` (~150 lines)
- [NEW] `src/components/shared/AvatarSelector.tsx` (~180 lines)
- [NEW] `src/components/shared/NameGeneratorButton.tsx` (~80 lines)
- [NEW] `src/components/shared/BackgroundGeneratorButton.tsx` (~80 lines)
- [NEW] `tests/utils/profanityFilter.test.ts` (~120 lines)
- [NEW] `tests/utils/nameGenerator.test.ts` (~150 lines)
- [NEW] `tests/utils/backgroundGenerator.test.ts` (~180 lines)
- [MOD] `src/lib/db/models/user.ts` (add 5 fields: gender, dateOfBirth, ethnicity, background, imageUrl)
- [MOD] `src/lib/db/models/company.ts` (add unique index on name)
- [MOD] `src/lib/types/index.ts` (export portrait types)
- [MOD] `src/app/api/auth/register/route.ts` (validate new fields, age check, profanity filter)
- [MOD] `src/app/registration/page.tsx` (UI updates for all new fields)
- [MOD] Company creation page (name generator, validation UI)

**Total:** 18 new files, 6 modified files (~1,480 new LOC, ~200 modified LOC)

**Dependencies:**
- FID-001 (Infrastructure) ✅ COMPLETED
- FID-002 (Company Foundation) ✅ COMPLETED (for company name validation)
- @faker-js/faker v10.1.0 ✅ ALREADY INSTALLED
- chance v1.1.13 ✅ ALREADY INSTALLED
- **User Task:** Generate 42-70 portrait images via Leonardo AI (blocks avatar selector testing)
- **Blocks:** No other features (enhancement to existing registration, can be implemented anytime)

**Strategic Notes:**
- **Utility-first approach:** Build shared utilities (profanityFilter, nameGenerator, backgroundGenerator) before components
- **Maximum code reuse:** NameGeneratorButton used for first/last/company names (single component, multiple contexts)
- **DRY enforcement:** All name generation logic in nameGenerator.ts, zero duplication across UI
- **Progressive enhancement:** System works without portraits (user can upload only), portraits add polish
- **Gender simplified:** Male/Female only per user requirement (not full spectrum to keep UI clean)
- **Portrait generation workflow:** User generates images manually via Leonardo AI, no API integration needed (cost savings)
- **Congressional headshot style:** Professional aesthetic appropriate for political simulation game theme

---

## [FID-006] Department System UI - 4 Dashboards + Shared Components
**Status:** MOVED TO PROGRESS.MD 2025-11-22 (Backend 100% complete, building UI layer)

**Acceptance:**
- ✅ Create 4 departments (Finance, HR, Marketing, R&D) with unique schemas
- ✅ Assign employees to departments (affects their work and department efficiency)
- ✅ Budget allocation system (distribute company funds across departments)
- ✅ Department leveling (1-5, unlocks features per level)
- ✅ **Finance Department:**
  - Generate monthly P&L reports (revenue, expenses, profit, cashflow)
  - Cashflow management (real-time tracking, 7/30/90-day forecasts, burn rate alerts)
  - Loan & financing system (business loans $10k-$1M at 5-15% APR, line of credit, equipment financing, venture capital)
  - Credit scoring (0-850, affects loan approval and rates)
  - Interest auto-deduction monthly, default triggers bankruptcy
  - Investment opportunities (stocks 5-15% return, bonds 2-5%, real estate 8-12%, index funds 7-10%)
  - Passive income via quarterly dividends (auto-deposited to company cash)
  - Tax planning and audit risk management
- ✅ **HR Department:**
  - Recruitment campaigns (bulk hiring with budget allocation)
  - Training programs (create custom programs: technical, leadership, sales, soft skills, certifications, degrees)
  - Training mechanics (enroll 1-10 employees per cohort, track progress, auto-complete and apply skill gains)
  - Mentorship programs (pair senior + junior for faster skill growth)
  - Award certifications and degrees upon completion
  - Training ROI metrics (skill gain per $ spent)
  - Morale boosters, performance reviews, retention strategies
  - Succession planning and salary benchmarking
- ✅ **Marketing Department:**
  - Marketing campaigns (increase customer base and contract availability)
  - Brand building (improves contract terms and pricing power)
  - Customer acquisition (drive contracts and revenue)
  - Market research (unlock new industries/products)
  - Social media management (viral potential)
  - ROI tracking and campaign analytics
- ✅ **R&D Department:**
  - Research projects (unlock industry-specific innovations)
  - Product development (new offerings)
  - Process improvements (efficiency gains)
  - Patent filing (IP protection, competitive moats)
  - Collaboration with universities (talent pipeline)
  - Technology breakthroughs (competitive advantage)
- ✅ TypeScript strict mode: 0 errors
- ✅ Complete JSDoc documentation for all schemas and API routes
- ✅ Production-ready with comprehensive error handling

**Approach:**
Phase 1: Database Schema (~8h → real: ~45min)
- Create Department.ts model (~500 lines) with finance, HR, marketing, R&D fields
- Department validation schemas (Zod)
- Type definitions for all department-specific data structures

Phase 2: Core API Endpoints (~15h → real: ~1h)
- /api/departments - GET (list), POST (create)
- /api/departments/[id] - GET, PATCH, DELETE
- /api/departments/[id]/assign - POST (assign employee)
- /api/departments/[id]/budget - PATCH (update budget)
- /api/departments/[id]/upgrade - POST (level up department)

Phase 3: Finance Department APIs (~8h → real: ~30min)
- /api/departments/finance/reports - GET (P&L statements)
- /api/departments/finance/loans - GET (available loans), POST (apply for loan)
- /api/departments/finance/investments - GET (portfolio), POST (invest), PATCH (rebalance)
- /api/departments/finance/cashflow - GET (forecasts, burn rate)

Phase 4: HR Department APIs (~10h → real: ~45min)
- /api/departments/hr/recruit - POST (recruitment campaign)
- /api/departments/hr/training - GET (available programs), POST (create program)
- /api/departments/hr/training/[id] - GET, PATCH, DELETE
- /api/departments/hr/training/[id]/enroll - POST (enroll employee)
- /api/departments/hr/training/[id]/complete - POST (mark complete, apply skill gains)

Phase 5: Marketing & R&D APIs (~8h → real: ~30min)
- /api/departments/marketing/campaign - POST (launch campaign)
- /api/departments/marketing/analytics - GET (ROI, metrics)
- /api/departments/rd/project - POST (start research project)
- /api/departments/rd/patents - GET (patent portfolio)

Phase 6: Utility Functions (~8h → real: ~30min)
- src/lib/utils/departments/finance.ts - P&L calculation, loan approval, investment returns
- src/lib/utils/departments/hr.ts - Recruitment, training completion, skill application
- src/lib/utils/departments/marketing.ts - Campaign ROI, brand value calculation
- src/lib/utils/departments/rd.ts - Research progress, innovation unlocks

Phase 7: UI Components (~13h → real: ~1h)
- DepartmentCard, DepartmentList (department overview)
- FinanceDashboard (P&L, loans, investments, cashflow)
- HRDashboard (recruitment, training programs, employee development)
- MarketingDashboard (campaigns, analytics, brand metrics)
- RDDashboard (research projects, patents, innovation pipeline)
- BudgetAllocation (allocate funds to departments)
- EmployeeAssignment (assign employees to departments)

**Files:**
- [NEW] `src/lib/db/models/Department.ts` (~500 lines) - Complete department schema
- [NEW] `src/lib/validations/department.ts` (~300 lines) - Zod validation schemas
- [NEW] `src/app/api/departments/route.ts` (~120 lines) - CRUD endpoints
- [NEW] `src/app/api/departments/[id]/route.ts` (~150 lines) - Individual department operations
- [NEW] `src/app/api/departments/[id]/assign/route.ts` (~80 lines) - Employee assignment
- [NEW] `src/app/api/departments/[id]/budget/route.ts` (~70 lines) - Budget updates
- [NEW] `src/app/api/departments/[id]/upgrade/route.ts` (~90 lines) - Level up mechanics
- [NEW] `src/app/api/departments/finance/reports/route.ts` (~100 lines) - P&L generation
- [NEW] `src/app/api/departments/finance/loans/route.ts` (~180 lines) - Loan application and management
- [NEW] `src/app/api/departments/finance/investments/route.ts` (~150 lines) - Investment portfolio
- [NEW] `src/app/api/departments/finance/cashflow/route.ts` (~100 lines) - Cashflow forecasting
- [NEW] `src/app/api/departments/hr/recruit/route.ts` (~120 lines) - Recruitment campaigns
- [NEW] `src/app/api/departments/hr/training/route.ts` (~200 lines) - Training program CRUD
- [NEW] `src/app/api/departments/hr/training/[id]/route.ts` (~100 lines) - Individual program management
- [NEW] `src/app/api/departments/hr/training/[id]/enroll/route.ts` (~80 lines) - Enroll employees
- [NEW] `src/app/api/departments/hr/training/[id]/complete/route.ts` (~100 lines) - Complete training, apply skills
- [NEW] `src/app/api/departments/marketing/campaign/route.ts` (~150 lines) - Launch campaigns
- [NEW] `src/app/api/departments/marketing/analytics/route.ts` (~90 lines) - Campaign ROI tracking
- [NEW] `src/app/api/departments/rd/project/route.ts` (~130 lines) - Research project lifecycle
- [NEW] `src/app/api/departments/rd/patents/route.ts` (~80 lines) - Patent portfolio
- [NEW] `src/lib/utils/departments/finance.ts` (~250 lines) - Finance utilities
- [NEW] `src/lib/utils/departments/hr.ts` (~200 lines) - HR utilities
- [NEW] `src/lib/utils/departments/marketing.ts` (~150 lines) - Marketing utilities
- [NEW] `src/lib/utils/departments/rd.ts` (~150 lines) - R&D utilities
- [NEW] `src/lib/components/departments/DepartmentCard.tsx` (~120 lines) - Department overview card
- [NEW] `src/lib/components/departments/DepartmentList.tsx` (~100 lines) - List all departments
- [NEW] `src/lib/components/departments/FinanceDashboard.tsx` (~280 lines) - Finance department UI
- [NEW] `src/lib/components/departments/HRDashboard.tsx` (~300 lines) - HR department UI
- [NEW] `src/lib/components/departments/MarketingDashboard.tsx` (~200 lines) - Marketing department UI
- [NEW] `src/lib/components/departments/RDDashboard.tsx` (~220 lines) - R&D department UI
- [NEW] `src/lib/components/departments/BudgetAllocation.tsx` (~150 lines) - Budget allocation interface
- [NEW] `src/lib/components/departments/EmployeeAssignment.tsx` (~130 lines) - Assign employees to departments
- [NEW] `src/app/(game)/companies/[id]/departments/page.tsx` (~200 lines) - Department hub page
- [NEW] `src/app/(game)/companies/[id]/departments/[deptId]/page.tsx` (~250 lines) - Department detail page

**Dependencies:**
- FID-20251120-001 (Infrastructure) ✅ COMPLETED
- FID-20251120-002 (Company Foundation) ✅ COMPLETED
- FID-20251120-003 (Employee Management) ✅ COMPLETED
- FID-20251120-004 (Contract System) ✅ COMPLETED
- **Blocks:** Technology/AI Industry (requires R&D department), all industries (require Finance loans for startup costs)

---

## [FID-20251123-001] Complete AI/Tech Sector Implementation - 10 Subsystems
**Status:** MOVED TO PROGRESS.MD **Priority:** CRITICAL **Complexity:** 5/5
**Created:** 2025-11-23 **Estimated:** 320-400h (8-10 weeks)

**Description:** Complete implementation of ENTIRE AI/Tech sector with 100% feature parity to legacy system. Covers all 10 subsystems: (1) Model Training, (2) Research Lab, (3) Real Estate, (4) Data Centers, (5) Talent Management, (6) Compute Marketplace, (7) Model Marketplace, (8) Global Competition, (9) AGI Development, (10) Industry Dominance. Includes 12-15 Mongoose models, 89 API endpoints, 15 utility functions, 14 UI components, and full integration with existing Company/Employee/Transaction systems.

**Acceptance Criteria:**
- ✅ 12-15 Mongoose models with TypeScript strict compliance (0 new errors)
- ✅ 15 utility functions tested with 100% formula accuracy validation
- ✅ 89 API endpoints implemented with request validation (Zod schemas), Transaction logging, error handling
- ✅ 14 UI components migrated from Chakra UI to HeroUI with Tailwind v4
- ✅ Integration requirements: Company/Employee/Transaction linking functional, real estate → data center blocking dependency enforced, payment escrow validation in pre-save hooks, SLA refund tiers Bronze 10% to Platinum 100%, multi-licensing model validation Perpetual/Subscription/Usage/API, event-driven simulation with trigger monitoring, reputation systems (0-100)
- ✅ Testing: Unit tests for 15 utilities, integration tests for payment flows, E2E tests for critical flows (model training, compute rental, real estate acquisition)
- ✅ Legacy Feature Parity: ZERO omissions - all 42 features from AI_TECH_LEGACY_FEATURE_PARITY_ANALYSIS.md implemented
- ✅ TypeScript strict mode: 0 errors (2993 baseline acceptable)
- ✅ ECHO compliance: Complete file reading, AAA quality, zero placeholders, GUARDIAN protocol enforced

**Approach:** Phased implementation with dependency-aware build order:
Phase 1 Foundation (Hours 1-3): Company/Employee/Transaction (already exist), AIModel (standalone), ResearchProject (requires Company+Employee)
Phase 2 Infrastructure (Hours 4-7): RealEstate (requires Company), DataCenter (requires RealEstate - HARD BLOCKING), permit/zoning workflows
Phase 3 Marketplaces (Hours 8-10): ComputeListing (requires DataCenter), ComputeContract (requires ComputeListing), ModelListing (requires AIModel), payment escrow implementation
Phase 4 Advanced Systems (Hours 11-13): AGIMilestone progression, GlobalImpactEvent generation, industry dominance tracking, global competition
Phase 5 Analytics & Polish (Hours 14-16): Dashboard components, analytics endpoints, HeroUI component migration, performance optimization, integration testing

**Files:** 12-15 models / 15 utilities (exist) / 89 APIs / 14 UI components = ~130 files total
**Dependencies:** Requires completed FID-20251122-003 (Models Consolidation). Blocks no other features (can be implemented last).
**Legacy Review:** Complete (25,887+ lines analyzed, 42 features documented, 100% utility coverage achieved)
- ✅ 5-level AI company progression with distinct mechanics per level:
  - L1: Solo Consultant ($12k, 1-2 people, cloud credits, $2k-$8k/mo consulting revenue)
  - L2: AI Startup ($85k, 5-15 people, 8-16 cloud GPUs, first product, $20k-$150k/mo revenue)
  - L3: AI Platform ($750k, 50-200 people, 64-256 GPUs, API platform, $300k-$3M/mo revenue)
  - L4: Research Lab ($15M, 500-2k people, 1-5k GPUs, foundation models, $8M-$80M/mo revenue)
  - L5: AGI Company ($250M, 5k-50k people, 10k-100k+ GPUs, supercomputers, $100M-$800M+/mo revenue)
- ✅ **Model Training Flow:**
  - Data selection (quality, quantity, licensing costs)
  - Architecture selection (Transformer, CNN, RNN, Diffusion, GAN) with size tiers (Small/Medium/Large)
  - Training job submission (compute allocation, time estimates, cost forecasting)
  - Real-time progress tracking (training loss, validation metrics, ETA)
  - Model evaluation (benchmark performance, accuracy, inference speed)
  - Model deployment (API endpoints, scaling, monitoring)
  - Training failure handling (OOM errors, data quality issues, checkpoint recovery)
- ✅ **Research & Publication System:**
  - Research project creation (focus areas: LLM, Computer Vision, RL, Generative AI)
  - Academic paper writing (progress tracking, co-author selection)
  - Conference submission (NeurIPS, ICML, ICLR, CVPR) with peer review simulation
  - Citation tracking and reputation gains
  - Research breakthroughs (unlock advanced architectures, talent attraction bonuses)
  - Collaboration with universities (access to grad student talent pool)
- ✅ **Infrastructure Management:**
  - On-premise vs cloud compute decision system (capital vs operational costs)
  - GPU cluster management (utilization monitoring, capacity planning)
  - Data center operations (L3+ only: power, cooling, security)
  - Cloud credit system (AWS, GCP, Azure credit purchases)
  - Spot instance and preemptible GPU mechanics (cost savings with risk)
  - Storage capacity management (data warehousing, model checkpoints)
  - Compute cost optimization (idle GPU alerts, workload batching)
- ✅ **AI-Specific Talent Management:**
  - ML Engineer roles (junior, senior, staff levels)
  - Research Scientist roles (specialized in LLM, CV, RL, etc.)
  - Data Engineer and DevOps roles
  - Talent marketplace with AI-specific filtering
  - Poaching mechanics (steal talent from competitors with counter-offers)
  - Retention bonuses (equity grants, research freedom, conference attendance)
  - Skill progression specific to AI (PyTorch proficiency, paper authorship, model optimization)
- ✅ **Revenue Streams:**
  - API deployment and pricing (per-request or subscription tiers)
  - Enterprise licensing (custom models, on-premise deployment)
  - Consulting services (model training, fine-tuning, advisory)
  - Customer acquisition funnel (free tier → paid tiers)
  - Churn tracking and retention mechanics
  - Revenue optimization (dynamic pricing, tiered plans, usage-based billing)
- ✅ **Competitive Dynamics:**
  - AI industry leaderboard (rankings by model performance, research impact, revenue)
  - Market share tracking (% of API calls, customer count)
  - Competitive events (talent wars, compute shortages, breakthrough announcements)
  - Acquisition offers from larger companies
  - Reputation system (affects hiring, partnerships, funding)
- ✅ **Political Integration:**
  - AI regulation compliance (data privacy, model safety, algorithmic fairness)
  - Government subsidies for AI research (CHIPS Act-style funding)
  - Lobbying for favorable AI policies (research tax credits, H-1B visas)
  - Export controls on advanced chips/models
  - Ethical review boards (optional but affects reputation)
- ✅ TypeScript strict mode: 0 errors
- ✅ Complete JSDoc documentation for all AI-specific code
- ✅ Production-ready with comprehensive testing and error handling

**Approach:**
Phase 1: Database Schema Extensions (~10h → real: ~45min)
- Extend Company model with AI-specific fields (researchFocus, computeType, gpuCount, cloudCredits, etc.)
- Create AIModel schema (~300 lines: architecture, parameters, training status, performance metrics)
- Create AIEmployee extension (~200 lines: ML roles, research skills, compute budgets)
- Create AIResearchProject schema (~200 lines: progress tracking, publication outcomes, citations)
- Create AIInfrastructure schema (~180 lines: GPU clusters, data centers, utilization)

Phase 2: Core API Endpoints (~12h → real: ~1h)
- /api/companies/[id]/ai/models - GET (list), POST (create model)
- /api/companies/[id]/ai/models/[modelId] - GET, PATCH, DELETE
- /api/companies/[id]/ai/training - POST (submit training job), GET (job status)
- /api/companies/[id]/ai/training/[jobId] - GET (detailed progress), DELETE (cancel job)
- /api/companies/[id]/ai/research - GET (projects), POST (start research project)
- /api/companies/[id]/ai/research/[projectId] - GET, PATCH (update), DELETE
- /api/companies/[id]/ai/infrastructure - GET (current setup), PATCH (upgrade)
- /api/companies/[id]/ai/talent - GET (AI-specific marketplace)

Phase 3: Model Training System (~12h → real: ~1h)
- Data selection interface (quality tiers, licensing costs, quantity)
- Architecture configuration (model type, size, hyperparameters)
- Training job submission (compute allocation, cost estimation)
- Progress tracking (training loss curves, validation metrics)
- Model evaluation (benchmarking, performance testing)
- Deployment mechanics (API creation, scaling configuration)
- Training failure handling (checkpointing, error recovery)

Phase 4: Research & Publication System (~10h → real: ~45min)
- Research project lifecycle (creation, progress, completion)
- Paper authoring mechanics (co-author selection, writing progress)
- Conference submission flow (target conference, peer review simulation)
- Citation accumulation (reputation growth, talent attraction)
- Breakthrough events (unlock advanced features)
- University collaboration (graduate student recruitment)

Phase 5: Infrastructure Management (~10h → real: ~45min)
- On-premise vs cloud decision interface
- GPU utilization monitoring and alerts
- Data center management dashboard (L3+ only)
- Cloud credit purchasing and tracking
- Spot instance mechanics (cost vs risk trade-offs)
- Compute cost optimization recommendations

Phase 6: Talent & Competition (~8h → real: ~30min)
- AI-specific talent marketplace filtering
- Poaching interface (steal competitors' talent)
- Counter-offer mechanics (retention strategies)
- Leaderboard system (industry rankings)
- Market event generation (talent wars, breakthroughs)
- Reputation tracking (affects hiring and partnerships)

Phase 7: Revenue & Product Systems (~8h → real: ~30min)
- API deployment wizard (model → API endpoint)
- Pricing configuration (per-request, subscription tiers)
- Customer acquisition funnel (free → paid conversion)
- Churn tracking and analytics
- Revenue optimization tools (dynamic pricing)
- Enterprise licensing mechanics (custom models)

Phase 8: Political Integration (~6h → real: ~30min)
- Regulatory compliance tracking (data privacy, model safety)
- Subsidy application system (government AI funding)
- Lobbying mechanics (influence AI policy)
- Export control compliance (chip/model restrictions)
- Ethical review board (optional, affects reputation)

Phase 9: UI Components (~14h → real: ~1.5h)
- AICompanyDashboard (~250 lines: overview, metrics, alerts)
- ModelTrainingWizard (~300 lines: data → architecture → training → deployment)
- ResearchProjectManager (~250 lines: project creation, progress, publication)
- InfrastructureManager (~220 lines: GPU utilization, cost tracking)
- TalentMarketplace (~200 lines: AI-specific hiring, poaching)
- CompetitiveLeaderboard (~150 lines: industry rankings, market share)
- RevenueAnalytics (~180 lines: API usage, customer metrics)

**Files:**
- [NEW] `src/lib/db/models/AICompany.ts` (~300 lines) - AI company schema extension
- [NEW] `src/lib/db/models/AIModel.ts` (~250 lines) - Model training schema
- [NEW] `src/lib/db/models/AIEmployee.ts` (~200 lines) - AI talent schema
- [NEW] `src/lib/db/models/AIResearchProject.ts` (~200 lines) - Research project schema
- [NEW] `src/lib/db/models/AIInfrastructure.ts` (~180 lines) - Infrastructure schema
- [NEW] `src/app/api/companies/[id]/ai/models/route.ts` (~150 lines) - Model CRUD
- [NEW] `src/app/api/companies/[id]/ai/models/[modelId]/route.ts` (~100 lines) - Individual model ops
- [NEW] `src/app/api/companies/[id]/ai/training/route.ts` (~200 lines) - Training job submission
- [NEW] `src/app/api/companies/[id]/ai/training/[jobId]/route.ts` (~120 lines) - Job status tracking
- [NEW] `src/app/api/companies/[id]/ai/research/route.ts` (~180 lines) - Research project API
- [NEW] `src/app/api/companies/[id]/ai/research/[projectId]/route.ts` (~100 lines) - Project management
- [NEW] `src/app/api/companies/[id]/ai/infrastructure/route.ts` (~160 lines) - Infrastructure management
- [NEW] `src/app/api/companies/[id]/ai/talent/route.ts` (~130 lines) - AI talent marketplace
- [NEW] `src/lib/utils/ai/training.ts` (~300 lines) - Training simulation engine
- [NEW] `src/lib/utils/ai/research.ts` (~250 lines) - Research mechanics
- [NEW] `src/lib/utils/ai/infrastructure.ts` (~200 lines) - Compute management utilities
- [NEW] `src/lib/utils/ai/competition.ts` (~180 lines) - Market dynamics
- [NEW] `src/lib/utils/ai/revenue.ts` (~150 lines) - Revenue calculation utilities
- [NEW] `src/lib/components/ai/AICompanyDashboard.tsx` (~250 lines) - Main AI dashboard
- [NEW] `src/lib/components/ai/ModelTrainingWizard.tsx` (~300 lines) - Training flow wizard
- [NEW] `src/lib/components/ai/ResearchProjectManager.tsx` (~250 lines) - Research UI
- [NEW] `src/lib/components/ai/InfrastructureManager.tsx` (~220 lines) - Infrastructure dashboard
- [NEW] `src/lib/components/ai/TalentMarketplace.tsx` (~200 lines) - AI talent hiring UI
- [NEW] `src/lib/components/ai/CompetitiveLeaderboard.tsx` (~150 lines) - Industry rankings
- [NEW] `src/lib/components/ai/RevenueAnalytics.tsx` (~180 lines) - Revenue tracking UI
- [NEW] `src/app/(game)/companies/[id]/ai/dashboard/page.tsx` (~200 lines) - AI dashboard page
- [NEW] `src/app/(game)/companies/[id]/ai/training/page.tsx` (~250 lines) - Training interface page
- [NEW] `src/app/(game)/companies/[id]/ai/research/page.tsx` (~200 lines) - Research page
- [NEW] `src/app/(game)/companies/[id]/ai/infrastructure/page.tsx` (~180 lines) - Infrastructure page
- [NEW] `src/app/(game)/companies/[id]/ai/talent/page.tsx` (~150 lines) - Talent page
- [MOD] `src/lib/db/models/Company.ts` (~50 lines) - Add AI industry support
- [MOD] `src/lib/db/models/Employee.ts` (~30 lines) - Add AI roles (ML Engineer, Research Scientist)
- [MOD] `src/lib/types/models.ts` (~100 lines) - Add AI type definitions
- [MOD] `src/lib/utils/constants.ts` (~80 lines) - AI industry constants (GPU costs, training times, etc.)

**Dependencies:**
- FID-20251120-001 (Infrastructure) ✅ COMPLETED
- FID-20251120-002 (Company Foundation) ✅ COMPLETED
- FID-20251120-003 (Employee Management) ✅ COMPLETED
- FID-20251120-004 (Contract System) ✅ COMPLETED
- FID-20251120-005 (Time Progression) ✅ COMPLETED
- **CRITICAL:** FID-006 (Department System) ⏳ REQUIRED - R&D department needed for research projects, Finance department needed for loans/investments
- **Blocks:** No other features (can be implemented last)

---

## 💎 **MONETIZATION & ENGAGEMENT SYSTEMS**

## 💎 **MONETIZATION & ENGAGEMENT SYSTEMS**

### **PHASE 5: Core Monetization Infrastructure** - 80-120h total (real: ~6-8h)

**Status:** Not started (can begin in parallel with Phase 2-3)

---

## [FID-008] Premium Currency & Dual Economy System
**Status:** PLANNED **Priority:** CRITICAL **Complexity:** 4/5
**Created:** 2025-11-21 **Estimated:** 20-30h (real: ~1.5-2h)

**Description:**
Implement dual currency economy with free cash (earned in-game) and premium crystals (purchased with real money). Crystals enable time acceleration, premium features, and convenience purchases while maintaining competitive balance for free players. Includes crystal purchase packs, exchange systems, transaction logging, and fraud prevention.

**Acceptance:**
- ✅ Dual currency system (cash: in-game dollars, crystals: premium)
- ✅ Crystal purchase packs ($4.99 to $499.99 with escalating bonuses)
- ✅ Free crystal earning (10/day login, achievements, level-ups, events)
- ✅ Crystal-to-cash exchange (1 crystal = $10k in-game, one-way only)
- ✅ Transaction logging (all crystal purchases and spending audited)
- ✅ Fraud detection (unusual spending patterns, refund abuse)
- ✅ Crystal balance display in UI (prominent but not intrusive)
- ✅ Purchase flow (Stripe integration, receipt emails, confirmation screens)
- ✅ Gifting system (players can gift crystals to friends - monetization hook)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Database: CrystalTransaction model (userId, amount, type, source, timestamp)
- API: /api/crystals (balance), /api/crystals/purchase (Stripe), /api/crystals/spend
- UI: CrystalBalance component, PurchaseModal, TransactionHistory
- Security: Rate limiting, purchase verification, chargeback handling

**Files:** ~12 files (~2,200 LOC)

**Dependencies:**
- FID-001 (Infrastructure) ✅
- Stripe API integration
- **Blocks:** All premium features (VIP, time skips, gacha)

---

## [FID-009] Action Point System & Energy Mechanics
**Status:** PLANNED **Priority:** HIGH **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Energy/stamina system limiting player actions per day. Free players get 100 AP (regens 1 per 10 min = 16.67h full recharge), premium players get 150-infinite. Actions cost 10-50 AP (contracts, hiring, training). Creates login frequency habit and monetization pressure without hard paywalls.

**Acceptance:**
- ✅ Action Point (AP) system (current, max, regen rate)
- ✅ Action costs (contract: 10 AP, hire: 15 AP, train: 20 AP, research: 25 AP, campaign: 30 AP, election: 50 AP)
- ✅ Regeneration (1 AP per 10 minutes, +50 AP daily login bonus)
- ✅ Premium refills (50 crystals = 100 AP, unlimited with Gold VIP)
- ✅ Free refill (watch 30s ad = +20 AP, 1x per day)
- ✅ AP display (prominently in UI, red when low, animations on use)
- ✅ Action blocking (disable buttons when insufficient AP with tooltip)
- ✅ Notification system (alert when AP full, encourage login)
- ✅ VIP bonuses (Bronze: +50 max, Silver: +150 max, Gold: infinite)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Extend User model: actionPoints, maxActionPoints, lastAPRegen
- Middleware: checkActionPoints() before actions
- Background job: Regenerate AP every 10 min (cron)
- UI: APBar component (similar to game health bar)

**Files:** ~8 files (~1,400 LOC)

**Dependencies:**
- FID-001 (Infrastructure) ✅
- FID-008 (Crystals for refills)
- **Blocks:** Creates friction driving monetization

---

## [FID-010] VIP Subscription Tiers (Bronze/Silver/Gold)
**Status:** PLANNED **Priority:** CRITICAL **Complexity:** 4/5
**Created:** 2025-11-21 **Estimated:** 25-35h (real: ~2-2.5h)

**Description:**
Multi-tier recurring subscription system ($9.99/$24.99/$49.99/month) providing progression acceleration (NOT pure pay-to-win). Bronze: +50% XP, 3 companies, +50 AP. Silver: +100% XP, 10 companies, +150 AP, instant training. Gold: +200% XP, unlimited companies, infinite AP, all time skips free. Includes auto-renewal, payment processing, churn prevention.

**Acceptance:**
- ✅ 3 VIP tiers (Bronze $9.99, Silver $24.99, Gold $49.99 monthly)
- ✅ **Bronze perks:** 3 companies, 25 employees, +50 max AP, +50% XP, auto-collect payouts, no ads, +50 daily crystals
- ✅ **Silver perks:** 10 companies, 100 employees, +150 max AP, +100% XP, +25% contract payouts, instant training, VIP contracts, early feature access, monthly legendary employee, +150 daily crystals
- ✅ **Gold perks:** Unlimited companies/employees, infinite AP, +200% XP, +50% contract payouts, free time skips, VIP marketplace, guaranteed weekly legendary, server announcements, gold nameplate, concierge support, +500 daily crystals
- ✅ Subscription management (upgrade/downgrade/cancel)
- ✅ Auto-renewal (Stripe subscriptions, payment retries)
- ✅ Grace period (3 days after failed payment before downgrade)
- ✅ Churn prevention (offer discount before cancel, exit survey)
- ✅ Pro-rated billing (upgrade mid-month charges difference)
- ✅ Referral system (refer friend → 1 month free Bronze)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Database: Subscription model (userId, tier, status, startDate, nextBilling)
- API: /api/subscriptions (manage), /api/subscriptions/upgrade, /api/subscriptions/cancel
- Stripe: Customer portal integration, webhook handlers
- UI: SubscriptionManager, TierComparison, UpgradePrompts

**Files:** ~15 files (~2,800 LOC)

**Dependencies:**
- FID-008 (Crystals) ✅
- FID-009 (AP system to enhance)
- Stripe Billing API
- **Revenue:** Primary MRR driver ($50k-$260k/month at scale)

---

## [FID-011] Employee Gacha & Legendary Recruitment
**Status:** PLANNED **Priority:** HIGH **Complexity:** 4/5
**Created:** 2025-11-21 **Estimated:** 20-30h (real: ~1.5-2h)

**Description:**
Loot box system for employee recruitment. Standard marketplace has 40-60 skill employees (free). Premium "Executive Headhunter" costs 50 crystals per pull, drops Common (70%), Rare (25%), Epic (4.5%), Legendary (0.5%) employees with 50-100 skills. Pity system guarantees legendary after 100 pulls (ethical gacha). Legendary employees visible status symbols with +10% company-wide bonuses.

**Acceptance:**
- ✅ Employee rarity tiers (Common 50-70, Rare 70-85, Epic 85-95, Legendary 95-100 skills)
- ✅ Premium recruitment gacha (50 crystals per pull)
- ✅ Drop rates (Common 70%, Rare 25%, Epic 4.5%, Legendary 0.5%)
- ✅ Pity system (guaranteed legendary at 100 pulls, counter visible)
- ✅ Free pulls (1/week baseline, +3 from weekly quests)
- ✅ Visual slot machine animation (spinning résumés, suspenseful reveal)
- ✅ Legendary perks (gold nameplate, +10% all contracts, leaderboard tracking)
- ✅ Collection tracking (achievement for "collect all legendary roles")
- ✅ Multi-pull options (10-pull at 450 crystals = 10% discount)
- ✅ Featured legendary rotation (1 week exclusive higher drop rate 2%)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Extend Employee model: rarity, specialAbilities, visualEffects
- GachaEngine utility: weighted random, pity tracking
- API: /api/employees/gacha (pull), /api/employees/gacha/history
- UI: GachaMachine component, PullResultsModal, Collection showcase

**Files:** ~12 files (~2,400 LOC)

**Dependencies:**
- FID-003 (Employee system) ✅
- FID-008 (Crystals for pulls)
- **Revenue:** Whale magnet (chase complete legendary collection)

---

## [FID-012] Contract Lootboxes & Premium Marketplace
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Premium contract packs containing guaranteed high-value deals. Bronze Box (100 crystals) = 5 contracts with 1 guaranteed $200k+. Silver Box (250 crystals) = 10 contracts, 2 guaranteed $500k+. Gold Box (500 crystals) = 20 contracts, 1 guaranteed $5M mega-deal. Free earning via achievements (100 contracts → free Silver Box).

**Acceptance:**
- ✅ Contract lootbox tiers (Bronze/Silver/Gold at 100/250/500 crystals)
- ✅ Guaranteed minimums (Bronze: 1×$200k+, Silver: 2×$500k+, Gold: 1×$5M+)
- ✅ Box contents visible after purchase (no duplicates)
- ✅ Free earning (achievement rewards, streak bonuses)
- ✅ Limited-time boxes (holiday events, +50% value for 48h)
- ✅ Opening animation (chest opening, contract reveals)
- ✅ Contract expiration (must claim within 7 days)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- ContractBox model (boxType, contents[], purchasedAt, claimedAt)
- LootboxGenerator utility: random contract bundles
- API: /api/contracts/lootbox (purchase, open, claim)
- UI: LootboxShop, OpeningAnimation, ContractInventory

**Files:** ~10 files (~1,800 LOC)

**Dependencies:**
- FID-004 (Contract system) ✅
- FID-008 (Crystals)
- **Revenue:** Impulse purchases ($100k-$500k/year)

---

## [FID-013] Time Skip & Instant Completion
**Status:** PLANNED **Priority:** HIGH **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Direct monetization via time acceleration. Training takes 40 game hours (14 real minutes), skip for 200 crystals. Contracts 1-6 hours, skip for 100-500 crystals. Research projects 3 days, skip for 1000 crystals. Free players wait, impatient players pay. Creates 3-5x progression speed advantage while maintaining skill requirement for success.

**Acceptance:**
- ✅ Time skip buttons on all time-gated actions
- ✅ Dynamic pricing (cost scales with time remaining)
- ✅ Training skip (200 crystals = instant +15 skill points)
- ✅ Contract skip (100-500 crystals based on value = instant payout)
- ✅ Research skip (1000 crystals = instant innovation unlock)
- ✅ Cooldown restrictions (can't skip same action type twice in 1 hour - anti-abuse)
- ✅ VIP benefits (Gold VIP = all skips free, Silver = 50% off)
- ✅ Warning prompts (confirm spend, show alternative "wait X time")
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- TimeSkipService utility: calculate skip cost, validate, apply
- API: /api/actions/skip (generic endpoint for all skippable actions)
- UI: SkipButton component (shows cost vs time), ConfirmSkipModal
- Analytics: Track skip usage (identify pain points to optimize)

**Files:** ~8 files (~1,500 LOC)

**Dependencies:**
- FID-005 (Time system) ✅
- FID-008 (Crystals)
- **Revenue:** High-value whales ($50-$500/month on skips)

---

## [FID-014] Reputation Economy & Cross-System Synergy
**Status:** PLANNED **Priority:** HIGH **Complexity:** 5/5
**Created:** 2025-11-21 **Estimated:** 30-40h (real: ~2.5-3h)

**Description:**
Universal reputation system affecting ALL game systems. Business rep (affects loan rates, contract quality), Political rep (election chances, lobbying power), Social rep (employee retention, talent attraction), Industry rep (R&D breakthroughs, partnerships), Ethical score (public perception). Reputation naturally grows slow (+1 per contract), premium acceleration via PR campaigns (500 crystals = +10 rep instantly). Creates interconnected gameplay and monetization hook.

**Acceptance:**
- ✅ 5 reputation categories (Business, Political, Social, Industry, Ethical each 0-100)
- ✅ Reputation impacts:
  - Business: +10 rep = -1% loan APR, +2% contract value
  - Political: +10 rep = +2% vote share, +5% lobbying power
  - Social: +10 rep = +1% employee loyalty, +10% applicant quality
  - Industry: +10 rep = +5% R&D breakthrough chance, +10% partnership likelihood
  - Ethical: +10 = +5% all reputation gains, -10 = scandal risk +20%
- ✅ Natural growth (slow: +1 rep per successful action)
- ✅ Premium acceleration:
  - PR Campaign (500 crystals = +10 any rep)
  - Charity Donation (1000 crystals = +20 Ethical + Social)
  - Media Blitz (750 crystals = +15 Social + Political)
- ✅ Reputation decay (unused categories lose -1/month)
- ✅ Reputation damage (failed contracts -5, employee revolts -10, scandals -30 to -80)
- ✅ Reputation display (5-category radar chart in profile)
- ✅ Cross-system calculations (all bonuses auto-apply)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Extend User model: reputation object with 5 categories
- ReputationEngine: calculate all bonuses, apply globally
- API: /api/reputation (view, boost via crystals)
- UI: ReputationRadarChart, ReputationBoostModal, ImpactCalculator

**Files:** ~18 files (~3,200 LOC)

**Dependencies:**
- All core systems (Company, Employee, Contract, Politics) ✅
- FID-008 (Crystals for boosts)
- **Synergy:** Makes all systems interconnected (addiction hook)

---

## [FID-015] Supply Chain PvP & Resource Marketplace
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 4/5
**Created:** 2025-11-21 **Estimated:** 25-35h (real: ~2-2.5h)

**Description:**
Player-driven economy where industries depend on each other. Energy companies sell power to Tech/Manufacturing (required for GPUs/factories). Manufacturing sells GPUs to AI companies. Media companies sell advertising to all industries. Healthcare sells insurance packages reducing employee costs 15%. Creates economic warfare, monopoly opportunities, and forced interdependence driving player interaction and monetization (buy crystals to afford whale-controlled resources).

**Acceptance:**
- ✅ Resource dependency matrix:
  - Tech/AI requires Energy contracts (100MW per 1000 GPUs)
  - Manufacturing requires Energy contracts (50MW per factory)
  - All industries require Marketing/Media services (advertising)
  - Employee-heavy companies need Healthcare insurance (reduces cost 15%)
- ✅ Player marketplace (buy/sell resources between players)
- ✅ Dynamic pricing (supply/demand algorithm)
- ✅ Monopoly mechanics (players can corner markets, price gouge)
- ✅ Economic warfare (cut off competitor supplies)
- ✅ Guild supply chains (alliance members trade at 20% discount)
- ✅ NPC suppliers (prevent total lockout, but 2x price)
- ✅ Crystal purchases (emergency resource buying at premium)
- ✅ Contract system (weekly resource contracts auto-execute)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- ResourceMarketplace model (resourceType, sellerId, price, quantity)
- SupplyChain utility: dependency checks, auto-deductions
- API: /api/marketplace/resources (list, buy, sell, contracts)
- UI: ResourceMarketplace, SupplyChainDashboard, PriceHistory

**Files:** ~16 files (~2,900 LOC)

**Dependencies:**
- FID-007 (Tech/AI) ✅
- Phase 2 industries (Energy, Manufacturing, Media, Healthcare)
- **Monetization:** Whales monopolize → free players buy crystals to compete

---

## [FID-016] Corruption & Shadow Operations (DARK MONETIZATION)
**Status:** PLANNED **Priority:** LOW **Complexity:** 5/5
**Created:** 2025-11-21 **Estimated:** 30-40h (real: ~2.5-3h)

**Description:**
High-risk/high-reward unethical mechanics driving engagement and monetization. Bribery ($10k-$10M, 60-95% success, 5-30% discovery risk). Corporate espionage (steal competitor R&D for $50k-$500k). Insider trading (3-10x returns, 20% SEC investigation risk). Labor violations (save 30-60% costs, lawsuits/fines). Creates moral dilemmas, temptation mechanics, and "redemption arc" opportunities. Premium "Legal Defense Fund" subscription reduces penalties 50%.

**Acceptance:**
- ✅ Bribery system (bribe officials $10k-$10M, bypass regulations, win govt contracts)
- ✅ Success rates (60-95% based on official's integrity score)
- ✅ Discovery mechanics (5-30% chance caught, penalties: fines, impeachment, reputation -50)
- ✅ Corporate espionage (hire hackers $50k-$500k, steal R&D/financials/employee lists)
- ✅ Espionage consequences (40-80% success, lawsuits, criminal charges if caught)
- ✅ Insider trading (buy stocks before announcements, 3-10x profits, 20% SEC risk)
- ✅ Labor violations (unpaid overtime saves 30%, unsafe conditions saves 20%, lawsuit risks)
- ✅ Political quid pro quo ($1M donation → tax break/contract/deregulation)
- ✅ Scandal system (media exposure, voter backlash, reputation destruction)
- ✅ Redemption mechanics (charity donations, ethical business pivot, reputation rebuilding)
- ✅ Premium defense ($9.99/month Legal Defense Fund = 50% penalty reduction)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- CorruptionAction model (type, target, cost, success, discovered, penalties)
- RiskCalculator utility: probability calculations
- API: /api/corruption (bribe, spy, insider-trade, violate-labor)
- UI: ShadowOperationsPanel (hidden until Level 3), RiskAssessment, ScandalNotifications

**Files:** ~20 files (~3,600 LOC)

**Dependencies:**
- FID-014 (Reputation for damage) ✅
- Politics system (bribery targets)
- **Monetization:** Legal Defense subscription, temptation-driven crystal spending

---

## [FID-017] Daily Quests, Streaks & Battle Pass
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 20-25h (real: ~1.5-2h)

**Description:**
Login habit formation via daily quests (complete 3 contracts, hire 1 employee, etc.), escalating streak rewards (day 1: $10k, day 30: $1M + rare contract, day 365: $50M + legendary employee), and seasonal battle pass ($9.99/3 months with free/premium tracks). Creates FOMO, daily engagement, and recurring revenue stream.

**Acceptance:**
- ✅ Daily quests (5 quests/day: complete contracts, hire, train, increase revenue, political action)
- ✅ Quest rewards ($25k cash + XP per quest)
- ✅ Login streak tracking (consecutive days, visible counter)
- ✅ Escalating streak rewards (day 7: $100k, day 30: $1M + rare contract, day 90: $5M + legendary employee, day 365: $50M + exclusive title)
- ✅ Streak anxiety (notification 18h before streak break)
- ✅ Streak protection (100 crystals = restore broken streak 1x/month)
- ✅ Battle pass system (free track: rewards every 10 levels, premium $9.99: rewards every 5 levels)
- ✅ Season duration (3 months, levels 1-100)
- ✅ XP sources (contracts, quests, achievements, level-ups)
- ✅ Exclusive cosmetics (premium track only: office themes, company logos)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- QuestSystem model (daily quests, progress, completion)
- StreakTracker model (currentStreak, longestStreak, lastLogin)
- BattlePass model (season, level, xp, premium status)
- API: /api/quests (daily, complete), /api/streak (view, protect), /api/battlepass (progress, purchase)
- UI: DailyQuestsPanel, StreakDisplay, BattlePassProgress

**Files:** ~14 files (~2,600 LOC)

**Dependencies:**
- FID-008 (Crystals for streak protection)
- **Revenue:** Battle pass ($9.99 × 25% players = $60k-$250k/season)

---

## [FID-018] FOMO Events & Limited-Time Offers
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Urgency-driven monetization via flash sales (24h 2x crystal packs), weekend bonuses (+50% contract payouts for 48h, VIP gets +100%), monthly legendary events (exclusive employee available 30 days only, never returns), and seasonal battle pass (3-month exclusives). Creates FOMO pressure and impulse purchases.

**Acceptance:**
- ✅ Daily flash sales (different crystal pack 2x bonus each day, 24h countdown)
- ✅ Weekend events (Sat-Sun +50% contract payouts baseline, +100% for VIP)
- ✅ Monthly legendary events (exclusive employee 5000 crystals OR 100h grind event)
- ✅ Seasonal exclusives (battle pass rewards never return after season ends)
- ✅ Holiday sales (Christmas, Black Friday: 3x crystal bonuses)
- ✅ Event notifications (push, email, in-game banners with countdown timers)
- ✅ Scarcity displays ("Only 247 players own this legendary!")
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- EventScheduler service: cron jobs for event timing
- LimitedOffer model (offerType, startDate, endDate, participants)
- API: /api/events (active, participate, claim)
- UI: EventBanner, CountdownTimer, ExclusiveShop

**Files:** ~10 files (~1,800 LOC)

**Dependencies:**
- FID-008 (Crystals) ✅
- FID-011 (Gacha for legendary events)
- **Revenue:** Impulse purchases during FOMO windows

---

## [FID-019] Leaderboards & Social Comparison
**Status:** PLANNED **Priority:** MEDIUM **Complexity:** 3/5
**Created:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Global rankings creating competition and status anxiety. Wealth leaderboard (net worth), Political leaderboard (terms served, bills passed), Industry leaderboards (market share per industry), Reputation leaderboard (highest ethical score), Corruption leaderboard (most scandals survived). Personal comparison ("Beat these 3 to reach top 100"). Real-time notifications ("@Rival just passed you in Tech!"). Drives grinding and monetization via competitive pressure.

**Acceptance:**
- ✅ 5 global leaderboards (Wealth, Political, Industry, Reputation, Corruption)
- ✅ Real-time ranking updates (recalculated every 15 minutes)
- ✅ Personal ranking display ("You are #47 in Wealth, up from #52")
- ✅ Nearby players ("Beat @Player1, @Player2, @Player3 to reach top 100")
- ✅ Historical tracking (peak rank, rank change over time)
- ✅ Notifications (when passed, when passing others, milestone ranks)
- ✅ Leaderboard rewards (top 10 get exclusive titles monthly)
- ✅ F2P separate bracket (free players compete separately, prevents whale dominance)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- LeaderboardCache (Redis): top 100 per category
- RankingService: calculate ranks, send notifications
- API: /api/leaderboards (global, personal, nearby)
- UI: LeaderboardTable, RankDisplay, CompetitiveNotifications

**Files:** ~12 files (~2,200 LOC)

**Dependencies:**
- All gameplay systems (for ranking data)
- **Engagement:** Drives login frequency, status competition

---

## [FID-020] Guild/Alliance System & Mega-Projects
**Status:** PLANNED **Priority:** LOW **Complexity:** 5/5
**Created:** 2025-11-21 **Estimated:** 40-50h (real: ~3-4h)

**Description:**
Cooperative endgame content for retention. Guilds (10-100 players) provide shared contracts (pool resources, split profits), supply chain networks (members trade at 20% discount), political blocs (combined lobbying power), and mega-projects (guild builds Space Station for $500B combined over 6 months, unlocks Space industry). Social retention hook ("staying for friends, not game").

**Acceptance:**
- ✅ Guild creation (10-100 members, founder controls roles/permissions)
- ✅ Shared contracts (guild contract pool, members bid, profits split)
- ✅ Supply chain network (members trade resources 20% below market)
- ✅ Political alliance (combined lobbying power, coordinate voting blocs)
- ✅ Mega-projects (Space Station $500B, Quantum Computer $1T, etc.)
- ✅ Project progression tracking (% complete, contributions, ETA)
- ✅ Guild chat (real-time messaging, announcements)
- ✅ Guild benefits scale with size (10 members: 5% bonuses, 100 members: 25% bonuses)
- ✅ Guild vs Guild competition (territory control, contract wars)
- ✅ TypeScript strict mode: 0 errors

**Approach:**
- Guild model (members, roles, treasury, projects)
- MegaProject model (goal, contributions, rewards, deadline)
- API: /api/guilds (create, join, manage, contribute)
- UI: GuildDashboard, MegaProjectProgress, GuildChat
- Socket.io: Real-time chat and updates

**Files:** ~25 files (~4,500 LOC)

**Dependencies:**
- All core systems ✅
- Socket.io integration
- **Retention:** Social bonds prevent churn (proven by MMOs)

---

## 📊 **MONETIZATION SUMMARY**

**Revenue Projections (50,000 players):**

**Monthly Recurring Revenue (MRR):**
- Bronze VIP (20%): 10,000 × $9.99 = $99,900
- Silver VIP (7%): 3,500 × $24.99 = $87,465
- Gold VIP (3%): 1,500 × $49.99 = $74,985
- Battle Pass (25%): 12,500 × $3.33/mo = $41,625
- Legal Defense (5%): 2,500 × $9.99 = $24,975
**Total MRR: $329,000**

**One-Time Purchases (Monthly Average):**
- Crystal packs (50% spend avg $15/mo): 25,000 × $15 = $375,000
- Time skips (10% whales avg $50/mo): 5,000 × $50 = $250,000
- Gacha pulls (30% spend avg $20/mo): 15,000 × $20 = $300,000
- Contract lootboxes (20% spend avg $10/mo): 10,000 × $10 = $100,000
**Total One-Time: $1,025,000**

**Total Monthly Revenue: $1,354,000**
**Annual Revenue: ~$16.25M**

**At 100k players: ~$32.5M/year**
**At 250k players: ~$81.25M/year**

---

**Free Player Balance:**
- Can reach max level (takes 6-12 months vs 1 month for whales)
- All content accessible with time/skill investment
- Separate F2P leaderboards preserve competitive integrity
- Guild system provides whale protection (coordinate against monopolies)

---

**Ethical Safeguards:**
- Transparent drop rates (published gacha percentages)
- Pity systems prevent pure RNG lockout
- No permanent exclusive content (time-exclusive only)
- Skill ceiling ensures strategy > spending
- Clear "Free path to success" messaging

---

## [FID-021] HeroUI Component Framework Integration
**Status:** IN_PROGRESS **Priority:** HIGH **Complexity:** 3/5
**Created:** 2025-11-21 **Started:** 2025-11-21 **Estimated:** 15-20h (real: ~1-1.5h)

**Description:**
Integrate HeroUI component library into Next.js project as modern UI framework. HeroUI is built on top of Tailwind CSS v4, provides production-ready components, and includes Framer Motion animations already in project. Replaces Chakra UI with more modern, performant alternative while maintaining existing Tailwind CSS infrastructure.

**Progress:**
- ✅ Phase 1: Dependencies installed (Tailwind v4, HeroUI packages, Chakra removed)
- ✅ Phase 2: Configuration complete (hero.ts, tailwind.config.ts, globals.css)
- ✅ Phase 3: Provider setup complete (HeroUIProvider, theme support)
- ⏳ Phase 4: Component migration needed (28 files use Chakra UI imports)

**Acceptance:**
- ✅ Tailwind CSS upgraded to v4 (from v3.4.18)
- ✅ HeroUI packages installed (@heroui/react, @heroui/system, @heroui/theme)
- ✅ `hero.ts` config file created with HeroUI plugin and theme
- ✅ `tailwind.config.ts` updated to import from hero.ts
- ✅ Global CSS updated with `@import "@heroui/theme/styles.css"`
- ✅ `HeroUIProvider` added to providers.tsx
- ✅ Root layout wrapped with HeroUIProvider
- ✅ Dark/light theme support configured (className="light" on html)
- ✅ Chakra UI dependencies removed from package.json
- ⏳ Component migration: 28 files need Chakra → HeroUI updates
- ⏳ TypeScript strict mode: 0 errors (currently 41 errors from Chakra imports)
- ⏳ Next.js builds successfully with HeroUI

**Approach:**

**Phase 1: Dependency Management** (~10 min) ✅ COMPLETE
1. ✅ Upgrade Tailwind CSS: `npm install -D tailwindcss@next`
2. ✅ Install HeroUI packages: `npm install @heroui/react @heroui/system @heroui/theme`
3. ✅ Remove Chakra UI: `npm uninstall @chakra-ui/react @chakra-ui/next-js @chakra-ui/icons @emotion/react @emotion/styled`

**Phase 2: Configuration** (~15 min) ✅ COMPLETE
1. ✅ Create `hero.ts` config file with HeroUI plugin and custom theme
2. ✅ Update `tailwind.config.ts` to import from hero.ts
3. ✅ Update `src/app/globals.css` with HeroUI styles import
4. ✅ Verify Framer Motion compatibility (v11.18.2 meets v11.9+ requirement)

**Phase 3: Provider Setup** (~20 min) ✅ COMPLETE
1. ✅ Update `src/app/providers.tsx` to replace ChakraProvider with HeroUIProvider
2. ✅ Update `src/app/layout.tsx` to add className="light" for theme control
3. ✅ Configure theme switching capability (ready for dark mode toggle)
4. ✅ Test provider initialization

**Phase 4: Component Migration** (~14-16h estimated) ⏳ PENDING
- **28 files** currently importing from '@chakra-ui/react' need migration
- **Component mapping** (Chakra → HeroUI equivalents):
  - Box → div with Tailwind classes or HeroUI Card
  - Button → @heroui/button
  - Progress → @heroui/progress
  - Badge → @heroui/chip
  - VStack/HStack → Tailwind flex classes
  - Container → div with container classes
  - Alert → @heroui/snippet or custom component
  - Tooltip → @heroui/tooltip
  - Spinner → @heroui/spinner
  - Modal → @heroui/modal
  - Input/Select → @heroui/input, @heroui/select
  - useToast → custom implementation or react-toastify (already installed)

**Files Affected:**
- Pages: 14 files (app/game/*, app/page.tsx, app/test-infrastructure)
- Components: 13 files (lib/components/**)
- Hooks: 1 file (lib/hooks/ui/useToast.ts)

**Files Modified:** ~6 files modified (~500 LOC)

**Modified Files:**
- [MOD] `package.json` - Upgraded Tailwind, added HeroUI, removed Chakra (~30 lines)
- [NEW] `hero.ts` - HeroUI configuration with themes (~105 lines)
- [MOD] `tailwind.config.ts` - Import hero.ts config (~15 lines)
- [MOD] `src/app/globals.css` - Add HeroUI styles import (~40 lines with docs)
- [MOD] `src/app/providers.tsx` - Replace ChakraProvider with HeroUIProvider (~65 lines)
- [MOD] `src/app/layout.tsx` - Add theme className (~70 lines with docs)

**Dependencies:**
- FID-001 (Infrastructure) ✅
- Existing Tailwind CSS (upgraded to v4) ✅
- Existing Framer Motion v11.18.2 ✅

**Notes:**
- Tailwind CSS v4 is backward-compatible (existing styles unaffected)
- HeroUI extends Tailwind, doesn't replace it
- Component migration can be done incrementally (file by file)
- 28 files need Chakra → HeroUI component updates before full build success
- Theme toggle component needed for dynamic dark/light switching (future enhancement)
- **INFRASTRUCTURE COMPLETE** - Component migration split to FID-022 for focused delivery

---

## 📊 **MONETIZATION SUMMARY**


---

---

---

