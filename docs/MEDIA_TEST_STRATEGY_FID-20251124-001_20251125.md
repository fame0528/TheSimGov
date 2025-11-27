# Media Utilities Test Strategy

**FID:** FID-20251124-001  
**Date:** 2025-11-25  
**Purpose:** Define comprehensive Jest test strategy for all media utility modules, ensuring >85% coverage, edge case handling, and deterministic behavior verification.

---

## Test Suite Organization

### Directory Structure

```
tests/
└── media/
    ├── advertising.test.ts
    ├── audience.test.ts
    ├── content.test.ts
    ├── platform.test.ts
    ├── monetization.test.ts
    ├── crossPlatform.test.ts (new - normalization utilities)
    ├── analytics.test.ts (new - volatility, forecasting)
    └── __helpers__/
        ├── fixtures.ts (test data generators)
        ├── matchers.ts (custom Jest matchers)
        └── mocks.ts (mock data factories)
```

---

## Test Coverage Requirements

### Minimum Coverage Targets

- **Overall:** ≥85% line coverage
- **Critical utilities:** ≥95% line coverage
- **Branches:** ≥80% coverage
- **Functions:** 100% coverage (every function must have at least one test)

### Critical Utilities (95%+ Coverage Required)

1. Revenue calculations (ROI, ROAS, CPM, LTV)
2. Engagement metrics (rates, virality, retention)
3. Forecasting functions (churn, growth, aging)
4. Cross-platform normalization
5. Risk assessment utilities

---

## Test Categories

### 1. Edge Case Tests

**Mandatory edge cases for EVERY utility:**

```typescript
describe('Edge Cases', () => {
  // Zero values
  it('should handle zero denominator gracefully', () => {
    expect(() => calculateROI(100, 0)).toThrow('Division by zero');
  });
  
  it('should return 0 for zero numerator', () => {
    expect(calculateROI(0, 100)).toBe(-100);
  });
  
  // Negative values
  it('should handle negative inputs', () => {
    expect(calculateROI(-50, 100)).toBe(-150);
  });
  
  // Empty arrays
  it('should handle empty array', () => {
    expect(() => calculateEngagementVolatility([])).toThrow('Empty data set');
  });
  
  // Null/undefined
  it('should throw on null input', () => {
    expect(() => calculateEngagementRate(null)).toThrow(TypeError);
  });
  
  it('should handle undefined optional params', () => {
    expect(calculateViralCoefficient(100, 1000)).toBeDefined();
  });
  
  // Very large numbers
  it('should handle large numbers without overflow', () => {
    const result = calculateAudienceReach(Number.MAX_SAFE_INTEGER);
    expect(result).toBeLessThan(Infinity);
  });
  
  // Very small numbers (precision)
  it('should maintain precision for small decimals', () => {
    expect(calculateEngagementRate({
      views: 1000000,
      likes: 1,
      shares: 0,
      comments: 0,
      watchTime: 0
    })).toBeCloseTo(0.0001, 4);
  });
});
```

---

### 2. Determinism Tests

**Verify consistent results with seeds:**

```typescript
describe('Deterministic Behavior', () => {
  it('should produce identical results with same seed', () => {
    const data = generateTestData();
    const seed = 42;
    
    const result1 = calculateChurnForecast(data, 6, 0.95, seed);
    const result2 = calculateChurnForecast(data, 6, 0.95, seed);
    
    expect(result1).toEqual(result2);
  });
  
  it('should produce different results with different seeds', () => {
    const data = generateTestData();
    
    const result1 = calculateChurnForecast(data, 6, 0.95, 42);
    const result2 = calculateChurnForecast(data, 6, 0.95, 99);
    
    expect(result1).not.toEqual(result2);
  });
  
  it('should use default seed consistently', () => {
    const data = generateTestData();
    
    const result1 = calculateChurnForecast(data, 6, 0.95);
    const result2 = calculateChurnForecast(data, 6, 0.95);
    
    expect(result1).toEqual(result2);
  });
});
```

---

### 3. Boundary Tests

**Test min/max values and transitions:**

```typescript
describe('Boundary Conditions', () => {
  it('should clamp output to 0-100 range', () => {
    const result = normalizeCrossPlatformMetrics(
      Number.MAX_VALUE,
      'followers',
      'YouTube'
    );
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
  
  it('should handle minimum viable data set', () => {
    const minData = [
      { date: '2025-01-01', engagementRate: 5.0 }
    ];
    const result = calculateEngagementVolatility(minData);
    expect(result.volatility).toBe(0); // No variance with 1 point
  });
  
  it('should transition smoothly at thresholds', () => {
    // Test risk level transitions
    expect(assessRiskLevel(14.9).riskLevel).toBe('low');
    expect(assessRiskLevel(15.0).riskLevel).toBe('medium');
    expect(assessRiskLevel(30.0).riskLevel).toBe('high');
  });
});
```

---

### 4. Integration Tests

**Test utility composition:**

```typescript
describe('Integration Tests', () => {
  it('should compose metrics for complete analytics', () => {
    const contentMetrics: ContentMetrics = {
      views: 10000,
      likes: 500,
      shares: 100,
      comments: 50,
      watchTime: 3000
    };
    
    const engagementRate = calculateEngagementRate(contentMetrics);
    const viralCoef = calculateViralCoefficient(
      contentMetrics.shares,
      contentMetrics.views
    );
    const monetization = calculateMonetizationPotential(
      { ...contentMetrics, uniqueViewers: 8000, completionRate: 0.75 },
      5.0,
      1.2
    );
    
    expect(engagementRate).toBeGreaterThan(0);
    expect(viralCoef).toBeGreaterThan(0);
    expect(monetization.estimatedRevenue).toBeGreaterThan(0);
  });
  
  it('should chain forecasting utilities', () => {
    const growthRate = calculateAudienceGrowthRate(1000, 900, 30);
    const projection = projectGrowth(1000, growthRate, 6);
    const healthScore = computeAudienceHealthFlags(
      growthRate,
      5.0,
      2.5
    );
    
    expect(projection).toBeGreaterThan(1000);
    expect(healthScore).toContain('positive_growth');
  });
});
```

---

### 5. Performance Tests

**Verify acceptable performance:**

```typescript
describe('Performance Tests', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array(10000).fill(null).map((_, i) => ({
      date: new Date(2025, 0, i % 365).toISOString(),
      engagementRate: 5 + Math.random() * 5
    }));
    
    const startTime = performance.now();
    const result = calculateEngagementVolatility(largeDataset);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // < 100ms
    expect(result).toBeDefined();
  });
  
  it('should not cause stack overflow with deep recursion', () => {
    const deepLoops = 100;
    expect(() => {
      calculateAdvancedVirality({
        initialReach: 1000,
        shares: 120,
        sharesPerView: 0.12,
        viewsPerShare: 1.2
      }, deepLoops);
    }).not.toThrow();
  });
});
```

---

## Test Data Fixtures

### Fixture Generators

**Create reusable test data:**

```typescript
// tests/media/__helpers__/fixtures.ts

export function generateContentMetrics(overrides?: Partial<ContentMetrics>): ContentMetrics {
  return {
    views: 10000,
    likes: 500,
    shares: 100,
    comments: 50,
    watchTime: 3000,
    uniqueViewers: 8000,
    completionRate: 0.75,
    rewatchRate: 0.15,
    saves: 25,
    ...overrides
  };
}

export function generateEngagementHistory(
  days: number,
  baseRate: number = 5.0,
  volatility: number = 1.0,
  seed: number = 0
): EngagementDataPoint[] {
  const random = seededRandom(seed);
  return Array(days).fill(null).map((_, i) => ({
    date: new Date(2025, 0, i + 1),
    engagementRate: baseRate + (random() - 0.5) * volatility * 2,
    interactions: Math.floor(1000 + random() * 500),
    activeUsers: Math.floor(5000 + random() * 1000)
  }));
}

export function generateChurnData(
  months: number,
  baseChurn: number = 5.0,
  trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
): ChurnDataPoint[] {
  return Array(months).fill(null).map((_, i) => {
    let churnRate = baseChurn;
    if (trend === 'increasing') churnRate += i * 0.2;
    if (trend === 'decreasing') churnRate -= i * 0.2;
    
    return {
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      churnRate: Math.max(0, churnRate),
      subscribers: 10000 - i * 200,
      revenue: (10000 - i * 200) * 10
    };
  });
}
```

---

## Custom Jest Matchers

**Domain-specific assertions:**

```typescript
// tests/media/__helpers__/matchers.ts

expect.extend({
  toBeValidPercentage(received: number) {
    const pass = received >= 0 && received <= 100;
    return {
      pass,
      message: () => `Expected ${received} to be between 0 and 100`
    };
  },
  
  toBeValidROI(received: number) {
    const pass = !isNaN(received) && isFinite(received);
    return {
      pass,
      message: () => `Expected ${received} to be a valid ROI (not NaN or Infinity)`
    };
  },
  
  toMatchEngagementPattern(received: EngagementDataPoint[], expected: 'stable' | 'volatile') {
    const rates = received.map(d => d.engagementRate);
    const stddev = calculateStandardDeviation(rates);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const cv = (stddev / mean) * 100;
    
    const pass = expected === 'stable' ? cv < 15 : cv >= 15;
    return {
      pass,
      message: () => `Expected engagement to be ${expected} (CV: ${cv.toFixed(2)}%)`
    };
  }
});

// TypeScript declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPercentage(): R;
      toBeValidROI(): R;
      toMatchEngagementPattern(expected: 'stable' | 'volatile'): R;
    }
  }
}
```

---

## Test Suite Templates

### Template: Basic Utility Test

```typescript
import { calculateMetricName } from '@/lib/utils/media/moduleName';

describe('calculateMetricName', () => {
  describe('Happy Path', () => {
    it('should calculate metric correctly', () => {
      const result = calculateMetricName(validInput);
      expect(result).toBe(expectedOutput);
    });
    
    it('should handle typical ranges', () => {
      const inputs = [10, 100, 1000, 10000];
      inputs.forEach(input => {
        const result = calculateMetricName(input);
        expect(result).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero denominator', () => {
      expect(() => calculateMetricName(0)).toThrow();
    });
    
    it('should handle negative values', () => {
      const result = calculateMetricName(-10);
      expect(result).toBeLessThan(0);
    });
    
    it('should handle empty array', () => {
      expect(() => calculateMetricName([])).toThrow();
    });
  });
  
  describe('Determinism', () => {
    it('should be deterministic with seed', () => {
      const result1 = calculateMetricName(input, seed);
      const result2 = calculateMetricName(input, seed);
      expect(result1).toEqual(result2);
    });
  });
  
  describe('Validation', () => {
    it('should validate input types', () => {
      expect(() => calculateMetricName(null)).toThrow(TypeError);
      expect(() => calculateMetricName(undefined)).toThrow(TypeError);
      expect(() => calculateMetricName('invalid')).toThrow(TypeError);
    });
  });
});
```

### Template: Forecasting Utility Test

```typescript
import { calculateForecast } from '@/lib/utils/media/analytics';
import { generateChurnData } from './__helpers__/fixtures';

describe('calculateForecast', () => {
  describe('Trend Detection', () => {
    it('should detect increasing trend', () => {
      const data = generateChurnData(12, 5.0, 'increasing');
      const result = calculateForecast(data, 6);
      expect(result.trend).toBe('increasing');
      expect(result.forecast[5]).toBeGreaterThan(result.forecast[0]);
    });
    
    it('should detect stable trend', () => {
      const data = generateChurnData(12, 5.0, 'stable');
      const result = calculateForecast(data, 6);
      expect(result.trend).toBe('stable');
    });
  });
  
  describe('Confidence Intervals', () => {
    it('should provide confidence bounds', () => {
      const data = generateChurnData(12, 5.0);
      const result = calculateForecast(data, 6, 0.95);
      
      result.forecast.forEach((forecast, i) => {
        expect(result.lowerBound[i]).toBeLessThan(forecast);
        expect(result.upperBound[i]).toBeGreaterThan(forecast);
      });
    });
    
    it('should widen bounds with lower confidence', () => {
      const data = generateChurnData(12, 5.0);
      const result80 = calculateForecast(data, 6, 0.80);
      const result95 = calculateForecast(data, 6, 0.95);
      
      const range80 = result80.upperBound[0] - result80.lowerBound[0];
      const range95 = result95.upperBound[0] - result95.lowerBound[0];
      expect(range95).toBeGreaterThan(range80);
    });
  });
});
```

---

## Mocking Strategy

### External Dependencies

```typescript
// Mock database models
jest.mock('@/lib/db/models/media/Platform', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn()
}));

// Mock expensive calculations
jest.mock('@/lib/utils/media/expensive', () => ({
  complexCalculation: jest.fn(() => 42) // Fast mock
}));
```

### Avoid Over-Mocking

**DO NOT mock:**
- Pure utility functions (test actual implementation)
- Simple calculations
- Domain logic

**DO mock:**
- Database queries
- External API calls
- File system operations
- Time-dependent functions (Date.now())

---

## Continuous Integration Requirements

### Pre-Commit Checks

```bash
# Run all tests
npm test

# Check coverage threshold
npm test -- --coverage --coverageThreshold='{"global":{"lines":85}}'

# Run only changed files
npm test -- --onlyChanged
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
test:
  steps:
    - name: Run tests
      run: npm test -- --coverage --ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
    
    - name: Enforce coverage
      run: |
        if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 85 ]; then
          echo "Coverage below 85%"
          exit 1
        fi
```

---

## Test Execution Plan

### Phase 1: Existing Utilities (Week 1)

- [ ] advertising.test.ts (calculateROAS, calculateCTR, calculateCPA, calculateCPM)
- [ ] audience.test.ts (calculateAudienceGrowth, calculateRetention, calculateDemographics)
- [ ] content.test.ts (calculateEngagementRate, calculateVirality, calculateContentQuality)
- [ ] platform.test.ts (calculatePlatformAnalytics, calculateAlgorithmScore)
- [ ] monetization.test.ts (calculateMonetizationPotential, calculateSubscriptionMetrics)

### Phase 2: New Utilities (Week 2)

- [ ] crossPlatform.test.ts (normalizeCrossPlatformMetrics)
- [ ] analytics.test.ts (calculateEngagementVolatility, calculateChurnForecast, calculateContentAging)

### Phase 3: Enhanced Utilities (Week 3)

- [ ] Advanced tests for calculateInfluencerROI (multi-touch attribution)
- [ ] Advanced tests for calculateCohortRetention (time-windowed cohorts)
- [ ] Advanced tests for calculateAdvancedVirality (viral loops)

---

## Success Criteria

✅ **All tests pass** in CI/CD pipeline  
✅ **Coverage ≥85%** overall, ≥95% for critical utilities  
✅ **Zero flaky tests** (deterministic behavior verified)  
✅ **Performance benchmarks met** (<100ms for standard datasets)  
✅ **All edge cases covered** (zero division, null, empty, negative, overflow)  
✅ **Integration tests pass** (utility composition works correctly)  

---

**Footer:** Generated under ECHO v1.3.0 (GUARDIAN active). Test strategy ensures comprehensive coverage, deterministic behavior, and production readiness. Ready for test-driven implementation.
