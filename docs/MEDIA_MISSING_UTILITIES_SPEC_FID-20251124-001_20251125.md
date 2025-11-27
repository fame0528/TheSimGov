# Media Missing Utility Specifications

**FID:** FID-20251124-001  
**Date:** 2025-11-25  
**Purpose:** Define precise function signatures and deterministic behavior for all missing/partial media utility functions, ensuring DRY compliance, composability, and test-driven implementation.

---

## Missing Utilities (Priority Implementation)

### 1. normalizeCrossPlatformMetrics

**Purpose:** Normalize metrics across different platform types for fair comparison

**Status:** Missing  
**Priority:** HIGH  
**Complexity:** Medium

```typescript
/**
 * Normalize cross-platform metrics for fair comparison
 * 
 * Different platforms have different scales (YouTube millions vs Instagram thousands).
 * This utility normalizes metrics to a 0-100 scale per platform type.
 * 
 * @param metric - The raw metric value to normalize
 * @param metricType - Type of metric (followers, engagement, revenue, etc.)
 * @param platformType - Platform type for context-specific normalization
 * @param seed - Optional seed for deterministic random components (default: 0)
 * @returns Normalized score (0-100)
 * 
 * @example
 * normalizeCrossPlatformMetrics(500000, 'followers', 'YouTube') // 75.2
 * normalizeCrossPlatformMetrics(50000, 'followers', 'Instagram') // 68.5
 */
export function normalizeCrossPlatformMetrics(
  metric: number,
  metricType: 'followers' | 'engagement' | 'revenue' | 'reach' | 'cpm',
  platformType: PlatformType,
  seed: number = 0
): number;
```

**Algorithm:**
- Define platform-specific scale ranges per metric type
- Apply logarithmic scaling for large-number metrics (followers, reach)
- Apply linear scaling for percentage metrics (engagement, retention)
- Clamp output to 0-100 range
- Use seed for any random variance (e.g., confidence intervals)

**Constants (mediaConstants.ts):**
```typescript
export const PLATFORM_SCALE_RANGES = {
  YouTube: { followers: [1000, 10000000], engagement: [0.5, 15] },
  Instagram: { followers: [500, 5000000], engagement: [1, 25] },
  TikTok: { followers: [1000, 50000000], engagement: [3, 50] },
  // ... other platforms
};
```

---

### 2. calculateEngagementVolatility

**Purpose:** Calculate engagement volatility/stability for risk assessment

**Status:** Missing  
**Priority:** HIGH  
**Complexity:** Medium

```typescript
/**
 * Calculate engagement volatility over time
 * 
 * Measures standard deviation and coefficient of variation
 * to assess engagement stability/predictability.
 * 
 * @param engagementHistory - Array of historical engagement data points
 * @param windowSize - Number of data points to analyze (default: 30)
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Volatility score object
 * 
 * @example
 * calculateEngagementVolatility([
 *   { date: '2025-01-01', engagementRate: 5.2 },
 *   { date: '2025-01-02', engagementRate: 5.8 },
 *   // ...
 * ]) 
 * // { volatility: 12.5, trend: 'stable', riskLevel: 'low' }
 */
export function calculateEngagementVolatility(
  engagementHistory: EngagementDataPoint[],
  windowSize: number = 30,
  seed: number = 0
): {
  volatility: number; // 0-100, higher = more volatile
  standardDeviation: number;
  coefficientOfVariation: number;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
};
```

**Algorithm:**
- Calculate mean engagement rate over window
- Calculate standard deviation
- Calculate coefficient of variation (stddev / mean * 100)
- Volatility score = CV * trend modifier
- Trend: Linear regression slope over window
- Risk level: Low (<15%), Medium (15-30%), High (>30%)

---

### 3. calculateCohortRetention (Enhanced)

**Purpose:** Calculate cohort-based retention with time windows

**Status:** Partial (basic version exists)  
**Priority:** HIGH  
**Complexity:** High

```typescript
/**
 * Calculate cohort-based retention metrics
 * 
 * Enhanced version with time-windowed cohort analysis.
 * Tracks retention by acquisition cohort over time.
 * 
 * @param cohorts - Array of cohort data with acquisition date and retention
 * @param timeWindow - Analysis window in days (7, 30, 90, 365)
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Cohort retention analysis
 * 
 * @example
 * calculateCohortRetention([
 *   { acquisitionDate: '2025-01-01', initialSize: 1000, retained: [950, 900, 850] },
 *   // ...
 * ], 30)
 * // { retentionCurve: [...], churnRate: 15.2, ltv: 45.8 }
 */
export function calculateCohortRetention(
  cohorts: CohortData[],
  timeWindow: 7 | 30 | 90 | 365,
  seed: number = 0
): {
  retentionCurve: number[]; // Retention % at each time interval
  churnRate: number; // Average churn rate across cohorts
  lifetimeValue: number; // Predicted LTV based on retention
  cohortPerformance: CohortPerformance[];
};

interface CohortData {
  acquisitionDate: string;
  initialSize: number;
  retained: number[]; // Retained count at each interval
  revenue?: number[];
}

interface CohortPerformance {
  cohort: string;
  retentionRate: number;
  churnRate: number;
  ltv: number;
}
```

**Algorithm:**
- Group followers by acquisition date (cohort)
- Track retention at intervals (day 1, 7, 30, 90)
- Calculate average retention curve across cohorts
- Compute churn rate: (lost / starting) per interval
- Predict LTV: sum of revenue over retention curve

---

### 4. calculateChurnForecast

**Purpose:** Forecast future churn using historical patterns

**Status:** Missing  
**Priority:** HIGH  
**Complexity:** High

```typescript
/**
 * Forecast churn rate for upcoming periods
 * 
 * Uses historical churn data to predict future churn
 * with confidence intervals.
 * 
 * @param churnHistory - Historical churn data points
 * @param forecastMonths - Number of months to forecast (1-12)
 * @param confidenceLevel - Confidence level for prediction (0.8, 0.9, 0.95)
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Churn forecast with confidence intervals
 * 
 * @example
 * calculateChurnForecast([
 *   { month: '2025-01', churnRate: 5.2, subscribers: 10000 },
 *   // ...
 * ], 6, 0.95)
 * // { forecast: [5.8, 6.1, 6.3, ...], upper: [...], lower: [...] }
 */
export function calculateChurnForecast(
  churnHistory: ChurnDataPoint[],
  forecastMonths: number,
  confidenceLevel: number = 0.95,
  seed: number = 0
): {
  forecast: number[]; // Predicted churn rates
  upperBound: number[]; // Upper confidence bound
  lowerBound: number[]; // Lower confidence bound
  trend: 'increasing' | 'decreasing' | 'stable';
  riskScore: number; // 0-100
};

interface ChurnDataPoint {
  month: string;
  churnRate: number;
  subscribers: number;
  revenue?: number;
}
```

**Algorithm:**
- Apply exponential smoothing to historical churn
- Calculate trend component (linear regression)
- Calculate seasonal component (if > 12 months data)
- Generate forecast with trend + seasonal
- Compute confidence intervals using historical variance
- Risk score: weighted by churn trend and magnitude

---

### 5. calculateContentAging

**Purpose:** Calculate content decay/aging metrics over time

**Status:** Missing  
**Priority:** MEDIUM  
**Complexity:** Medium

```typescript
/**
 * Calculate content aging and decay metrics
 * 
 * Models engagement decay over time since publication
 * to predict content "shelf life".
 * 
 * @param content - Content with performance history
 * @param decayModel - Decay model type ('exponential' | 'linear' | 'logarithmic')
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Content aging metrics
 * 
 * @example
 * calculateContentAging({
 *   publishedDate: '2025-01-01',
 *   performanceHistory: [...]
 * }, 'exponential')
 * // { halfLife: 14, decayRate: 0.05, projectedShelfLife: 90 }
 */
export function calculateContentAging(
  content: {
    publishedDate: Date;
    performanceHistory: PerformanceSnapshot[];
  },
  decayModel: 'exponential' | 'linear' | 'logarithmic' = 'exponential',
  seed: number = 0
): {
  halfLife: number; // Days until 50% engagement
  decayRate: number; // Daily decay percentage
  currentAge: number; // Days since publication
  projectedShelfLife: number; // Days until 10% engagement
  revitalizationPotential: number; // 0-100 score for refresh potential
};
```

**Algorithm:**
- Fit decay curve to performance history
- Exponential: engagement = initial * e^(-decayRate * t)
- Calculate half-life: t where engagement = 50% initial
- Shelf life: t where engagement = 10% initial
- Revitalization potential: Based on topic evergreen-ness + current engagement floor

---

### 6. calculateAlgorithmAdaptationScore

**Purpose:** Score platform algorithm adaptation/optimization

**Status:** Missing (New/Improvement)  
**Priority:** MEDIUM  
**Complexity:** High

```typescript
/**
 * Calculate algorithm adaptation score
 * 
 * Measures how well content aligns with platform algorithm
 * preferences (posting time, format, length, engagement patterns).
 * 
 * @param platform - Platform optimization settings
 * @param content - Content performance data
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Algorithm adaptation metrics
 * 
 * @example
 * calculateAlgorithmAdaptationScore({
 *   algorithmScore: 75,
 *   preferredContentLength: 300,
 *   preferredPostingTimes: ['18:00', '20:00']
 * }, {
 *   length: 280,
 *   postedAt: '19:30',
 *   engagement: { ... }
 * })
 * // { adaptationScore: 82, recommendations: [...] }
 */
export function calculateAlgorithmAdaptationScore(
  platform: {
    algorithmScore: number;
    preferredContentLength: number;
    preferredPostingTimes: string[];
    trendingTopics: string[];
    contentFormatPreferences: Record<string, number>;
  },
  content: {
    length: number;
    postedAt: string;
    format: string;
    tags: string[];
    engagement: ContentMetrics;
  },
  seed: number = 0
): {
  adaptationScore: number; // 0-100
  lengthAlignment: number; // % match to preferred length
  timingAlignment: number; // % match to optimal posting times
  formatAlignment: number; // % match to preferred formats
  topicAlignment: number; // % match to trending topics
  recommendations: string[]; // Actionable improvements
};
```

**Algorithm:**
- Length alignment: Gaussian curve centered on preferred length
- Timing alignment: Distance from nearest preferred time
- Format alignment: Weighted by platform preferences
- Topic alignment: Jaccard similarity with trending topics
- Overall score: Weighted average of alignments
- Recommendations: Generated from lowest-scoring dimensions

---

### 7. calculateMonetizationRisk

**Purpose:** Calculate monetization volatility and risk

**Status:** Missing (New/Improvement)  
**Priority:** MEDIUM  
**Complexity:** Medium

```typescript
/**
 * Calculate monetization risk score
 * 
 * Assesses revenue volatility, dependency concentration,
 * and sustainability of monetization strategy.
 * 
 * @param monetizationData - Historical revenue and strategy data
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Monetization risk assessment
 * 
 * @example
 * calculateMonetizationRisk({
 *   revenueHistory: [...],
 *   revenueStreams: { ads: 0.8, subscriptions: 0.15, affiliate: 0.05 }
 * })
 * // { riskScore: 65, diversification: 35, volatility: 22 }
 */
export function calculateMonetizationRisk(
  monetizationData: {
    revenueHistory: RevenueDataPoint[];
    revenueStreams: Record<string, number>; // Stream → % of total
    cpmHistory?: number[];
    subscriberChurn?: number;
  },
  seed: number = 0
): {
  riskScore: number; // 0-100, higher = riskier
  diversificationScore: number; // 0-100, higher = more diverse
  volatilityScore: number; // 0-100
  concentrationRisk: number; // 0-100
  sustainabilityScore: number; // 0-100
  recommendations: string[];
};

interface RevenueDataPoint {
  date: string;
  totalRevenue: number;
  revenueByStream: Record<string, number>;
}
```

**Algorithm:**
- Revenue volatility: CV of revenue over time
- Diversification: Herfindahl-Hirschman Index (HHI) of revenue streams
- Concentration risk: % from single largest stream
- Sustainability: Trend + churn + growth stability
- Risk score: Weighted combination of factors
- Recommendations: Based on highest risk factors

---

### 8. calculateInfluencerROI (Enhanced)

**Purpose:** Enhanced multi-touch attribution influencer ROI

**Status:** Partial (basic version exists)  
**Priority:** HIGH  
**Complexity:** High

```typescript
/**
 * Calculate comprehensive influencer ROI with attribution
 * 
 * Enhanced version with multi-touch attribution, lifetime value,
 * and cost-per-acquisition tracking.
 * 
 * @param deal - Influencer deal data
 * @param attributionModel - Attribution model ('lastTouch' | 'firstTouch' | 'linear' | 'timeDecay')
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Comprehensive ROI analysis
 * 
 * @example
 * calculateInfluencerROI({
 *   compensation: 5000,
 *   totalImpressions: 500000,
 *   totalConversions: 250,
 *   conversionValue: 50
 * }, 'timeDecay')
 * // { roi: 150, attributedRevenue: 12500, cpa: 20, ... }
 */
export function calculateInfluencerROI(
  deal: {
    compensation: number;
    totalImpressions: number;
    totalEngagement: number;
    totalConversions: number;
    conversionValue?: number;
    attributionData?: AttributionTouchpoint[];
  },
  attributionModel: 'lastTouch' | 'firstTouch' | 'linear' | 'timeDecay' = 'linear',
  seed: number = 0
): {
  roi: number; // Percentage
  attributedRevenue: number;
  costPerAcquisition: number;
  costPerImpression: number;
  costPerEngagement: number;
  engagementROI: number;
  lifetimeValueROI: number;
  paybackPeriod: number; // Days
};

interface AttributionTouchpoint {
  source: string;
  timestamp: Date;
  conversionValue: number;
}
```

**Algorithm:**
- Apply attribution model to conversion touchpoints
- Last-touch: 100% credit to last influencer interaction
- First-touch: 100% credit to first influencer interaction
- Linear: Equal credit across all touchpoints
- Time-decay: Exponentially weighted by recency
- Calculate attributed revenue
- ROI = (attributed revenue - cost) / cost * 100
- Payback period: Days until cumulative revenue > cost

---

### 9. calculateAdvancedVirality (Enhanced)

**Purpose:** Advanced virality coefficient with viral loops

**Status:** Partial (basic version exists)  
**Priority:** MEDIUM  
**Complexity:** High

```typescript
/**
 * Calculate advanced virality metrics with viral loop tracking
 * 
 * Enhanced version tracking K-factor, viral loop cycles,
 * and compound growth potential.
 * 
 * @param content - Content with sharing and reach data
 * @param loopDepth - Number of viral loop cycles to model (default: 5)
 * @param seed - Optional seed for deterministic calculations (default: 0)
 * @returns Advanced virality analysis
 * 
 * @example
 * calculateAdvancedVirality({
 *   initialReach: 10000,
 *   shares: 1200,
 *   sharesPerView: 0.12,
 *   viewsPerShare: 8.5
 * }, 5)
 * // { kFactor: 1.02, viralGrowth: 'exponential', projectedReach: 50000 }
 */
export function calculateAdvancedVirality(
  content: {
    initialReach: number;
    shares: number;
    sharesPerView: number;
    viewsPerShare: number;
    uniqueSharers?: number;
  },
  loopDepth: number = 5,
  seed: number = 0
): {
  kFactor: number; // Viral coefficient (>1 = viral)
  viralGrowth: 'exponential' | 'linear' | 'declining';
  projectedReach: number; // After all viral loops
  viralLoopCycles: ViralLoopCycle[];
  timeToViralPeak: number; // Days
  sustainabilityScore: number; // 0-100
};

interface ViralLoopCycle {
  cycle: number;
  reach: number;
  shares: number;
  kFactor: number;
}
```

**Algorithm:**
- K-factor = sharesPerView * viewsPerShare
- Model viral loops: reach[n+1] = reach[n] * kFactor
- Continue for loopDepth cycles or until k-factor < 0.1
- Viral growth type: Exponential (k>1), Linear (k≈1), Declining (k<1)
- Time to peak: Estimate based on historical viral content patterns
- Sustainability: Based on k-factor stability and decay rate

---

## Utility Function Best Practices

### Deterministic Behavior

All utilities MUST:
1. Accept optional `seed` parameter for deterministic random behavior
2. Return consistent results for same inputs + seed
3. Document all random components in JSDoc
4. Use seeded PRNG when randomness needed

**Example Seeded Random:**
```typescript
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
```

### Error Handling

All utilities MUST:
1. Validate inputs and throw TypeError for invalid types
2. Handle edge cases (zero division, negative values, empty arrays)
3. Return sensible defaults for missing optional parameters
4. Document all possible errors in JSDoc

**Example:**
```typescript
if (denominator === 0) {
  throw new Error('Division by zero: denominator cannot be zero');
}
if (values.length === 0) {
  return { mean: 0, stddev: 0 }; // Sensible default
}
```

### DRY Composition

Utilities SHOULD:
1. Compose from smaller, reusable functions
2. Extract common patterns into helper functions
3. Share constants via `mediaConstants.ts`
4. Avoid duplicating logic across utilities

**Example:**
```typescript
// ❌ BAD: Duplicated logic
export function calculateROI1(revenue, cost) {
  return (revenue - cost) / cost * 100;
}
export function calculateROAS(revenue, spend) {
  return (revenue - spend) / spend * 100;
}

// ✅ GOOD: Shared logic
function calculateReturnPercentage(gain, cost) {
  if (cost === 0) return 0;
  return (gain - cost) / cost * 100;
}
export const calculateROI = calculateReturnPercentage;
export const calculateROAS = calculateReturnPercentage;
```

---

## Implementation Priority

**Phase 1 (Critical - Week 1):**
1. normalizeCrossPlatformMetrics
2. calculateEngagementVolatility
3. calculateCohortRetention (enhanced)
4. calculateInfluencerROI (enhanced)

**Phase 2 (High Priority - Week 2):**
5. calculateChurnForecast
6. calculateContentAging
7. calculateMonetizationRisk

**Phase 3 (Enhancements - Week 3):**
8. calculateAlgorithmAdaptationScore
9. calculateAdvancedVirality

---

## Testing Requirements

Each utility MUST have:
1. **Edge case tests:** Zero, negative, empty, null, undefined inputs
2. **Determinism tests:** Same seed → same output
3. **Boundary tests:** Min/max values, overflow/underflow
4. **Integration tests:** Composition with other utilities
5. **Performance tests:** Large datasets, time complexity verification

**Example Test Structure:**
```typescript
describe('calculateEngagementVolatility', () => {
  it('should handle empty history', () => {
    expect(() => calculateEngagementVolatility([])).toThrow();
  });
  
  it('should be deterministic with seed', () => {
    const result1 = calculateEngagementVolatility(data, 30, 42);
    const result2 = calculateEngagementVolatility(data, 30, 42);
    expect(result1).toEqual(result2);
  });
  
  it('should calculate stable trend for consistent data', () => {
    const stableData = Array(30).fill({ engagementRate: 5.0 });
    const result = calculateEngagementVolatility(stableData);
    expect(result.trend).toBe('stable');
    expect(result.volatility).toBeLessThan(5);
  });
});
```

---

**Footer:** Generated under ECHO v1.3.0 (GUARDIAN active). All utility specs follow deterministic, DRY, and composable design. Ready for test-driven implementation.
