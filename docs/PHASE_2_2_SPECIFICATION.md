# Phase 2.2 Specification: OrgChart Component

**Status:** Ready to begin  
**Estimated:** 90 minutes  
**Type:** React Component (TSX)  
**Location:** `src/components/employee/OrgChart.tsx`

---

## Component Purpose

Hierarchical visualization of organizational structure showing manager-to-report relationships. Displays:
- Employee cards with key metrics
- Tree structure showing reporting relationships
- Color-coded status and performance indicators
- Click-through for detailed employee view
- Filtering and search capabilities

---

## Features Required

### 1. Tree Structure Display
- Manager at top level
- Direct reports nested below
- Multi-level hierarchy support (manager → report → report's reports)
- Indentation showing hierarchy depth
- Connector lines between manager and reports (optional, enhanced UX)

### 2. Employee Cards
**Required Fields per Card:**
- Employee name
- Job title/role
- Performance rating (color-coded via getPerformanceRatingColor)
- Morale level (color-coded via getMoraleColor)
- Retention risk (color-coded via getRetentionRiskColor)
- Status badge (color-coded via getStatusColor)

**Visual Elements:**
- Avatar placeholder or initials
- Color-coded badges for status/morale/performance
- Skill average indicator (via employee.skillAverage virtual)
- Optional: Market value salary comparison

### 3. Interactivity
- Click employee card → View full details modal
- Click card → Load detailed employee profile (via useEmployee hook)
- Tooltip on hover showing: name, role, 5-year tenure, skill average
- Action buttons: "View Details", "Conduct Review", "Adjust Salary", "Train", "Fire"

### 4. Filtering
**Filter Options:**
- By department/role
- By status (active, training, onLeave, terminated)
- By performance level (≥4, ≥3, <3)
- By retention risk (low, medium, high)
- Search by name (substring match)

**Apply Filters:**
- Checkbox controls or dropdown selects
- Real-time filtering of tree
- Show count of filtered employees

### 5. Responsive Design
- Desktop: Full tree layout
- Tablet: Collapsible tree sections
- Mobile: Vertical stack with expandable sections

---

## Data Dependencies

### Required Utilities (from Phase 2.0)
```typescript
import {
  getStatusColor, getMoraleColor, getRetentionRiskColor,
  getPerformanceRatingColor, getStatusLabel, getMoraleLabel,
  getRetentionRiskLabel, getPerformanceLabel
} from '@/lib/utils/employee';
```

### Required Hooks
```typescript
import { useEmployee, useEmployees } from '@/lib/hooks/useEmployee';
import useAPI from '@/lib/hooks/useAPI';
```

### Required Components
- HeroUI Card (for employee cards)
- HeroUI Badge (for status/morale indicators)
- HeroUI Button (for actions)
- HeroUI Modal (for details view)
- HeroUI Checkbox (for filters)
- HeroUI Select (for filter dropdowns)

---

## API Integration Points

### 1. Fetch Organization Data
```
GET /api/employees?companyId=X&status=active
Response: { employees[], total, metrics }
```

### 2. View Employee Details
```
GET /api/employees/[id]
Response: { employee, metrics, reviews, trainingHistory }
```

### 3. Update Employee (from detail modal)
```
PATCH /api/employees/[id]
Body: { role?, salary?, status?, morale?, ... }
```

### 4. Conduct Review (from detail modal)
```
POST /api/employees/[id]/review
Body: { overallScore, feedback[] }
```

### 5. Terminate Employee (from detail modal)
```
DELETE /api/employees/[id]?reason=...
```

---

## Code Pattern Template

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@heroui/react';
import { useEmployees } from '@/lib/hooks/useEmployee';
import {
  getStatusColor, getMoraleColor, getRetentionRiskColor,
  getPerformanceRatingColor, getStatusLabel, getMoraleLabel,
  getRetentionRiskLabel, getPerformanceLabel
} from '@/lib/utils/employee';

interface OrgChartProps {
  companyId: string;
}

export default function OrgChart({ companyId }: OrgChartProps) {
  const { employees, loading, error } = useEmployees(companyId);
  const [filters, setFilters] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter employees based on active filters
  const filteredEmployees = useMemo(() => {
    return employees?.filter(emp => {
      // Apply all filters...
    }) || [];
  }, [employees, filters, searchTerm]);

  // Build tree structure
  const treeData = useMemo(() => {
    // Create manager → reports hierarchy...
  }, [filteredEmployees]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Checkbox filters for department, status, performance, risk */}
      </div>

      {/* Organization Tree */}
      <div className="space-y-4">
        {/* Recursive tree rendering... */}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="modal">
          {/* Employee details and action buttons */}
        </div>
      )}
    </div>
  );
}
```

---

## Color Coding Reference

**Status Colors** (via getStatusColor):
- Active: Green (#10B981)
- Training: Blue (#3B82F6)
- On Leave: Yellow (#EAB308)
- Terminated: Gray (#6B7280)

**Morale Colors** (via getMoraleColor):
- ≥80: Green (#10B981)
- 50-79: Yellow (#EAB308)
- <50: Red (#DC2626)

**Performance Colors** (via getPerformanceRatingColor):
- 5 (Excellent): Green (#10B981)
- 4 (Good): Blue (#3B82F6)
- 3 (Average): Yellow (#EAB308)
- 2 (Below): Orange (#F97316)
- 1 (Poor): Red (#DC2626)

**Retention Risk Colors** (via getRetentionRiskColor):
- Low (<25): Green (#10B981)
- Medium (25-75): Yellow (#EAB308)
- High (>75): Red (#DC2626)

---

## Testing Considerations

1. **Rendering:** Component displays with sample company data
2. **Filters:** Each filter type works independently and in combination
3. **Search:** Name search finds partial matches
4. **Interactions:** Click handlers properly dispatch modals/actions
5. **Loading States:** Properly display while fetching data
6. **Error Handling:** Graceful error display

---

## Estimated Implementation Breakdown

| Task | Time |
|------|------|
| Component skeleton & imports | 10 min |
| Data fetching setup | 15 min |
| Tree structure rendering | 20 min |
| Employee card design | 15 min |
| Filter logic implementation | 15 min |
| Interactivity & modals | 10 min |
| Responsive design | 5 min |
| **Total** | **90 min** |

---

**Next Phase:** 2.3 - EmployeeDirectory Component (DataTable with sorting/filtering)

*Ready to begin when approved via "code" or "proceed" command*
