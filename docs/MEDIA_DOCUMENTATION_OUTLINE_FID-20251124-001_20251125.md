# Media Utilities Guide - Documentation Outline

**FID:** FID-20251124-001  
**Date:** 2025-11-25  
**Purpose:** Define structure and content for comprehensive `/docs/MEDIA_UTILITIES_GUIDE.md` covering all media utility functions, formulas, determinism, error contracts, and extension patterns.

---

## Document Structure

### 1. Overview & Introduction

**Content:**
- Purpose of media utilities library
- Architectural principles (utility-first, DRY, deterministic)
- Key features and capabilities
- Quick start guide
- Prerequisites and dependencies

**Example:**
```markdown
# Media Utilities Guide

## Overview

The Media Utilities library provides a comprehensive suite of deterministic, composable functions for media analytics, performance tracking, and optimization. Built on ECHO v1.3.0 principles, all utilities are:

- **Deterministic:** Same inputs (+ seed) produce identical outputs
- **DRY-Compliant:** Zero duplication, maximum reuse
- **Composable:** Functions work together seamlessly
- **Type-Safe:** Full TypeScript support with strict types
- **Tested:** >85% code coverage with comprehensive edge case handling

## Quick Start

\`\`\`typescript
import {
  calculateEngagementRate,
  calculateROAS,
  calculateAudienceGrowthRate
} from '@/lib/utils/media';

const metrics = {
  views: 10000,
  likes: 500,
  shares: 100,
  comments: 50,
  watchTime: 3000
};

const engagementRate = calculateEngagementRate(metrics);
// => 6.5 (%)
\`\`\`
```

---

### 2. Core Concepts

**Content:**
- Deterministic calculations and seeding
- Metric categories and classifications
- Input/output type contracts
- Error handling patterns
- Performance considerations

**Sections:**

#### 2.1 Deterministic Behavior

```markdown
## Deterministic Behavior

All utilities accept an optional `seed` parameter to ensure reproducible results:

\`\`\`typescript
const result1 = calculateChurnForecast(data, 6, 0.95, 42);
const result2 = calculateChurnForecast(data, 6, 0.95, 42);
// result1 === result2 (guaranteed)

const result3 = calculateChurnForecast(data, 6, 0.95, 99);
// result3 !== result1 (different seed)
\`\`\`

**When to use seeds:**
- Unit testing (ensure consistent test results)
- Debugging (reproduce exact calculations)
- A/B testing (consistent cohort assignment)
- Production (default seed=0 ensures consistency)
```

#### 2.2 Metric Categories

```markdown
## Metric Categories

### Engagement Metrics
- Engagement Rate
- Viral Coefficient
- Content Quality Score
- Engagement Efficiency

### Audience Metrics
- Growth Rate
- Retention Rate
- Churn Rate
- Lifetime Value

### Monetization Metrics
- ROI / ROAS
- CPM / CPC / CPA
- Monetization Potential
- Revenue Forecasting

### Platform Metrics
- Cross-Platform Normalization
- Algorithm Adaptation Score
- Platform Health Score

### Forecasting Metrics
- Churn Forecast
- Growth Projection
- Content Aging
- Engagement Volatility
```

---

### 3. Function Reference

**Content:**
- Complete API documentation for every utility
- Parameters, return types, examples
- Related functions and composition patterns
- Common use cases

**Template for each function:**

```markdown
### calculateEngagementRate

Calculate engagement rate from content metrics.

**Signature:**
\`\`\`typescript
function calculateEngagementRate(
  metrics: ContentMetrics,
  seed?: number
): number
\`\`\`

**Parameters:**
- `metrics` (ContentMetrics): Content performance metrics
  - `views` (number): Total views
  - `likes` (number): Total likes
  - `shares` (number): Total shares
  - `comments` (number): Total comments
  - `watchTime` (number): Total watch time in seconds
- `seed` (number, optional): Random seed for determinism (default: 0)

**Returns:**
- `number`: Engagement rate as percentage (0-100)

**Formula:**
\`\`\`
engagementRate = (likes + shares + comments) / views * 100
\`\`\`

**Examples:**
\`\`\`typescript
// Basic usage
const metrics = {
  views: 10000,
  likes: 500,
  shares: 100,
  comments: 50,
  watchTime: 3000
};
const rate = calculateEngagementRate(metrics);
// => 6.5

// With custom seed
const rate2 = calculateEngagementRate(metrics, 42);
// => 6.5 (deterministic)
\`\`\`

**Edge Cases:**
- Zero views: Returns 0
- Negative values: Throws TypeError
- Null/undefined: Throws TypeError

**Related Functions:**
- calculateViralCoefficient
- calculateContentQualityScore
- calculateEngagementEfficiency

**Use Cases:**
- Content performance dashboards
- A/B testing content variants
- Platform comparison analytics
```

---

### 4. Mathematical Formulas

**Content:**
- Detailed mathematical explanations
- Formula derivations
- Algorithm descriptions
- Complexity analysis

**Example:**

```markdown
## Mathematical Formulas

### Engagement Rate

**Basic Formula:**
\`\`\`
EngagementRate = (Σ Interactions / Views) × 100

where:
  Interactions = Likes + Shares + Comments + Saves
  Views = Total content views
\`\`\`

**Weighted Formula (Advanced):**
\`\`\`
EngagementRate = (w₁·Likes + w₂·Shares + w₃·Comments + w₄·Saves) / Views × 100

Default weights:
  w₁ (likes) = 0.4
  w₂ (shares) = 0.3
  w₃ (comments) = 0.2
  w₄ (saves) = 0.1
\`\`\`

**Complexity:** O(1)

---

### Viral Coefficient (K-Factor)

**Formula:**
\`\`\`
K = (Shares / Views) × (ViewsPerShare)

where:
  Shares/Views = Share rate
  ViewsPerShare = Average views generated per share
\`\`\`

**Interpretation:**
- K > 1: Exponential viral growth
- K = 1: Linear growth (break-even)
- K < 1: Declining reach (non-viral)

**Example Calculation:**
\`\`\`
Content with:
  Views = 10,000
  Shares = 1,200
  ViewsPerShare = 8.5

K = (1,200 / 10,000) × 8.5
  = 0.12 × 8.5
  = 1.02

Result: Slightly viral (K > 1)
\`\`\`

---

### Churn Rate

**Formula:**
\`\`\`
ChurnRate = (Lost / Starting) × 100

where:
  Lost = Followers lost during period
  Starting = Followers at period start
\`\`\`

**Annualized Churn:**
\`\`\`
AnnualChurn = 1 - (1 - MonthlyChurn)^12
\`\`\`

**Complexity:** O(1)
```

---

### 5. Error Handling & Validation

**Content:**
- Error types and codes
- Input validation rules
- Error recovery strategies
- Best practices

```markdown
## Error Handling

### Error Types

#### TypeError
Thrown when invalid input types provided:
\`\`\`typescript
calculateEngagementRate(null); // TypeError
calculateEngagementRate({ views: "100" }); // TypeError
\`\`\`

#### RangeError
Thrown when values out of valid range:
\`\`\`typescript
normalizeCrossPlatformMetrics(-100, 'followers', 'YouTube');
// RangeError: metric must be >= 0
\`\`\`

#### DivisionByZeroError
Thrown when denominator is zero:
\`\`\`typescript
calculateROI(100, 0); // DivisionByZeroError
\`\`\`

### Input Validation

All utilities validate inputs before calculation:

\`\`\`typescript
function validateContentMetrics(metrics: ContentMetrics): void {
  if (!metrics || typeof metrics !== 'object') {
    throw new TypeError('metrics must be an object');
  }
  if (typeof metrics.views !== 'number' || metrics.views < 0) {
    throw new TypeError('views must be a non-negative number');
  }
  // ... additional validations
}
\`\`\`

### Error Recovery

**Graceful Defaults:**
- Empty arrays → Return zero/empty result
- Missing optional params → Use sensible defaults
- Null optional fields → Treat as zero

**Example:**
\`\`\`typescript
// Graceful handling of missing optional fields
calculateMonetizationPotential({
  views: 10000,
  uniqueViewers: 8000,
  shares: 100,
  comments: 50,
  likes: 500,
  watchTime: 3000,
  completionRate: 0.75
  // saves: undefined → treated as 0
}, 5.0, 1.0);
\`\`\`
```

---

### 6. Extension Patterns

**Content:**
- How to create new utilities
- Composing existing utilities
- Custom metric implementations
- Plugin architecture

```markdown
## Extension Patterns

### Creating New Utilities

**Pattern: Pure Function**
\`\`\`typescript
/**
 * Calculate custom metric
 * @param input - Input data
 * @param seed - Random seed for determinism
 */
export function calculateCustomMetric(
  input: CustomInput,
  seed: number = 0
): number {
  // 1. Validate inputs
  validateInput(input);
  
  // 2. Perform calculation
  const result = performCalculation(input, seed);
  
  // 3. Validate output
  if (isNaN(result) || !isFinite(result)) {
    throw new Error('Invalid calculation result');
  }
  
  // 4. Return result
  return result;
}
\`\`\`

### Composing Utilities

**Pattern: Higher-Order Composition**
\`\`\`typescript
// Compose multiple metrics into analytics dashboard
export function calculateContentAnalytics(
  content: MediaContent
): ContentAnalytics {
  const engagement = calculateEngagementRate(content.engagementMetrics);
  const virality = calculateViralCoefficient(
    content.engagementMetrics.shares,
    content.engagementMetrics.views
  );
  const quality = calculateContentQualityScore(
    content.engagementMetrics,
    content.qualityMetrics
  );
  const monetization = calculateMonetizationPotential(
    content.engagementMetrics,
    content.cpm || 5.0,
    1.0
  );
  
  return {
    engagement,
    virality,
    quality,
    monetization,
    overallScore: (engagement + virality + quality) / 3
  };
}
\`\`\`

### Custom Metric Implementation

**Step 1: Define Type**
\`\`\`typescript
// types/media.ts
export interface CustomMetricInput {
  value1: number;
  value2: number;
  options?: CustomOptions;
}
\`\`\`

**Step 2: Implement Function**
\`\`\`typescript
// utils/media/custom.ts
export function calculateCustomMetric(
  input: CustomMetricInput,
  seed: number = 0
): number {
  // Implementation
}
\`\`\`

**Step 3: Add Tests**
\`\`\`typescript
// tests/media/custom.test.ts
describe('calculateCustomMetric', () => {
  it('should calculate correctly', () => {
    // Tests
  });
});
\`\`\`

**Step 4: Export**
\`\`\`typescript
// utils/media/index.ts
export { calculateCustomMetric } from './custom';
\`\`\`
```

---

### 7. Performance Optimization

**Content:**
- Caching strategies
- Memoization patterns
- Batch processing
- Performance benchmarks

```markdown
## Performance Optimization

### Caching Expensive Calculations

\`\`\`typescript
import memoize from 'lodash/memoize';

// Memoize expensive volatility calculations
export const calculateEngagementVolatilityCached = memoize(
  calculateEngagementVolatility,
  // Custom cache key
  (data, windowSize, seed) => `${JSON.stringify(data)}-${windowSize}-${seed}`
);
\`\`\`

### Batch Processing

\`\`\`typescript
// Process multiple content pieces efficiently
export function batchCalculateEngagement(
  contentArray: MediaContent[]
): number[] {
  return contentArray.map(content =>
    calculateEngagementRate(content.engagementMetrics)
  );
}
\`\`\`

### Performance Benchmarks

| Function | Input Size | Time (ms) | Memory (MB) |
|----------|-----------|-----------|-------------|
| calculateEngagementRate | 1 item | <1 | <0.1 |
| calculateEngagementVolatility | 30 days | <5 | <1 |
| calculateChurnForecast | 12 months | <10 | <2 |
| normalizeCrossPlatformMetrics | 1 item | <1 | <0.1 |
| calculateAdvancedVirality | 5 loops | <15 | <3 |

**Optimization Tips:**
- Pre-compute frequently used metrics
- Cache results for repeated calculations
- Use batch processing for multiple items
- Avoid unnecessary deep cloning
```

---

### 8. Migration & Upgrade Guide

**Content:**
- Upgrading from legacy implementations
- Breaking changes and deprecations
- Migration examples
- Compatibility notes

```markdown
## Migration Guide

### From Legacy Media Utilities

**Breaking Changes:**

1. **Function naming:** `calc*` → `calculate*`
   \`\`\`typescript
   // OLD
   import { calcEngagement } from './old/media';
   
   // NEW
   import { calculateEngagementRate } from '@/lib/utils/media';
   \`\`\`

2. **Return types:** All functions now return typed objects
   \`\`\`typescript
   // OLD
   const result = calculateMetric(data); // any
   
   // NEW
   const result = calculateMetric(data); // MetricResult (typed)
   \`\`\`

3. **Seed parameter:** Added for determinism
   \`\`\`typescript
   // OLD
   calculateMetric(data);
   
   // NEW
   calculateMetric(data, 0); // Explicit seed
   \`\`\`

### Migration Checklist

- [ ] Update all import statements
- [ ] Add seed parameters where needed
- [ ] Update return type annotations
- [ ] Run tests to verify behavior
- [ ] Update API routes using utilities
- [ ] Remove old utility files
```

---

### 9. Troubleshooting & FAQ

**Content:**
- Common errors and solutions
- Frequently asked questions
- Debug strategies
- Support resources

```markdown
## Troubleshooting

### Common Issues

#### "Division by zero" Error

**Cause:** Denominator is zero (e.g., zero views, zero cost)  
**Solution:** Validate inputs before calculation

\`\`\`typescript
if (views === 0) {
  return 0; // or throw error
}
const rate = calculateEngagementRate(metrics);
\`\`\`

#### Inconsistent Results Across Runs

**Cause:** Missing or different seed values  
**Solution:** Always provide explicit seed

\`\`\`typescript
// BAD: Implicit default seed (may vary)
const result = calculateMetric(data);

// GOOD: Explicit seed
const result = calculateMetric(data, 42);
\`\`\`

#### Performance Issues with Large Datasets

**Cause:** Processing too much data at once  
**Solution:** Use batch processing or caching

\`\`\`typescript
// Use memoization for repeated calculations
const cached = memoize(calculateMetric);
\`\`\`

### FAQ

**Q: Are utilities thread-safe?**  
A: Yes, all utilities are pure functions without side effects.

**Q: Can I use utilities on the frontend?**  
A: Yes, all utilities are isomorphic (work in Node.js and browser).

**Q: How do I contribute new utilities?**  
A: See Extension Patterns section and submit PR with tests.

**Q: What's the performance impact?**  
A: See Performance Benchmarks section for specific metrics.
```

---

### 10. Appendix

**Content:**
- Complete type definitions
- Constants reference
- Glossary of terms
- Bibliography and references

```markdown
## Appendix

### A. Type Definitions

Complete TypeScript interface reference for all utility inputs/outputs.

### B. Constants Reference

All constants used across utilities:

| Constant | Value | Purpose |
|----------|-------|---------|
| DEFAULT_CPM | 5.0 | Default cost per mille |
| MIN_ENGAGEMENT_RATE | 0 | Minimum engagement rate |
| MAX_ENGAGEMENT_RATE | 100 | Maximum engagement rate |
| VIRAL_THRESHOLD | 1.0 | K-factor threshold for virality |

### C. Glossary

- **CPM:** Cost Per Mille (thousand impressions)
- **CPC:** Cost Per Click
- **CPA:** Cost Per Acquisition
- **ROI:** Return On Investment
- **ROAS:** Return On Ad Spend
- **K-Factor:** Viral coefficient
- **LTV:** Lifetime Value
- **Churn:** Customer attrition rate

### D. References

- [Media Analytics Best Practices](https://example.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
```

---

## Documentation Standards

### Writing Style

- **Clear and concise:** Short paragraphs, active voice
- **Code-first:** Show examples before explanations
- **Comprehensive:** Cover all parameters, edge cases, related functions
- **Accessible:** Define technical terms, provide context

### Code Examples

- **Runnable:** All examples should be copy-pastable and work
- **Realistic:** Use real-world scenarios
- **Annotated:** Include comments explaining key points
- **Complete:** Show imports, types, and full context

### Formatting

- **Markdown:** Use proper headings, lists, code blocks
- **Syntax highlighting:** Specify language for code blocks
- **Tables:** Use for comparing options or listing data
- **Links:** Cross-reference related sections

---

## Maintenance Plan

### Update Triggers

- **New utility added:** Update function reference
- **Breaking change:** Update migration guide
- **Performance improvement:** Update benchmarks
- **Bug fix:** Update troubleshooting

### Review Cycle

- **Quarterly:** Full documentation review
- **Per release:** Update changelog and migration guide
- **Per PR:** Update relevant sections

---

**Footer:** Generated under ECHO v1.3.0 (GUARDIAN active). Documentation outline ensures comprehensive, maintainable, user-friendly guide for all media utilities. Ready for implementation.
