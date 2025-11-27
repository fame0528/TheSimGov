# FID-20251127-EMPLOYEES: Employee Management Implementation

**Status:** PLANNED  
**Priority:** CRITICAL/HIGH (P0/P1)  
**Industry:** Cross-Functional (Employee Management)  
**Created:** 2025-11-27  
**Components:** 5 total (2 P0, 3 P1)  
**Estimated Effort:** 36-48 hours  
**Estimated LOC:** ~18,000-24,000  

---

## 📋 EXECUTIVE SUMMARY

### Business Context
Employee management module providing org chart visualization, directory, onboarding workflows, performance reviews, and training/development tracking. Critical infrastructure for ALL industries.

**Strategic Value:**
- **Operational Efficiency:** CRITICAL - HR processes automation
- **Employee Experience:** HIGH - Smooth onboarding, clear career paths
- **Compliance:** HIGH - HR record-keeping, performance documentation
- **Scalability:** CRITICAL - Multi-team, multi-department, multi-location

---

## 🎯 COMPONENTS BREAKDOWN

### **Phase 0 (P0) - Critical Foundation** (Week 2)

#### 1. **OrgChart.tsx** (456 LOC)
**Priority:** CRITICAL  
**Complexity:** 4/5  
**Estimated Time:** 6-8 hours  
**Week:** 2

**Business Value:**
- Visual organization structure
- Reporting relationships clarity
- Team composition visibility
- Leadership hierarchy

**Key Features:**
- Interactive org chart (tree/hierarchy visualization)
- Employee cards (photo, name, title, department)
- Search and filter (name, department, title, location)
- Drill-down to team view
- Reporting line visualization
- Vacant positions tracking
- Headcount by department/location

**API Endpoints:** (~10-12)
- `GET /api/employees/org-chart` - Org structure data
- `GET /api/employees/[id]` - Employee details
- `GET /api/employees/reports/[id]` - Direct reports
- `GET /api/employees/departments` - Department list

**Database Schema:**
```typescript
// Employee schema (extends User)
{
  employeeId: string (unique)
  userId: ObjectId (ref: User)
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    photo: string (URL)
  }
  employment: {
    title: string
    department: string
    location: string
    employmentType: enum (full-time, part-time, contractor, intern)
    startDate: Date
    endDate: Date (nullable)
    status: enum (active, on-leave, terminated)
  }
  reporting: {
    managerId: ObjectId (ref: Employee)
    dotted: [ObjectId] (matrix reporting)
  }
  compensation: {
    salary: number
    currency: string
    payFrequency: enum (hourly, salary)
    level: string (IC1, IC2, M1, etc.)
  }
  companyId: ObjectId (indexed)
}
```

**Reuse Opportunities:**
- Tree visualization library (org chart rendering)
- Card components (employee cards)
- SearchBar (employee search)

**Dependencies:**
- React Flow or D3.js (org chart visualization)
- Chakra UI

---

#### 2. **EmployeeDirectory.tsx** (548 LOC)
**Priority:** CRITICAL  
**Complexity:** 3/5  
**Estimated Time:** 6-8 hours  
**Week:** 2

**Business Value:**
- Employee lookup and contact information
- Team composition discovery
- Cross-functional collaboration enablement

**Key Features:**
- Employee list table (DataTable - photo, name, title, department, location, contact)
- Advanced filters (department, location, title, skills, availability)
- Employee profile modal (full details, contact, skills, projects)
- Quick actions (email, message, schedule meeting)
- Export functionality (CSV, PDF directory)
- Birthday/anniversary reminders

**API Endpoints:** (~8-10)
- `GET /api/employees` - List employees (filterable)
- `GET /api/employees/[id]/profile` - Full profile
- `GET /api/employees/search` - Search employees
- `GET /api/employees/anniversaries` - Upcoming anniversaries

**Database Schema:**
```typescript
// EmployeeProfile schema (extends Employee)
{
  employeeId: ObjectId (ref: Employee)
  bio: string
  skills: [string]
  certifications: [{ name, issuer, date, expiration }]
  languages: [{ language, proficiency }]
  projects: [ObjectId] (current projects)
  socialLinks: {
    linkedin: string
    github: string
    twitter: string
  }
  availability: {
    status: enum (available, busy, away, do-not-disturb)
    timezone: string
  }
  companyId: ObjectId (indexed)
}
```

---

### **Phase 1 (P1) - Advanced HR** (Weeks 5-7)

#### 3. **OnboardingDashboard.tsx** (512 LOC)
**Priority:** HIGH  
**Complexity:** 4/5  
**Estimated Time:** 8-10 hours  
**Week:** 5

**Business Value:**
- Streamlined new hire onboarding
- Consistency in onboarding experience
- Reduced time-to-productivity
- Compliance tracking (I-9, W-4, etc.)

**Key Features:**
- Onboarding pipeline (upcoming, in-progress, completed)
- New hire checklist (paperwork, equipment, training, access)
- Task assignment and tracking (HR, IT, manager, buddy)
- Progress tracking per new hire
- Document collection (I-9, W-4, direct deposit, benefits enrollment)
- Equipment tracking (laptop, phone, accessories)
- Training module assignments
- First-day schedule and orientation

**API Endpoints:** (~12-15)
- `GET /api/employees/onboarding` - Onboarding list
- `GET /api/employees/onboarding/[id]` - Onboarding details
- `POST /api/employees/onboarding` - Create onboarding
- `PUT /api/employees/onboarding/[id]/tasks/[taskId]` - Update task
- `POST /api/employees/onboarding/[id]/documents` - Upload document

**Database Schema:**
```typescript
// OnboardingWorkflow schema
{
  onboardingId: string (unique)
  employeeId: ObjectId (ref: Employee)
  status: enum (scheduled, in-progress, completed, on-hold)
  startDate: Date
  completionDate: Date
  tasks: [
    {
      taskId: string
      category: enum (paperwork, equipment, training, access, orientation)
      title: string
      description: string
      assignedTo: enum (hr, it, manager, buddy, self)
      dueDate: Date
      completionDate: Date
      status: enum (pending, in-progress, completed, blocked)
      notes: string
    }
  ]
  documents: [
    {
      type: enum (i9, w4, direct-deposit, benefits, handbook)
      uploadedAt: Date
      url: string
      verified: boolean
    }
  ]
  equipment: [
    {
      item: string (laptop, phone, monitor, etc.)
      status: enum (ordered, delivered, setup, returned)
      serialNumber: string
    }
  ]
  companyId: ObjectId (indexed)
}
```

---

#### 4. **PerformanceReviews.tsx** (624 LOC)
**Priority:** HIGH  
**Complexity:** 4/5  
**Estimated Time:** 8-10 hours  
**Week:** 6

**Business Value:**
- Structured performance management
- Career development tracking
- Compensation decision support
- Retention insights

**Key Features:**
- Review cycle management (annual, semi-annual, quarterly)
- Self-assessment forms
- Manager assessment forms
- Peer feedback (360 reviews)
- Goal setting and tracking (OKRs, SMART goals)
- Performance ratings (exceeds, meets, needs improvement)
- Calibration sessions
- Review history and trends
- Development plan creation

**API Endpoints:** (~12-15)
- `GET /api/employees/reviews` - Review cycles
- `GET /api/employees/[id]/reviews` - Employee reviews
- `POST /api/employees/reviews` - Create review
- `PUT /api/employees/reviews/[id]` - Update review
- `GET /api/employees/[id]/goals` - Employee goals

**Database Schema:**
```typescript
// PerformanceReview schema
{
  reviewId: string (unique)
  employeeId: ObjectId (indexed, ref: Employee)
  managerId: ObjectId (ref: Employee)
  cycle: {
    period: string (e.g., "2025 H1")
    startDate: Date
    endDate: Date
  }
  selfAssessment: {
    completedAt: Date
    accomplishments: string
    challenges: string
    goals: [{ goal: string, achieved: boolean, notes: string }]
  }
  managerAssessment: {
    completedAt: Date
    strengths: string
    areasForImprovement: string
    rating: enum (exceeds, meets, needs-improvement, unsatisfactory)
    promotionRecommendation: boolean
    notes: string
  }
  peerFeedback: [
    {
      peerId: ObjectId (ref: Employee)
      feedback: string
      submittedAt: Date
    }
  ]
  goals: [
    {
      category: enum (performance, development, skill, leadership)
      description: string
      dueDate: Date
      status: enum (not-started, in-progress, achieved, abandoned)
    }
  ]
  companyId: ObjectId (indexed)
}
```

---

#### 5. **TrainingDashboard.tsx** (478 LOC)
**Priority:** HIGH  
**Complexity:** 3/5  
**Estimated Time:** 6-8 hours  
**Week:** 7

**Business Value:**
- Employee skill development
- Compliance training tracking (safety, security, etc.)
- Career path support
- Knowledge sharing

**Key Features:**
- Training catalog (courses, workshops, certifications)
- Enrollment tracking (required, optional, completed)
- Completion tracking (progress, certificates)
- Compliance training (deadlines, renewal dates)
- Skill development plans
- Training budget tracking
- Instructor-led vs self-paced
- External certifications tracking

**API Endpoints:** (~10-12)
- `GET /api/employees/training/catalog` - Training catalog
- `GET /api/employees/[id]/training` - Employee training
- `POST /api/employees/training/enroll` - Enroll in training
- `PUT /api/employees/training/[id]/complete` - Mark complete

**Database Schema:**
```typescript
// TrainingEnrollment schema
{
  enrollmentId: string (unique)
  employeeId: ObjectId (indexed, ref: Employee)
  courseId: ObjectId (ref: TrainingCourse)
  enrolledAt: Date
  startDate: Date
  completionDate: Date
  status: enum (enrolled, in-progress, completed, dropped)
  progress: number (%)
  certificate: {
    issued: boolean
    certificateId: string
    issueDate: Date
    expirationDate: Date
  }
  companyId: ObjectId (indexed)
}
```

---

## 🏗️ SHARED INFRASTRUCTURE

### Zod Schemas
```typescript
const employeeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email()
  }),
  employment: z.object({
    title: z.string().min(1),
    department: z.string(),
    startDate: z.date()
  })
});
```

### Utility Functions
```typescript
export function calculateTenure(startDate: Date): { years: number, months: number };
export function generateOrgChartData(employees: Employee[]): OrgNode[];
export function calculateOnboardingProgress(tasks: Task[]): number;
```

---

## 📊 SUCCESS METRICS

### P0 Completion (Week 2)
- ✅ 2 components deployed (OrgChart, EmployeeDirectory)
- ✅ ~18-22 API endpoints
- ✅ Employee lookup functional

### P1 Completion (Week 7)
- ✅ All 5 components deployed
- ✅ ~52-64 API endpoints
- ✅ Complete HR lifecycle management

---

**Auto-generated by ECHO v1.3.1 Planning System**  
**Date:** 2025-11-27  
**Status:** Ready for Implementation
