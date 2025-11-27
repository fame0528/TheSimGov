/**
 * @fileoverview React Performance Monitoring Hooks
 * @module lib/hooks/usePerformance
 * @description React hooks for automatic component performance tracking.
 * Integrates with performance monitoring utility for render time tracking,
 * memory monitoring, and operation profiling.
 * 
 * @created 2025-11-17
 * @author ECHO v1.0.0
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import performance from '@/lib/utils/performance';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module provides React hooks for:
 * - Automatic component render time tracking
 * - Memory snapshot monitoring
 * - Operation performance measurement
 * - Performance baseline comparison
 * 
 * Usage:
 * - usePerformanceMonitor: Track component renders automatically
 * - useMemoryMonitor: Monitor memory usage in component
 * - useOperationTimer: Time expensive operations
 */

// ============================================================================
// HOOK: usePerformanceMonitor
// ============================================================================

/**
 * Automatically track component render performance
 * 
 * @param componentName - Name of component for tracking
 * @param metadata - Optional metadata to include with measurements
 * 
 * @example
 * ```tsx
 * function ContractList() {
 *   usePerformanceMonitor('ContractList', {
 *     itemCount: contracts.length
 *   });
 *   
 *   return <div>{contracts.map(...)}</div>;
 * }
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  metadata?: Record<string, unknown>
): void {
  const renderStartRef = useRef<number>(0);

  // Track render start
  if (renderStartRef.current === 0) {
    renderStartRef.current = performance.getConfig().enabled && typeof window !== 'undefined'
      ? window.performance.now()
      : 0;
  }

  useEffect(() => {
    // Measure render completion
    if (renderStartRef.current > 0) {
      const duration = window.performance.now() - renderStartRef.current;
      
      const perf = performance.measureRender(componentName);
      perf.complete({
        ...metadata,
        phase: 'mount',
        duration,
      });

      // Reset for next render
      renderStartRef.current = 0;
    }
  });

  // Track re-renders
  useEffect(() => {
    const perf = performance.measureRender(`${componentName}:update`);
    
    return () => {
      perf.complete({
        ...metadata,
        phase: 'update',
      });
    };
  }, [componentName, metadata]);
}

// ============================================================================
// HOOK: useMemoryMonitor
// ============================================================================

/**
 * Monitor memory usage in component lifecycle
 * 
 * @param componentName - Name of component for tracking
 * @param interval - Snapshot interval in ms (default: 5000)
 * 
 * @example
 * ```tsx
 * function AIModelList() {
 *   const memoryStats = useMemoryMonitor('AIModelList', 10000);
 *   
 *   // memoryStats updates every 10 seconds with current memory usage
 *   return <div>Memory: {memoryStats?.usedMB}MB</div>;
 * }
 * ```
 */
export function useMemoryMonitor(
  componentName: string,
  interval: number = 5000
): {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  timestamp: number;
} | null {
  const [memoryStats, setMemoryStats] = useStateIfClient<{
    usedMB: number;
    totalMB: number;
    limitMB: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    // Take initial snapshot
    const snapshot = performance.takeMemorySnapshot(componentName);
    if (snapshot) {
      setMemoryStats({
        usedMB: snapshot.usedJSHeapSize / 1024 / 1024,
        totalMB: snapshot.totalJSHeapSize / 1024 / 1024,
        limitMB: snapshot.jsHeapSizeLimit / 1024 / 1024,
        timestamp: snapshot.timestamp,
      });
    }

    // Set up periodic snapshots
    const intervalId = setInterval(() => {
      const snapshot = performance.takeMemorySnapshot(componentName);
      if (snapshot) {
        setMemoryStats({
          usedMB: snapshot.usedJSHeapSize / 1024 / 1024,
          totalMB: snapshot.totalJSHeapSize / 1024 / 1024,
          limitMB: snapshot.jsHeapSizeLimit / 1024 / 1024,
          timestamp: snapshot.timestamp,
        });

        // Check for memory leaks
        performance.detectMemoryLeak();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [componentName, interval]);

  return memoryStats;
}

// ============================================================================
// HOOK: useOperationTimer
// ============================================================================

/**
 * Create timer for expensive operations within component
 * 
 * @param operationName - Name of operation for tracking
 * @returns Callback to measure operation
 * 
 * @example
 * ```tsx
 * function ContractCalculator() {
 *   const measureCalc = useOperationTimer('qualityCalculation');
 *   
 *   const handleCalculate = () => {
 *     const result = measureCalc(() => {
 *       return expensiveQualityCalculation();
 *     }, { contractCount: 100 });
 *   };
 *   
 *   return <button onClick={handleCalculate}>Calculate</button>;
 * }
 * ```
 */
export function useOperationTimer(operationName: string): <T>(
  operation: () => T,
  metadata?: Record<string, unknown>
) => T {
  return useCallback(
    <T>(operation: () => T, metadata?: Record<string, unknown>): T => {
      const perf = performance.measureOperation(operationName);
      
      try {
        const result = operation();
        perf.complete(metadata);
        return result;
      } catch (error) {
        perf.complete({ ...metadata, error: String(error) });
        throw error;
      }
    },
    [operationName]
  );
}

// ============================================================================
// HOOK: useApiMonitor
// ============================================================================

/**
 * Monitor API call performance within component
 * 
 * @param endpoint - API endpoint
 * @returns Monitored fetch function
 * 
 * @example
 * ```tsx
 * function ContractList() {
 *   const fetchContracts = useApiMonitor('/api/contracts');
 *   
 *   useEffect(() => {
 *     fetchContracts({ method: 'GET' })
 *       .then(res => res.json())
 *       .then(data => setContracts(data));
 *   }, []);
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useApiMonitor(endpoint: string): (
  options?: RequestInit
) => Promise<Response> {
  return useCallback(
    async (options?: RequestInit): Promise<Response> => {
      const method = options?.method || 'GET';
      const perf = performance.measureApiCall(endpoint, method);

      try {
        const response = await fetch(endpoint, options);
        
        perf.complete({
          status: response.status,
          ok: response.ok,
        });

        return response;
      } catch (error) {
        perf.complete({
          error: String(error),
          success: false,
        });
        throw error;
      }
    },
    [endpoint]
  );
}

// ============================================================================
// HOOK: usePerformanceBaseline
// ============================================================================

/**
 * Get performance baseline for component
 * 
 * @param componentName - Component name
 * @param type - Metric type (default: 'render')
 * @returns Baseline data or undefined
 * 
 * @example
 * ```tsx
 * function ContractList() {
 *   const baseline = usePerformanceBaseline('ContractList');
 *   
 *   return (
 *     <div>
 *       Average render: {baseline?.avg.toFixed(2)}ms
 *       P95: {baseline?.p95.toFixed(2)}ms
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceBaseline(
  componentName: string,
  type: 'render' | 'api' | 'operation' = 'render'
): ReturnType<typeof performance.getBaseline> | undefined {
  const [baseline, setBaseline] = useStateIfClient<
    ReturnType<typeof performance.getBaseline>
  >(undefined);

  useEffect(() => {
    // Get initial baseline
    const current = performance.getBaseline(componentName, type);
    setBaseline(current);

    // Update periodically
    const intervalId = setInterval(() => {
      const updated = performance.getBaseline(componentName, type);
      setBaseline(updated);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [componentName, type]);

  return baseline;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * useState hook that only works in client components
 * Returns undefined in server components
 */
function useStateIfClient<T>(initialValue: T): [T, (value: T) => void] {
  if (typeof window === 'undefined') {
    // Server-side: return dummy state
    return [initialValue, () => {}];
  }

  // Client-side: use real useState
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const React = require('react');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return React.useState(initialValue) as [T, (value: T) => void];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  usePerformanceMonitor,
  useMemoryMonitor,
  useOperationTimer,
  useApiMonitor,
  usePerformanceBaseline,
};

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Client-Only Hooks:
 *    - All hooks use 'use client' directive for Next.js 15
 *    - Gracefully handle server-side rendering
 *    - Performance API only available in browser
 * 
 * 2. Automatic Tracking:
 *    - usePerformanceMonitor: Tracks both mount and updates
 *    - useMemoryMonitor: Periodic snapshots with leak detection
 *    - useOperationTimer: Wraps expensive operations
 * 
 * 3. Integration Patterns:
 *    - Add to high-traffic components (dashboards, lists)
 *    - Monitor expensive calculations (quality scoring, analytics)
 *    - Track API calls (data fetching, mutations)
 * 
 * 4. Performance Impact:
 *    - Minimal overhead when disabled
 *    - Development-only by default
 *    - Can enable in production with env var
 * 
 * 5. Usage Examples:
 *    - Dashboard: usePerformanceMonitor + useMemoryMonitor
 *    - Data grid: usePerformanceMonitor with item count metadata
 *    - API integration: useApiMonitor for automatic tracking
 *    - Heavy calculations: useOperationTimer wrapper
 * 
 * 6. Future Enhancements:
 *    - React Profiler integration
 *    - Component tree performance analysis
 *    - Automated performance regression alerts
 *    - Performance comparison (before/after optimization)
 */
