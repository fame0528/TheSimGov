# Manual-First QA Strategy for TheSimGov

**Document Type:** Quality Assurance Strategy  
**Created:** 2025-11-27  
**Last Updated:** 2025-11-27  
**Status:** Active  
**Scope:** All domains (Crime, Politics, Business, Employees, Media, Demographics)  

---

## Philosophy

TheSimGov uses a **manual-first QA approach** rather than automated test suites. This strategy prioritizes:

1. **Comprehensive manual testing workflows** with detailed checklists
2. **Sample data loaders** for stable, reproducible test environments
3. **Regression testing procedures** for systematic validation
4. **Real-world scenario testing** that automated tests cannot replicate
5. **Rapid iteration** without test suite maintenance overhead

**Rationale:**
- Complex MMO gameplay interactions difficult to unit test
- Real-time Socket.io events require human validation (timing, UX feel)
- Cross-domain integrations (Crime ↔ Politics ↔ Business) need end-to-end workflows
- Manual QA catches UX issues automated tests miss (animations, sound, responsiveness)
- Developer velocity prioritized over test coverage percentages

---

## QA Workflow Overview

### Development Phase QA
```
Feature Implementation → Self-Test (Dev) → Sample Data Load → 
Manual Checklist Execution → Bug Fixes → Regression Test → 
Code Review → Merge
```

### Release Phase QA
```
Feature Complete → Full Regression Suite → Cross-Domain Integration Tests →
Performance Testing → Security Audit → User Acceptance Testing (UAT) →
Production Deploy → Post-Launch Monitoring
```

---

## Sample Data Loaders

### Purpose
Provide stable, reproducible datasets for consistent QA testing across all features.

### Location
`/scripts/sample-data/`

### Loaders by Domain

#### 1. Crime Domain Sample Data
**File:** `/scripts/sample-data/crime-loader.ts`

**Loads:**
- 50 drug production facilities (labs, farms, warehouses) across 10 states
- 100 distribution routes (state-to-state) with varying risk levels
- 200 P2P marketplace listings (10 substances, multiple sellers, varied pricing)
- 20 player-owned gangs/cartels with 5-10 members each
- 50 NPC gangs with territory claims across 25 city districts
- 500 historical transactions (manufacturing, distribution, retail)
- 100 smuggling events (successful deliveries, seizures, robberies)
- 30 legalization bills (pending, passed, failed) linked to Politics

**Key Data Points:**
- Substance pricing: State-level averages from DEA/SAMHSA data
- Enforcement intensity: Arrest rates by state (FBI Uniform Crime Reports)
- Territory demographics: Population density, median income, crime rates
- Employee skills: Chemist quality (50-100), driver reliability (60-95)

**Sample Scenarios:**
- Player 1 runs cannabis farm in Colorado (legal), ships to Texas (illegal) - tests legalization mechanics
- Player 2 controls territory in NYC with 5 blocks, faces challenge from NPC gang - tests turf wars
- Bulk purchase from Player 3's lab → Transport via Player 4's distribution network - tests P2P commerce

**Load Command:**
```bash
npm run load-sample-data -- --domain crime --scenario all
```

---

#### 2. Politics Domain Sample Data
**File:** `/scripts/sample-data/politics-loader.ts`

**Loads:**
- 20 active elections (Governor, State Senate x10, State House x9) across 3 election cycles
- 30 campaigns (10 gubernatorial, 20 legislative) with varied strategies
- 50 bills (Tax x10, CriminalJustice x10, Labor x10, Regulation x10, Budget x10)
- 500 donors (250 individuals, 100 PACs, 75 businesses, 75 unions) with contribution history
- 100 districts (50 State Senate, 50 State House) with demographics and electoral history
- 200 voter outreach sessions (phone banking, canvassing, town halls, GOTV)
- 1000 simulated voters per district (total 100K) with party affiliation, issue priorities
- 10 implemented policies affecting Crime (legalization x3), Business (taxes x4), Employees (labor laws x3)

**Key Data Points:**
- Polling data: Realistic spreads (Safe: 60-40, Lean: 52-48, Tossup: 50-50)
- Fundraising: Contribution limits enforced ($5K individuals, $10K PACs, $15K business/unions)
- Vote margins: Historical averages by district competitiveness
- Bill passage rates: 30% of introduced bills pass (realistic congressional average)

**Sample Scenarios:**
- Player 1 runs for Governor with $500K raised, polling at 48% vs. 47% (tossup race)
- Player 2 sponsors cannabis legalization bill → Committee vote → Floor vote → Executive signature
- NPC legislator proposes minimum wage increase → Players vote → Bill passes → Employees domain updates

**Load Command:**
```bash
npm run load-sample-data -- --domain politics --scenario all
```

---

#### 3. Business Domain Sample Data
**File:** `/scripts/sample-data/business-loader.ts`

**Loads:**
- 100 businesses (25 cannabis dispensaries, 25 restaurants, 25 tech startups, 25 retail shops)
- 50 supply chain relationships (supplier-customer links across businesses)
- 200 employees assigned to businesses (from Employees domain)
- 500 financial transactions (revenue, expenses, taxes, payroll)
- 10 tax policy implementations from Politics (corporate tax rates, sales tax, property tax)
- 30 regulatory compliance records (licenses, inspections, violations)

**Sample Scenarios:**
- Cannabis dispensary transitions from Crime domain (legalization) → Pays 10% state tax → Files compliance reports
- Restaurant franchise expands to 3 locations → Hires 30 employees → Manages payroll with minimum wage laws from Politics
- Tech startup receives investment → Scales headcount → Navigates corporate tax changes from Politics bill

**Load Command:**
```bash
npm run load-sample-data -- --domain business --scenario all
```

---

#### 4. Employees Domain Sample Data
**File:** `/scripts/sample-data/employees-loader.ts`

**Loads:**
- 500 employees (100 chemists, 100 drivers, 100 campaign staff, 100 business employees, 100 generic)
- 50 hiring events across all domains (Crime facilities, Political campaigns, Business companies)
- 30 labor law implementations from Politics (minimum wage x10, union rights x10, benefits mandates x10)
- 100 payroll records with varying wage rates (pre/post minimum wage changes)
- 20 public sector job postings (government positions from Politics bills)

**Sample Scenarios:**
- Chemist with skill level 85 hired by Crime manufacturing lab → Increases product quality → Affects marketplace pricing
- Campaign manager with experience 75 hired by gubernatorial campaign → Boosts polling by 3% → Affects election outcome
- Business raises wages to new minimum wage → Payroll costs increase → Affects Business profitability

**Load Command:**
```bash
npm run load-sample-data -- --domain employees --scenario all
```

---

#### 5. Cross-Domain Integration Sample Data
**File:** `/scripts/sample-data/integration-loader.ts`

**Loads:**
- 10 complete integration scenarios across all domains
- End-to-end workflows (e.g., Crime legalization → Business conversion → Tax revenue → Politics budget)
- Real-time event chains (Bill passes → Policy implements → Crime converts → Business profits → Employees hired)

**Example Integration Scenario:**
1. Politics: Cannabis legalization bill passes → `policy:implemented` event fires
2. Crime: 10 cannabis farms auto-convert to legal businesses → Heat removed, pricing/tax updated
3. Business: 10 new dispensaries created with licenses → Start filing tax returns
4. Employees: 50 employees transition from illegal to legal payroll → Wages increase (legal jobs pay more)
5. Politics: Tax revenue from legal sales funds public programs → Budget bill allocates to schools

**Load Command:**
```bash
npm run load-sample-data -- --domain integration --scenario all
```

---

### Sample Data Loader Execution

**Full Load (All Domains):**
```bash
npm run load-sample-data -- --all
```

**Incremental Load (Add to Existing):**
```bash
npm run load-sample-data -- --domain crime --scenario p2p-marketplace --incremental
```

**Reset and Reload:**
```bash
npm run load-sample-data -- --reset --all
```

**Verify Data Integrity:**
```bash
npm run verify-sample-data
```

---

## Manual QA Checklists

### Crime Domain Checklist (60+ Scenarios)

#### Manufacturing (10 scenarios)
- [ ] Create lab facility with $50K investment → Verify facility created with correct capacity
- [ ] Hire chemist with skill 85 → Produce batch → Verify quality/yield matches skill level
- [ ] Upgrade equipment tier 2 → 3 → Verify yield increase (20% boost expected)
- [ ] Neighbor reports suspicious activity → Verify heat accumulation, raid risk increases
- [ ] DEA raid on lab → Verify inventory seized, facility shut down, cash penalty
- [ ] Employee snitch reports to authorities → Verify heat spike, increased surveillance
- [ ] Produce at max capacity for 30 days → Verify no inventory overflow, storage costs accurate
- [ ] Legalization bill passes → Verify facility auto-converts to legal business, heat removed
- [ ] Create cannabis farm in Colorado (legal state) → Verify zero heat accumulation
- [ ] Cross-state production: Lab in Texas ships to Colorado → Verify interstate transport risk

#### Distribution (10 scenarios)
- [ ] Establish route TX → NY with truck transport → Verify cost, risk, delivery time calculated
- [ ] Hire driver with reliability 90 → Assign to route → Verify reduced seizure probability
- [ ] Border checkpoint intercepts shipment → Verify partial seizure (50% loss realistic)
- [ ] NPC distributor offers bulk purchase (500 units) → Accept → Verify transaction, inventory updated
- [ ] Player distributor lists bulk buy offer → Player 2 accepts → Escrow holds funds → Delivery completes → Verify funds released
- [ ] Air transport selected (high cost, low risk) → Verify faster delivery, lower seizure rate
- [ ] Route becomes "hot" (increased enforcement) → Verify dynamic risk adjustment, cost increase
- [ ] Legalization reduces checkpoints → Verify route risk drops, cost decreases
- [ ] Inventory expires (perishable product) → Verify spoilage, loss recorded
- [ ] Simultaneous shipments on same route → Verify no race conditions, inventory tracking accurate

#### P2P Marketplace (10 scenarios)
- [ ] Player 1 lists cannabis (100g, $1000, CO) → Verify listing appears in marketplace
- [ ] Player 2 searches "cannabis, CO, < $15/g" → Verify listing matches filters
- [ ] Player 2 purchases 50g → Escrow holds $500 → Meet-up arranged → Verify escrow release after delivery
- [ ] Player 2 reviews transaction (5 stars, "Quality product") → Verify seller reputation increases
- [ ] Player 3 attempts scam (accept payment, no delivery) → Dispute filed → Verify refund, seller blacklisted
- [ ] Dynamic pricing: CO market flooded (10 sellers, low demand) → Verify price drops 20%
- [ ] Event: Festival in CO → Demand spikes → Verify price increases 30%
- [ ] Purity filter: Search only "90%+ purity" → Verify only high-quality listings shown
- [ ] Bulk discount: Purchase 1000g (vs 100g) → Verify per-unit price decreases
- [ ] Legalization: Cannabis moves from illegal to legal marketplace → Verify price drop, tax added, compliance required

#### Territory & Gangs (10 scenarios)
- [ ] Player 1 creates gang "The Kingpins" → Claims Block 1 in Manhattan → Verify passive income starts (based on foot traffic)
- [ ] NPC gang "The Rivals" challenges Block 1 → Negotiation fails → Combat resolution → Verify winner absorbs territory
- [ ] Player 1 recruits Player 2 as lieutenant → Assigns distribution role → Verify profit sharing, role permissions
- [ ] Alliance formed between 2 player gangs → Share supply chain → Verify bulk purchase discounts
- [ ] Turf war between 3 gangs over 5-block district → Verify combat mechanics, territory redistribution
- [ ] Gang reputation increases (successful operations, no losses) → Verify NPC gangs more willing to ally/submit
- [ ] Player 1 expands to 10 blocks → Income scales → Verify diminishing returns (enforcement heat increases)
- [ ] Police crackdown (Politics enforcement budget increase) → Verify territory income drops, defense costs rise
- [ ] NPC gang scripted behavior: Expand aggressively → Verify AI logic (target weak territories, negotiate with strong)
- [ ] Gang dissolution: Player quits, disbands gang → Verify territories revert to unclaimed, members freed

#### State-to-State Travel (10 scenarios)
- [ ] Player travels CO → TX (1200 miles, 18 hours) → Verify travel cost ($200), time delay, arrival
- [ ] Buy 100g cannabis in CO ($800) → Travel to TX → Sell for $2000 → Verify arbitrage profit, risk exposure
- [ ] Border crackdown event active (TX border patrol surge) → Verify increased seizure probability (30% → 50%)
- [ ] Bulk purchase in CA (500g, $5000) → Transport to NY → Verify risk scales with quantity (higher seizure chance)
- [ ] Coordinate with Player 2 in NY (pre-sale agreement) → Arrive, deliver → Verify escrow release, reputation gain
- [ ] Seasonal event: Summer festival in FL → Demand spike → Verify dynamic pricing (30% increase)
- [ ] State drought (CO cannabis shortage) → Verify supply drop, price increase (opposite of usual low CO prices)
- [ ] Legalization bill passes in TX → Verify prices equalize across states, arbitrage opportunity reduces
- [ ] Multiple players travel same route → Verify no bottleneck, independent travel instances
- [ ] Player stranded mid-route (random event: vehicle breakdown) → Verify delay, repair costs, no inventory loss

#### Legalization & Conversion (10 scenarios)
- [ ] Federal cannabis legalization bill passes (Politics) → Verify all cannabis operations receive `policy:implemented` event
- [ ] Player 1's cannabis lab (illegal) → Auto-converts to legal dispensary → Verify facility type changes, heat removed
- [ ] Legal dispensary files tax return (10% state tax) → Verify revenue calculation, tax payment, compliance record
- [ ] Pre-legalization pricing ($20/g illegal) → Post-legalization ($15/g legal, taxed) → Verify market adjustment
- [ ] Quality standards enforced (legal market) → Player with low-purity product (60%) → Verify compliance failure, fine
- [ ] Legal market competition (10 dispensaries in CO) → Verify price pressure, quality differentiation matters
- [ ] Player 2 refuses to convert (keeps illegal operation post-legalization) → Verify increased heat, raid probability
- [ ] Legalization converts 100 facilities simultaneously → Verify no server lag, all conversions logged
- [ ] Employees transition from illegal to legal payroll → Verify wage increase (legal jobs pay 20% more)
- [ ] Tax revenue from legal sales → Politics budget bill allocates to public programs → Verify fund tracking, budget impact

---

### Politics Domain Checklist (60+ Scenarios)

#### Elections (10 scenarios)
- [ ] Create gubernatorial election (2026, General) → Verify election appears in calendar, candidates can announce
- [ ] Player 1 announces candidacy (Democrat, Governor) → Verify filing fee deducted, campaign created
- [ ] Multiple candidates (5 total: 2 Dem, 2 GOP, 1 Ind) → Verify polling distributes correctly (sum ~100%)
- [ ] Primary election: 2 Dems compete → Verify winner advances to general, loser status = 'Lost'
- [ ] General election: Democrat vs. Republican → Simulate voting → Verify vote counts, percentage calculations
- [ ] Runoff triggered (no candidate >50%) → Verify top 2 advance, new election created, date set
- [ ] Election night dashboard → Live results update → Verify vote counts increment, map colors change
- [ ] Race called for winner (margin >5%) → Verify `election:race-called` event fires, status = 'Won'
- [ ] Historical results stored → View past elections → Verify vote margins, turnout data accurate
- [ ] Special election (vacancy fill) → Verify short campaign period, immediate term start

#### Campaigns (10 scenarios)
- [ ] Create campaign with strategy (60% TV ads, 20% digital, 10% events, 10% ground game) → Verify budget allocation totals 100%
- [ ] Reallocate budget mid-campaign (30% TV → 50% digital) → Verify funds shift, metrics update (digital reach increases)
- [ ] Hire campaign manager (skill 80, cost $50K) → Verify cash on hand decreases, polling boost (+2%)
- [ ] Polling update (weekly) → Trend rising (+3% per week) → Verify favorability increases, trend = 'Rising'
- [ ] Scandal event fires (opponent attack ad) → Verify polling drops (-5%), favorability decreases
- [ ] Endorsement received (major union) → Verify polling boost (+4%), base turnout increases
- [ ] Finance metrics: Cash on hand $200K, burn rate $10K/day → Verify days until broke = 20
- [ ] Media mentions: 10 positive, 5 neutral, 2 negative → Verify sentiment score = +0.47 (weighted avg)
- [ ] Volunteer recruitment: 50 volunteers recruited → Assign to phone banking → Verify calls made increases
- [ ] Election night: Player wins 52-48 → Victory displayed → Verify confetti animation, `election-win.mp3` plays

#### Voter Outreach (10 scenarios)
- [ ] Phone bank session (target District 12, 100 calls) → Verify voter responses recorded (Strong Support: 30, Lean: 25, Undecided: 20, Oppose: 25)
- [ ] Canvassing (send 10 volunteers to swing precincts) → Verify doors knocked, voter sentiment tracked
- [ ] Town hall event (500 attendees, cost $5K) → Verify media coverage generated (+3 positive mentions), polling boost
- [ ] Volunteer assignment: 20 volunteers → 10 to phone bank, 10 to canvassing → Verify task distribution, hours tracked
- [ ] Voter database query (District 12, Undecided, high turnout likelihood) → Verify filter returns correct subset
- [ ] GOTV activation (final 3 days) → Target strong supporters with reminders → Verify turnout increases (+5% in targeted group)
- [ ] Micro-targeting: Hispanics aged 25-35 in urban areas prioritize healthcare → Send healthcare message → Verify persuasion effectiveness (+10% vs generic message)
- [ ] Persuasion tracking: Undecided voter contacted 3 times → Verify shift to Lean Support (cumulative effect)
- [ ] Volunteer fatigue: 100 hours in 1 week → Verify effectiveness declines (-20% persuasion per contact)
- [ ] Concurrent outreach: Phone bank + canvass same district → Verify no overlap, contacts tracked separately

#### Bills & Policy (10 scenarios)
- [ ] Create cannabis legalization bill (sponsor: Player 1, type: CriminalJustice) → Verify bill introduced, status = 'Introduced'
- [ ] Bill progression: Introduced → Committee vote (12 Yea, 8 Nay) → Verify passedCommittee = true, stage = 'Floor'
- [ ] Floor vote: 55 legislators, need 28 for passage → 30 vote Yea → Verify bill passed, stage = 'Executive'
- [ ] Executive signature (Governor signs) → Verify bill status = 'Implemented', `bill:signed` event fires
- [ ] Policy implementation: Cannabis legalized → Crime domain receives `policy:implemented` → Verify facility conversions
- [ ] Amendment proposed (reduce tax rate 10% → 5%) → Vote on amendment → Verify bill updated or amendment rejected
- [ ] Veto: Governor vetoes bill → Legislature attempts override (need 2/3 supermajority) → Verify override success/failure based on votes
- [ ] Lobbying: Player 2 spends $50K lobbying for bill → 3 undecided legislators shift to Yea → Verify vote impact
- [ ] Fiscal impact: Tax rate bill projects $100M revenue increase → Verify budget forecast updates, Politics budget allocates
- [ ] Concurrent bills: 5 bills voted on same day → Verify each vote separate, no cross-contamination of tallies

#### Fundraising & Donors (10 scenarios)
- [ ] Make donation: Player 2 donates $5000 to Player 1's campaign → Verify contribution limit enforced ($5K individuals)
- [ ] Fundraising event: Dinner ($500/plate, 50 attendees) → Verify revenue $25K, costs $5K, net $20K
- [ ] Finance report filed quarterly → Verify receipts, expenditures, cash on hand accurate, publicly accessible
- [ ] Bundled contributions: Donor recruits 10 friends ($50K total) → Verify bundler credited, network tracked
- [ ] Contribution limit exceeded: Player attempts $6K donation → Verify transaction rejected, $5K max enforced
- [ ] PAC donation: Tech Industry PAC donates $10K → Verify PAC limit ($10K) enforced, not individual limit
- [ ] Business donation: Corporation donates $15K → Verify business limit enforced ($15K max)
- [ ] Donor engagement: Email campaign to 100 donors → 20 donate again → Verify repeat donation rate, loyalty tracked
- [ ] Super PAC (P1): Independent expenditure group spends $500K on ads (not coordinated with campaign) → Verify campaign unaware of spending (no coordination allowed)
- [ ] Finance audit: Verify all transactions logged, receipts match expenditures, no unexplained cash

#### Districts & Demographics (10 scenarios)
- [ ] View district details (District NY-SD-12) → Verify demographics (pop, income, race, education), voter data, electoral history
- [ ] Competitive district filter (Tossup) → Verify returns districts with 48-52% margins
- [ ] Voter file query (District 12, Democrat registration) → Verify returns correct party affiliation subset
- [ ] District map interaction: Click district on map → Verify details panel opens, color-coded by party control
- [ ] Electoral history: District voted Dem in 2022 (52-48), GOP in 2024 (51-49) → Verify trend = 'Swing'
- [ ] Redistricting (P1): Redraw boundaries → Verify population balance, competitiveness changes
- [ ] Demographic targeting: High-income suburban district → Send tax cut message → Verify message-demo alignment boosts persuasion
- [ ] Issue priorities: District ranks Crime as top issue (40% voters) → Campaign focuses on law enforcement message → Verify polling boost
- [ ] Turnout history: District averaged 65% turnout → Election forecast predicts 68% (enthusiasm high) → Verify turnout model accuracy
- [ ] GeoJSON map: Verify district polygons render correctly, click accuracy, color legend matches party

---

### Business Domain Checklist (40+ Scenarios)

#### Business Creation & Management (10 scenarios)
- [ ] Create cannabis dispensary (post-legalization) → Verify business created, license required, compliance tracking
- [ ] Franchise expansion: Restaurant opens 3 locations → Verify separate inventory, shared brand, consolidated financials
- [ ] Employee hiring: Hire 30 employees for business → Verify payroll integration, wage rates from Employees domain
- [ ] Supply chain: Tech startup purchases equipment from supplier → Verify transaction, inventory updated
- [ ] Revenue tracking: Dispensary sales $500K/month → Verify revenue logged, tax liability calculated
- [ ] Tax compliance: File quarterly sales tax (8% rate) → Verify tax payment, compliance record updated
- [ ] Regulatory inspection: Health inspector visits restaurant → Pass inspection → Verify compliance status = 'Good Standing'
- [ ] Violation: Dispensary sells to minor (compliance failure) → Verify fine assessed, license suspension risk
- [ ] Bankruptcy: Business losses exceed assets → Declare bankruptcy → Verify business closure, creditor notifications
- [ ] Merger: Two businesses merge → Verify combined assets, employees transferred, financial consolidation

#### Policy Integration (10 scenarios)
- [ ] Corporate tax rate bill passes (25% → 28%) → Verify Business tax liability increases for all companies
- [ ] Minimum wage increase (Politics bill) → Verify Business payroll costs rise, affects profitability
- [ ] Regulatory streamlining act (reduces compliance costs 20%) → Verify Business operational expenses decrease
- [ ] Small business tax credit (companies < 50 employees) → Verify eligible businesses receive credit, tax liability decreases
- [ ] Cannabis legalization: 10 illegal operations convert to legal businesses → Verify tax revenue tracked, licenses issued
- [ ] Sales tax rate change (6% → 7%) → Verify Business sales tax collection updated, remittance accurate
- [ ] Property tax increase (affects warehouses) → Verify Business real estate costs rise, margins compressed
- [ ] Environmental regulation: Manufacturing business must install pollution controls → Verify capital expenditure, compliance costs
- [ ] Subsidy program: Green energy subsidy for solar panel installers → Verify subsidy received, revenue boost
- [ ] Trade policy: Tariff on imported goods affects supply chain costs → Verify Business cost increases, pricing adjustments

---

### Employees Domain Checklist (30+ Scenarios)

#### Hiring & Payroll (10 scenarios)
- [ ] Hire chemist (skill 85, wage $75K) for Crime lab → Verify employee assigned, payroll starts, skill applied
- [ ] Hire campaign manager for Politics campaign → Verify campaign effectiveness improves, polling boost
- [ ] Hire driver (reliability 90) for Crime distribution → Verify route risk decreases, delivery success rate increases
- [ ] Fire employee: Business fires underperformer → Verify severance paid, employment record updated
- [ ] Payroll processing: 100 employees paid bi-weekly → Verify wages calculated, taxes withheld, net pay accurate
- [ ] Overtime: Employee works 50 hours (40 regular, 10 OT at 1.5x) → Verify overtime pay calculated correctly
- [ ] Minimum wage compliance: New minimum wage $15/hr → Verify all employees at/above minimum, violators flagged
- [ ] Benefits: Employee enrolled in health insurance → Verify premium deducted from paycheck, employer contribution
- [ ] Promotion: Employee promoted (skill increases, wage increases) → Verify new skill level applied to work output
- [ ] Resignation: Employee quits → Verify replacement hiring process, productivity gap until replacement

#### Labor Policy Integration (10 scenarios)
- [ ] Minimum wage bill passes ($12 → $15) → Verify Employee salaries increase, Business costs rise
- [ ] Union rights act strengthens organizing → Verify Employee union membership option, collective bargaining
- [ ] Paid family leave mandate → Verify Employees eligible for 12 weeks leave, wages paid by state fund
- [ ] Public sector job creation (Politics budget bill) → Verify government jobs posted, Employees can apply
- [ ] Labor law violation: Business fails to pay overtime → Verify fine assessed, back pay owed
- [ ] Unemployment benefits: Employee laid off → Verify unemployment claim processed, benefits paid
- [ ] Workers' compensation: Employee injured on job → Verify claim filed, medical costs covered, lost wages paid
- [ ] Pension system: Public sector employees enrolled → Verify contributions deducted, retirement benefits tracked
- [ ] Training program: Employee completes skill training → Verify skill level increases (70 → 80)
- [ ] Employee satisfaction: Poor working conditions (low wages, no benefits) → Verify turnover increases, productivity drops

---

### Cross-Domain Integration Checklist (50+ Scenarios)

#### Crime ↔ Politics (10 scenarios)
- [ ] Cannabis legalization bill passes → Crime facilities auto-convert → Verify conversion complete, heat removed, pricing updated
- [ ] Enforcement budget increase (Politics) → Crime heat accumulation rate increases → Verify raid frequency rises
- [ ] Sentencing reform (Politics) → Crime arrest penalties decrease → Verify reduced cash loss, shorter suspensions
- [ ] DEA priority shift (Politics) → Crime opioid heat increases 50% → Verify dynamic risk adjustment
- [ ] Asset forfeiture policy change → Crime seizures return 30% to players → Verify partial recovery on failed operations
- [ ] Legalization campaign: Crime players lobby Politics legislators → Bill vote influenced → Verify lobbying expenditures tracked
- [ ] Police funding cut → Crime operations face fewer raids → Verify risk reduction, profitability increases
- [ ] Border security bill (Politics) → Crime interstate transport risk increases → Verify route costs, seizure probability
- [ ] Treatment funding (Politics) → Crime demand decreases for addictive substances → Verify market contraction, price adjustment
- [ ] Decriminalization (not full legalization) → Crime penalties reduced but still illegal → Verify heat reduced 50%, not eliminated

#### Crime ↔ Business (10 scenarios)
- [ ] Illegal cannabis operation (Crime) → Legalization → Converts to dispensary (Business) → Verify business license, tax compliance
- [ ] Money laundering: Crime cash → Invested in restaurant (Business) → Verify laundering mechanics, audit risk
- [ ] Supply chain: Cannabis dispensary (Business) purchases from cultivation facility (formerly Crime) → Verify B2B transaction
- [ ] Employee transfer: Chemist from Crime lab → Hired by legal pharmaceutical company (Business) → Verify skill transfer
- [ ] Tax revenue: Legal cannabis sales (Business) generate tax revenue → Politics allocates to programs → Verify fund flow
- [ ] Regulatory compliance: Business must pass inspections; former Crime operators struggle with compliance → Verify violation rates higher for converts
- [ ] Market competition: Legal businesses undercut illegal Crime prices → Verify price pressure, market share shift
- [ ] Legitimate front: Crime player owns restaurant (Business) to launder money → Verify dual operations
- [ ] Investment: Crime profits invested in Business startup → Verify capital injection, ownership stake
- [ ] Brand reputation: Crime background (arrest history) affects Business loan approval → Verify credit check, interest rate penalty

#### Politics ↔ Business (10 scenarios)
- [ ] Corporate tax rate bill (Politics) → Business tax liability changes → Verify revenue impact, profitability shift
- [ ] Minimum wage increase (Politics) → Business payroll costs rise → Verify margin compression, potential layoffs
- [ ] Sales tax change (Politics) → Business collection rates update → Verify remittance amounts accurate
- [ ] Small business tax credit (Politics) → Qualifying businesses receive credit → Verify eligibility check, credit applied
- [ ] Regulatory streamlining (Politics) → Business compliance costs decrease → Verify operational expense reduction
- [ ] Subsidy program (Politics) → Green energy businesses receive grants → Verify subsidy receipt, revenue boost
- [ ] Campaign donation: Business donates $15K to gubernatorial campaign (Politics) → Verify contribution limit enforced
- [ ] Lobbying: Business spends $100K lobbying for tax cut bill (Politics) → Verify expenditure tracked, influence on vote
- [ ] Trade policy (Politics) → Tariffs increase Business import costs → Verify supply chain adjustment, pricing changes
- [ ] Public procurement (Politics) → Government contracts awarded to businesses → Verify bidding process, contract execution

#### Politics ↔ Employees (10 scenarios)
- [ ] Minimum wage bill (Politics) → Employee salaries increase → Verify wage floor enforced across all domains
- [ ] Union rights act (Politics) → Employees can organize unions → Verify collective bargaining, strike mechanics
- [ ] Paid family leave mandate (Politics) → Employees eligible for leave → Verify benefits paid, job protection
- [ ] Public sector job creation (Politics) → Government hires Employees → Verify job postings, application process
- [ ] Campaign staff hiring (Politics) → Campaign hires Employees → Verify skills applied to campaign effectiveness
- [ ] Labor law violation enforcement (Politics) → Business fined for wage theft → Verify Employee back pay recovered
- [ ] Unemployment benefits (Politics) → Laid-off Employees receive benefits → Verify claim processing, payment
- [ ] Training program funding (Politics) → Employees enroll in skill courses → Verify skill level increases
- [ ] Government shutdown (Politics) → Public sector Employees furloughed → Verify paycheck suspension, back pay upon resolution
- [ ] Pension reform (Politics) → Employee retirement benefits adjusted → Verify contribution rates, benefit calculations

#### End-to-End Integration (10 scenarios)
- [ ] **Scenario 1**: Crime cannabis legalization → Business dispensary → Employee hiring → Tax revenue → Politics budget
  - Cannabis legalization bill passes (Politics) →
  - Crime facilities convert to Business dispensaries →
  - Dispensaries hire Employees (chemists, retail staff) →
  - Sales generate tax revenue →
  - Politics budget allocates revenue to public schools →
  - Verify complete chain: Bill → Conversion → Hiring → Revenue → Allocation

- [ ] **Scenario 2**: Politics minimum wage → Employee wages → Business costs → Crime opportunities
  - Minimum wage bill passes $12 → $15 (Politics) →
  - Employee salaries increase across all domains →
  - Business payroll costs rise 25% →
  - Businesses lay off Employees →
  - Unemployed Employees join Crime operations (economic desperation) →
  - Verify complete chain: Wage increase → Cost impact → Layoffs → Crime recruitment

- [ ] **Scenario 3**: Crime profits → Money laundering → Business investment → Employee jobs → Tax revenue
  - Player earns $500K from Crime operations →
  - Launders money through restaurant (Business) →
  - Restaurant expands, hires 20 Employees →
  - Restaurant generates $100K tax revenue →
  - Verify complete chain: Crime → Laundering → Expansion → Jobs → Revenue

- [ ] **Scenario 4**: Politics campaign → Crime donation → Policy influence → Business benefit
  - Crime kingpin donates $15K to gubernatorial campaign (Politics) →
  - Candidate wins, opposes enforcement increases →
  - Enforcement budget stays flat (no increase) →
  - Crime operations face stable risk, profitability maintained →
  - Crime player benefits from political investment →
  - Verify complete chain: Donation → Election → Policy → Crime benefit

- [ ] **Scenario 5**: Business lobbying → Politics tax cut → Business profit → Employee bonuses
  - Tech company (Business) lobbies for corporate tax cut (Politics) →
  - Tax cut bill passes (25% → 20%) →
  - Business tax savings $200K/year →
  - Business pays Employee bonuses ($50K total) →
  - Verify complete chain: Lobbying → Tax cut → Savings → Bonuses

- [ ] **Scenario 6**: Politics enforcement increase → Crime risk → Business opportunity → Employee demand
  - Police funding increase (Politics) →
  - Crime heat accumulation doubles, raids increase →
  - Crime players exit market (too risky) →
  - Legal cannabis businesses (Business) capture market share →
  - Businesses hire Employees to meet demand →
  - Verify complete chain: Enforcement → Crime contraction → Business growth → Hiring

- [ ] **Scenario 7**: Employee union organizing → Politics labor bill → Business costs → Crime competition
  - Employees unionize at manufacturing company (Business) →
  - Union lobbies for labor rights bill (Politics) →
  - Bill passes, union protections strengthened →
  - Business labor costs increase 15% →
  - Business raises prices, loses customers to illegal Crime alternatives →
  - Verify complete chain: Union → Bill → Costs → Competition

- [ ] **Scenario 8**: Politics decriminalization → Crime penalty reduction → Employee recruitment → Business shortage
  - Decriminalization bill passes (Politics) →
  - Crime penalties reduced 75% (still illegal but minor fines) →
  - Employees quit legal jobs to join Crime operations (higher pay, lower risk) →
  - Businesses face labor shortage →
  - Verify complete chain: Decrim → Lower risk → Employee shift → Labor shortage

- [ ] **Scenario 9**: Crime legalization → Business boom → Politics tax revenue → Employee public sector jobs
  - Federal legalization (Politics) →
  - 100 Crime operations convert to Business →
  - Tax revenue increases $10M/year →
  - Politics budget allocates to public sector jobs →
  - 500 government Employee positions created →
  - Verify complete chain: Legalization → Conversion → Revenue → Job creation

- [ ] **Scenario 10**: Politics scandal → Campaign collapse → Business donation loss → Employee layoffs
  - Gubernatorial candidate scandal (Politics) →
  - Polling drops 30%, campaign suspended →
  - Business that donated $15K loses influence →
  - Expected policy benefit (tax cut) doesn't happen →
  - Business cuts budget, lays off 10 Employees →
  - Verify complete chain: Scandal → Campaign failure → Policy loss → Layoffs

---

## Regression Testing Procedures

### Full Regression Suite (Pre-Release)

**Frequency:** Before every major release (P0-Alpha, P0-Beta, P0-Gamma)

**Scope:** All manual QA checklists (250+ scenarios across all domains)

**Process:**
1. **Reset Environment**: Load fresh sample data (all domains)
2. **Execute Checklists**: Systematically test every scenario
3. **Log Results**: Record pass/fail for each scenario in regression spreadsheet
4. **Bug Triage**: Categorize failures (critical, high, medium, low priority)
5. **Fix & Retest**: Resolve bugs, re-run failed scenarios
6. **Sign-Off**: QA lead confirms all scenarios passing before release

**Time Estimate:** 40-60 hours (full suite, single tester)

**Regression Spreadsheet Template:**
```
| Scenario ID | Domain | Feature | Test Case | Status | Notes | Tester | Date |
|-------------|--------|---------|-----------|--------|-------|--------|------|
| CRM-001     | Crime  | Manufacturing | Create lab facility | PASS | | Alice | 2025-11-27 |
| CRM-002     | Crime  | Manufacturing | Hire chemist | FAIL | Quality calculation off by 5% | Bob | 2025-11-27 |
| POL-015     | Politics | Bills | Cannabis legalization → Crime conversion | PASS | | Alice | 2025-11-28 |
```

---

### Incremental Regression (Weekly)

**Frequency:** Weekly during active development

**Scope:** Feature-specific checklists (modified features + integration points)

**Process:**
1. Identify features modified this week
2. Run checklist for modified features (e.g., Crime manufacturing changes → Run CRM-001 through CRM-010)
3. Run cross-domain integration scenarios touching modified features
4. Log results, fix critical bugs immediately
5. Defer medium/low bugs to backlog

**Time Estimate:** 8-12 hours/week

---

### Smoke Testing (Daily Builds)

**Frequency:** Every dev build (daily or on-demand)

**Scope:** Critical path scenarios (1 per major feature, ~20 total)

**Example Critical Path:**
- CRM-001: Create lab facility
- CRM-012: Establish distribution route
- CRM-020: List item in P2P marketplace
- POL-025: Create campaign and run election
- POL-031: Cannabis legalization bill → Crime conversion
- BUS-005: Create business and hire employees
- EMP-003: Payroll processing with minimum wage compliance
- INT-001: Crime legalization → Business conversion → Tax revenue

**Time Estimate:** 2-3 hours

---

## Performance Testing

### Load Testing Scenarios

#### 1. High-Volume Transactions
- **Scenario**: 1000 concurrent P2P marketplace transactions
- **Metrics**: Transaction processing time, database write latency, error rate
- **Target**: < 500ms per transaction, < 1% error rate
- **Tool**: Custom load script (`npm run load-test -- --scenario p2p-marketplace`)

#### 2. Real-Time Event Broadcast
- **Scenario**: 100 concurrent elections with live results updating every 5 seconds
- **Metrics**: Socket.io event latency, client connection stability, server CPU/memory
- **Target**: < 100ms event latency, 0 dropped connections, < 70% CPU
- **Tool**: Socket.io load tester (`npm run load-test -- --scenario realtime-elections`)

#### 3. Complex Queries
- **Scenario**: 500 concurrent district demographic queries (GeoJSON rendering)
- **Metrics**: Query execution time, database index usage, cache hit rate
- **Target**: < 200ms query time, 100% index coverage, > 80% cache hit rate
- **Tool**: MongoDB profiler + custom query benchmarks

#### 4. Cross-Domain Cascades
- **Scenario**: Cannabis legalization bill converts 1000 Crime facilities simultaneously
- **Metrics**: Cascade completion time, event propagation latency, data consistency
- **Target**: < 30 seconds total cascade, 100% data consistency (no orphaned records)
- **Tool**: Integration test with instrumentation

---

## Security Audit

### Manual Security Checklist

#### Authentication & Authorization
- [ ] NextAuth session expiration enforced (30 min idle, 24h absolute)
- [ ] Role-based access: Only legislators vote, only executives sign bills
- [ ] API routes protected: All `/api/*` routes check authentication
- [ ] CSRF protection: All state-changing requests validate CSRF tokens
- [ ] Password requirements: 12+ chars, uppercase, lowercase, number, special char

#### Input Validation
- [ ] Zod schemas validate all API inputs (bill parameters, donation amounts, vote choices)
- [ ] SQL/NoSQL injection prevented: Mongoose queries parameterized, no string concatenation
- [ ] XSS prevention: All user inputs sanitized, React auto-escaping enabled
- [ ] File upload validation: Max size 10MB, allowed extensions only, virus scan
- [ ] Rate limits enforced: Campaign creation 5/year, bill introduction 10/session, donations 50/day

#### Data Privacy
- [ ] Voter records pseudonymized (no real PII)
- [ ] Donor contact info private (names/amounts public, email/phone private)
- [ ] Campaign finance reports public (aggregated, no individual donor addresses)
- [ ] Employee data secured (payroll, SSN, bank info encrypted at rest)
- [ ] User passwords hashed (bcrypt, salt rounds = 12)

#### Financial Security
- [ ] Contribution limits enforced server-side (individuals $5K, PACs $10K, business/unions $15K)
- [ ] Escrow transactions atomic (funds locked until delivery confirmed, no partial releases)
- [ ] Vote buying detection (large donation immediately before vote = flagged for review)
- [ ] Audit logging (all donations, votes, executive actions logged with timestamps)
- [ ] Anti-fraud: Duplicate transaction prevention (idempotency keys)

#### Server-Side Validation
- [ ] Vote counting server-calculated (client cannot manipulate totals)
- [ ] Polling data server-generated (client cannot fake polls)
- [ ] Bill passage thresholds checked server-side (client cannot force passage)
- [ ] Fiscal impact calculations server-side (client cannot submit fake estimates)
- [ ] Competitiveness scores server-calculated (client cannot override)

---

## Bug Tracking & Prioritization

### Bug Severity Levels

**Critical (P0):**
- Data loss or corruption
- Security vulnerabilities (auth bypass, injection)
- Crashes or complete feature failure
- Real-time events not broadcasting (election results, bill votes)
- **Resolution SLA:** 24 hours

**High (P1):**
- Major feature broken but workaround exists
- Cross-domain integration failures (Crime → Politics policy not applying)
- Performance degradation (>5s page loads)
- Incorrect calculations (vote counts off, tax revenue wrong)
- **Resolution SLA:** 3 days

**Medium (P2):**
- Minor feature issues (UI glitch, missing tooltip)
- Inconsistent behavior (works sometimes, fails other times)
- Poor UX (confusing flow, unclear error messages)
- **Resolution SLA:** 1 week

**Low (P3):**
- Cosmetic issues (alignment, colors)
- Nice-to-have features missing
- Documentation errors
- **Resolution SLA:** 2 weeks or backlog

---

## User Acceptance Testing (UAT)

### UAT Process

**Phase 1: Feature Walkthrough (Solo Developer)**
- Developer follows user scenarios end-to-end
- Validates all acceptance criteria met
- Logs any usability issues, edge cases

**Phase 2: Beta Testing (Future - when users available)**
- Invite 10-20 beta testers
- Provide guided scenarios (e.g., "Run for Governor and pass a legalization bill")
- Collect feedback via surveys, session recordings

**Phase 3: Launch Readiness Review**
- All critical/high bugs resolved
- Performance targets met
- Security audit passed
- Documentation complete (API docs, user guides)

---

## Continuous Improvement

### QA Metrics Tracking

**Weekly Metrics:**
- Bugs found per domain
- Bug resolution time by severity
- Regression test pass rate
- Performance benchmark trends (query times, event latency)

**Monthly Metrics:**
- Feature completion rate (planned vs. delivered)
- QA coverage (scenarios executed vs. total checklist)
- Production incidents (post-launch bugs)
- User-reported issues (if beta testing active)

**Quarterly Review:**
- QA strategy effectiveness (are we catching bugs pre-release?)
- Checklist updates (add new scenarios for new features)
- Tooling improvements (better sample data, load testing)
- Documentation updates (reflect lessons learned)

---

## Conclusion

This manual-first QA strategy prioritizes **comprehensive testing workflows over automated test suites**, enabling rapid iteration while maintaining AAA-quality standards. By combining detailed checklists, reproducible sample data, systematic regression procedures, and rigorous cross-domain integration testing, TheSimGov ensures all features meet acceptance criteria before release.

**Key Principles:**
1. **Manual testing catches UX/gameplay issues automated tests miss**
2. **Sample data loaders provide stable, reproducible test environments**
3. **Regression procedures ensure no feature regressions across releases**
4. **Cross-domain integration testing validates complex MMO mechanics**
5. **Performance and security testing protect production stability**

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-27  
**Maintained By:** Platform Architecture (ECHO v1.3.1)  
**Review Cycle:** Quarterly (update checklists for new features, adjust sample data)
