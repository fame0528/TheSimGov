# 🎯 Important Decisions

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**ECHO Version:** v1.0.0

---

## 📋 Decision Log

### Decision Format

Each decision is documented with:
- **Decision ID:** Unique identifier
- **Date:** When decision was made
- **Context:** Why this decision was needed
- **Options Considered:** Alternatives evaluated
- **Decision:** What was chosen
- **Rationale:** Why this option was selected
- **Consequences:** Known trade-offs and implications
- **Status:** Active / Superseded / Deprecated

---

## 🏗️ Architecture Decisions

### [DEC-001] Next.js 15 with App Router

**Date:** 2025-11-13  
**Context:** Need to choose frontend framework for MMO game  

**Options Considered:**
1. Next.js 15 (App Router)
2. Next.js 14 (Pages Router)
3. React + Express
4. Remix

**Decision:** Next.js 15 with App Router

**Rationale:**
- Server Components improve initial page load performance
- File-based routing reduces boilerplate
- Built-in API routes eliminate separate backend
- Excellent TypeScript support
- Vercel deployment optimization
- Future-proof (latest stable version)

**Consequences:**
- ✅ Better performance out-of-the-box
- ✅ Simplified project structure
- ⚠️ Learning curve for App Router (newer paradigm)
- ⚠️ Some third-party libraries may have compatibility issues

**Status:** Active

---

### [DEC-002] Socket.io for Real-time Communication

**Date:** 2025-11-13  
**Context:** Need real-time features for multiplayer economy, chat, elections

**Options Considered:**
1. Socket.io
2. WebSockets (native)
3. Server-Sent Events (SSE)
4. Polling

**Decision:** Socket.io with custom Next.js server

**Rationale:**
- Battle-tested library with excellent reliability
- Automatic reconnection handling
- Room/namespace organization for game systems
- Fallback to polling if WebSocket unavailable
- Easy horizontal scaling with Redis adapter
- Large community and ecosystem

**Consequences:**
- ✅ Robust real-time communication
- ✅ Easy to implement and maintain
- ⚠️ Requires custom server (can't use Vercel serverless only)
- ⚠️ Additional server deployment needed

**Status:** Active

---

### [DEC-003] MongoDB with Mongoose

**Date:** 2025-11-13  
**Context:** Need database for player data, companies, transactions, etc.

**Options Considered:**
1. MongoDB (NoSQL)
2. PostgreSQL (SQL)
3. MySQL (SQL)
4. Supabase (PostgreSQL + BaaS)

**Decision:** MongoDB with Mongoose ODM

**Rationale:**
- Flexible schema for evolving game mechanics
- Excellent read performance (critical for leaderboards, market data)
- Horizontal scaling with sharding
- Rich query capabilities (aggregation pipeline)
- Managed service available (MongoDB Atlas)
- JavaScript/TypeScript integration via Mongoose

**Consequences:**
- ✅ Flexible schema adapts to game evolution
- ✅ Great performance for game data patterns
- ⚠️ Need to design schema carefully (avoid anti-patterns)
- ⚠️ Less strict than relational databases (must validate in code)

**Status:** Active

---

### [DEC-004] Zustand for State Management

**Date:** 2025-11-13  
**Context:** Need global state management for game state, player data

**Options Considered:**
1. Zustand
2. Redux Toolkit
3. Jotai
4. React Context only

**Decision:** Zustand + React Context (for auth/game context)

**Rationale:**
- Lightweight (< 1KB) and simple API
- TypeScript-first design
- No Provider wrapping overhead
- DevTools integration
- Easy to test
- React Context for auth boundaries (separation of concerns)

**Consequences:**
- ✅ Minimal boilerplate
- ✅ Easy to learn and use
- ✅ Great TypeScript support
- ⚠️ Less opinionated than Redux (need team conventions)

**Status:** Active

---

### [DEC-005] NextAuth.js v5 for Authentication

**Date:** 2025-11-13  
**Context:** Need secure authentication system

**Options Considered:**
1. NextAuth.js v5 (Auth.js)
2. Clerk
3. Custom JWT implementation
4. Passport.js

**Decision:** NextAuth.js v5 (Auth.js)

**Rationale:**
- Built for Next.js (seamless integration)
- Supports JWT and database sessions
- Extensible with custom providers
- Security best practices built-in
- Active community and updates
- Free and open-source

**Consequences:**
- ✅ Production-ready security
- ✅ Easy to implement and extend
- ✅ No vendor lock-in
- ⚠️ v5 is still in beta (stable enough for production)

**Status:** Active

---

### [DEC-006] Chakra UI for Component Library

**Date:** 2025-11-13  
**Context:** Need UI component library for consistent design

**Options Considered:**
1. Chakra UI
2. Material-UI (MUI)
3. Ant Design
4. Tailwind CSS + Headless UI

**Decision:** Chakra UI v2

**Rationale:**
- Accessible by default (WCAG 2.1 AA)
- Composable components (flexible)
- Built-in dark mode support
- TypeScript-first
- Good documentation
- Smaller bundle size than MUI

**Consequences:**
- ✅ Accessibility compliance
- ✅ Consistent design system
- ✅ Fast development velocity
- ⚠️ Less customizable than building with Tailwind
- ⚠️ Opinionated design language

**Status:** Active

---

## 🎮 Game Design Decisions

### [DEC-007] First Name + Last Name Structure

**Date:** 2025-11-13  
**Context:** Player identification system for US political simulation

**Options Considered:**
1. First name + last name (separate fields)
2. Single character name field
3. Auto-generated usernames
4. Email-based identification

**Decision:** First name + last name (separate fields, 2-50 characters each)

**Rationale:**
- Clean data structure (first/last name separation)
- Flexible display options ("John Smith", "Smith, John", "J. Smith")
- Better for sorting and searching
- Reflects political nature (formal names for politicians)
- Allows future features (nickname, middle name, suffix)
- More professional than single field
- Realistic for political simulation

**Consequences:**
- ✅ Clean, flexible data structure
- ✅ Professional appearance for political figures
- ✅ Better sorting and display options
- ✅ Extensible (can add middle name, suffix, etc.)
- ✅ Easy to implement formal/informal displays
- ⚠️ Need moderation for inappropriate names
- ⚠️ May have duplicate names (not enforcing uniqueness on full name)

**Status:** Active

---

## 🧪 Testing Decisions

### [DEC-008] Jest + Playwright for Testing

**Date:** 2025-11-13  
**Context:** Need comprehensive testing strategy

**Options Considered:**
1. Jest + Playwright
2. Vitest + Playwright
3. Jest + Cypress

**Decision:** Jest + Playwright

**Rationale:**
- Jest is battle-tested and widely adopted
- Playwright supports multiple browsers (Chrome, Firefox, Safari)
- Excellent TypeScript support in both
- Good Next.js integration
- Strong community and documentation

**Consequences:**
- ✅ Comprehensive testing coverage
- ✅ Cross-browser E2E testing
- ✅ Great developer experience
- ⚠️ Two testing frameworks to maintain

**Status:** Active

---

## 📈 Progression & Economy Decisions (New)

### [DEC-018] Five-Level Company Progression vs. Granular Levels

**Date:** 2025-11-15  
**Context:** Need a clear, comprehensible progression system across all industries with strong gameplay gates.

**Options Considered:**
1. 5 discrete levels (L1–L5)
2. 10+ granular levels
3. Continuous score without levels

**Decision:** 5 discrete levels (L1–L5) across all industries

**Rationale:**
- Clear player understanding and goals (Bronze→Diamond metaphor)
- Strong feature gates unlock at higher levels (politics, M&A, IPO)
- Easier balancing and content planning (70 configs total)
- Works across industries with unique configurations

**Consequences:**
- ✅ Intuitive progression and UI
- ✅ Predictable balancing targets
- ⚠️ Coarser granularity vs. continuous scale (mitigated via XP within levels)

**Status:** Active

---

### [DEC-019] XP-Based Progression vs. Time-Based

**Date:** 2025-11-15  
**Context:** Determine how companies advance levels.

**Options Considered:**
1. XP via contracts/revenue milestones
2. Real-time waiting (idle timers)
3. Manual purchase only (cash gates)

**Decision:** XP-based progression with requirement validation (cash, employees, revenue)

**Rationale:**
- Rewards skillful play and execution
- Avoids idle-timer frustration
- Keeps cash meaningful but not the sole driver

**Consequences:**
- ✅ Engaging gameplay loop (do work → gain XP → unlock)
- ✅ Supports multiple playstyles (contracts, revenue growth)
- ⚠️ Requires XP balance tuning across industries

**Status:** Active

---

### [DEC-020] Industry-Specific Level Configurations vs. Universal Template

**Date:** 2025-11-15  
**Context:** Whether to use the same progression per industry or tailor by industry.

**Options Considered:**
1. Universal config (same for all)
2. Industry-specific with shared primitives

**Decision:** Industry-specific configs with shared typed interfaces

**Rationale:**
- Realism: Different capital intensity (Energy vs Media)
- Replayability: Each industry feels distinct
- Maintainability: Shared interfaces keep code sane

**Consequences:**
- ✅ Richer world and strategy
- ⚠️ More content to manage (mitigated via codegen/templates)

**Status:** Active

---

### [DEC-021] Level 1 Accessibility Targets

**Date:** 2025-11-15  
**Context:** Ensure on-ramp is achievable for most players.

**Decision:** Multiple industries with <$10k L1 costs (e.g., Media, Retail) and loan availability for higher-cost starts.

**Rationale:**
- Low barrier to entry maintains fun
- Banking system covers capital-intensive starts

**Consequences:**
- ✅ Broad accessibility
- ⚠️ Must avoid trivializing early choices

**Status:** Active

---

### [DEC-022] Employee Salary Tiers Tied to Company Level

**Date:** 2025-11-15  
**Context:** Prevent L5 companies from paying L1 wages; drive realism.

**Decision:** Salary bands per level (L1: $30k–$50k → L5: $500k–$5M for top execs)

**Rationale:**
- Realistic scaling of operating costs
- Encourages financial management depth

**Consequences:**
- ✅ Prevents exploits
- ⚠️ Needs good cost models per industry

**Status:** Active

---

### [DEC-023] Contract Scaling and Visibility by Level

**Date:** 2025-11-15  
**Context:** Ensure contracts match company capability.

**Decision:** Contract tiers (Local→Global) filtered by company level; XP rewards scale with value.

**Rationale:**
- Prevents L1 overwhelm and L5 boredom
- Natural growth through markets

**Consequences:**
- ✅ Smoother difficulty curve
- ⚠️ Requires tier generation logic

**Status:** Active

---

### [DEC-024] Politics Integration via Level Gates

**Date:** 2025-11-15  
**Context:** Control access to influence systems.

**Decision:** Unlock donations at L3, lobbying at L4, run for office at L5.

**Rationale:**
- Mirrors real-world power accumulation
- Reward for business growth

**Consequences:**
- ✅ Strong long-term goals
- ⚠️ Balancing political ROI

**Status:** Active

---

### [DEC-025] Dual Banking System: NPC + Player-Owned

**Date:** 2025-11-15  
**Context:** Provide capital markets and player agency.

**Decision:** Implement NPC banks (5 types) and player-owned banks (Level 3+ Banking).

**Rationale:**
- Realistic economy; loans essential for growth
- Player control over capital allocation and pricing

**Consequences:**
- ✅ Deep competition and strategy
- ⚠️ Risk of predatory lending (managed via credit and default systems)

**Status:** Active

---

### [DEC-026] FICO-Style Credit Scoring (300–850)

**Date:** 2025-11-15  
**Context:** Standardize creditworthiness across systems.

**Decision:** Weighted factors: Payment History (35%), DTI (30%), Utilization (15%), Age (10%), Inquiries (10%); default penalties stack.

**Rationale:**
- Familiar, realistic model
- Easy to explain to players

**Consequences:**
- ✅ Transparent borrowing mechanics
- ⚠️ Requires careful tuning to avoid dead-ends

**Status:** Active

---

### [DEC-016] Next.js 16 Route Params: Promise-Based `context.params`

**Date:** 2025-11-13  
**Context:** Next.js 16 validator types require `context.params` to be a Promise in App Router route handlers.

**Options Considered:**
1. Keep legacy `{ params: { id: string } }` signature (pre-15 style)
2. Adopt Next 16 signature `{ params: Promise<{ id: string }> }` and `await context.params`
3. Wrap with a local helper to normalize both shapes

**Decision:** Adopt Next 16 Promise-based params signature across all route handlers.

**Rationale:**
- Matches Next 16 validator typings to maintain strict TS compliance
- Removes repeated type casting/workarounds in handlers
- Consistent convention prevents future regressions during upgrades

**Consequences:**
- ✅ TypeScript strict mode passes without signature mismatches
- ✅ Consistent pattern: `const { id } = await context.params;`
- ⚠️ Requires updating all dynamic route handlers touching `params`

**Status:** Active

---

### [DEC-017] React Import Hygiene: No Default `React` Import

**Date:** 2025-11-13  
**Context:** With the automatic JSX runtime, default `import React from 'react'` is unnecessary and often unused, triggering strict unused import errors.

**Options Considered:**
1. Keep default imports in all components
2. Remove default import; use named/type-only imports as needed
3. ESLint rule override to allow unused default React import

**Decision:** Remove default `React` import; use named imports (`useState`, `useMemo`, etc.) and type-only (`type FC`, `type ReactNode`) when required.

**Rationale:**
- Eliminates unused import errors under strict settings
- Aligns with modern React (automatic runtime)
- Clearer dependency intent (only import what’s used)

**Consequences:**
- ✅ Cleaner components and pages (no unused defaults)
- ✅ Reduced lint/type noise
- ⚠️ Ensure type-only imports are used for `FC`, `ReactNode` when needed

**Status:** Active

---
## 🚀 Deployment Decisions

### [DEC-009] Vercel for Next.js, Separate for Socket.io

**Date:** 2025-11-13  
**Context:** Deployment strategy for Next.js + Socket.io

**Options Considered:**
1. Vercel (Next.js) + Railway (Socket.io)
2. Single VPS (DigitalOcean, Linode)
3. AWS (EC2, ECS)
4. Heroku

**Decision:** Vercel for Next.js, Railway/Render for Socket.io server

**Rationale:**
- Vercel optimized for Next.js (automatic optimizations)
- Separate Socket.io server allows independent scaling
- Railway/Render simple deployment for custom Node.js server
- Cost-effective for initial launch
- Easy to migrate if needed

**Consequences:**
- ✅ Optimized Next.js performance
- ✅ Flexible scaling
- ⚠️ Two deployment pipelines to manage
- ⚠️ Cross-origin configuration needed

**Status:** Active

---

## 📚 Documentation Decisions

### [DEC-010] ECHO v1.0.0 Development System

**Date:** 2025-11-13  
**Context:** Need development workflow and quality standards

**Decision:** Implement ECHO v1.0.0 AAA-Quality Development System

**Rationale:**
- Bulletproof auto-audit tracking
- AAA code quality standards
- Complete file reading law prevents errors
- Session recovery capability
- Proven system for complex projects
- Continuous improvement through lessons learned

**Consequences:**
- ✅ Consistent high-quality code
- ✅ Automated tracking (zero manual overhead)
- ✅ Excellent project visibility
- ⚠️ Requires strict adherence to workflow
- ⚠️ Initial learning curve for new contributors

**Status:** Active

---

### [DEC-011] US-Based Political Structure (Multi-Level Government)

**Date:** 2025-11-13  
**Context:** Government structure for political simulation game

**Options Considered:**
1. US-based system (local, state, federal)
2. Generic three-tier system (Mayor → Governor → President)
3. International multi-country system
4. Single-tier government only

**Decision:** US-based political structure with local, state, and federal levels

**Rationale:**
- Reflects real US government structure
- Three distinct levels provide progression path
- Local governments vary by state (realistic)
- State selection creates geographic identity
- Federal level provides ultimate goal
- Educational value (civics)
- Familiar to US players

**Consequences:**
- ✅ Realistic and immersive political simulation
- ✅ Clear progression: Local → State → Federal
- ✅ Geographic diversity (50 states, each unique)
- ✅ Multiple office types at each level
- ⚠️ Complex to implement (many office types)
- ⚠️ Need accurate state/local data
- ⚠️ May be US-centric (international appeal)

**Government Levels:**
- **Local**: Mayor, City Council, County Supervisor
- **State**: Assembly, Senate, Governor (50 states)
- **Federal**: US House, US Senate, President

**Status:** Active

---

### [DEC-012] State Selection During Registration

**Date:** 2025-11-13  
**Context:** Player geographic placement in US political simulation

**Options Considered:**
1. State selection during registration
2. Random state assignment
3. Allow state migration
4. No geographic boundaries

**Decision:** State selection during registration (permanent)

**Rationale:**
- Players choose their political "home"
- Creates state-based communities
- Enables local government mechanics
- Realistic (can't easily change state residency)
- State-specific policies affect players differently
- Competition between states

**Consequences:**
- ✅ Player agency in geographic placement
- ✅ State identity and community
- ✅ Local government participation
- ✅ State-level economic differences
- ⚠️ Unbalanced state populations
- ⚠️ Players may want to change states (future feature)

**Local Government Assignment:**
- Based on state selection
- County assigned (largest county by default)
- City assigned (state capital by default)
- Can move within state (future feature)

**Status:** Active

---

### [DEC-013] Player Archetype System

**Date:** 2025-11-13  
**Context:** Need personality/playstyle framework to influence events and reputation

**Options Considered:**
1. Three archetypes (Innovator, Ruthless Tycoon, Ethical Builder)
2. Five archetypes (add Politician, Mogul)
3. Skill-based system (no personality)
4. No archetype system (pure sandbox)

**Decision:** Three archetypes with event and reputation influence

**Rationale:**
- **Innovator**: Appeals to players who value R&D, efficiency, new products
- **Ruthless Tycoon**: Appeals to aggressive, competitive players (hostile takeovers)
- **Ethical Builder**: Appeals to players who value sustainability, employee welfare
- Three options provide clear differentiation without overwhelming
- Archetypes influence random events (different outcomes based on type)
- Reputation system ties to archetype consistency
- Replayability through different archetype experiences
- Guides tutorial and early events (personalized onboarding)

**Consequences:**
- ✅ Clear player identity and roleplaying framework
- ✅ Events feel personalized to playstyle
- ✅ Reputation mechanics more meaningful
- ✅ High replayability (3 distinct experiences)
- ⚠️ Need balanced event design for all archetypes
- ⚠️ Risk of players feeling locked into choices
- ⚠️ Additional complexity in event system

**Implementation:**
- Selected during registration (after state selection)
- Affects:
  - Random event probabilities and outcomes
  - Reputation impact multipliers
  - Available options in choice-based events
  - NPC reactions and opportunities
  - Tutorial guidance and early contracts
- Can be shifted over time through actions (not locked permanently)

**Status:** Active

---

### [DEC-014] NPC Employee System with Stats

**Date:** 2025-11-13  
**Context:** Need workforce management mechanics for company operations

**Options Considered:**
1. NPC employees with stats (skill, loyalty, salary, morale)
2. Abstract "workforce" number (no individual NPCs)
3. Player-to-player employment (real users)
4. No employee system (solo operations)

**Decision:** NPC employees with individual stats and management

**Rationale:**
- Adds strategic depth to company management
- Skill levels affect productivity (better employees = better output)
- Loyalty affects retention (prevents poaching, reduces turnover)
- Morale triggers events (strikes, resignations)
- Salary decisions create trade-offs (quality vs. cost)
- HR department becomes meaningful (training, promotions)
- Events can target employees (strikes, poaching, performance)
- Realistic business simulation (workforce is key asset)

**Consequences:**
- ✅ Strategic hiring decisions (skill vs. cost)
- ✅ HR management depth (training, morale, retention)
- ✅ Event variety (strikes, resignations, promotions)
- ✅ Realistic business operations
- ⚠️ Additional database complexity (employee collection)
- ⚠️ Balance needed (too complex = tedious micromanagement)
- ⚠️ UI/UX challenge (managing many employees)

**Employee Stats:**
- **Skill** (1-10): Affects productivity and output quality
- **Loyalty** (1-10): Affects retention, poaching resistance
- **Salary**: Market-based, skill-dependent (monthly cost)
- **Morale**: Influenced by pay, company performance, events

**HR Actions:**
- Hire (skill vs. cost trade-off)
- Fire (morale impact, severance costs)
- Train (improve skills, increase productivity)
- Promote (boost morale, increase salary)

**Status:** Active

---

### [DEC-015] Event-Driven Narrative System

**Date:** 2025-11-13  
**Context:** Need drama, unpredictability, and storytelling in simulation

**Options Considered:**
1. Event system with choices and consequences
2. Pure sandbox (no scripted events)
3. Linear story progression
4. Minimal random events only

**Decision:** Comprehensive event system with four categories and player choices

**Rationale:**
- **Business events** add operational drama (strikes, crashes, disruptions)
- **Political events** create election excitement and policy impacts
- **Global events** introduce macro-level challenges (pandemics, wars)
- **Personal events** provide archetype-specific opportunities
- Player choices create branching outcomes (not just random)
- Consequences affect reputation and future event probabilities
- Adds unpredictability to prevent optimal strategy dominance
- Creates memorable moments and stories
- Tutorial events guide early gameplay

**Consequences:**
- ✅ Dynamic, unpredictable gameplay
- ✅ Player agency through choices
- ✅ Memorable moments and emergent stories
- ✅ Archetype differentiation through events
- ⚠️ Complex event design and balancing
- ⚠️ Risk of event fatigue (too many interruptions)
- ⚠️ Database complexity (event state tracking)

**Event Categories:**
1. **Business**: Strikes, disruptions, crashes, competitor actions
2. **Political**: Elections, scandals, policy shifts, investigations
3. **Global**: Pandemics, wars, disasters, tech breakthroughs
4. **Personal**: Archetype-specific opportunities and crises

**Event Flow:**
- Trigger (time/condition) → Notification → Choices (2-4 options)
- Player decision → Immediate impact + long-term effects
- Reputation change → Future event probabilities adjusted

**Status:** Active

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-15*
