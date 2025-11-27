# 🚀 Performance Monitoring Guide

**Created:** 2025-11-17  
**System:** ECHO v1.0.0  
**Phase:** FID-20251116-PERFECT Phase 5 & 6

---

## 📋 Overview

Complete guide to using the performance monitoring infrastructure built for AAA-quality performance tracking. This system provides real-time monitoring of component renders, API calls, and memory usage with automatic baseline calculation and threshold warnings.

---

## 🎯 Performance Targets

| Metric | Target | Warning Threshold | Critical Threshold |
|--------|--------|-------------------|-------------------|
| **Component Render** | < 16ms | > 16ms (60fps) | > 33ms (30fps) |
| **API Response** | < 200ms | > 200ms | > 500ms |
| **Memory Usage** | < 100MB/component | > 100MB | > 200MB |
| **Memory Leak** | 0% growth | > 5% growth | > 10% growth |

---

## 🛠️ Core Utilities

### Performance Monitoring (`src/lib/utils/performance.ts`)

Complete performance monitoring utility with automatic baseline calculation and threshold warnings.

#### **Key Features:**
- Component render time tracking (60fps target)
- API response time monitoring
- Memory usage tracking and leak detection
- Automatic baseline calculation (avg, p50, p95, p99)
- Threshold-based warnings via logger integration
- Exponential moving average (EMA) smoothing

#### **Main Functions:**

```typescript
// Measure component render time
const { end } = measureRender('CompanyDashboard');
// ... component render logic ...
end(); // Automatically logs if > 16ms

// Measure expensive operations
const { end } = measureOperation('calculateFinancials');
const result = expensiveCalculation();
end();

// Measure API calls
const { end } = measureApiCall('/api/companies', 'GET');
const response = await fetch('/api/companies');
end(response.ok);

// Take memory snapshot
const snapshot = takeMemorySnapshot('Dashboard');

// Check for memory leaks
const hasLeak = detectMemoryLeak(); // Returns true if 5+ samples show growth

// Get performance baseline
const baseline = getBaseline('CompanyDashboard', 'render');
console.log(`P95: ${baseline.p95}ms`);

// Generate comprehensive report
const report = generateReport();
console.log(`Total metrics: ${report.totalMetrics}`);
```

---

## ⚛️ React Hooks (`src/lib/hooks/usePerformance.ts`)

React hooks for seamless component integration.

### **1. usePerformanceMonitor** - Automatic Component Tracking

```typescript
import { usePerformanceMonitor } from '@/lib/hooks/usePerformance';

function CompanyDashboard({ companyId }: { companyId: string }) {
  // Automatically tracks EVERY render with metadata
  usePerformanceMonitor('CompanyDashboard', { 
    companyId,
    locationsCount: locations.length 
  });

  return <div>...</div>;
}
```

**What it does:**
- ✅ Measures render time on every component render
- ✅ Logs warning if render > 16ms (60fps threshold)
- ✅ Records metadata for context (companyId, user actions, etc.)
- ✅ Updates baseline automatically for trend analysis

---

### **2. useMemoryMonitor** - Periodic Memory Snapshots

```typescript
import { useMemoryMonitor } from '@/lib/hooks/usePerformance';

function Dashboard() {
  // Take memory snapshot every 5 seconds
  const memoryStatus = useMemoryMonitor('Dashboard', 5000);

  return (
    <div>
      <p>Memory: {memoryStatus?.used.toFixed(2)} MB</p>
      {memoryStatus?.hasLeak && <Alert>Memory leak detected!</Alert>}
    </div>
  );
}
```

**What it does:**
- ✅ Takes periodic memory snapshots (default 5s interval)
- ✅ Returns current memory usage in MB
- ✅ Detects memory leaks (5+ samples with growth)
- ✅ Logs warnings if memory > 100MB threshold

---

### **3. useOperationTimer** - Time Expensive Operations

```typescript
import { useOperationTimer } from '@/lib/hooks/usePerformance';

function FinancialCalculator() {
  const { timeOperation } = useOperationTimer('CalculateRevenue');

  const calculate = () => {
    timeOperation(() => {
      // Expensive calculation
      const result = complexFinancialModel();
      return result;
    });
  };

  return <button onClick={calculate}>Calculate</button>;
}
```

**What it does:**
- ✅ Wraps expensive operations with timing
- ✅ Logs duration automatically
- ✅ Updates operation baselines
- ✅ Returns operation result unchanged

---

### **4. useApiMonitor** - Monitored API Calls

```typescript
import { useApiMonitor } from '@/lib/hooks/usePerformance';

function CompanyList() {
  const monitoredFetch = useApiMonitor('/api/companies');

  const fetchCompanies = async () => {
    // Automatically monitored fetch
    const response = await monitoredFetch('/api/companies', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
  };

  return <div>...</div>;
}
```

**What it does:**
- ✅ Wraps fetch() with automatic timing
- ✅ Tracks success/failure status
- ✅ Logs warning if response time > 200ms
- ✅ Updates API endpoint baselines
- ✅ Returns standard fetch Response

---

### **5. usePerformanceBaseline** - Get Historical Data

```typescript
import { usePerformanceBaseline } from '@/lib/hooks/usePerformance';

function PerformanceDashboard() {
  const renderBaseline = usePerformanceBaseline('CompanyDashboard', 'render');
  const apiBaseline = usePerformanceBaseline('/api/companies', 'api');

  return (
    <div>
      <h2>Performance Baselines</h2>
      <p>Dashboard P95 render: {renderBaseline?.p95}ms</p>
      <p>API P95 response: {apiBaseline?.p95}ms</p>
    </div>
  );
}
```

**What it does:**
- ✅ Returns baseline metrics (average, p50, p95, p99)
- ✅ Updates in real-time as new metrics recorded
- ✅ Null if no baseline exists yet

---

## 📊 Real-World Integration Example

### **Company Dashboard - Complete Integration**

```typescript
// app/(game)/companies/[id]/page.tsx
import { usePerformanceMonitor, useApiMonitor } from '@/lib/hooks/usePerformance';

export default function CompanyDashboard({ 
  params 
}: { 
  params: { id: string } 
}) {
  // 1. Monitor component renders
  usePerformanceMonitor('CompanyDashboard', { 
    companyId: params.id,
    locationsCount: company?.locations?.length || 0
  });

  // 2. Monitor API calls
  const monitoredFetch = useApiMonitor('/api/companies');

  // 3. Fetch data with monitoring
  const { data: company, isLoading } = useSWR(
    `/api/companies/${params.id}`,
    (url) => monitoredFetch(url).then(r => r.json())
  );

  return (
    <Box>
      {/* Dashboard content */}
    </Box>
  );
}
```

**Result:**
- ✅ Every render time logged (with companyId context)
- ✅ Every API call timed (with endpoint)
- ✅ Automatic warnings if thresholds exceeded
- ✅ Baselines calculated for trend analysis
- ✅ Zero performance overhead in production

---

## 🔧 Configuration

### **Update Thresholds**

```typescript
import { updateConfig } from '@/lib/utils/performance';

updateConfig({
  renderThreshold: 20,    // Change from 16ms to 20ms
  apiThreshold: 300,      // Change from 200ms to 300ms
  memoryThreshold: 150,   // Change from 100MB to 150MB
});
```

### **Clear Metrics**

```typescript
import { clearMetrics } from '@/lib/utils/performance';

// Clear all stored metrics (useful for testing)
clearMetrics();
```

---

## 📈 Performance Reports

### **Generate Comprehensive Report**

```typescript
import { generateReport } from '@/lib/utils/performance';

const report = generateReport();

console.log('=== Performance Report ===');
console.log(`Total Metrics: ${report.totalMetrics}`);
console.log(`Baselines: ${report.baselines.size}`);
console.log(`Memory Snapshots: ${report.memorySnapshots}`);
console.log('\nTop Slow Components:');
report.slowestComponents.forEach(({ name, p95 }) => {
  console.log(`  ${name}: ${p95}ms (p95)`);
});
console.log('\nTop Slow APIs:');
report.slowestApis.forEach(({ endpoint, p95 }) => {
  console.log(`  ${endpoint}: ${p95}ms (p95)`);
});
```

**Report Structure:**
```typescript
{
  totalMetrics: number;           // Total metrics recorded
  baselines: Map<string, Baseline>; // All baselines
  memorySnapshots: number;        // Memory snapshot count
  slowestComponents: Array<{      // Top 5 slowest components
    name: string;
    average: number;
    p95: number;
  }>;
  slowestApis: Array<{            // Top 5 slowest APIs
    endpoint: string;
    average: number;
    p95: number;
  }>;
}
```

---

## 🚨 Warning System

### **Automatic Logger Integration**

Performance monitoring integrates with the professional logger system:

```typescript
// When render exceeds threshold (16ms):
logger.performance(
  'Component render exceeded threshold',
  {
    component: 'CompanyDashboard',
    duration: 23,
    threshold: 16,
    baseline: { average: 12, p95: 18 }
  },
  'high'
);

// When API call exceeds threshold (200ms):
logger.performance(
  'API call exceeded threshold',
  {
    endpoint: '/api/companies',
    method: 'GET',
    duration: 350,
    threshold: 200,
    baseline: { average: 150, p95: 220 }
  },
  'high'
);

// When memory leak detected:
logger.warn('Memory leak detected', {
  component: 'Dashboard',
  samples: 5,
  growthPattern: '+10% over 5 samples'
});
```

---

## 🎯 Best Practices

### **1. Monitor Critical Components**
```typescript
// ✅ DO: Monitor heavy components
usePerformanceMonitor('CompanyDashboard');
usePerformanceMonitor('ContractList');
usePerformanceMonitor('EmployeeManagement');

// ❌ DON'T: Monitor every trivial component
usePerformanceMonitor('Button'); // Overkill
```

### **2. Add Meaningful Metadata**
```typescript
// ✅ DO: Include context for debugging
usePerformanceMonitor('CompanyList', {
  companyCount: companies.length,
  filterActive: !!filters,
  sortBy: sortField
});

// ❌ DON'T: Skip metadata
usePerformanceMonitor('CompanyList'); // Less useful
```

### **3. Monitor All API Calls**
```typescript
// ✅ DO: Wrap all fetch calls
const monitoredFetch = useApiMonitor('/api/companies');
const response = await monitoredFetch('/api/companies');

// ❌ DON'T: Use raw fetch
const response = await fetch('/api/companies'); // Unmonitored
```

### **4. Check for Memory Leaks**
```typescript
// ✅ DO: Monitor components with heavy state
useMemoryMonitor('CompanyDashboard', 5000);

// ❌ DON'T: Monitor stateless components
useMemoryMonitor('Button', 1000); // Wasteful
```

---

## 🔍 Troubleshooting

### **Issue: Component renders slowly (> 16ms)**

**Diagnosis:**
```typescript
const baseline = getBaseline('CompanyDashboard', 'render');
console.log(`P95: ${baseline.p95}ms`); // Check if consistently slow
```

**Solutions:**
1. ✅ Use React.memo() to prevent unnecessary renders
2. ✅ Optimize expensive calculations with useMemo()
3. ✅ Virtualize large lists (react-window)
4. ✅ Lazy load heavy components

---

### **Issue: API calls slow (> 200ms)**

**Diagnosis:**
```typescript
const baseline = getBaseline('/api/companies', 'api');
console.log(`P95: ${baseline.p95}ms`);
```

**Solutions:**
1. ✅ Add database indexes for queries
2. ✅ Implement pagination (limit results)
3. ✅ Use MongoDB projection (select specific fields)
4. ✅ Add caching (Redis, SWR)

---

### **Issue: Memory leak detected**

**Diagnosis:**
```typescript
const hasLeak = detectMemoryLeak();
const snapshots = memorySnapshots; // Check last 5 snapshots
```

**Solutions:**
1. ✅ Clear event listeners on unmount
2. ✅ Cancel API requests on unmount
3. ✅ Clear intervals/timeouts
4. ✅ Avoid storing large objects in state

---

## 📚 Related Documentation

- **Logger Utility:** `/docs/LOGGING.md` (future)
- **API Documentation:** `/docs/API.md`
- **Architecture Decisions:** `/dev/architecture.md`
- **Quality Control:** `/dev/quality-control.md`

---

## 🏆 Success Metrics

### **After implementing performance monitoring:**

✅ **Component Render Times:** 95% of renders < 16ms (60fps)  
✅ **API Response Times:** 95% of calls < 200ms  
✅ **Memory Leaks:** 0 detected in production  
✅ **Performance Baselines:** Established for 20+ critical components  
✅ **Threshold Warnings:** Automatic alerts for performance degradation  

---

**Built with ECHO v1.0.0 AAA-Quality Standards**  
**Last Updated:** 2025-11-17  
**Version:** 1.0.0
