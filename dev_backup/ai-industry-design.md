# 🤖 Technology/AI Industry — 5-Level Progression (v2)

**Created:** 2025-11-13  
**Updated:** 2025-11-15 (v2: 5-level AI progression)  
**Industry Type:** Technology/AI  
**Complexity:** 5 (Highest)  
**Priority:** HIGH

---

## 🎯 Overview

The Technology/AI industry is the most complex and realistic simulation of AI company operations. Players experience the full lifecycle of AI development: from hiring ML engineers to training massive language models, managing GPU costs, publishing research, and competing in a dynamic AI market.

**Core Philosophy:** As real-world as possible - mirrors actual AI startup challenges (compute costs, talent wars, research vs product tension, regulatory uncertainty).

---

## 🧭 Level Structure Overview

AI splits into a 5-level journey with escalating capital, talent, compute, and influence needs. All costs can be financed via the Banking System.

- L1: Solo AI Consultant — $12k setup; 1–2 people; cloud credits
- L2: AI Startup — $85k setup; 5–15 people; first product; accelerator/seed
- L3: AI Platform Company — $750k setup; 50–200 people; API platform; enterprise
- L4: AI Research Lab — $15M setup; 500–2,000 people; foundation models
- L5: AGI Company — $250M setup; 5,000–50,000 people; supercomputer clusters

Startup loan dependency: L1 can be bootstrapped with a small loan; L2+ typically require significant financing.

## 💰 Level Costs & Scale

| Level | Setup Cost | Team Size | Compute | Revenue Potential |
|------|------------|-----------|---------|-------------------|
| L1 | $12k | 1–2 | Cloud credits | $2k–$8k/mo consulting |
| L2 | $85k | 5–15 | 8–16 GPUs (cloud) | $20k–$150k/mo (first product) |
| L3 | $750k | 50–200 | 64–256 GPUs (mix) | $300k–$3M/mo (API/platform) |
| L4 | $15M | 500–2,000 | 1–5k GPUs | $8M–$80M/mo |
| L5 | $250M | 5k–50k | 10k–100k+ GPUs | $100M–$800M+/mo |

Notes: Costs include facilities, compute, data, licensing, security, and hiring ramps.

---

## 📊 Database Schema Extensions (v2)

### AICompany (extends Company model)

```typescript
interface AICompany extends Company {
  industry: 'Technology';
  
  // Research & Development
  researchFocus?: 'LLM' | 'ComputerVision' | 'ReinforcementLearning' | 'GenerativeAI';
  researchBudget: number;  // Monthly R&D spend
  researchPoints: number;  // Accumulated research progress
  publications: number;    // Academic papers published
  citations: number;       // Total citations (reputation metric)
  
  // Model Portfolio
  models: AIModel[];       // Trained models
  
  // Infrastructure
  computeType: 'OnPremise' | 'Cloud' | 'Hybrid';
  gpuCount: number;        // Owned GPUs (if on-premise)
  gpuUtilization: number;  // % utilization (efficiency metric)
  cloudCredits: number;    // Remaining cloud budget
  storageCapacity: number; // TB of data storage
  dataCenters?: ObjectId[]; // Link to DataCenter entities (L3+)
  computeClusters?: ObjectId[]; // Link to ComputeCluster entities (L3+)
  
  // Product Metrics
  apiCalls: number;        // Total API requests served
  activeCustomers: number; // Paying customers
  uptime: number;          // Service availability %
  
  // Reputation
  industryRanking: number; // Position on AI leaderboard (1-100)
  acquisitionOffers: number; // Number of pending acquisition offers
}
```

### AIModel

```typescript
interface AIModel {
  _id: ObjectId;
  company: ObjectId;       // Reference to Company
  
  // Model Specs
  name: string;            // "GPT-Politics-7B"
  architecture: 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN';
  size: 'Small' | 'Medium' | 'Large';  // 7B, 70B, 400B+ params
  parameters: number;      // Exact param count (e.g., 7000000000)
  
  // Training
  status: 'Training' | 'Completed' | 'Failed' | 'Deployed';
  trainingProgress: number; // 0-100%
  trainingStarted: Date;
  trainingCompleted?: Date;
  trainingCost: number;    // Total compute cost spent
  dataset: string;         // Dataset used (e.g., "Common Crawl")
  datasetSize: number;     // GB of training data
  
  // Performance
  benchmarkScores: {
    accuracy?: number;     // For classification tasks
    perplexity?: number;   // For LLMs
    bleu?: number;         // For translation
    f1?: number;           // For general tasks
  };
  
  // Deployment
  deployed: boolean;
  apiEndpoint?: string;    // If deployed as API
  pricing?: number;        // $ per 1M tokens
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### AIEmployee (extends Employee model)

```typescript
interface AIEmployee extends Employee {
  // AI-specific roles
  role: 'MLEngineer' | 'ResearchScientist' | 'DataEngineer' | 'MLOps' | 'ProductManager';
  
  // Specialized skills (1-10 scale)
  researchAbility: number;   // Affects research speed and paper quality
  codingSkill: number;       // Affects implementation speed
  domainExpertise: string;   // 'NLP', 'Vision', 'RL', 'Generative'
  
  // Academic credentials
  hasPhD: boolean;
  publications: number;      // Personal publication count
  hIndex: number;           // Research impact metric
  
  // Compensation
  baseSalary: number;       // $80k-$500k range
  stockOptions: number;     // Equity % (retention tool)
  computeBudget: number;    // Personal GPU allocation
  
  // Attraction/Retention
  satisfactionScore: number; // 1-10 (affects retention)
  poachAttempts: number;    // How many competitors tried to hire
}
```

### AIResearchProject

```typescript
interface AIResearchProject {
  _id: ObjectId;
  company: ObjectId;
  
  // Project Details
  name: string;              // "Efficient Attention Mechanisms"
  type: 'LLM' | 'ComputerVision' | 'ReinforcementLearning' | 'GenerativeAI';
  description: string;
  
  // Progress
  status: 'Planning' | 'InProgress' | 'Completed' | 'Published';
  progress: number;          // 0-100%
  startDate: Date;
  completionDate?: Date;
  
  // Resources
  budgetAllocated: number;
  budgetSpent: number;
  assignedResearchers: ObjectId[]; // AIEmployee references
  computeHoursUsed: number;
  
  // Outcomes
  breakthroughAchieved: boolean;
  performanceGain: number;   // % improvement over baseline
  publicationVenue?: string; // 'NeurIPS', 'ICML', 'ICLR', etc.
  citationCount: number;
  
  // Impact
  reputationGain: number;
  talentAttractionBonus: number; // Makes recruiting easier
  
  createdAt: Date;
  updatedAt: Date;
}
```

### AIInfrastructure (deprecated by `ComputeCluster` + `DataCenter`)

```typescript
interface AIInfrastructure {
  _id: ObjectId;
  company: ObjectId;
  
  // GPU Resources
  gpus: {
    type: 'A100' | 'H100' | 'V100' | 'RTX4090';
    count: number;
    costPerHour: number;
    utilizationRate: number; // 0-100%
  }[];
  
  // Cloud Resources (if using cloud)
  cloudProvider?: 'AWS' | 'GCP' | 'Azure' | 'Lambda';
  monthlyCloudSpend: number;
  cloudCreditsRemaining: number;
  
  // Storage
  storageType: 'SSD' | 'HDD' | 'S3' | 'GCS';
  storageCapacityTB: number;
  storageUsedTB: number;
  storageCostPerTB: number;
  
  // Networking
  bandwidthGbps: number;
  monthlyBandwidthCost: number;
  
  // Monitoring
  uptimePercentage: number;
  incidentCount: number;
  lastMaintenanceDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎮 Gameplay Mechanics (Level-Gated)

### 1. Company Founding (L1)

**Initial State (after paying $12k setup):**
- Cash: ~$0 to -$2k (likely needs a small loan)
- Employees: 0 (must hire first ML engineer)
- Models: 0 (no models trained yet)
- Research Points: 0
- GPU Access: Cloud trial credits (limited)

**First Decisions:**
1. **Secure Funding:**
   - Take out $20k loan (5% interest)
   - Seek angel investor (dilution but cash)
   - Enter AI startup accelerator (mentorship + $50k)

2. **Choose Research Focus:**
   - LLM (most expensive, highest potential)
   - Computer Vision (medium cost, proven market)
   - Reinforcement Learning (research-heavy, long-term)
   - Generative AI (trending, competitive)

3. **Hire First Team:**
   - 1 Senior ML Engineer ($150k/year) or
   - 2 Junior ML Engineers ($80k each) or
   - 1 Research Scientist ($200k, slower but better quality)

### 2. Model Development Flow (All Levels; scale increases with level)

**Step 1: Data Acquisition**
- **Options:**
  - Open datasets (free, lower quality): Common Crawl, ImageNet
  - Licensed datasets ($5k-$50k): Domain-specific, higher quality
  - Custom datasets ($20k+): Proprietary, competitive advantage
  - Scraped data (cheap, legal risk): Web scraping, copyright issues

**Step 2: Architecture Selection**
- **Transformer (LLM):** Best for text, requires most compute
- **CNN:** Image tasks, proven architectures (ResNet, EfficientNet)
- **Diffusion:** Generative images, trending but expensive
- **RNN/LSTM:** Sequential data, older but efficient
- **Custom:** Research project, high risk/reward

**Step 3: Training Configuration**
- **Model Size:**
  - Small (7B params): $1k-$5k, fast, good for demos
  - Medium (70B params): $20k-$50k, production-ready
  - Large (400B+ params): $100k+, state-of-the-art
  
- **Compute Allocation:**
  - Number of GPUs: 4-256+
  - Training duration: 1 week - 3 months
  - Estimated cost: Auto-calculated based on GPU hours

**Step 4: Training Execution**
- **Real-time Progress:**
  - Training loss curve (decreasing = good)
  - GPU utilization (aim for 90%+)
  - Estimated time remaining
  - Cost burned so far
  
- **Random Events:**
  - GPU failure (restart from checkpoint)
  - Better hyperparameters discovered (speed boost)
  - Gradient explosion (training failed, retry needed)
  - Data quality issues (performance degraded)

**Step 5: Evaluation**
- **Benchmark Testing:**
  - Run against standard datasets
  - Compare to competitors (leaderboard)
  - Quality metrics (accuracy, perplexity, etc.)
  
- **Decisions:**
  - Good enough? → Deploy to production
  - Not good enough? → More training or restart
  - Breakthrough? → Publish research paper

**Step 6: Deployment**
- **Deployment Options:**
  - API service ($X per 1M tokens)
  - On-device (mobile apps, edge devices)
  - Enterprise license (flat fee)
  - Open-source (free, reputation gain)
  
- **Optimization:**
  - Quantization (reduce size, faster inference)
  - Distillation (smaller model, same performance)
  - Pruning (remove unnecessary weights)

### 3. Research System (L3+ emphasis)

**Publishing Papers:**
- **Process:**
  1. Complete research project (3-6 months)
  2. Write paper (1 month, requires Research Scientist)
  3. Submit to conference (NeurIPS, ICML, CVPR)
  4. Peer review (2-3 months wait)
  5. Acceptance or rejection
  
- **Benefits of Publication:**
  - +50 reputation per paper
  - +100 reputation if top-tier venue (NeurIPS)
  - Attract better talent (PhD researchers)
  - Citations increase over time (passive reputation)
  - Potential acquisition interest

**Research Projects:**
- **Types:**
  - Algorithmic improvements (faster training)
  - Novel architectures (better performance)
  - Efficiency gains (lower costs)
  - New applications (market expansion)
  
- **Success Factors:**
  - Researcher skill (higher = faster progress)
  - Budget allocated (more = faster)
  - Luck/randomness (breakthrough chance)
  - Collaboration with other companies

### 4. Talent Management (talent scale/gate by level)

**Hiring Process:**
1. **Post Job Opening:**
   - Role: ML Engineer, Research Scientist, etc.
   - Salary range: $80k-$500k
   - Stock options: 0.1%-2%
   - Compute budget: $500-$5,000/month
   
2. **Candidate Pool:**
   - Junior (skill 4-6): Abundant, cheap, need training
   - Mid-level (skill 6-8): Competitive, proven experience
   - Senior (skill 8-9): Rare, expensive, high impact
   - PhD (skill 9-10): Very rare, research-focused, prestigious
   
3. **Interview & Offer:**
   - Competing offers from other AI companies
   - Must outbid or offer better perks
   - Reputation affects acceptance rate

**Retention:**
- **Satisfaction Factors:**
  - Salary competitiveness (market rate?)
  - Research freedom (publish papers?)
  - Compute access (enough GPUs?)
  - Impact (interesting projects?)
  - Company trajectory (growing or declining?)
  
- **Poaching:**
  - Competitors offer higher salaries
  - Player can counter-offer
  - Top talent always at risk
  - Losing key researcher delays projects

**Performance:**
- **Productivity Metrics:**
  - Models shipped per quarter
  - Papers published per year
  - Bugs fixed / features added
  - Mentor junior employees
  
- **Promotions:**
  - Junior → Mid → Senior → Principal → Director
  - Salary increases with level
  - More autonomy and impact

### 5. Infrastructure Management (Compute & Real Estate)

**On-Premise vs Cloud Decision:**

**On-Premise:**
- **Pros:**
  - Full control over hardware
  - No per-hour charges (fixed cost)
  - Data security (no external access)
  
- **Cons:**
  - High upfront cost ($50k-$500k for GPU cluster)
  - Maintenance burden (hire MLOps engineer)
  - Underutilization risk (GPUs idle = wasted money)
  - Obsolescence (H100 replaced by H200 next year)

**Cloud (AWS/GCP/Azure):**
- **Pros:**
  - No upfront cost (pay-as-you-go)
  - Infinite scalability
  - Latest hardware available
  - No maintenance
  
- **Cons:**
  - Expensive at scale ($2-$5/hour per GPU)
  - Data transfer costs
  - Vendor lock-in
  - Potential outages (cloud provider issues)

**Hybrid:**
- Best of both worlds
- On-premise for base load, cloud for bursts
- Complex to manage but optimal cost

**Resource Monitoring:**
- **GPU Utilization Dashboard:**
  - Real-time usage per GPU
  - Training jobs queue
  - Cost per hour tracking
  - Efficiency metrics ($/model trained)
  
- **Optimization Opportunities:**
  - Idle GPUs → Rent to other players (marketplace)
  - Inefficient code → Hire MLOps engineer
  - Spot instances → 70% cost savings (but can be interrupted)

### 6. Product & Revenue (Level-Specific Emphasis)

**Revenue Streams:**

1. **API Business (OpenAI model):**
   - Pricing: $X per 1M tokens
   - Customers: Developers, businesses
   - Metrics: API calls/day, revenue/customer, churn rate
   - Costs: Inference compute (must be < revenue)
   
2. **Enterprise Licensing:**
   - Flat fee: $10k-$500k/year
   - Deploy model on customer's infrastructure
   - Support & SLA guarantees
   - Higher margins but slower sales cycle
   
3. **Consulting Services:**
   - Custom model training for clients
   - High revenue per project ($100k+)
   - Diverts talent from core product
   - Good early-stage revenue source
   
4. **Research Grants:**
   - Government funding (NIH, DARPA, NSF)
   - Academic partnerships
   - Lower pressure but restricted use
   
5. **Acquisitions:**
   - Sell company to tech giant
   - Valuation based on models, talent, revenue
   - Exit strategy for successful players

**Customer Acquisition:**
- **Marketing:**
  - Blog posts (free, slow growth)
  - Conference talks (reputation + customers)
  - Open-source demos (viral potential)
  - Paid ads (expensive but targeted)
  
- **Sales:**
  - Inbound leads (from marketing)
  - Outbound (cold emails, LinkedIn)
  - Partnerships (integrate with existing products)
  - Freemium model (free tier → paid upgrades)

**Pricing Strategy:**
- **Too low:** Unsustainable, compute costs > revenue
- **Too high:** No customers, market share to competitors
- **Dynamic:** Adjust based on demand and competition
- **Tiered:** Free/Starter/Pro/Enterprise

### 7. Competition & Market Dynamics

**AI Leaderboard:**
- **Ranked by:**
  - Model performance (benchmark scores)
  - Research impact (papers + citations)
  - Market share (API usage)
  - Revenue (business success)
  - Reputation (industry recognition)
  
- **Top 10 Benefits:**
  - Easier talent recruitment
  - Press coverage (free marketing)
  - Acquisition interest
  - Partnership opportunities

**Competitive Events:**
- **Breakthrough Announcements:**
  - Competitor releases better model
  - Market reacts (customers churn, stock price)
  - Must respond: match or differentiate
  
- **Talent Wars:**
  - Competitor poaches your researcher
  - Offer counter (expensive) or let go (project delayed)
  - Raid competitor's talent (reputation risk)
  
- **Price Wars:**
  - Competitor undercuts your API pricing
  - Match (lower margins) or hold (lose customers)
  - Race to the bottom vs differentiation

**Collaboration Opportunities:**
- **Research Partnerships:**
  - Co-author papers (shared credit)
  - Share datasets (mutual benefit)
  - Joint conferences (industry prestige)
  
- **Technical Partnerships:**
  - Model ensembles (combine strengths)
  - Data sharing agreements
  - Cross-licensing IP

### 8. Events & Challenges

**Random Events:**
- **Positive:**
  - Breakthrough: Model exceeds expectations (+10% performance)
  - Viral Demo: Your chatbot goes viral (+1,000 customers)
  - Acquisition Offer: Tech giant offers $5M buyout
  - Star Hire: Top researcher joins your company
  - Research Grant: Government awards $500k funding
  
- **Negative:**
  - Model Failure: Hallucinations cause PR disaster
  - Data Breach: Training data leaked, lawsuits incoming
  - GPU Shortage: Cloud provider out of capacity
  - Talent Exodus: 3 engineers quit to join competitor
  - Regulatory Crackdown: New AI law requires compliance ($50k)

**Scripted Milestones:**
- **First Model Trained:** Achievement unlocked
- **First Paying Customer:** Revenue milestone
- **First Paper Published:** Academic credibility
- **Break Even:** Revenue > costs
- **Unicorn Status:** $1B valuation

### 9. Political Integration

**AI-Specific Policies:**
- **Regulation:**
  - Model safety audits (cost: $10k per model)
  - Bias testing requirements
  - Explainability mandates
  - Export controls (can't sell to foreign players)
  
- **Subsidies:**
  - R&D tax credits (50% of research costs)
  - Government compute grants (free GPU hours)
  - AI research funding (NSF, DARPA)
  
- **Tariffs:**
  - Import taxes on foreign GPUs
  - Data localization laws (must store data domestically)
  
- **Bans:**
  - Facial recognition prohibition
  - Deepfake creation illegal
  - Autonomous weapons ban

**Lobbying Strategy:**
- **Pro-AI Lobby:**
  - Push for R&D tax credits
  - Oppose restrictive regulations
  - Advocate for H1B visa increases (talent pipeline)
  
- **Anti-AI Lobby:**
  - Support safety regulations (helps incumbents, hurts startups)
  - Advocate for export controls (protects domestic advantage)
  - Push for labor protections (slows AI adoption)

---

## 🎯 Implementation Roadmap (Aligned to Phase 1C)

### Phase 1: Core AI Company (40-60h)
- Extend Company model with AI-specific fields
- Create AIModel schema and CRUD operations
- Basic model training flow (simplified)
- Hire AI-specific employees (ML Engineer, Research Scientist)
- Cloud compute cost tracking

### Phase 2: Research System (30-40h)
- AIResearchProject schema
- Publication flow (submit → review → accept)
- Citation tracking and reputation
- Research buffs (unlock better architectures)

### Phase 3: Infrastructure (30-40h)
- AIInfrastructure schema
- On-premise vs Cloud decision
- GPU utilization monitoring
- Cost optimization mechanics

### Phase 4: Product & Revenue (40-50h)
- API deployment system
- Pricing configuration
- Customer acquisition
- Revenue tracking
- Inference cost calculation

### Phase 5: Advanced Features (60-80h)
- Model benchmarking leaderboard
- Talent poaching mechanics
- Competitive events
- Research collaborations
- Political integration (AI policies)

**Total Estimated:** 200–270 hours

---

## 📊 Success Metrics

**Player Engagement:**
- AI company creation rate (% of total companies)
- Average session length in AI company management
- Retention rate (players still managing AI company after 1 month)

**Gameplay Depth:**
- Average models trained per company
- Research papers published (total)
- GPU utilization optimization (players learning to reduce costs)
- Talent retention rate (indicator of strategic depth)

**Economic Impact:**
- AI company revenue vs other industries
- Compute costs as % of revenue (profitability metric)
- Acquisition offers value (market validation)

**Multiplayer:**
- Talent poaching frequency
- Research collaborations formed
- Leaderboard position changes
- Competitive pricing dynamics

---

---

## 🧩 XP Events (AI-Specific)
- Research breakthrough: +500 XP (L3+)
- Model deployment: +200 XP (any level)
- Enterprise client signed: +300 XP (L2+)
- Benchmark top-10: +400 XP (L3+)
- Published paper: +250 XP (L3+)

## 🧯 Risks & Crises (AI)
- Model harm incident → Reputation -30 to -80, regulatory cost
- Data breach → -$50k to -$5M losses; fines; reputation hit
- Compute crunch → 2–6× cost spike (market-wide)
- Talent exodus → project delays, hiring spikes

---

*ECHO v1.0.0 update (2025-11-15): Introduced 5-level AI progression with costs, staffing, compute, revenue scales; integrated DataCenter/ComputeCluster models; aligned with Banking & Level System.*
