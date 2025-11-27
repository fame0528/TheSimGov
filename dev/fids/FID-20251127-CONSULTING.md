# FID-20251127-CONSULTING: Consulting Industry Implementation

**Status:** PLANNED  
**Priority:** MEDIUM (P2)  
**Industry:** Consulting & Professional Services  
**Created:** 2025-11-27  
**Components:** 1 total (P2)  
**Estimated Effort:** 12-16 hours  
**Estimated LOC:** ~12,000-15,000  

---

## 📋 EXECUTIVE SUMMARY

### Business Context
Consulting module for project management, client engagement tracking, billable hours, consultant utilization, revenue forecasting, and deliverables management.

**Revenue Model:**
- Hourly billing (consultant rate × hours)
- Project-based fees (fixed price contracts)
- Retainer agreements (monthly/quarterly)
- Value-based pricing (performance bonuses)
- Product/training sales (workshops, materials)

### Strategic Value
- **Revenue Impact:** HIGH - Billable hour tracking = revenue
- **Utilization:** CRITICAL - Consultant productivity = profitability
- **Client Satisfaction:** HIGH - Repeat business and referrals
- **Project Delivery:** CRITICAL - On-time, on-budget = reputation

---

## 🎯 COMPONENTS BREAKDOWN

### **Phase 2 (P2) - Complete Consulting** (Week 13)

#### 1. **ConsultingDashboard.tsx** (870 LOC)
**Priority:** MEDIUM  
**Complexity:** 4/5  
**Estimated Time:** 12-16 hours  
**Week:** 13

**Business Value:**
- Unified view of all consulting operations
- Revenue tracking (billable hours, project fees, retainers)
- Consultant utilization metrics
- Project pipeline and forecasting
- Client portfolio management

**Key Features:**

**Section 1: Revenue Dashboard**
- Billable hours chart (LineChart - daily/weekly/monthly trends)
- Revenue breakdown (hourly, project, retainer)
- Outstanding invoices tracking
- Payment collection metrics
- Revenue forecast (pipeline value × close probability)

**Section 2: Project Management**
- Active projects table (DataTable - client, phase, budget, timeline)
- Project status cards (on-track, at-risk, delayed, completed)
- Budget tracking (spent vs allocated, burn rate)
- Milestone tracking (deliverables, due dates, completion)
- Resource allocation (consultants assigned per project)
- Project profitability analysis

**Section 3: Consultant Utilization**
- Utilization rate per consultant (billable hours / total hours %)
- Capacity planning (available hours, booked hours)
- Consultant performance (revenue generated, client satisfaction)
- Skill matrix (expertise areas, certifications)
- Bench time tracking (unassigned consultants)
- Training and development hours

**Section 4: Client Management**
- Client portfolio (active, inactive, prospect)
- Client satisfaction scores (NPS, CSAT)
- Engagement history (projects, revenue, duration)
- Upsell/cross-sell opportunities
- Contract renewal tracking
- Client acquisition cost vs lifetime value

**Section 5: Pipeline & Forecasting**
- Sales pipeline (leads, proposals, negotiations, won/lost)
- Win rate analysis (by industry, service type, size)
- Revenue forecast (weighted pipeline, close dates)
- Capacity vs demand analysis
- Hiring needs projection

**API Endpoints:** (~25-30)
- `GET /api/consulting/projects` - List projects
- `GET /api/consulting/projects/[id]` - Project details
- `POST /api/consulting/projects` - Create project
- `PUT /api/consulting/projects/[id]` - Update project
- `GET /api/consulting/consultants` - List consultants
- `GET /api/consulting/consultants/[id]/utilization` - Utilization data
- `GET /api/consulting/timesheets` - Billable hours
- `POST /api/consulting/timesheets` - Log hours
- `GET /api/consulting/clients` - Client list
- `GET /api/consulting/clients/[id]` - Client details
- `GET /api/consulting/revenue` - Revenue analytics
- `GET /api/consulting/pipeline` - Sales pipeline
- `GET /api/consulting/forecasts` - Revenue forecast

**Database Schema:**
```typescript
// Project schema
{
  projectId: string (unique)
  name: string
  client: {
    id: ObjectId (ref: Client)
    name: string
    contact: { name, email, phone }
  }
  type: enum (hourly, fixed-price, retainer, value-based)
  status: enum (proposal, active, on-hold, completed, cancelled)
  phase: enum (discovery, planning, execution, delivery, closure)
  timeline: {
    startDate: Date
    endDate: Date
    actualEndDate: Date
  }
  budget: {
    type: enum (hourly, fixed)
    allocated: number
    spent: number
    currency: string
  }
  team: [
    {
      consultantId: ObjectId (ref: User)
      role: string (lead, analyst, specialist)
      rate: number (hourly)
      hoursAllocated: number
      hoursLogged: number
    }
  ]
  milestones: [
    {
      name: string
      dueDate: Date
      completionDate: Date
      deliverables: [string]
      status: enum (pending, in-progress, completed, delayed)
    }
  ]
  revenue: {
    total: number
    invoiced: number
    collected: number
  }
  profitability: {
    revenue: number
    costs: number (hours × rate)
    margin: number (%)
  }
  companyId: ObjectId (indexed)
  createdAt, updatedAt
}

// Timesheet schema
{
  timesheetId: string (unique)
  consultantId: ObjectId (indexed, ref: User)
  projectId: ObjectId (indexed, ref: Project)
  date: Date (indexed)
  hours: number
  billable: boolean
  activity: string (description of work)
  approvedBy: ObjectId (ref: User)
  approvalDate: Date
  invoiced: boolean
  invoiceId: ObjectId (ref: Invoice)
  companyId: ObjectId (indexed)
}

// Client schema
{
  clientId: string (unique)
  name: string
  industry: string
  contact: {
    primaryContact: { name, email, phone, title }
    billingContact: { name, email, phone }
  }
  status: enum (prospect, active, inactive, churned)
  engagements: [
    {
      projectId: ObjectId (ref: Project)
      startDate: Date
      endDate: Date
      revenue: number
    }
  ]
  satisfaction: {
    nps: number (0-10)
    csat: number (1-5)
    lastSurvey: Date
  }
  ltv: number (lifetime value)
  cac: number (client acquisition cost)
  companyId: ObjectId (indexed)
}

// Consultant schema (extends User)
{
  consultantId: ObjectId (ref: User)
  role: string (partner, senior, analyst, specialist)
  rate: number (hourly billing rate)
  skills: [string]
  certifications: [{ name, issuer, date, expiration }]
  utilization: {
    target: number (% - e.g., 80%)
    current: number (%)
    ytd: number (%)
  }
  performance: {
    projectsCompleted: number
    revenueGenerated: number
    clientSatisfaction: number (avg)
  }
  availability: {
    hoursPerWeek: number
    currentProjects: [ObjectId]
    benchTime: number (hours unassigned)
  }
  companyId: ObjectId (indexed)
}
```

**Reuse Opportunities:**
- DataTable (projects, consultants, clients, timesheets)
- ProgressCard (revenue metrics, utilization, satisfaction)
- ChartCard (revenue trends, pipeline funnel, utilization rates)
- StatusBadge (project status, client status, consultant availability)
- FilterPanel (project filters, date ranges, consultants, clients)

**Dependencies:**
- Recharts (LineChart, BarChart, PieChart for revenue/utilization)
- Chakra UI (complex layouts, tabs, modals)
- Date utilities (timeline tracking, forecasting)
- Invoice generation (PDF export)

---

## 🏗️ SHARED INFRASTRUCTURE

### Zod Schemas
```typescript
const projectSchema = z.object({
  name: z.string().min(1),
  clientId: z.string(),
  type: z.enum(['hourly', 'fixed-price', 'retainer', 'value-based']),
  budget: z.object({
    type: z.enum(['hourly', 'fixed']),
    allocated: z.number().min(0)
  }),
  timeline: z.object({
    startDate: z.date(),
    endDate: z.date()
  })
});

const timesheetSchema = z.object({
  consultantId: z.string(),
  projectId: z.string(),
  date: z.date(),
  hours: z.number().min(0).max(24),
  billable: z.boolean(),
  activity: z.string().min(1)
});

const clientSchema = z.object({
  name: z.string().min(1),
  industry: z.string(),
  contact: z.object({
    primaryContact: z.object({
      name: z.string(),
      email: z.string().email()
    })
  })
});
```

### Utility Functions
```typescript
// Consulting business calculations
export function calculateUtilization(
  billableHours: number,
  totalHours: number
): number;

export function calculateProjectMargin(
  revenue: number,
  costs: number
): number;

export function calculateBurnRate(
  spent: number,
  allocated: number,
  daysElapsed: number,
  totalDays: number
): number;

export function forecastRevenue(
  pipelineValue: number,
  closeProbability: number,
  expectedCloseDate: Date
): { amount: number, date: Date };

export function calculateClientLTV(
  engagements: Engagement[]
): number;
```

### Formatters
```typescript
export const formatUtilization = (rate: number) => `${rate.toFixed(1)}%`;
export const formatHours = (hours: number) => `${hours.toFixed(2)}h`;
export const formatMargin = (margin: number) => `${margin > 0 ? '+' : ''}${margin.toFixed(1)}%`;
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Component rendering (ConsultingDashboard sections)
- Business logic calculations (utilization, margin, burn rate, LTV)
- Zod schema validation
- Utility functions

### Integration Tests
- Project creation and management workflow
- Timesheet submission and approval
- Client engagement tracking
- Revenue reporting accuracy

### E2E Tests
- Complete project lifecycle (create → track → bill → close)
- Consultant time logging workflow
- Client portfolio management
- Revenue forecasting accuracy

**Coverage Target:** 80%+

---

## 📊 SUCCESS METRICS

### P2 Completion (Week 13)
- ✅ 1 comprehensive dashboard deployed
- ✅ ~25-30 API endpoints functional
- ✅ Project management operational
- ✅ Timesheet tracking functional
- ✅ Utilization metrics accurate
- ✅ Revenue forecasting working
- ✅ TypeScript strict mode passing
- ✅ 80%+ test coverage

### Performance Targets
- Project list load: < 1s (up to 500 projects)
- Timesheet data fetch: < 500ms (up to 10,000 entries)
- Revenue calculations: < 300ms
- Dashboard full load: < 3s

---

## 🎯 DEPLOYMENT STRATEGY

### Week 13 Rollout
1. Deploy database schemas (Project, Timesheet, Client, Consultant)
2. Deploy API routes (~25-30 endpoints)
3. Deploy ConsultingDashboard component
4. Configure invoice generation (PDF export)
5. QA testing (project management, time tracking, revenue accuracy)
6. User acceptance (consultant testing, project manager approval)

---

## 🚨 RISKS & MITIGATION

### High-Risk Areas
1. **Time Tracking Accuracy:** Manual entry errors
   - **Mitigation:** Validation rules, approval workflow, audit trail
2. **Revenue Recognition:** Complex billing models
   - **Mitigation:** Clear business rules, automated calculations, manual review checkpoints
3. **Utilization Metrics:** Calculation complexity
   - **Mitigation:** Documented formulas, unit tests, peer review
4. **Project Profitability:** Real-time vs retrospective
   - **Mitigation:** Periodic recalculation, cached summaries, update triggers

---

## 📚 DOCUMENTATION REQUIREMENTS

### Technical Docs
- API endpoint documentation (OpenAPI/Swagger)
- Database schema diagrams
- Business logic formulas (utilization, margin, burn rate, LTV, forecasting)
- Integration guides (invoice generation, time tracking)

### User Guides
- Project creation and management
- Time logging procedures
- Client engagement tracking
- Revenue forecasting methodology

---

**Auto-generated by ECHO v1.3.1 Planning System**  
**Date:** 2025-11-27  
**Status:** Ready for Implementation
