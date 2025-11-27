# 🏛️ Politics-Business Integration System

**Created:** 2025-11-15  
**Version:** 1.0.0  
**ECHO:** v1.0.0  
**Status:** DESIGN COMPLETE

---

## 📋 Executive Summary

### **The Vision**
This is a **politics game** where business success is the path to political power. Players build companies to generate wealth, then leverage that wealth to influence policy, run campaigns, and ultimately run for political office themselves.

### **Core Gameplay Loop**
```
Build Business → Generate Wealth → Donate to Campaigns → Gain Political Connections
    ↓                                                              ↓
Influence Policy ← Lobbying Power ← Company Growth ← Favorable Legislation
    ↓
Run for Office (Mayor → Governor → Congress → President)
    ↓
Win Election Using Business Fortune + Political Network
    ↓
ENDGAME: Control Government While Owning Business Empire
```

---

## 🎯 Political Influence by Company Level

### **Level 1-2: No Political Power (Local Focus)**

**Company Status:** Startup/Small Business  
**Political Reach:** None  
**Available Actions:** None (too small to matter)

**Gameplay:**
- Focus entirely on building business
- No political options available
- Must reach Level 3 to enter politics

---

### **Level 3: Local Politics Entry**

**Company Status:** Regional Corporation  
**Political Reach:** City/County Level  
**Budget:** Up to $50,000/year in political spending

**Available Actions:**

1. **Campaign Donations** ($500-$50,000)
   - Donate to mayoral candidates
   - Support city council members
   - Contribute to local ballot measures
   - **Benefit:** Gain favor with local politicians

2. **Attend Fundraisers** (Networking Events)
   - Meet local politicians
   - Build relationships with power brokers
   - Get "inside track" on upcoming policy changes
   - **Benefit:** Advanced notice of zoning changes, permits, regulations

3. **Small-Scale Lobbying** (10 Power Points)
   - Push for favorable zoning approvals
   - Request expedited permit processing
   - Advocate for local tax incentives
   - **Benefit:** Easier business expansion in city

4. **Run for Local Office** (OPTIONAL)
   - Mayor of small/medium city
   - City council member
   - County commissioner
   - **Requirement:** $50k+ net worth, strong local reputation
   - **Benefit:** Direct control over local policies

**Example Politics Gameplay (Level 3 Retail Company):**

```
Player owns 10 retail stores in Ohio.
↓
Donates $20k to Columbus mayoral candidate (pro-business)
↓
Candidate wins, remembers donation
↓
Player requests expedited permits for 3 new store locations
↓
Permits approved in 2 weeks instead of 6 months
↓
Player expands faster than competitors
↓
Gains market dominance in Columbus
```

---

### **Level 4: State & Federal Politics**

**Company Status:** National Corporation  
**Political Reach:** State Legislatures + U.S. Congress  
**Budget:** Up to $500,000/year in political spending

**Available Actions:**

1. **Major Campaign Donations** ($10,000-$500,000)
   - Donate to gubernatorial candidates
   - Support U.S. Senate/House candidates
   - Fund state ballot measure campaigns
   - **Benefit:** Access to state/federal lawmakers

2. **Professional Lobbying** (50 Power Points)
   - Hire K Street lobbying firms
   - Push for industry-favorable legislation
   - Block unfavorable regulations
   - **Benefit:** Shape actual laws in your industry

3. **PAC Creation** (Political Action Committee)
   - Create company PAC to bundle donations
   - Coordinate political strategy across industry
   - Support multiple candidates simultaneously
   - **Benefit:** Industry-wide political influence

4. **Trade Policy Influence**
   - Lobby for tariffs protecting your industry
   - Push for trade deals favoring your products
   - Block imports from foreign competitors
   - **Benefit:** Market protection, reduced competition

5. **Tax Policy Influence**
   - Advocate for corporate tax cuts
   - Push for industry-specific tax credits
   - Create tax loopholes benefiting your business
   - **Benefit:** Massive tax savings

6. **Run for State Office** (OPTIONAL)
   - Governor
   - U.S. Senator
   - U.S. Representative
   - State Attorney General
   - **Requirement:** $5M+ net worth, national reputation
   - **Benefit:** Direct control over state/federal policy

**Example Politics Gameplay (Level 4 Manufacturing Company):**

```
Player owns national manufacturing company (steel, automotive parts)
↓
Hires lobbying firm for $100k/year
↓
Lobbying firm pushes for 25% tariff on Chinese steel imports
↓
Congress debates tariff bill
↓
Player donates $250k to 10 key senators on trade committee
↓
Bill passes, 25% tariff imposed
↓
Chinese steel now 25% more expensive (non-competitive)
↓
Player's steel company gains massive market share
↓
Revenue increases 40%, profits soar
```

---

### **Level 5: National Politics & Regulatory Capture**

**Company Status:** Fortune 500 / Global Giant  
**Political Reach:** Federal Government + International  
**Budget:** $1M-$10M+/year in political spending

**Available Actions:**

1. **Unlimited Campaign Donations** ($100k-$10M+)
   - Presidential campaigns
   - Senate/House leadership
   - National party committees
   - **Benefit:** Direct access to President, Cabinet, Congressional leaders

2. **Regulatory Capture** (200 Power Points)
   - Appoint industry "experts" to regulatory agencies
   - Write legislation directly (lobbyists draft bills)
   - Control regulatory rulemaking process
   - **Benefit:** Legal monopoly status, competitors destroyed

3. **Super PAC Funding**
   - Fund unlimited independent expenditures
   - Run political ads supporting/opposing candidates
   - Shape national political narrative
   - **Benefit:** Control electoral outcomes

4. **International Trade Influence**
   - Shape U.S. trade policy globally
   - Push for sanctions on competitor nations
   - Secure favorable trade agreements
   - **Benefit:** Global market dominance

5. **Government Contracts** (Billions)
   - Secure no-bid government contracts
   - Become "too big to fail" (government dependence)
   - Defense contracts, infrastructure projects
   - **Benefit:** Guaranteed revenue from taxpayers

6. **Run for President** (ULTIMATE ENDGAME)
   - Billionaire presidential candidate
   - Self-fund campaign ($100M-$1B+)
   - Use business success as campaign credential
   - **Requirement:** $500M+ net worth, national fame
   - **Benefit:** TOTAL CONTROL - Own business empire AND government

**Example Politics Gameplay (Level 5 Energy Company):**

```
Player owns Fortune 500 oil/gas company
↓
Donates $5M to presidential campaign
↓
Candidate wins, appoints player's former executive as Energy Secretary
↓
Energy Secretary approves offshore drilling permits (previously blocked)
↓
Player gains exclusive drilling rights in Gulf of Mexico
↓
Meanwhile, player lobbies Congress for $10B renewable energy subsidies
↓
Congress passes bill (written by player's lobbyists)
↓
Player's company receives $2B in subsidies
↓
Uses subsidies to fund "green" division while expanding oil operations
↓
Reputation boost ("going green") while profits soar
↓
Player becomes billionaire
↓
ENDGAME CHOICE:
  Option A: Sell companies, run for President
  Option B: Stay in business, control government from shadows
  Option C: Both (keep companies, install puppet politicians)
```

---

## 💰 Political Spending System

### **Donation Mechanics**

```typescript
interface CampaignDonation {
  donor: Company;
  recipient: Politician;
  amount: number;
  electionType: 'Local' | 'State' | 'Federal';
  electionYear: number;
  
  // Effects
  influenceGained: number;      // Relationship points with politician
  favorReturned: boolean;       // Did politician deliver?
  returnOnInvestment: number;   // $ gained from favorable policies
  
  // Tracking
  donatedAt: Date;
  publicRecord: boolean;        // FEC filings show donations
}

// Donation limits by company level
const DONATION_LIMITS = {
  1: 0,           // Cannot donate
  2: 5000,        // $5k to local candidates
  3: 50000,       // $50k to local/state
  4: 500000,      // $500k to state/federal
  5: 10000000     // $10M to federal/presidential
};
```

### **Lobbying Mechanics**

```typescript
interface LobbyingAction {
  company: Company;
  policyTarget: string;         // "Corporate tax rate", "Trade tariffs", etc.
  desiredOutcome: string;       // "Reduce from 21% to 15%"
  powerPointsSpent: number;     // Lobbying budget
  
  // Success probability (higher spending = higher chance)
  baseProbability: number;      // 30-70% based on policy difficulty
  donationBonus: number;        // +10% per $100k in recent donations
  reputationBonus: number;      // +5% per 10 reputation points
  oppositionStrength: number;   // -% based on counter-lobbying
  
  finalProbability: number;     // Total success chance
  
  // Outcome
  status: 'Pending' | 'Success' | 'Failure';
  outcomeDescription: string;   // What actually happened
  financialImpact: number;      // $ saved/gained if successful
  
  resolvedAt: Date;
}

// Lobbying power by company level
const LOBBYING_POWER = {
  1: 0,    // No lobbying capability
  2: 0,    // No lobbying capability
  3: 10,   // 10 power points (local policy only)
  4: 50,   // 50 power points (state/federal policy)
  5: 200   // 200 power points (regulatory capture)
};
```

### **Return on Investment (ROI) Tracking**

**Example ROI Calculations:**

| Political Action | Cost | Benefit | ROI | Payback Time |
|-----------------|------|---------|-----|--------------|
| Local permit expedition | $10k donation | Save $50k in delays | 5x | Immediate |
| State tax credit lobbying | $100k lobbying | $2M/year tax savings | 20x | 6 weeks |
| Federal tariff protection | $500k donations | $50M/year revenue boost | 100x | 3 months |
| Regulatory capture | $5M political spending | $500M monopoly profits | 100x | 1 year |

**Key Insight:** Political spending has **absurd ROI** compared to normal business operations. This creates moral dilemma gameplay.

---

## 🎮 Government Contract System

### **Contract Tiers by Company Level**

| Level | Contract Type | Value | Requirements |
|-------|--------------|-------|-------------|
| **L1** | Small local contracts | $5k-$50k | None (open bidding) |
| **L2** | County contracts | $50k-$250k | 5+ employees |
| **L3** | State contracts | $250k-$5M | Political connections helpful |
| **L4** | Federal contracts | $5M-$500M | Lobbying/donations almost required |
| **L5** | Mega defense contracts | $500M-$50B | Regulatory capture essential |

### **Competitive Bidding vs. Political Favoritism**

```typescript
interface GovernmentContract {
  agency: string;
  contractValue: number;
  duration: number; // months
  
  // Bid evaluation
  technicalScore: number;       // 0-100 (actual capability)
  priceScore: number;           // 0-100 (competitiveness)
  politicalScore: number;       // 0-100 (donations, lobbying, connections)
  
  // Final score (weighted)
  finalScore: number; // 40% technical + 30% price + 30% political
  
  // Winner determination
  winner: Company;
  reasoning: string;
}

// Political score calculation
function calculatePoliticalScore(company: Company): number {
  let score = 0;
  
  // Recent donations to elected officials overseeing agency
  score += company.recentDonations * 0.5; // Max 50 points
  
  // Lobbying power points spent on agency
  score += company.lobbyingPower * 0.3; // Max 30 points
  
  // Former government employees on board/staff (revolving door)
  score += company.formerOfficials * 20; // Max 20 points
  
  return Math.min(score, 100);
}
```

**Example: Defense Contract Competition**

```
$10B fighter jet maintenance contract
↓
Company A (Level 4): 
  - Technical: 90/100 (excellent capability)
  - Price: 85/100 (competitive bid)
  - Political: 30/100 (minimal lobbying)
  - Final Score: 68.5

Company B (Level 5 - PLAYER):
  - Technical: 75/100 (adequate capability)
  - Price: 70/100 (slightly higher bid)
  - Political: 95/100 ($2M in donations, hired 3 former generals)
  - Final Score: 79.5
↓
PLAYER WINS despite worse tech/price (politics dominated)
↓
Moral dilemma: Is this corruption or just "how the game is played"?
```

---

## 🗳️ Running for Office System

### **Campaign Mechanics**

```typescript
interface PoliticalCampaign {
  candidate: Player;
  office: 'Mayor' | 'Governor' | 'Senator' | 'Representative' | 'President';
  
  // Requirements
  minimumNetWorth: number;      // Mayor: $50k, President: $500M
  minimumReputation: number;    // 70+ reputation required
  politicalConnections: number; // Donor/lobbying history
  
  // Campaign resources
  campaignFund: number;         // Self-funded or donations
  staffSize: number;            // Campaign manager, volunteers, etc.
  mediaSpend: number;           // TV ads, digital, mailers
  
  // Electoral strategy
  platform: string[];           // Policy promises
  targetDemographic: string;    // Who you're appealing to
  attacks: boolean;             // Negative ads against opponent?
  
  // Election mechanics
  pollingAverage: number;       // 0-100% support
  opponentStrength: number;     // How tough is the race?
  
  // Outcome
  votesReceived: number;
  votesNeeded: number;
  won: boolean;
  electionDate: Date;
}
```

### **Campaign Costs by Office**

| Office | Minimum Spend | Competitive Spend | Self-Fund Option |
|--------|--------------|------------------|------------------|
| **Mayor (Small City)** | $50k | $100k-$500k | Yes (L3+) |
| **Mayor (Large City)** | $500k | $1M-$5M | Yes (L4+) |
| **Governor** | $5M | $20M-$100M | Yes (L4+) |
| **U.S. Senator** | $10M | $30M-$150M | Yes (L5+) |
| **U.S. Representative** | $2M | $5M-$15M | Yes (L4+) |
| **President** | $100M | $500M-$2B | Yes (L5 billionaires only) |

### **Winning Strategy**

```typescript
// Presidential campaign example
function calculateElectionChance(campaign: PoliticalCampaign): number {
  let winProbability = 50; // Start at 50/50
  
  // Spending advantage (diminishing returns)
  const spendingRatio = campaign.campaignFund / campaign.opponentFund;
  if (spendingRatio > 1) {
    winProbability += Math.min(Math.log2(spendingRatio) * 10, 20); // Max +20%
  }
  
  // Business success narrative (+credibility)
  if (campaign.candidate.netWorth > 1_000_000_000) {
    winProbability += 10; // "Successful businessman" bonus
  }
  
  // Reputation/likability
  winProbability += (campaign.candidate.reputation - 50) * 0.3;
  
  // Political experience
  if (campaign.candidate.priorOffice) {
    winProbability += 15; // "Not a political novice" bonus
  }
  
  // Scandal damage
  campaign.candidate.scandals.forEach(scandal => {
    winProbability -= scandal.severity * 2; // Scandals hurt badly
  });
  
  // Economic conditions (out of player control)
  const economicBonus = getEconomicConditions(); // -10 to +10
  winProbability += economicBonus;
  
  return Math.max(0, Math.min(100, winProbability));
}
```

---

## ⚖️ Moral Dilemma Gameplay

### **Ethical Choices with Real Consequences**

**Scenario 1: The Tax Loophole**
```
Senator you donated $100k to introduces tax bill
↓
Bill creates loophole saving your company $5M/year
↓
BUT: Bill increases taxes on middle class to compensate
↓
CHOICE:
  A) Support bill (save $5M, reputation -10)
  B) Oppose bill publicly (lose $5M, reputation +20)
  C) Support privately, oppose publicly (save $5M, reputation -5, risk exposure)
```

**Scenario 2: The Bribe**
```
Local mayor requests $50k "donation" for re-election
↓
In exchange, promises to block competitor's permit
↓
CHOICE:
  A) Pay the bribe (eliminate competitor, reputation -20, legal risk)
  B) Report to authorities (lose business advantage, gain reputation +30)
  C) Pay but leak to media (destroy mayor AND competitor, high risk/reward)
```

**Scenario 3: The Monopoly**
```
Your Level 5 company dominates industry (80% market share)
↓
Department of Justice announces antitrust investigation
↓
CHOICE:
  A) Spend $10M lobbying to kill investigation (likely success, reputation -30)
  B) Fight in court (50/50 chance, $50M legal costs, could lose company)
  C) Voluntary breakup (keep reputation, lose market power)
  D) Bribe Attorney General (90% success, massive reputation -50, prison risk)
```

**Scenario 4: The Presidential Run**
```
You've built $10B business empire
↓
Consider running for President
↓
CHOICE:
  A) Self-fund $1B campaign (keep control, 60% win chance)
  B) Accept corporate donations (80% win chance, owe favors)
  C) Stay in business (keep building empire, no political power)
  D) Sell companies, run as "outsider" (90% win chance, lose business)
```

---

## 🎯 Endgame Victory Conditions

### **Win Condition 1: Business Dominance**
- Own Level 5 companies in 5+ industries
- Control 50%+ market share in 3+ industries
- Net worth > $100 billion
- **Status:** Business Tycoon

### **Win Condition 2: Political Power**
- Elected President of United States
- OR control 50+ members of Congress (donations/lobbying)
- OR appointed Cabinet Secretary
- **Status:** Political Kingmaker

### **Win Condition 3: Ultimate Power**
- Elected President WHILE owning $10B+ business empire
- Control government AND industry simultaneously
- **Status:** American Oligarch (Highest Achievement)

### **Win Condition 4: Billionaire Philanthropist**
- Net worth > $10B
- Reputation > 90
- Never bribed politicians, always ethical
- **Status:** Moral Victor (Hardest Path)

---

## 📊 Implementation Priority

### **Phase 1: Foundation (HIGH PRIORITY)**
- Campaign donation system (Level 3+)
- Basic lobbying mechanics (Level 4+)
- Government contract bidding

### **Phase 2: Advanced Politics (MEDIUM PRIORITY)**
- PAC creation
- Regulatory influence
- Run for local office (Mayor)

### **Phase 3: National Politics (LOW PRIORITY - POST-MVP)**
- Federal lobbying
- Presidential campaigns
- Regulatory capture mechanics
- Multi-office management

### **Phase 4: Moral Dilemmas (POLISH PHASE)**
- Scandal system
- Ethical choice scenarios
- Reputation impact from political actions
- Investigative journalism events

---

**Integration with Company Level System:** This politics system scales perfectly with the 5-level company progression. Political power is EARNED through business success, creating a cohesive gameplay loop where business and politics are inseparable.

---

*Specification maintained by ECHO v1.0.0*  
*Created: 2025-11-15*  
*Status: DESIGN COMPLETE - Ready for integration*
