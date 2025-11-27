# Engagement Features - Shared Infrastructure (P0)

**Document Type:** Feature Specification  
**Created:** 2025-11-27  
**Status:** PLANNED  
**Priority:** HIGH (P0 Foundation)  
**Scope:** Cross-domain shared infrastructure for player engagement  

---

## Overview

Engagement features are **shared infrastructure components** that enhance player retention, progression visibility, and social interaction across all game domains (Crime, Politics, Business, Employees, Media, Demographics). Rather than being isolated features, these systems integrate deeply with domain-specific gameplay to create a cohesive MMO experience.

**Key Systems:**
1. **GamificationEngine** - Achievements, leaderboards, progression tracking
2. **LiveActivityFeed** - Real-time social feed with reactions, sharing, highlights
3. **AIInsightsPanel** - Data-driven analytics and recommendations (no LLM)
4. **InteractiveTutorial** - Onboarding and contextual help system
5. **DesignSystem** - HeroUI theme, components, motion, sound effects

---

## 1. GamificationEngine

### Purpose
Drive player engagement through achievements, leaderboards, progression systems, and rewards that span all game domains.

### Core Features

#### Achievements System
- **Domain-Specific Achievements**: Each domain (Crime, Politics, Business, Employees) contributes achievements
  - Crime: "First Lab", "Drug Lord" (10 facilities), "Kingpin" (control 20 territories)
  - Politics: "Elected Official", "Legislator" (pass first bill), "Landslide Victory" (win by 20+ points)
  - Business: "Entrepreneur", "Mogul" ($10M revenue), "Empire Builder" (10+ businesses)
  - Employees: "Hiring Manager", "Labor Leader" (unionize 100 workers), "CEO" (manage 500+ employees)

- **Cross-Domain Achievements**: Reward integration across domains
  - "Legitimate Businessman": Convert illegal Crime operation to legal Business
  - "Political Kingmaker": Donate to 5+ winning campaigns
  - "Economic Titan": Control Crime + Business + Political influence in same state
  - "Reformer": Pass legalization bill that converts 10+ Crime operations

- **Meta Achievements**: Long-term progression
  - "Completionist": Unlock 100 achievements
  - "Legend": Reach level 50 (experience from all domains)
  - "Pioneer": Complete tutorial and reach level 10 in first 7 days

#### Leaderboards
- **Global Leaderboards** (cross-company):
  - Total wealth (Crime profits + Business revenue + political donations)
  - Political influence (campaign wins, bills passed, donor network size)
  - Criminal empire size (territories controlled, production capacity)
  - Business empire (revenue, employee count, market share)

- **Company-Specific Leaderboards** (within tenant):
  - Top earners this month
  - Most powerful politicians (current office holders)
  - Largest gang/cartel (by territory/members)
  - Fastest rising players (level gain this week)

- **Seasonal Leaderboards**:
  - Election cycle winners (most electoral victories)
  - Legislative champions (most bills passed this session)
  - Economic growth leaders (highest % revenue increase)

#### Progression System
- **Experience Points (XP)**: Earned from all domain activities
  - Crime: Manufacturing batches, successful deliveries, territory claims
  - Politics: Campaign milestones, bill votes, election wins
  - Business: Revenue thresholds, employee hires, expansions
  - Employees: Training completions, promotions, skill increases

- **Levels**: 1-50, unlocks permissions and features
  - Level 1-10: Tutorial phase, basic features
  - Level 11-25: Intermediate features (gang creation, campaign management, business expansion)
  - Level 26-40: Advanced features (super PACs, multi-state operations, franchises)
  - Level 41-50: Endgame features (federal politics, international trade, legacy systems)

- **Rewards**:
  - Level milestones unlock features, cosmetics (avatar frames, badges), bonus starting capital

### API Surface
- `GET /api/engagement/achievements` - List all achievements with unlock status
- `POST /api/engagement/achievements/:id/unlock` - Unlock achievement (triggered by domain events)
- `GET /api/engagement/leaderboards/:type` - Fetch leaderboard (global, company, seasonal)
- `GET /api/engagement/progression` - Player XP, level, next level requirements
- `POST /api/engagement/xp/grant` - Award XP (called by domain services)

### Real-Time Events
- `achievement:unlocked` - Broadcast achievement unlock with animation trigger
- `leaderboard:update` - Player rank changes (throttled to 1/minute per player)
- `level:up` - Player levels up (triggers celebration animation)

### Implementation Estimate
**Time:** 12-16 hours
- Achievement definitions (3h)
- Leaderboard system with caching (4h)
- XP/level progression logic (3h)
- API endpoints + Socket.io events (2h)
- UI components (badges, progress bars, leaderboard tables) (4h)

---

## 2. LiveActivityFeed

### Purpose
Create real-time social feed showing player activities, major events, and achievements across all domains to foster community and competitive dynamics.

### Core Features

#### Activity Types
- **Crime Activities**:
  - "PlayerX claimed 3 territories in Brooklyn"
  - "PlayerY successfully delivered 500kg cannabis NY → CA"
  - "Gang 'The Kingpins' won turf war, absorbed 5 blocks"
  - "PlayerZ's lab raided by DEA, $2M seized"

- **Politics Activities**:
  - "PlayerA won election for Governor of New York (52-48%)"
  - "PlayerB passed Cannabis Legalization Act, 30-25 vote"
  - "PlayerC raised $500K in 24 hours for Senate campaign"
  - "Governor signed Bill HB-2025-042, affecting 100 Crime operations"

- **Business Activities**:
  - "PlayerD opened 3 new dispensaries in Colorado"
  - "PlayerE's restaurant chain hit $10M annual revenue"
  - "PlayerF hired 100 employees, now largest employer in state"

- **Achievements & Milestones**:
  - "PlayerG unlocked 'Drug Lord' achievement"
  - "PlayerH reached Level 25"
  - "PlayerI climbed to #3 on Global Wealth Leaderboard"

#### Feed Features
- **Filters**: Global (all companies), Company (tenant-specific), Friends (social network), Personal (my activities)
- **Reactions**: 👍 Like, 🔥 Fire, 😮 Wow, 😂 LOL (emoji reactions on activities)
- **Sharing**: Share activity to friends, gang members, campaign supporters
- **Comments** (P1): Threaded comments on activities
- **Highlight Reels**: Daily/weekly top moments (most reactions, biggest wins)

#### Privacy Controls
- **Activity Visibility**:
  - Public: All players see activity
  - Company: Only company members see
  - Friends: Only friends see
  - Private: No feed entry (opt-out for specific activities)

- **Default Visibility by Activity**:
  - Election wins: Public
  - Bill passage: Public
  - Crime seizures/arrests: Private (embarrassing)
  - Business expansions: Public
  - Territory wars: Public

### API Surface
- `GET /api/engagement/feed` - Fetch activity feed with filters (global, company, friends, personal)
- `POST /api/engagement/feed/activity` - Post new activity (called by domain services)
- `POST /api/engagement/feed/:id/react` - Add reaction to activity
- `DELETE /api/engagement/feed/:id/react` - Remove reaction
- `GET /api/engagement/feed/highlights` - Daily/weekly highlight reel

### Real-Time Events
- `feed:new-activity` - New activity posted (broadcast to filtered audience)
- `feed:reaction` - Someone reacted to your activity
- `feed:trending` - Activity went viral (100+ reactions)

### Implementation Estimate
**Time:** 14-18 hours
- Activity data model + feed generation logic (4h)
- Filter/privacy system (3h)
- Reactions system (2h)
- Highlight reel algorithm (most reactions/impact) (3h)
- API endpoints + Socket.io events (2h)
- UI components (feed card, reaction buttons, highlight carousel) (4h)

---

## 3. AIInsightsPanel

### Purpose
Provide data-driven analytics, recommendations, and predictions using statistical models (NO LLM required) to help players optimize strategies across all domains.

### Core Features

#### Crime Insights
- **Pricing Optimization**: "Cannabis prices in TX are 40% above national average - arbitrage opportunity"
- **Risk Analysis**: "Your route (NY → CA) has 35% seizure risk - consider alternative (NY → CO → CA)"
- **Production Efficiency**: "Upgrade equipment to Tier 3 for 25% yield increase (ROI: 6 months)"
- **Territory Recommendations**: "District 12 has high foot traffic + low gang presence - ideal expansion target"

#### Politics Insights
- **Polling Predictions**: "Based on trends, you're projected to win 54-46% (95% confidence)"
- **Campaign Spending**: "Reallocate 20% from TV ads to ground game for optimal vote share in swing districts"
- **Voter Targeting**: "Focus outreach on independents aged 35-50 in suburban precincts (highest persuadability)"
- **Bill Passage Probability**: "Bill HB-042 has 65% passage chance - lobby 3 undecided senators to secure majority"
- **Fundraising Forecast**: "At current burn rate, out of cash in 18 days - need $50K by next week"

#### Business Insights
- **Revenue Forecasting**: "Projected monthly revenue: $450K (± $50K, based on 3-month trend)"
- **Tax Optimization**: "Hire 2 more employees to qualify for small business tax credit ($15K savings)"
- **Supply Chain**: "Switching to Supplier B saves 15% on materials with same quality"
- **Expansion Timing**: "Cash flow supports opening 2nd location in 4 months (Monte Carlo simulation)"

#### Employees Insights
- **Skill Gaps**: "Hire chemist with skill 85+ to increase product quality 20%"
- **Turnover Risk**: "3 employees have low satisfaction - raise wages 10% to retain (turnover cost: $30K)"
- **Training ROI**: "Investing $5K in training increases productivity 15% (payback: 8 months)"

#### Cross-Domain Insights
- **Legalization Impact**: "If cannabis legalization passes, your 5 labs convert to legal businesses (+$200K revenue, -$50K heat costs)"
- **Policy Effects**: "Minimum wage increase will raise payroll costs $75K/year across Business + Crime operations"
- **Integration Opportunities**: "Your Crime profits ($500K) could fund political campaign for legalization (expected ROI: 3x if successful)"

### Statistical Models (No LLM)
- **Regression Models**: Revenue forecasting, polling predictions, pricing trends
- **Monte Carlo Simulation**: Business expansion timing, legalization impact scenarios
- **Linear Programming**: Campaign budget optimization, supply chain routing
- **Logistic Regression**: Voter persuasion probability, bill passage likelihood
- **Time Series**: Cash flow forecasting, market demand cycles
- **Clustering**: Voter segmentation, district targeting

### API Surface
- `GET /api/engagement/insights/:domain` - Domain-specific insights (crime, politics, business, employees)
- `GET /api/engagement/insights/cross-domain` - Integration opportunities across domains
- `GET /api/engagement/insights/predictions/:type` - Predictions (polling, revenue, passage probability)
- `POST /api/engagement/insights/scenario` - Run scenario analysis (e.g., "what if legalization passes?")

### Implementation Estimate
**Time:** 16-20 hours
- Statistical models implementation (regression, Monte Carlo, clustering) (8h)
- Insight generation algorithms by domain (6h)
- API endpoints (2h)
- UI components (insight cards, charts, scenario simulator) (4h)

---

## 4. InteractiveTutorial

### Purpose
Onboard new players with guided tutorials and provide contextual help throughout gameplay to reduce learning curve and increase retention.

### Core Features

#### Tutorial Flows
- **Getting Started** (5-7 minutes):
  - Create account → Choose starting state → Receive $50K starting capital
  - Tour UI (dashboard, navigation, activity feed)
  - Complete first action in each domain (manufacture batch, make donation, hire employee)

- **Crime Tutorial**:
  - Build first lab → Hire chemist → Produce batch → List on marketplace → Complete sale

- **Politics Tutorial**:
  - Announce candidacy (State House race) → Set campaign strategy → Make first donation → Vote on sample bill

- **Business Tutorial**:
  - Create business → Hire employees → Generate revenue → File tax return

- **Cross-Domain Tutorial**:
  - Lobby for legalization bill → Bill passes → Crime operation converts to Business → See tax revenue flow

#### Contextual Help
- **Tooltips**: Hover over any UI element for explanation
- **Help Buttons**: "?" icons next to complex features (e.g., campaign budget allocation)
- **Video Walkthroughs**: 2-3 minute videos for major features
- **Sample Scenarios**: Pre-built scenarios players can run (e.g., "Simulate an election")

#### Starter Quests
- **First Steps** (rewards: $10K bonus, 1000 XP):
  - Complete tutorial
  - Reach level 5
  - Unlock first achievement
  - Make first friend (social connection)

- **Domain Mastery** (rewards: Unlock advanced features):
  - Crime: Control first territory
  - Politics: Win first election
  - Business: Reach $100K revenue
  - Employees: Hire 10 employees

### API Surface
- `GET /api/engagement/tutorial/progress` - Player tutorial completion status
- `POST /api/engagement/tutorial/:step/complete` - Mark tutorial step complete
- `GET /api/engagement/tutorial/help/:topic` - Fetch contextual help content
- `POST /api/engagement/tutorial/quest/:id/claim` - Claim quest reward

### Implementation Estimate
**Time:** 10-14 hours
- Tutorial flow scripting (4h)
- Contextual help content creation (3h)
- Quest system (2h)
- API endpoints (1h)
- UI components (tutorial modals, help tooltips, quest tracker) (4h)

---

## 5. DesignSystem (HeroUI Theme)

### Purpose
Establish consistent visual design, motion, and sound across all domains with a comprehensive HeroUI-based design system.

### Core Features

#### Color System
- **Primary Palette**:
  - `brandPrimary`: Blue-600 (#2563EB) - Politics, civic engagement
  - `brandSecondary`: Emerald-600 (#059669) - Business, growth
  - `brandAccent`: Purple-600 (#9333EA) - Premium features, achievements

- **Domain Colors**:
  - `crimsonRed`: Red-700 (#B91C1C) - Crime domain
  - `royalBlue`: Blue-600 (#2563EB) - Politics domain
  - `forestGreen`: Emerald-600 (#059669) - Business domain
  - `goldenYellow`: Amber-500 (#F59E0B) - Employees domain

- **Semantic Colors**:
  - `success`: Green-600 (#16A34A) - Positive actions, wins
  - `warning`: Amber-500 (#F59E0B) - Alerts, caution
  - `danger`: Red-600 (#DC2626) - Errors, losses
  - `info`: Blue-500 (#3B82F6) - Information, tooltips

#### Typography
- **Headings**: Inter (Google Font), weights 600-800
- **Body**: Inter, weight 400-500
- **Monospace**: JetBrains Mono (for code, data tables)
- **Scale**: 
  - h1: 2.5rem (40px)
  - h2: 2rem (32px)
  - h3: 1.5rem (24px)
  - body: 1rem (16px)
  - small: 0.875rem (14px)

#### Component Variants
- **Cards**: Default, Elevated (shadow), Bordered, Interactive (hover effects)
- **Buttons**: Primary, Secondary, Outline, Ghost, Danger
- **Badges**: Default, Success, Warning, Danger, Info, Pill, Dot
- **Tables**: Default, Striped, Hoverable, Compact, Bordered
- **Modals**: Small (400px), Medium (600px), Large (800px), Full-Screen

#### Motion Presets (Framer Motion)
- **Page Transitions**: Fade + slide (300ms, easeOut)
- **Card Entrance**: Fade + scale (200ms, easeOut)
- **Modal**: Backdrop fade (200ms) + modal scale (250ms, spring)
- **List Items**: Stagger children (50ms delay, 200ms each)
- **Success Animations**: Confetti burst (election wins), checkmark scale
- **Number Animations**: Count-up effect (vote totals, revenue)

#### Sound Effects Library
- **Actions** (volume: 0.3-0.4):
  - `click.mp3`: Button clicks
  - `success.mp3`: Achievement unlocks, quest completions
  - `error.mp3`: Invalid actions, errors
  - `notification.mp3`: Alerts, new messages

- **Domain-Specific** (volume: 0.4-0.5):
  - `vote-cast.mp3`: Voting on bills
  - `donation.mp3`: Campaign donations
  - `cash-register.mp3`: Business sales
  - `level-up.mp3`: Player levels up

- **Ambient** (volume: 0.2, optional):
  - `city-ambience.mp3`: Background city sounds (toggleable)

#### Icon Set
- **Primary**: Lucide Icons (consistent, open-source)
- **Custom**: Domain-specific icons (drug flask, ballot box, briefcase, hardhat)

#### Illustration Style
- **Approach**: Minimalist line art with domain color accents
- **Use Cases**: Empty states, tutorial screens, achievement badges
- **Tool**: Custom SVG illustrations

### Implementation Estimate
**Time:** 12-16 hours
- HeroUI theme configuration (colors, typography, components) (4h)
- Motion presets (Framer Motion variants) (3h)
- Sound effects integration (licensed free SFX, playback system) (2h)
- Icon library setup (Lucide + custom icons) (2h)
- Illustration creation (5-7 key illustrations) (3h)
- Design system documentation (Storybook or dedicated docs) (2h)

---

## Total Implementation Estimates

| Feature | Core Time | UI Time | Total Time |
|---------|-----------|---------|------------|
| GamificationEngine | 8h | 4h | 12-16h |
| LiveActivityFeed | 10h | 4h | 14-18h |
| AIInsightsPanel | 10h | 6h | 16-20h |
| InteractiveTutorial | 7h | 4h | 10-14h |
| DesignSystem | 11h | 2h | 12-16h |
| **TOTAL** | **46h** | **20h** | **64-84h** |

**Recommended Phasing:**
- **Phase 1 (Foundation)**: DesignSystem + GamificationEngine (24-32h) - Enables consistent UI + core progression
- **Phase 2 (Social Layer)**: LiveActivityFeed + InteractiveTutorial (24-32h) - Adds social features + onboarding
- **Phase 3 (Analytics)**: AIInsightsPanel (16-20h) - Advanced data-driven insights

---

## Integration with Domains

### Crime Integration
- **Achievements**: "First Lab", "Kingpin", "Drug Lord"
- **Activity Feed**: Territory claims, successful deliveries, turf wars
- **Insights**: Pricing arbitrage, risk analysis, production optimization
- **Tutorial**: Build lab → Produce → Sell workflow

### Politics Integration
- **Achievements**: "Elected Official", "Legislator", "Landslide Victory"
- **Activity Feed**: Election wins, bill passage, fundraising milestones
- **Insights**: Polling predictions, campaign optimization, bill passage probability
- **Tutorial**: Campaign creation → Strategy → Vote workflow

### Business Integration
- **Achievements**: "Entrepreneur", "Mogul", "Empire Builder"
- **Activity Feed**: Revenue milestones, expansions, employee hiring
- **Insights**: Revenue forecasting, tax optimization, expansion timing
- **Tutorial**: Create business → Hire → Generate revenue workflow

### Employees Integration
- **Achievements**: "Hiring Manager", "Labor Leader", "CEO"
- **Activity Feed**: Major hires, union organizing, training completions
- **Insights**: Skill gaps, turnover risk, training ROI
- **Tutorial**: Hire employee → Manage payroll workflow

---

## Success Metrics

**Engagement Metrics:**
- **Achievement Unlock Rate**: 60%+ of players unlock 5+ achievements in first week
- **Leaderboard Interaction**: 40%+ of players check leaderboards weekly
- **Feed Engagement**: 30%+ of players react to activities daily
- **Tutorial Completion**: 80%+ of new players complete getting started tutorial
- **Retention**: 70%+ of players who complete tutorial return within 7 days

**Technical Metrics:**
- **XP Grant Latency**: < 100ms from domain event to XP awarded
- **Feed Load Time**: < 500ms to load 50 feed items
- **Insight Generation**: < 2s to generate domain insights
- **Tutorial Step Transition**: < 200ms between steps

---

**Status:** PLANNED - Ready for phased implementation  
**Next Steps:** Prioritize Phase 1 (DesignSystem + GamificationEngine) for P0-Alpha  
**Dependencies:** All features depend on DesignSystem; other features independent  
**Created:** 2025-11-27
