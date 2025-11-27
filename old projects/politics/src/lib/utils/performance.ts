/**
 * @fileoverview Performance Monitoring Utility
 * @module lib/utils/performance
 * @description Production-ready performance monitoring system for tracking
 * component render times, API response times, memory usage, and establishing
 * performance baselines. Integrates with logger for structured performance data.
 * 
 * @created 2025-11-17
 * @author ECHO v1.0.0
 */

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module provides:
 * - Component render time tracking (<16ms target for 60fps)
 * - API response time monitoring (<200ms target)
 * - Memory usage tracking and leak detection
 * - Performance baseline establishment
 * - Real-time performance alerts
 * - Performance metrics aggregation
 * 
 * Usage patterns:
 * - React components: usePerformanceMonitor hook
 * - API routes: measureApiPerformance wrapper
 * - Critical operations: performanceMonitor.measure()
 */

import logger from './logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  name: string;              // Operation/component name
  type: 'render' | 'api' | 'operation' | 'memory';
  duration?: number;         // Duration in milliseconds
  timestamp: number;         // Performance.now() timestamp
  metadata?: Record<string, unknown>;
}

/**
 * Performance baseline data
 */
export interface PerformanceBaseline {
  name: string;
  type: PerformanceMetric['type'];
  samples: number;
  avg: number;               // Average duration (ms)
  min: number;               // Minimum duration (ms)
  max: number;               // Maximum duration (ms)
  p50: number;               // 50th percentile (median)
  p95: number;               // 95th percentile
  p99: number;               // 99th percentile
  updatedAt: number;
}

/**
 * Memory snapshot
 */
export interface MemorySnapshot {
  usedJSHeapSize: number;    // Used memory in bytes
  totalJSHeapSize: number;   // Total allocated memory
  jsHeapSizeLimit: number;   // Memory limit
  timestamp: number;
  component?: string;
}

/**
 * Performance monitor configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
  renderThreshold: number;   // Warn if render > threshold (ms)
  apiThreshold: number;      // Warn if API call > threshold (ms)
  memoryThreshold: number;   // Warn if memory usage > threshold (MB)
  sampleSize: number;        // Number of samples for baseline
  reportingInterval: number; // Report aggregated metrics (ms)
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_BROWSER = typeof window !== 'undefined';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Default performance configuration
 * Stricter thresholds in development for debugging
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: IS_DEVELOPMENT || process.env.PERFORMANCE_MONITORING === 'true',
  renderThreshold: 16,      // 60fps = 16.67ms per frame
  apiThreshold: 200,        // 200ms API response time
  memoryThreshold: 100,     // 100MB memory increase
  sampleSize: 100,          // 100 samples for baseline
  reportingInterval: 60000, // Report every 60 seconds
};

let config: PerformanceConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// STORAGE
// ============================================================================

/**
 * In-memory storage for performance metrics
 * In production, would send to monitoring service
 */
const metrics: PerformanceMetric[] = [];
const baselines: Map<string, PerformanceBaseline> = new Map();
const memorySnapshots: MemorySnapshot[] = [];

// Maximum stored metrics to prevent memory leaks
const MAX_STORED_METRICS = 1000;
const MAX_MEMORY_SNAPSHOTS = 100;

// ============================================================================
// CORE MONITORING FUNCTIONS
// ============================================================================

/**
 * Record a performance metric
 * 
 * @param metric - Performance metric entry
 */
function recordMetric(metric: PerformanceMetric): void {
  if (!config.enabled) return;

  // Add to metrics storage
  metrics.push(metric);

  // Trim old metrics if exceeded limit
  if (metrics.length > MAX_STORED_METRICS) {
    metrics.splice(0, metrics.length - MAX_STORED_METRICS);
  }

  // Update baseline
  updateBaseline(metric);

  // Check thresholds and warn if exceeded
  checkThresholds(metric);
}

/**
 * Update baseline metrics with new sample
 * 
 * @param metric - New performance metric
 */
function updateBaseline(metric: PerformanceMetric): void {
  if (!metric.duration) return;

  const key = `${metric.type}:${metric.name}`;
  const existing = baselines.get(key);

  if (!existing) {
    // Create new baseline
    baselines.set(key, {
      name: metric.name,
      type: metric.type,
      samples: 1,
      avg: metric.duration,
      min: metric.duration,
      max: metric.duration,
      p50: metric.duration,
      p95: metric.duration,
      p99: metric.duration,
      updatedAt: Date.now(),
    });
    return;
  }

  // Get recent samples for percentile calculation
  const recentSamples = metrics
    .filter(m => m.type === metric.type && m.name === metric.name && m.duration)
    .map(m => m.duration!)
    .slice(-config.sampleSize);

  // Sort for percentile calculation
  const sorted = [...recentSamples].sort((a, b) => a - b);

  // Calculate percentiles
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  // Update baseline with exponential moving average
  const alpha = 0.1; // Smoothing factor
  const newAvg = alpha * metric.duration + (1 - alpha) * existing.avg;

  baselines.set(key, {
    name: metric.name,
    type: metric.type,
    samples: existing.samples + 1,
    avg: newAvg,
    min: Math.min(existing.min, metric.duration),
    max: Math.max(existing.max, metric.duration),
    p50: sorted[p50Index] || metric.duration,
    p95: sorted[p95Index] || metric.duration,
    p99: sorted[p99Index] || metric.duration,
    updatedAt: Date.now(),
  });
}

/**
 * Check performance thresholds and log warnings
 * 
 * @param metric - Performance metric to check
 */
function checkThresholds(metric: PerformanceMetric): void {
  if (!metric.duration) return;

  let threshold: number | undefined;
  let warningType: string | undefined;

  switch (metric.type) {
    case 'render':
      if (metric.duration > config.renderThreshold) {
        threshold = config.renderThreshold;
        warningType = 'Slow component render';
      }
      break;
    case 'api':
      if (metric.duration > config.apiThreshold) {
        threshold = config.apiThreshold;
        warningType = 'Slow API response';
      }
      break;
  }

  if (warningType && threshold) {
    logger.warn(warningType, {
      operation: metric.name,
      component: 'performance',
      metadata: {
        duration: metric.duration,
        threshold,
        exceeded: metric.duration - threshold,
        ...metric.metadata,
      },
    });
  }
}

// ============================================================================
// PUBLIC API - COMPONENT MONITORING
// ============================================================================

/**
 * Measure component render time
 * 
 * @param componentName - Name of component
 * @returns Start function to call before render, complete function after
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const perf = measureRender('MyComponent');
 *   
 *   useEffect(() => {
 *     perf.complete();
 *   });
 *   
 *   // Component render...
 * }
 * ```
 */
export function measureRender(componentName: string): {
  complete: (metadata?: Record<string, unknown>) => void;
} {
  if (!config.enabled || !IS_BROWSER) {
    return { complete: () => {} };
  }

  const startTime = performance.now();

  return {
    complete: (metadata?: Record<string, unknown>) => {
      const duration = performance.now() - startTime;

      recordMetric({
        name: componentName,
        type: 'render',
        duration,
        timestamp: startTime,
        metadata,
      });
    },
  };
}

/**
 * Measure operation performance
 * 
 * @param operationName - Name of operation
 * @returns Complete function to call when done
 * 
 * @example
 * ```ts
 * const perf = measureOperation('calculateQuality');
 * const result = expensiveCalculation();
 * perf.complete({ itemCount: 100 });
 * ```
 */
export function measureOperation(operationName: string): {
  complete: (metadata?: Record<string, unknown>) => void;
} {
  if (!config.enabled) {
    return { complete: () => {} };
  }

  const startTime = IS_BROWSER ? performance.now() : Date.now();

  return {
    complete: (metadata?: Record<string, unknown>) => {
      const duration = IS_BROWSER ? performance.now() - startTime : Date.now() - startTime;

      recordMetric({
        name: operationName,
        type: 'operation',
        duration,
        timestamp: startTime,
        metadata,
      });
    },
  };
}

// ============================================================================
// PUBLIC API - API MONITORING
// ============================================================================

/**
 * Measure API call performance
 * 
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @returns Complete function to call when response received
 * 
 * @example
 * ```ts
 * const perf = measureApiCall('/api/contracts', 'GET');
 * const response = await fetch('/api/contracts');
 * perf.complete({ status: response.status });
 * ```
 */
export function measureApiCall(endpoint: string, method: string = 'GET'): {
  complete: (metadata?: Record<string, unknown>) => void;
} {
  if (!config.enabled) {
    return { complete: () => {} };
  }

  const startTime = IS_BROWSER ? performance.now() : Date.now();
  const name = `${method} ${endpoint}`;

  return {
    complete: (metadata?: Record<string, unknown>) => {
      const duration = IS_BROWSER ? performance.now() - startTime : Date.now() - startTime;

      recordMetric({
        name,
        type: 'api',
        duration,
        timestamp: startTime,
        metadata: {
          method,
          endpoint,
          ...metadata,
        },
      });
    },
  };
}

/**
 * Wrap API handler with automatic performance monitoring
 * 
 * @param handler - API handler function
 * @param name - Handler name for tracking
 * @returns Wrapped handler with performance tracking
 * 
 * @example
 * ```ts
 * export const GET = withApiMonitoring(async (req) => {
 *   // Handler implementation
 * }, 'GET /api/contracts');
 * ```
 */
export function withApiMonitoring<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  name: string
): T {
  if (!config.enabled) {
    return handler;
  }

  return (async (...args: any[]) => {
    const perf = measureApiCall(name, 'HANDLER');
    
    try {
      const result = await handler(...args);
      perf.complete({ success: true });
      return result;
    } catch (error) {
      perf.complete({ success: false, error: String(error) });
      throw error;
    }
  }) as T;
}

// ============================================================================
// PUBLIC API - MEMORY MONITORING
// ============================================================================

/**
 * Take memory snapshot (browser only)
 * 
 * @param component - Component or context name
 * @returns Memory snapshot or null if unavailable
 * 
 * @example
 * ```ts
 * const snapshot = takeMemorySnapshot('ContractList');
 * console.log(`Memory used: ${snapshot.usedJSHeapSize / 1024 / 1024}MB`);
 * ```
 */
export function takeMemorySnapshot(component?: string): MemorySnapshot | null {
  if (!config.enabled || !IS_BROWSER) return null;

  // Check if performance.memory is available (Chromium-based browsers)
  const memory = (performance as any).memory;
  if (!memory) return null;

  const snapshot: MemorySnapshot = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: performance.now(),
    component,
  };

  // Add to snapshots storage
  memorySnapshots.push(snapshot);

  // Trim old snapshots
  if (memorySnapshots.length > MAX_MEMORY_SNAPSHOTS) {
    memorySnapshots.splice(0, memorySnapshots.length - MAX_MEMORY_SNAPSHOTS);
  }

  // Check for memory threshold
  const usedMB = snapshot.usedJSHeapSize / 1024 / 1024;
  const prevSnapshot = memorySnapshots[memorySnapshots.length - 2];

  if (prevSnapshot) {
    const prevMB = prevSnapshot.usedJSHeapSize / 1024 / 1024;
    const increase = usedMB - prevMB;

    if (increase > config.memoryThreshold) {
      logger.warn('High memory increase detected', {
        operation: 'memoryMonitoring',
        component: component || 'unknown',
        metadata: {
          currentMB: usedMB.toFixed(2),
          previousMB: prevMB.toFixed(2),
          increaseMB: increase.toFixed(2),
          threshold: config.memoryThreshold,
        },
      });
    }
  }

  return snapshot;
}

/**
 * Detect potential memory leaks
 * 
 * @returns True if potential leak detected
 * 
 * @example
 * ```ts
 * if (detectMemoryLeak()) {
 *   console.warn('Potential memory leak detected!');
 * }
 * ```
 */
export function detectMemoryLeak(): boolean {
  if (!config.enabled || !IS_BROWSER || memorySnapshots.length < 5) {
    return false;
  }

  // Check last 5 snapshots for consistent growth
  const recent = memorySnapshots.slice(-5);
  let increasing = true;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i].usedJSHeapSize <= recent[i - 1].usedJSHeapSize) {
      increasing = false;
      break;
    }
  }

  if (increasing) {
    const first = recent[0].usedJSHeapSize / 1024 / 1024;
    const last = recent[recent.length - 1].usedJSHeapSize / 1024 / 1024;
    const totalIncrease = last - first;

    logger.warn('Potential memory leak detected', {
      operation: 'memoryLeakDetection',
      metadata: {
        samples: recent.length,
        firstMB: first.toFixed(2),
        lastMB: last.toFixed(2),
        totalIncreaseMB: totalIncrease.toFixed(2),
      },
    });

    return true;
  }

  return false;
}

// ============================================================================
// PUBLIC API - BASELINE & REPORTING
// ============================================================================

/**
 * Get performance baseline for specific metric
 * 
 * @param name - Metric name
 * @param type - Metric type
 * @returns Baseline data or undefined
 * 
 * @example
 * ```ts
 * const baseline = getBaseline('ContractList', 'render');
 * console.log(`Average render: ${baseline?.avg}ms`);
 * ```
 */
export function getBaseline(
  name: string,
  type: PerformanceMetric['type']
): PerformanceBaseline | undefined {
  const key = `${type}:${name}`;
  return baselines.get(key);
}

/**
 * Get all baselines
 * 
 * @returns Map of all baselines
 */
export function getAllBaselines(): Map<string, PerformanceBaseline> {
  return new Map(baselines);
}

/**
 * Generate performance report
 * 
 * @returns Performance report with aggregated metrics
 * 
 * @example
 * ```ts
 * const report = generateReport();
 * console.log(JSON.stringify(report, null, 2));
 * ```
 */
export function generateReport(): {
  timestamp: number;
  totalMetrics: number;
  baselines: PerformanceBaseline[];
  slowestRenders: PerformanceMetric[];
  slowestApis: PerformanceMetric[];
  memoryStats: {
    snapshots: number;
    currentMB: number;
    maxMB: number;
    avgMB: number;
  } | null;
} {
  // Get slowest renders (top 10)
  const slowestRenders = metrics
    .filter(m => m.type === 'render' && m.duration)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10);

  // Get slowest APIs (top 10)
  const slowestApis = metrics
    .filter(m => m.type === 'api' && m.duration)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10);

  // Calculate memory stats
  let memoryStats = null;
  if (memorySnapshots.length > 0) {
    const usedSizes = memorySnapshots.map(s => s.usedJSHeapSize / 1024 / 1024);
    memoryStats = {
      snapshots: memorySnapshots.length,
      currentMB: usedSizes[usedSizes.length - 1],
      maxMB: Math.max(...usedSizes),
      avgMB: usedSizes.reduce((a, b) => a + b, 0) / usedSizes.length,
    };
  }

  return {
    timestamp: Date.now(),
    totalMetrics: metrics.length,
    baselines: Array.from(baselines.values()),
    slowestRenders,
    slowestApis,
    memoryStats,
  };
}

/**
 * Clear all metrics and baselines (useful for testing)
 */
export function clearMetrics(): void {
  metrics.length = 0;
  baselines.clear();
  memorySnapshots.length = 0;
}

/**
 * Update performance configuration
 * 
 * @param newConfig - Partial configuration to merge
 * 
 * @example
 * ```ts
 * updateConfig({ enabled: true, renderThreshold: 20 });
 * ```
 */
export function updateConfig(newConfig: Partial<PerformanceConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current configuration
 * 
 * @returns Current performance config
 */
export function getConfig(): PerformanceConfig {
  return { ...config };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize automatic reporting (if enabled)
 */
if (config.enabled && IS_BROWSER) {
  // Report performance metrics periodically
  setInterval(() => {
    const report = generateReport();
    
    if (report.totalMetrics > 0) {
      logger.info('Performance report', {
        operation: 'performanceReporting',
        metadata: report,
      });
    }
  }, config.reportingInterval);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  measureRender,
  measureOperation,
  measureApiCall,
  withApiMonitoring,
  takeMemorySnapshot,
  detectMemoryLeak,
  getBaseline,
  getAllBaselines,
  generateReport,
  clearMetrics,
  updateConfig,
  getConfig,
};

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Performance Targets:
 *    - Component renders: <16ms (60fps = 16.67ms per frame)
 *    - API responses: <200ms (perceived instant response)
 *    - Memory: Alert on >100MB increases
 * 
 * 2. Baseline Calculation:
 *    - Uses exponential moving average (EMA) for smoothing
 *    - Tracks p50, p95, p99 percentiles for outlier detection
 *    - Requires configurable sample size (default 100)
 * 
 * 3. Memory Monitoring:
 *    - Browser-only (performance.memory API)
 *    - Available in Chromium-based browsers
 *    - Detects consistent growth patterns (potential leaks)
 * 
 * 4. Storage:
 *    - In-memory storage with max limits (prevents memory leaks)
 *    - Production would send to monitoring service
 *    - Periodic reporting with configurable interval
 * 
 * 5. Integration:
 *    - React components: measureRender in useEffect
 *    - API routes: withApiMonitoring wrapper
 *    - Critical operations: measureOperation wrapper
 * 
 * 6. Future Enhancements:
 *    - Integration with React DevTools Profiler
 *    - Web Vitals tracking (LCP, FID, CLS)
 *    - Server-side metrics (Node.js process memory)
 *    - Real User Monitoring (RUM) integration
 *    - Performance budgets and alerts
 *    - Automated performance regression detection
 */
