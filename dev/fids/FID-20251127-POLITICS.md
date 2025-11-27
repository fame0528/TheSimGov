# FID-20251127-POLITICS: Politics Domain - Core Gameplay System

**Feature ID:** FID-20251127-POLITICS  
**Domain:** Politics  
**Created:** 2025-11-27  
**Priority:** CRITICAL (P0)  
**Complexity:** 5/5 (Very High)  
**Status:** PLANNED  

---

## Overview

Politics is the **central gameplay loop** of TheSimGov, where players engage in electoral politics, campaign management, policy-making, and lobbying. This domain deeply integrates with Crime (legalization bills, enforcement budgets), Business (tax policy, regulations), and Employees (government jobs, public sector unions).

**Core Vision:** Players run for office, campaign across districts, raise donations, propose/vote on legislation, and influence policy outcomes that affect all other game domains.

**Key Differentiators:**
- **Real Electoral Mechanics**: Primaries, general elections, runoffs with district-level voting
- **Dynamic Policy System**: Bills proposed by players, voted on by legislature, real impact across domains
- **Campaign Strategy**: Fundraising, voter outreach, messaging, opposition research
- **Lobbying & Influence**: Players lobby for bills, donate to campaigns, build political networks
- **Cross-Domain Impact**: Tax rates affect Business revenue, legalization transforms Crime operations, labor laws impact Employees

---

## Core Loops & Integrations

### Primary Gameplay Loop
```
Announce Candidacy → Build Campaign → Raise Funds → Conduct Outreach → 
Win Election → Propose Bills → Vote on Legislation → Bills Pass/Fail → 
Policy Effects Cascade → Players Respond → New Campaign Cycle
```

### Campaign Loop
```
Set Campaign Strategy → Allocate Budget (Ads, Events, Staff) → 
Target Districts → Conduct Voter Outreach → Track Polling → 
Adjust Messaging → Election Day → Win/Lose → Analyze Results
```

### Policy Loop
```
Identify Issue → Draft Bill → Build Coalition → Lobby Support → 
Committee Vote → Floor Vote → Executive Action → Implementation → 
Domain Effects (Crime legalization, Business taxes, Employee regulations)
```

### Cross-Domain Integration
- **Crime**: Legalization bills convert illegal operations to legal businesses; enforcement budgets affect heat/raids; sentencing policy impacts arrest consequences
- **Business**: Tax rates (corporate, sales, property) affect revenue; regulations impact operations; subsidies/incentives drive investment
- **Employees**: Labor laws (minimum wage, unions, benefits); government job creation; public sector contracts
- **Shared Infrastructure**: Real-time notifications for votes, election results; achievements for electoral victories; leaderboards for campaign fundraising

---

## P0 Feature Set (6 Comprehensive Systems)

### 1. Election Dashboard (Foundation)
**Description:** Central hub showing active races, upcoming elections, current office-holders, election calendar, and player's electoral status.

**Core Features:**
- **Active Races Grid**: All current campaigns with candidates, districts, party, polling, days until election
- **Election Calendar**: Primaries, general elections, runoffs, special elections with countdown timers
- **Office Holders Directory**: Current officials (Governor, State Legislature, Mayor, etc.) with term info
- **Player Status Card**: Current offices held, term expiration, eligibility for next race
- **Historical Results**: Past election outcomes, vote margins, turnout data
- **District Map View**: Interactive map showing districts colored by party control, competitive races

**API Surface:**
- `GET /api/politics/elections` - List all active/upcoming elections
- `GET /api/politics/elections/:id` - Election details with candidates
- `GET /api/politics/office-holders` - Current officials by office type
- `GET /api/politics/player-status` - Player's electoral history and eligibility

**Estimate:** 8-10 hours

---

### 2. Campaign Manager (Strategic Core)
**Description:** Comprehensive campaign management system for running electoral campaigns including strategy, budgeting, staffing, and real-time performance tracking.

**Core Features:**
- **Campaign Creation**: Announce candidacy for office (Governor, State Senate, State House, Mayor, etc.)
- **Campaign Strategy Dashboard**: 
  - Budget allocation (TV Ads, Digital Ads, Direct Mail, Events, Staff, Ground Game)
  - Target district selection (priority precincts, swing voters, base turnout)
  - Messaging themes (Economy, Crime, Education, Healthcare, Environment)
  - Opposition research (opponent weaknesses, voting record, scandals)
- **Staff Management**: Hire campaign manager, field organizers, communications director, finance director (from Employees domain)
- **Performance Metrics**: 
  - Polling trends (daily tracking, favorability, name recognition)
  - Fundraising vs. burn rate
  - Volunteer hours, doors knocked, calls made
  - Media coverage (positive/neutral/negative mentions)
- **Real-Time Adjustments**: Respond to events (scandals, endorsements, policy news) by reallocating budget/messaging
- **Election Night Dashboard**: Live vote counting, district-by-district results, victory/concession

**Campaign Types:**
- Primary (compete against same party)
- General Election (party vs. party)
- Runoff (if no majority)
- Special Election (fill vacancy)

**API Surface:**
- `POST /api/politics/campaigns` - Announce candidacy
- `PATCH /api/politics/campaigns/:id/strategy` - Update campaign strategy
- `PATCH /api/politics/campaigns/:id/budget` - Reallocate campaign funds
- `GET /api/politics/campaigns/:id/polling` - Current polling data
- `GET /api/politics/campaigns/:id/metrics` - Performance dashboard data
- `POST /api/politics/campaigns/:id/respond-to-event` - Handle campaign event (scandal, endorsement)

**Estimate:** 16-20 hours

---

### 3. Voter Outreach & Ground Game
**Description:** Tools for direct voter contact including phone banking, door knocking, events, and volunteer coordination to maximize turnout.

**Core Features:**
- **Phone Banking**: Call voters with scripted messages; track responses (Strong Support, Lean Support, Undecided, Lean Oppose, Strong Oppose)
- **Door Knocking (Canvassing)**: Send volunteers to target precincts; record voter sentiment; identify supporters for GOTV
- **Town Halls & Events**: Host public events in districts; answer voter questions; generate media coverage
- **Volunteer Coordination**: Recruit volunteers; assign tasks (calls, canvassing, events); track hours contributed
- **Voter Database**: CRM-style voter records with contact history, issue priorities, turnout likelihood
- **Get Out The Vote (GOTV)**: Final days surge targeting identified supporters with reminders, transportation, poll location info
- **Micro-Targeting**: Segment voters by demographics, issue priorities, voting history for personalized outreach

**Outreach Mechanics:**
- **Effectiveness**: Depends on volunteer skills (from Employees), campaign budget, district demographics
- **Persuasion**: Undecided voters influenced by messaging alignment with their issue priorities
- **Turnout**: Strong supporters more likely to vote if contacted 2+ times in final week

**API Surface:**
- `POST /api/politics/outreach/phone-bank` - Initiate phone banking session
- `POST /api/politics/outreach/canvass` - Send canvassers to district
- `POST /api/politics/outreach/events` - Schedule campaign event
- `POST /api/politics/outreach/volunteers/recruit` - Recruit volunteer
- `POST /api/politics/outreach/volunteers/assign` - Assign volunteer to task
- `GET /api/politics/outreach/voter-database` - Query voter records
- `POST /api/politics/outreach/gotv` - Activate GOTV operations

**Estimate:** 14-18 hours

---

### 4. Policy Tracker & Bill Management
**Description:** Legislative system for proposing bills, tracking legislation, voting, and implementing policy changes that affect all game domains.

**Core Features:**
- **Bill Creation Wizard**: 
  - Bill type (Tax, Regulation, Budget, Social Policy, Criminal Justice, Labor, Environment)
  - Policy details (tax rate changes, substance legalization, minimum wage, etc.)
  - Fiscal impact estimate (revenue/cost to state budget)
  - Affected domains (Crime, Business, Employees, etc.)
- **Legislative Pipeline**:
  - Introduction → Committee Assignment → Committee Vote → Floor Vote → Executive Action (sign/veto) → Implementation
  - Status tracking with stage, votes needed, current support/opposition
- **Voting System**: 
  - Players vote on bills if they hold legislative office
  - Vote outcomes determine bill passage (simple majority, supermajority for overrides)
  - Roll call votes recorded in player's voting record
- **Policy Library**: All active laws with implementation status, effects, sunset dates
- **Impact Dashboard**: Real-time view of how policies affect domain metrics (crime rates, business revenue, employment)

**Example Bills (Crime Integration):**
- **Cannabis Legalization Act**: Legalizes recreational cannabis; converts illegal facilities to legal dispensaries; adds 10% state tax
- **Sentencing Reform Act**: Reduces penalties for drug possession; lowers heat accumulation rates
- **Enforcement Budget Act**: Increases/decreases police funding; affects raid frequency, checkpoint intensity

**Example Bills (Business Integration):**
- **Corporate Tax Rate Act**: Changes corporate income tax (affects Business revenue)
- **Small Business Relief Act**: Tax credits for companies < 50 employees
- **Regulatory Streamlining Act**: Reduces compliance costs for specific industries

**Example Bills (Employees Integration):**
- **Minimum Wage Act**: Sets state minimum wage (affects Employee salaries, Business costs)
- **Public Sector Union Rights Act**: Strengthens/weakens union organizing (affects government Employees)
- **Paid Family Leave Act**: Mandates leave benefits (affects Employee satisfaction, Business costs)

**API Surface:**
- `POST /api/politics/bills` - Create new bill
- `GET /api/politics/bills` - List all bills with filters (status, type, sponsor)
- `GET /api/politics/bills/:id` - Bill details with vote counts, amendments
- `POST /api/politics/bills/:id/vote` - Cast vote on bill (if player is legislator)
- `PATCH /api/politics/bills/:id/amend` - Propose amendment
- `POST /api/politics/bills/:id/executive-action` - Sign or veto (if player is executive)
- `GET /api/politics/policies/active` - All implemented policies with effects

**Estimate:** 18-22 hours

---

### 5. Donor Management & Fundraising
**Description:** Campaign finance system for raising funds, managing donors, compliance with contribution limits, and spending transparency.

**Core Features:**
- **Donor Database**: Track individual donors with contribution history, contact info, donor type (individual, PAC, business, union)
- **Fundraising Events**: Host fundraisers (dinners, receptions, online drives) with attendance, revenue, costs
- **Online Donations**: Players donate to campaigns (self or others); payment processing via escrow
- **Contribution Limits**: Enforce legal limits (individuals $5K/cycle, PACs $10K/cycle, businesses/unions $15K/cycle)
- **Bundling**: Donors recruit networks of contributors for larger aggregate impact
- **Finance Reports**: Quarterly filings showing receipts, expenditures, cash on hand (public transparency)
- **Donor Engagement**: Email campaigns, thank-you notes, VIP events to retain major donors
- **Super PACs (P1)**: Independent expenditure groups (not coordinated with campaigns)

**Fundraising Mechanics:**
- **Donor Targeting**: High-net-worth individuals, industry groups aligned with policy positions, unions (for labor-friendly candidates)
- **Solicitation**: Direct asks via phone/email; event invitations; bundling networks
- **Donor Motivation**: Policy alignment (crime legalization supporters donate to reform candidates), access (big donors get face time with officials)

**API Surface:**
- `GET /api/politics/donors` - Donor database with filters
- `POST /api/politics/donations` - Record donation (player → campaign)
- `POST /api/politics/fundraising/events` - Schedule fundraiser
- `GET /api/politics/fundraising/reports` - Finance reports (public)
- `POST /api/politics/donors/bundle` - Coordinate bundled contributions

**Estimate:** 12-16 hours

---

### 6. District Map & Demographic Analyzer
**Description:** Interactive map tools for analyzing districts, voter demographics, electoral trends, and strategic targeting.

**Core Features:**
- **Interactive Map**: 
  - US state map with districts (State Senate, State House, Congressional, etc.)
  - Click district to view demographics, voting history, current representative
  - Color-coded by party control, competitiveness (safe, lean, toss-up)
- **Demographic Breakdown**: 
  - Age, race, income, education, urban/suburban/rural split
  - Issue priorities (economy, crime, healthcare, education)
  - Voter registration (party affiliation, turnout history)
- **Electoral History**: 
  - Past election results by district (winning margins, turnout)
  - Swing trends (districts trending left/right)
  - Incumbent advantage metrics
- **Strategic Targeting**: 
  - Identify competitive districts for campaign focus
  - Find persuadable voters (independents, weak partisans)
  - Target demographics with issue-specific messaging
- **Redistricting (P1)**: Redraw district boundaries (every 10 years); gerrymandering mechanics

**Data Integration:**
- Real US Census data for demographics
- Historical election results (synthesized for game)
- Voter file data (simulated registration, turnout)

**API Surface:**
- `GET /api/politics/districts` - List all districts with summary stats
- `GET /api/politics/districts/:id` - Detailed district demographics, history
- `GET /api/politics/districts/:id/voters` - Voter file data for district
- `GET /api/politics/districts/competitive` - Identify swing districts

**Estimate:** 10-14 hours

---

## P1 Expansion Features (Future)

- **Super PACs & Independent Expenditures**: Unlimited spending groups not coordinated with campaigns
- **Endorsements System**: Unions, newspapers, party leaders endorse candidates (boosts polling)
- **Debates**: Live debate events with Q&A, opponent attacks, fact-checking (audience reaction)
- **Media Relations**: Press releases, interviews, spin room (manage media narrative)
- **Opposition Research**: Investigate opponents for scandals, voting record inconsistencies
- **Political Parties**: Party platforms, primaries, conventions, party discipline
- **Ballot Initiatives**: Direct democracy (voters vote on policies directly, bypassing legislature)
- **Judicial Appointments**: Governors/Presidents nominate judges; Senate confirmation votes
- **Federal Politics**: Congressional races, Presidential campaigns, federal legislation
- **International Relations (P2)**: Trade deals, foreign policy, diplomacy

---

## Data Models (Mongoose Schemas)

### Election Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,          // Tenant
  officeType: String,            // 'Governor', 'StateSenate', 'StateHouse', 'Mayor'
  district: String,              // District identifier (null for statewide)
  electionDate: Date,
  electionType: String,          // 'Primary', 'General', 'Runoff', 'Special'
  candidates: [{
    userId: ObjectId,
    party: String,               // 'Democrat', 'Republican', 'Independent'
    status: String,              // 'Active', 'Withdrawn', 'Won', 'Lost'
    votes: Number,               // Final vote count
    votePercentage: Number
  }],
  turnout: Number,               // Voter turnout percentage
  status: String,                // 'Upcoming', 'InProgress', 'Completed'
  results: {
    winnerId: ObjectId,
    margin: Number,              // Victory margin (votes or %)
    runoffRequired: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
election.index({ companyId: 1, electionDate: 1 })
election.index({ companyId: 1, officeType: 1, district: 1 })
```

### Campaign Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,
  electionId: ObjectId,
  candidateId: ObjectId,         // userId of candidate
  campaignName: String,
  officeType: String,
  district: String,
  party: String,
  
  strategy: {
    messagingThemes: [String],   // ['Economy', 'Crime', 'Education']
    targetDistricts: [String],   // Priority precincts
    budgetAllocation: {
      tvAds: Number,             // % of budget
      digitalAds: Number,
      directMail: Number,
      events: Number,
      staff: Number,
      groundGame: Number
    }
  },
  
  finances: {
    cashOnHand: Number,
    totalRaised: Number,
    totalSpent: Number,
    lastReportDate: Date,
    burnRate: Number             // $ per day
  },
  
  polling: {
    currentSupport: Number,      // % polling at
    favorability: Number,        // % favorable rating
    nameRecognition: Number,     // % who know candidate
    trendDirection: String,      // 'Rising', 'Flat', 'Falling'
    lastPolled: Date
  },
  
  metrics: {
    volunteersRecruited: Number,
    doorsKnocked: Number,
    phoneCallsMade: Number,
    eventsHeld: Number,
    mediaMentions: {
      positive: Number,
      neutral: Number,
      negative: Number
    }
  },
  
  staff: [{
    employeeId: ObjectId,        // From Employees domain
    role: String,                // 'Manager', 'FieldDirector', 'Communications', 'Finance'
    hireDate: Date
  }],
  
  status: String,                // 'Active', 'Suspended', 'Completed'
  createdAt: Date,
  updatedAt: Date
}

// Indexes
campaign.index({ companyId: 1, candidateId: 1 })
campaign.index({ companyId: 1, electionId: 1 })
campaign.index({ companyId: 1, status: 1 })
```

### Bill Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,
  billNumber: String,            // 'HB-2025-042'
  title: String,
  billType: String,              // 'Tax', 'Regulation', 'CriminalJustice', 'Labor', 'Budget'
  sponsorId: ObjectId,           // userId of sponsor
  cosponsors: [ObjectId],
  
  policyDetails: {
    type: String,                // Specific policy (e.g., 'SubstanceLegalization', 'TaxRateChange')
    parameters: Mixed,           // Policy-specific params (substance: 'cannabis', taxRate: 10)
    affectedDomains: [String],   // ['Crime', 'Business', 'Employees']
    fiscalImpact: {
      revenueChange: Number,     // Annual $ impact
      costChange: Number,
      budgetNeutral: Boolean
    }
  },
  
  legislativeStatus: {
    stage: String,               // 'Introduced', 'Committee', 'Floor', 'Executive', 'Implemented', 'Failed'
    committee: String,           // Which committee (if in committee)
    votes: [{
      stage: String,             // 'Committee', 'Floor', 'Override'
      voterId: ObjectId,
      vote: String,              // 'Yea', 'Nay', 'Abstain'
      votedAt: Date
    }],
    yeas: Number,
    nays: Number,
    votesNeeded: Number,         // For passage (simple majority, supermajority)
    passedCommittee: Boolean,
    passedFloor: Boolean,
    executiveAction: String,     // 'Signed', 'Vetoed', 'Pending'
    implementedAt: Date
  },
  
  fullText: String,              // Bill text (can be summary or full legal text)
  amendments: [{
    amendmentId: ObjectId,
    sponsorId: ObjectId,
    text: String,
    status: String               // 'Proposed', 'Adopted', 'Rejected'
  }],
  
  lobbyingActivity: [{
    lobbyistId: ObjectId,        // userId lobbying
    position: String,            // 'Support', 'Oppose'
    dollarsSpent: Number,
    activityDate: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
bill.index({ companyId: 1, billNumber: 1 })
bill.index({ companyId: 1, 'legislativeStatus.stage': 1 })
bill.index({ companyId: 1, sponsorId: 1 })
```

### Donor Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,
  userId: ObjectId,              // If donor is a player
  donorType: String,             // 'Individual', 'PAC', 'Business', 'Union'
  contactInfo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  
  contributionHistory: [{
    campaignId: ObjectId,
    electionId: ObjectId,
    amount: Number,
    contributionDate: Date,
    contributionType: String,    // 'Direct', 'Bundled', 'InKind'
    receiptId: String            // For compliance
  }],
  
  totalLifetimeContributions: Number,
  averageContribution: Number,
  lastContributionDate: Date,
  
  preferences: {
    issuesSupported: [String],   // ['CriminalJusticeReform', 'LaborRights', 'TaxCuts']
    partySide: String,           // 'Democrat', 'Republican', 'Independent', null
    maxContribution: Number      // Self-imposed limit
  },
  
  bundlingNetwork: [{
    donorId: ObjectId,           // Other donors recruited
    contributionsRecruitedTotal: Number
  }],
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
donor.index({ companyId: 1, userId: 1 })
donor.index({ companyId: 1, donorType: 1 })
donor.index({ companyId: 1, totalLifetimeContributions: -1 })
```

### District Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,
  districtCode: String,          // 'NY-SD-12' (State, Type, Number)
  districtType: String,          // 'StateSenate', 'StateHouse', 'Congressional'
  state: String,
  districtNumber: Number,
  
  demographics: {
    population: Number,
    medianAge: Number,
    medianIncome: Number,
    urbanPercentage: Number,
    suburbanPercentage: Number,
    ruralPercentage: Number,
    raceBreakdown: {
      white: Number,
      black: Number,
      hispanic: Number,
      asian: Number,
      other: Number
    },
    educationBreakdown: {
      highSchool: Number,
      someCollege: Number,
      bachelors: Number,
      graduate: Number
    }
  },
  
  voterData: {
    registeredVoters: Number,
    partyRegistration: {
      democrat: Number,
      republican: Number,
      independent: Number,
      other: Number
    },
    turnoutHistory: [{
      electionId: ObjectId,
      turnout: Number,
      date: Date
    }],
    issuePriorities: [{
      issue: String,
      percentage: Number         // % of voters who cite as top issue
    }]
  },
  
  electoralHistory: [{
    electionId: ObjectId,
    winnerId: ObjectId,
    winnerParty: String,
    margin: Number,
    date: Date
  }],
  
  currentRepresentative: {
    userId: ObjectId,
    party: String,
    termStart: Date,
    termEnd: Date
  },
  
  competitiveness: String,       // 'SafeDem', 'LeanDem', 'Tossup', 'LeanGOP', 'SafeGOP'
  
  geometry: {                    // For map display
    type: String,                // 'Polygon'
    coordinates: [[[Number]]]    // GeoJSON format
  },
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
district.index({ companyId: 1, districtCode: 1 })
district.index({ companyId: 1, state: 1, districtType: 1 })
district.index({ 'geometry': '2dsphere' })  // Geospatial queries
```

### VoterOutreach Schema
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,
  campaignId: ObjectId,
  outreachType: String,          // 'PhoneBank', 'Canvass', 'Event', 'GOTV'
  
  targetDistrict: String,
  targetVoters: [{
    voterId: ObjectId,           // Simulated voter ID
    contacted: Boolean,
    contactDate: Date,
    response: String,            // 'StrongSupport', 'LeanSupport', 'Undecided', 'LeanOppose', 'StrongOppose'
    turnoutLikelihood: Number    // 0-100 score
  }],
  
  volunteersAssigned: [{
    employeeId: ObjectId,
    hoursWorked: Number,
    contactsMade: Number
  }],
  
  results: {
    totalContacts: Number,
    strongSupport: Number,
    leanSupport: Number,
    undecided: Number,
    leanOppose: Number,
    strongOppose: Number,
    averagePersuasion: Number,   // Change in support after contact
    costPerContact: Number
  },
  
  scheduledDate: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
voterOutreach.index({ companyId: 1, campaignId: 1 })
voterOutreach.index({ companyId: 1, outreachType: 1, scheduledDate: 1 })
```

---

## API Surface (40+ Endpoints)

### Elections (6 endpoints)
- `GET /api/politics/elections` - List all elections with filters (upcoming, completed, office type)
- `GET /api/politics/elections/:id` - Election details with candidates, polling, results
- `POST /api/politics/elections` - Create election (admin/system)
- `GET /api/politics/office-holders` - Current officials by office type
- `GET /api/politics/player-status` - Player's electoral history, current offices, eligibility
- `GET /api/politics/elections/:id/results` - Live election results (vote counts by district)

### Campaigns (8 endpoints)
- `POST /api/politics/campaigns` - Announce candidacy
- `GET /api/politics/campaigns/:id` - Campaign details (strategy, finances, polling, metrics)
- `PATCH /api/politics/campaigns/:id/strategy` - Update messaging, targeting, budget allocation
- `PATCH /api/politics/campaigns/:id/budget` - Reallocate campaign funds
- `POST /api/politics/campaigns/:id/staff/hire` - Hire campaign staff from Employees
- `DELETE /api/politics/campaigns/:id/staff/:employeeId` - Fire campaign staff
- `GET /api/politics/campaigns/:id/polling` - Current polling data with trends
- `POST /api/politics/campaigns/:id/events` - Handle campaign event (scandal, endorsement, debate)

### Voter Outreach (7 endpoints)
- `POST /api/politics/outreach/phone-bank` - Start phone banking session
- `POST /api/politics/outreach/canvass` - Send canvassers to district
- `POST /api/politics/outreach/events` - Schedule campaign event (town hall, rally)
- `POST /api/politics/outreach/volunteers/recruit` - Recruit volunteer
- `POST /api/politics/outreach/volunteers/assign` - Assign volunteer to task
- `GET /api/politics/outreach/voter-database` - Query voter records with filters
- `POST /api/politics/outreach/gotv` - Activate Get Out The Vote operations

### Bills & Policy (10 endpoints)
- `POST /api/politics/bills` - Create new bill
- `GET /api/politics/bills` - List bills with filters (status, type, sponsor)
- `GET /api/politics/bills/:id` - Bill details with votes, amendments, lobbying
- `PATCH /api/politics/bills/:id` - Update bill (sponsor only, before committee)
- `POST /api/politics/bills/:id/vote` - Cast vote (if player is legislator)
- `POST /api/politics/bills/:id/amend` - Propose amendment
- `POST /api/politics/bills/:id/executive-action` - Sign or veto (if player is executive)
- `GET /api/politics/policies/active` - All implemented policies with effects
- `POST /api/politics/bills/:id/lobby` - Lobby for/against bill
- `GET /api/politics/bills/:id/impact` - Projected policy impact on domains

### Fundraising & Donors (5 endpoints)
- `GET /api/politics/donors` - Donor database with filters
- `POST /api/politics/donations` - Make donation (player → campaign)
- `POST /api/politics/fundraising/events` - Schedule fundraising event
- `GET /api/politics/fundraising/reports` - Finance reports (public transparency)
- `POST /api/politics/donors/bundle` - Coordinate bundled contributions

### Districts & Demographics (4 endpoints)
- `GET /api/politics/districts` - List all districts with summary stats
- `GET /api/politics/districts/:id` - Detailed district demographics, history, voter data
- `GET /api/politics/districts/:id/voters` - Voter file data for district
- `GET /api/politics/districts/competitive` - Identify swing districts for targeting

---

## Real-Time Events (Socket.io `/politics` namespace)

### Election Events (5 events)
- `election:results-update` - Live vote count updates on election night
  - Payload: `{ electionId, candidateId, votes, percentage, districtReporting }`
  - Broadcast: Global (all users watching election)
  
- `election:race-called` - Race called for winner
  - Payload: `{ electionId, winnerId, winnerName, officeType, margin }`
  - Broadcast: Global
  
- `election:polling-update` - New polling data released
  - Payload: `{ campaignId, candidateName, support, favorability, trend }`
  - Broadcast: Campaign-specific (candidate + donors + voters)
  
- `election:scandal` - Campaign scandal breaks
  - Payload: `{ campaignId, candidateName, scandalType, severity, pollingImpact }`
  - Broadcast: Global
  
- `election:endorsement` - Major endorsement announced
  - Payload: `{ campaignId, candidateName, endorser, endorserType, pollingBoost }`
  - Broadcast: Global

### Bill Events (4 events)
- `bill:introduced` - New bill introduced
  - Payload: `{ billId, billNumber, title, sponsorName, billType }`
  - Broadcast: Global
  
- `bill:vote-scheduled` - Vote scheduled for bill
  - Payload: `{ billId, billNumber, stage, scheduledDate, votesNeeded }`
  - Broadcast: Global
  
- `bill:passed` - Bill passed committee or floor
  - Payload: `{ billId, billNumber, stage, yeas, nays, nextStage }`
  - Broadcast: Global
  
- `bill:signed` - Bill signed into law
  - Payload: `{ billId, billNumber, title, policyType, affectedDomains, implementationDate }`
  - Broadcast: Global (triggers Crime legalization, Business tax changes, etc.)

### Campaign Events (3 events)
- `campaign:milestone` - Campaign hits fundraising/volunteer milestone
  - Payload: `{ campaignId, candidateName, milestone, value }`
  - Broadcast: Campaign-specific
  
- `campaign:ad-launch` - Major ad campaign launched
  - Payload: `{ campaignId, candidateName, adType, budget, messagingTheme }`
  - Broadcast: District-specific
  
- `campaign:debate` - Debate scheduled or results
  - Payload: `{ electionId, participants, debateDate, winner }`
  - Broadcast: Global

### Policy Events (2 events)
- `policy:implemented` - Policy takes effect (affects other domains)
  - Payload: `{ billId, policyType, parameters, affectedDomains, effects }`
  - Broadcast: Global (Crime, Business, Employees listen for relevant policies)
  
- `policy:repealed` - Policy repealed
  - Payload: `{ billId, policyType, repealDate, reversalEffects }`
  - Broadcast: Global

---

## Estimates & Phasing

### Total Implementation Time
- **Election Dashboard:** 8-10h
- **Campaign Manager:** 16-20h
- **Voter Outreach:** 14-18h
- **Policy Tracker & Bills:** 18-22h
- **Donor Management:** 12-16h
- **District Map:** 10-14h
- **Shared UI/Design:** 10-14h
- **Cross-Domain Integration (Crime, Business, Employees):** 8-12h

**Total Core:** 96-126h  
**Shared UI:** 10-14h  
**Integration:** 8-12h  
**Grand Total:** 114-152h

### Phasing Recommendation

**P0 (Full Politics):** All 6 features as single release
- **Rationale:** Politics is highly interconnected (campaigns need elections, bills need legislators, donors fund campaigns); splitting would create incomplete experiences
- **Dependencies:** Requires Employees domain for campaign staff; Crime/Business for policy effects (can stub initially)
- **Timeline:** 3-4 weeks dedicated development

**Alternative Phased Approach:**
- **P0-Alpha (Electoral Core):** Election Dashboard + Campaign Manager + Voter Outreach (38-48h) - Playable campaigns without policy impact
- **P0-Beta (Policy System):** Policy Tracker + Bill Management (18-22h) - Legislative gameplay without fundraising complexity
- **P0-Gamma (Finance & Analytics):** Donor Management + District Map (22-30h) - Complete strategic depth

---

## Dependencies & Integrations

### Required from Other Domains

**Employees (Campaign Staff):**
- Hire campaign manager, field organizers, communications director, finance director
- Staff skills affect campaign effectiveness (high-skill manager boosts polling, experienced field director increases voter contacts)
- Can implement with generic staff initially, enhance with Employees integration later

**Crime (Policy Effects):**
- Legalization bills trigger facility conversion (illegal → legal)
- Enforcement budget bills affect heat accumulation, raid frequency
- Sentencing reform affects arrest penalties
- Politics provides: Bill passage events, policy implementation webhooks
- Crime listens: `policy:implemented` events for `policyType: 'SubstanceLegalization'`

**Business (Policy Effects):**
- Tax rate changes affect Business revenue (corporate tax, sales tax, property tax)
- Regulatory bills impact operational costs
- Subsidies/incentives drive investment decisions
- Politics provides: Tax policy changes, regulation updates
- Business listens: `policy:implemented` events for `policyType: 'TaxRateChange'` or `'Regulation'`

**Employees (Policy Effects):**
- Minimum wage bills affect Employee salaries, Business costs
- Labor law bills impact union rights, benefits
- Government job creation from public sector bills
- Politics provides: Labor policy changes
- Employees listens: `policy:implemented` events for `policyType: 'LaborLaw'`

### Provides to Other Domains

**To Crime:**
- `policy:implemented` events when legalization bills pass
- Enforcement budget levels (affects raid intensity, checkpoint frequency)
- Sentencing guidelines (affects arrest penalties)
- Asset forfeiture policy (affects confiscation amounts)

**To Business:**
- Tax rates (corporate, sales, property) via `policy:implemented`
- Regulatory compliance requirements
- Subsidy/incentive programs
- Public sector contracts (government procurement)

**To Employees:**
- Minimum wage rates
- Union organizing rules
- Benefits mandates (healthcare, paid leave)
- Government job openings (from budget bills)

**Shared Infrastructure:**
- Real-time events (election results, bill votes) via Socket.io
- Achievements (electoral victories, bill passage)
- Leaderboards (campaign fundraising, bills sponsored)
- Notifications (vote reminders, election day alerts)

---

## AI-Lite Insights (No LLM Required)

1. **Polling Predictions**: Regression models predict election outcomes based on polling trends, fundraising, endorsements, demographics
2. **Optimal Campaign Spending**: Linear programming allocates budget across ad types, districts to maximize vote share within constraints
3. **Voter Persuasion Scoring**: Logistic regression identifies persuadable voters based on demographics, issue priorities, past turnout
4. **Bill Passage Probability**: Count votes (committed yea/nay/undecided), estimate passage likelihood, recommend lobbying targets
5. **Fundraising Forecasting**: Time series models project cash flow, burn rate, fundraising needed to stay competitive
6. **District Targeting**: Rank districts by competitiveness × persuadable voters × turnout potential for efficient resource allocation
7. **Policy Impact Simulation**: Calculate tax revenue changes, business cost impacts, employee wage effects before bill passage (Monte Carlo scenarios)
8. **Opposition Research Insights**: Text analysis of voting records identifies inconsistencies, flip-flops for attack ads
9. **Endorsement Value**: Calculate polling boost from endorsements based on endorser popularity, alignment with candidate
10. **Get Out The Vote Efficiency**: Optimize GOTV contact lists by turnout likelihood × support level (prioritize strong supporters with low turnout probability)

---

## Engagement Hooks

### Achievements
- **First Campaign**: Launch first electoral campaign
- **Elected Official**: Win any election
- **Landslide Victory**: Win election by 20+ points
- **Upset Win**: Win as underdog (polling deficit going into election)
- **Kingmaker**: Donate to 5+ winning campaigns
- **Legislator**: Pass first bill
- **Reform Champion**: Pass 3+ bills in single policy area (e.g., criminal justice reform)
- **Fundraising Titan**: Raise $1M+ in single campaign
- **Grassroots Hero**: Win election with 80%+ small donor funding
- **Party Leader**: Win 5+ elections for same party

### Leaderboards
- **Top Fundraisers**: Lifetime campaign contributions raised
- **Most Bills Passed**: Lifetime bills signed into law
- **Electoral Win Streak**: Consecutive election victories
- **Highest Vote Share**: Biggest electoral margin
- **Biggest Upsets**: Largest polling deficits overcome

### Live Events
- **Debate Season**: Scheduled debates with audience Q&A, fact-checking
- **Primary Night**: Multiple races decided same night (high-stakes drama)
- **Scandal Week**: Random scandals increase (test crisis management)
- **Endorsement Bonanza**: Major endorsers (unions, newspapers, party leaders) announce picks
- **Bill Vote Marathon**: Legislature votes on multiple major bills in short window
- **Fundraising Deadline**: Quarterly filing deadline approaching (fundraising surge)
- **Election Day**: Live vote counting, real-time results, victory/concession speeches

### Activity Feed Features
- **Filters**: Personal (my campaigns/bills), Party, District, State, Global
- **Reactions**: React to election results, bill votes, endorsements
- **Sharing**: Share campaign milestones, legislative victories
- **Alerts**: Election day reminders, vote scheduled notifications, polling updates
- **Highlight Reels**: Top campaign moments (viral ads, debate zingers, landslide wins)

---

## Manual QA Checklist

### Elections
- [ ] Create election (all office types: Governor, StateSenate, StateHouse, Mayor)
- [ ] Announce candidacy (verify eligibility, filing fee deducted)
- [ ] Multiple candidates in race (verify polling distributes correctly)
- [ ] Election day simulation (verify vote counting, winner determination, runoff triggers)
- [ ] Historical results stored (verify past elections accessible)

### Campaigns
- [ ] Create campaign with strategy (verify budget allocation totals 100%)
- [ ] Reallocate campaign budget (verify funds shift correctly, metrics update)
- [ ] Hire campaign staff from Employees (verify skills apply to effectiveness)
- [ ] Polling updates (verify trends calculate correctly: rising/flat/falling)
- [ ] Respond to campaign event (scandal reduces polling, endorsement boosts)
- [ ] Election night dashboard (verify live results update, winner called correctly)

### Voter Outreach
- [ ] Phone bank session (verify voter responses recorded, persuasion tracked)
- [ ] Canvassing (verify volunteer hours, contacts made, district targeting)
- [ ] Campaign event (town hall generates media coverage, voter sentiment)
- [ ] Volunteer recruitment (verify assignment to tasks, hours tracked)
- [ ] Voter database queries (verify filters work: district, support level, turnout)
- [ ] GOTV operations (verify identified supporters contacted, turnout increases)

### Bills & Policy
- [ ] Create bill (all types: Tax, Regulation, CriminalJustice, Labor, Budget)
- [ ] Bill progression (introduced → committee → floor → executive)
- [ ] Vote on bill (verify player vote recorded if legislator)
- [ ] Bill passage (verify yea/nay counts, threshold met)
- [ ] Executive action (sign triggers implementation, veto blocks)
- [ ] Policy implementation (verify Crime legalization converts facilities, Business taxes update)
- [ ] Amendments (propose, vote, adopt/reject)
- [ ] Lobbying (verify dollars spent, influence on undecided votes)

### Fundraising
- [ ] Make donation (verify contribution limits enforced, receipt generated)
- [ ] Fundraising event (verify attendance, revenue, costs calculated)
- [ ] Finance reports (verify receipts, expenditures, cash on hand accurate)
- [ ] Bundled contributions (verify recruiter credited, network tracked)
- [ ] Donor engagement (verify email campaigns, thank-yous sent)

### Districts & Demographics
- [ ] View district details (demographics, voter data, electoral history)
- [ ] Identify competitive districts (verify competitiveness score accurate)
- [ ] Target voters (verify demographic filters, issue priorities)
- [ ] Map interaction (click district, view data, color-coded by party)
- [ ] Redistricting (P1) (verify boundary changes, population balance)

### Cross-Domain Integration
- [ ] Crime legalization bill passes (verify facility conversion, pricing/tax changes, heat removed)
- [ ] Business tax rate bill passes (verify revenue calculations update)
- [ ] Employees minimum wage bill passes (verify salary increases, Business costs rise)
- [ ] Campaign hires Employee (verify staff skills apply to campaign metrics)

### Real-Time Events
- [ ] Election results update (verify live vote counts, percentage, districts reporting)
- [ ] Bill vote scheduled (verify notification sent, countdown timer)
- [ ] Policy implemented (verify affected domains notified, effects cascade)
- [ ] Campaign scandal (verify polling impact, media coverage)
- [ ] Polling update (verify trend direction, favorability, name recognition)

### Performance & Edge Cases
- [ ] Large election (10+ candidates, verify UI scales, polling distributes)
- [ ] High-volume voting (100+ legislators vote simultaneously, verify no race conditions)
- [ ] Concurrent bill votes (multiple bills voted same day, verify results separate)
- [ ] Fundraising limits (verify edge case: donation at exact limit accepted, over limit rejected)
- [ ] District voter database (1M+ voters, verify query performance)

### Security & Compliance
- [ ] Contribution limits enforced (individuals $5K, PACs $10K, business/unions $15K)
- [ ] Vote authorization (verify only legislators can vote, only on bills in their chamber)
- [ ] Executive action authorization (verify only governors/presidents can sign/veto)
- [ ] Finance report transparency (verify public access, no PII leaks)
- [ ] Campaign finance audit trails (verify all transactions logged)

---

## UI/Design System

### Core Components (HeroUI)
- **DataTable**: Elections list, campaign finance reports, bill tracker, donor database
- **Card**: Campaign dashboard cards, district cards, bill cards, candidate profiles
- **Tabs**: Campaign dashboard (Strategy, Finances, Polling, Metrics, Staff, Events)
- **Modal**: Bill creation wizard, donation processing, vote casting, event responses
- **Tooltip**: Polling trend explanations, fiscal impact estimates, competitiveness scores
- **Chip**: Election status (Upcoming, In Progress, Completed), Bill status (Committee, Floor, Signed)
- **Progress**: Campaign fundraising goal, bill vote counts (yeas vs. needed), election countdown
- **Badge**: New endorsements, scandal alerts, vote scheduled notifications

### Charts & Visualizations (Recharts)
- **Line Charts**: Polling trends over time, fundraising vs. burn rate, vote margins by district
- **Bar Charts**: Campaign spending by category, bill votes (yea/nay/abstain), donor contributions by type
- **Pie Charts**: Budget allocation (ads, events, staff), voter registration by party, district demographics
- **Area Charts**: Campaign cash on hand over time, volunteer hours accumulated
- **Scatter Plots**: District competitiveness vs. voter turnout, fundraising vs. polling
- **Maps**: Interactive district map with party control, competitiveness, demographic overlays

### Theme Tokens (Politics Domain)
- **Primary Accent**: `politicsBlue` (#3B82F6 - democratic process, civic engagement)
- **Party Colors**:
  - `democrat`: blue-600
  - `republican`: red-600
  - `independent`: purple-500
  - `tossup`: amber-400
- **Competitiveness**:
  - `safeDem`: blue-700
  - `leanDem`: blue-400
  - `tossup`: amber-400
  - `leanGOP`: red-400
  - `safeGOP`: red-700
- **Bill Status**:
  - `introduced`: slate-400
  - `committee`: blue-400
  - `floor`: purple-500
  - `signed`: emerald-500
  - `vetoed`: red-500

### Motion & Animations (Framer Motion)
- **Entrance**: Fade-in for election results, campaign events (duration: 300ms)
- **Vote Counter**: Animated count-up for live election results (duration: 2s, easing: easeOut)
- **Bill Progress**: Smooth stage transitions (introduced → committee → floor → signed)
- **Polling Charts**: Animated line drawing for trend updates (duration: 1s)
- **Victory Celebration**: Confetti burst on election win, fireworks on bill passage
- **Scandal Alert**: Shake animation on scandal notification (duration: 500ms, intensity: subtle)

### Sound Effects (Licensed Free SFX)
- **Actions**:
  - `vote-cast.mp3`: Ballot drop sound for casting votes (volume: 0.4)
  - `donation.mp3`: Cash register chime for donations (volume: 0.4)
  - `sign-bill.mp3`: Pen stroke for executive signing (volume: 0.3)
- **Alerts**:
  - `election-called.mp3`: News alert for race called (volume: 0.5)
  - `scandal.mp3`: Dramatic sting for scandals (volume: 0.5)
  - `endorsement.mp3`: Applause for endorsements (volume: 0.4)
- **Victory**:
  - `election-win.mp3`: Triumphant fanfare for winning election (volume: 0.6)
  - `bill-passed.mp3`: Gavel strike for bill passage (volume: 0.5)

### Specialized UI Elements
- **Polling Tracker**: Line chart with shaded confidence interval, trend arrow (up/down/flat)
- **Campaign Finance Gauge**: Circular progress showing cash on hand vs. burn rate (days until broke)
- **Bill Vote Counter**: Live tally with "Yeas Needed" threshold line, real-time updates
- **District Map**: Interactive US state map with clickable districts, color-coded by party/competitiveness
- **Candidate Comparison**: Side-by-side cards showing polling, fundraising, endorsements
- **Election Night Dashboard**: Split-screen with map (results by district) + live vote totals
- **Legislative Calendar**: Monthly calendar with bill votes, election dates, filing deadlines
- **Donor Leaderboard**: Top donors with avatar, contribution total, last donation date

---

## Security & Abuse Controls

### Input Validation
- **Zod Schemas**: All API routes validate inputs (bill parameters, donation amounts, vote choices)
- **NextAuth**: Session checks on all routes; role-based access (only legislators vote, only executives sign)
- **Office Eligibility**: Verify player meets requirements (age, residency, term limits) before candidacy
- **Contribution Limits**: Server-side enforcement ($5K individuals, $10K PACs, $15K business/unions)

### Rate Limits (Per-User)
- **Campaigns**: Create campaign max 5/year (prevents spam candidacies)
- **Bills**: Introduce bill max 10/session (prevents legislative spam)
- **Votes**: Cast vote once per bill per stage (prevents vote manipulation)
- **Donations**: Make donation max 50/day (prevents rapid-fire contributions)
- **Outreach**: Phone bank max 20 sessions/day, canvass max 10 districts/day (prevents bot farming)

### Server-Side Validation
- **Vote Counting**: Server calculates election results; client cannot manipulate vote totals
- **Polling Data**: Server generates polling based on campaign actions; client cannot fake polls
- **Bill Passage**: Server checks vote thresholds (simple majority, supermajority); client cannot force passage
- **Fiscal Impact**: Server calculates bill costs/revenues; client cannot submit fake estimates
- **Competitiveness Scores**: Server-calculated from demographics, history; client cannot override

### Audit Logging
- **Campaign Finance**: Log all donations (donor, recipient, amount, date) for transparency and compliance
- **Votes**: Log all votes (bill, voter, choice, timestamp) for accountability and public record
- **Executive Actions**: Log all signings/vetoes (bill, executive, action, date) for constitutional oversight
- **Policy Implementation**: Log all bill implementations (bill, policy type, affected domains, timestamp)

### Anti-Abuse Mechanisms
- **Multiple Candidacies**: Prevent same player from running for multiple offices simultaneously (unless state allows)
- **Self-Donation Caps**: Limit self-funding to prevent billionaire candidates from bypassing contribution limits
- **Vote Buying**: Monitor for suspicious donation patterns (large donation immediately before vote = flagged)
- **Astroturfing**: Detect fake grassroots campaigns (sudden volunteer surge from new accounts = flagged)
- **Polling Manipulation**: Prevent campaigns from gaming polling (outreach effectiveness capped, diminishing returns)

### Data Privacy
- **Voter Records**: Pseudonymous (simulated voters, not real PII)
- **Donor Privacy**: Display donor names/amounts publicly (transparency), but pseudonymize contact info
- **Campaign Staff**: Display roles publicly, but employee details private (link to Employees domain securely)
- **Finance Reports**: Public (as in real politics), but aggregated to prevent doxxing individual donors

---

## Risks & Mitigations

### Scope & Complexity
- **Risk**: Politics is interconnected; splitting features creates incomplete gameplay (campaigns without elections, bills without legislators)
- **Mitigation**: Implement all 6 P0 features as single cohesive Politics release; accept 114-152h timeline

### Ethical & Political Sensitivity
- **Risk**: Game simulates elections/legislation; could be perceived as endorsing political views
- **Mitigation**: 
  - Neutral mechanics (both parties equally viable)
  - Fictional scenarios (not modeling real current events)
  - Educational framing ("Explore democratic processes in safe simulation")
  - Disclaimers ("This is a game; does not reflect real political affiliations or endorsements")

### Balance & Fairness
- **Risk**: Dominant players monopolize offices; new players can't compete against incumbents
- **Mitigation**:
  - Term limits (Governors 2 terms, legislators 4 terms)
  - Primary challenges (same-party players can challenge incumbents)
  - Campaign finance limits (prevent billionaire players from buying elections)
  - Scandal system (incumbents face scandal risk; new players start clean)

### Cross-Domain Dependencies
- **Risk**: Politics needs Crime/Business/Employees for full effect; chicken-egg problem
- **Mitigation**:
  - Stub policy effects initially (legalization bill passes but Crime conversion deferred until Crime domain implemented)
  - Webhooks for future integration (Crime listens for `policy:implemented` events when ready)
  - Generic staff for campaigns (until Employees domain available)

### Performance & Scale
- **Risk**: Live election results with 1000+ concurrent users could overwhelm Socket.io
- **Mitigation**:
  - Rate limit events (max 1 update per district per second)
  - Aggregate vote counts (update every 10 seconds, not every vote)
  - Fallback to polling for non-critical updates (finance reports, polling trends)

### Data Integrity
- **Risk**: Concurrent votes on same bill could create race conditions
- **Mitigation**:
  - Optimistic locking (version field on Bill schema)
  - Atomic vote recording (single database transaction: check eligibility → record vote → update counts)
  - Idempotency (duplicate vote attempt returns existing vote, doesn't double-count)

### User Experience
- **Risk**: Politics is complex (campaigns, policy, fundraising); steep learning curve
- **Mitigation**:
  - Interactive tutorial (run mock campaign, vote on sample bill)
  - Starter quests (first campaign, first donation, first bill)
  - Help tooltips on every major UI element
  - Video walkthrough (5-7 min overview)
  - Simplified mode (P1): "Arcade Politics" with streamlined mechanics for casual players

---

## Acceptance Criteria (P0)

- All 40+ API routes with Zod validation and strict TypeScript types
- Socket.io namespace `/politics` broadcasting 14+ event types with rate limits
- HeroUI-first UI with responsive layouts, accessible controls (WCAG 2.1 AA)
- Mongoose schemas with non-duplicated indexes (GUARDIAN rule #17)
- Manual QA checklists executed (60+ scenarios covering elections, campaigns, bills, fundraising, outreach, districts)
- Cross-domain integration verified (Crime legalization, Business taxes, Employees staff)
- Real-time events functional (election results, bill votes, polling updates)
- Achievements, leaderboards, live events implemented
- Docs updated in Roadmap + Final Presentation to reflect Politics domain
- Sample data loaders produce stable datasets (50 districts, 20 elections, 100 bills, 500 donors)

---

**Status:** PLANNED - Ready for approval and implementation scheduling
**Next Steps:** Integrate Politics into overall project roadmap; determine phasing (P0-Full or defer); allocate development resources
**FID Created:** 2025-11-27
**Last Updated:** 2025-11-27
