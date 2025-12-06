/**
 * @fileoverview Counter Animation Custom Hook
 * @module hooks/useCounterAnimation
 *
 * OVERVIEW:
 * Custom hook for managing smooth number transitions and color changes
 * in the Revenue Ticker component. Uses Framer Motion for animations.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { animate } from 'framer-motion';
import type { UseCounterAnimationReturn, AnimationConfig } from '@/lib/types/revenueTicker';
import { calculateAnimationDuration } from '@/lib/utils/animation';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default animation configuration
 */
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 1.5,
  easing: 'easeOut',
  animateNumbers: true,
  animateColors: true,
};

/**
 * Minimum animation duration (ms)
 */
const MIN_DURATION = 300;

/**
 * Maximum animation duration (ms)
 */
const MAX_DURATION = 5000;

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for animating counter values with smooth transitions
 *
 * @param initialValue - Starting value for the counter
 * @param config - Animation configuration
 * @returns Animation state and controls
 *
 * @example
 * ```tsx
 * const { animatedValue, isAnimating, animateTo } = useCounterAnimation(1000);
 *
 * // Animate to new value
 * animateTo(1500);
 *
 * return <div>{animatedValue.toFixed(0)}</div>;
 * ```
 */
export function useCounterAnimation(
  initialValue: number = 0,
  config: Partial<AnimationConfig> = {}
): UseCounterAnimationReturn {
  const [animatedValue, setAnimatedValue] = useState<number>(initialValue);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [currentAnimation, setCurrentAnimation] = useState<{ stop: () => void } | null>(null);

  const finalConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

  /**
   * Animate to a new value
   */
  const animateTo = useCallback(
    async (targetValue: number, animationConfig?: Partial<AnimationConfig>) => {
      const activeConfig = { ...finalConfig, ...animationConfig };

      if (!activeConfig.animateNumbers || animatedValue === targetValue) {
        return;
      }

      // Stop any existing animation
      if (currentAnimation) {
        currentAnimation.stop();
      }

      setIsAnimating(true);

      try {
        // Calculate optimal duration based on value difference
        const duration = Math.max(
          MIN_DURATION,
          Math.min(
            calculateAnimationDuration(animatedValue, targetValue, activeConfig.duration * 1000),
            MAX_DURATION
          )
        ) / 1000; // Convert to seconds

        // Start animation
        const controls = animate(
          animatedValue,
          targetValue,
          {
            duration,
            ease: activeConfig.easing as any, // Framer Motion accepts string easings
            onUpdate: (value) => {
              setAnimatedValue(Math.round(value * 100) / 100); // Round to 2 decimals
            },
            onComplete: () => {
              setAnimatedValue(targetValue); // Ensure exact final value
              setIsAnimating(false);
              setCurrentAnimation(null);
            },
          }
        );

        setCurrentAnimation(controls);

      } catch (error) {
        console.error('Counter animation failed:', {
          operation: 'animateTo',
          component: 'useCounterAnimation.ts',
          metadata: { from: animatedValue, to: targetValue, config: activeConfig },
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Fallback: set value immediately
        setAnimatedValue(targetValue);
        setIsAnimating(false);
        setCurrentAnimation(null);
      }
    },
    [animatedValue, currentAnimation, finalConfig]
  );

  /**
   * Pause current animation
   */
  const pause = useCallback(() => {
    if (currentAnimation) {
      currentAnimation.stop();
      setIsAnimating(false);
    }
  }, [currentAnimation]);

  /**
   * Resume animation (not implemented - would need to track progress)
   */
  const resume = useCallback(() => {
    // Note: Resume functionality would require tracking animation progress
    // For now, this is a no-op. Could be enhanced in the future.
    console.warn('Resume functionality not implemented in useCounterAnimation');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAnimation) {
        currentAnimation.stop();
      }
    };
  }, [currentAnimation]);

  return {
    animatedValue,
    isAnimating,
    animateTo,
    pause,
    resume,
  };
}

// ============================================================================
// Specialized Animation Hooks
// ============================================================================

/**
 * Hook for currency counter animation with proper formatting
 */
export function useCurrencyCounter(
  initialValue: number = 0,
  config: Partial<AnimationConfig> = {}
) {
  const { animatedValue, isAnimating, animateTo, pause, resume } = useCounterAnimation(
    initialValue,
    config
  );

  /**
   * Animate currency value with proper rounding
   */
  const animateCurrency = useCallback(
    (targetValue: number, animationConfig?: Partial<AnimationConfig>) => {
      // Round to cents for currency
      const roundedTarget = Math.round(targetValue * 100) / 100;
      const roundedCurrent = Math.round(animatedValue * 100) / 100;

      animateTo(roundedTarget, animationConfig);
    },
    [animateTo, animatedValue]
  );

  return {
    animatedValue,
    formattedValue: animatedValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    isAnimating,
    animateTo: animateCurrency,
    pause,
    resume,
  };
}

/**
 * Hook for percentage counter animation
 */
export function usePercentageCounter(
  initialValue: number = 0,
  config: Partial<AnimationConfig> = {}
) {
  const { animatedValue, isAnimating, animateTo, pause, resume } = useCounterAnimation(
    initialValue,
    {
      ...config,
      duration: 1.0, // Faster for percentages
    }
  );

  return {
    animatedValue,
    formattedValue: `${animatedValue.toFixed(1)}%`,
    isAnimating,
    animateTo,
    pause,
    resume,
  };
}

// ============================================================================
// Color Animation Hook
// ============================================================================

/**
 * Hook for animating color transitions
 */
export function useColorAnimation(
  initialColor: string = 'text-gray-400',
  config: { animateColors?: boolean } = {}
) {
  const [currentColor, setCurrentColor] = useState<string>(initialColor);
  const [isColorAnimating, setIsColorAnimating] = useState<boolean>(false);

  const animateColor = useCallback(
    async (targetColor: string, duration: number = 0.5) => {
      if (!config.animateColors || currentColor === targetColor) {
        setCurrentColor(targetColor);
        return;
      }

      setIsColorAnimating(true);

      // Simple timeout-based color transition
      // In a real implementation, this could use CSS transitions
      setTimeout(() => {
        setCurrentColor(targetColor);
        setIsColorAnimating(false);
      }, duration * 1000);
    },
    [currentColor, config.animateColors]
  );

  return {
    currentColor,
    isColorAnimating,
    animateColor,
  };
}

// ============================================================================
// Combined Animation Hook
// ============================================================================

/**
 * Hook that combines counter and color animations
 */
export function useCounterWithColor(
  initialValue: number = 0,
  initialColor: string = 'text-gray-400',
  config: Partial<AnimationConfig> = {}
) {
  const counter = useCounterAnimation(initialValue, config);
  const color = useColorAnimation(initialColor, { animateColors: config.animateColors });

  const animateToWithColor = useCallback(
    (
      targetValue: number,
      targetColor: string,
      animationConfig?: Partial<AnimationConfig>
    ) => {
      // Animate both value and color simultaneously
      counter.animateTo(targetValue, animationConfig);
      color.animateColor(targetColor, animationConfig?.duration || 1.5);
    },
    [counter, color]
  );

  return {
    ...counter,
    currentColor: color.currentColor,
    isColorAnimating: color.isColorAnimating,
    animateToWithColor,
  };
}