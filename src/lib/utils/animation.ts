/**
 * @fileoverview Animation Utilities for Counter Transitions
 * @module lib/utils/animation
 *
 * OVERVIEW:
 * Provides smooth counter animation utilities using Framer Motion.
 * Handles number interpolation, easing curves, and pause/resume functionality
 * for the Revenue Ticker component.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

import { animate } from 'framer-motion';
import type { AnimationConfig, AnimationFrame } from '@/lib/types/revenueTicker';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default animation configuration
 */
const DEFAULT_CONFIG: AnimationConfig = {
  duration: 1.5,
  easing: 'easeOut',
  animateNumbers: true,
  animateColors: true,
};

/**
 * Easing function presets
 */
const EASING_PRESETS = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  linear: [0, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================================================
// Core Animation Functions
// ============================================================================

/**
 * Animate a counter from start to end value
 *
 * @param startValue - Starting number value
 * @param endValue - Target number value
 * @param config - Animation configuration
 * @returns Promise that resolves when animation completes
 *
 * @example
 * ```ts
 * await animateCounter(1000, 1500, { duration: 2 });
 * // Counter animates from 1000 to 1500 over 2 seconds
 * ```
 */
export async function animateCounter(
  startValue: number,
  endValue: number,
  config: Partial<AnimationConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.animateNumbers || startValue === endValue) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const controls = animate(
        startValue,
        endValue,
        {
          duration: finalConfig.duration,
          ease: EASING_PRESETS[finalConfig.easing as keyof typeof EASING_PRESETS] || EASING_PRESETS.easeOut,
          onComplete: resolve,
          onStop: resolve, // Also resolve if stopped
        }
      );

      // Return cleanup function
      return () => controls.stop();
    } catch (error) {
      console.error('Counter animation failed:', {
        operation: 'animateCounter',
        component: 'animation.ts',
        metadata: { startValue, endValue, config: finalConfig },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      reject(error);
    }
  });
}

/**
 * Create an animation frame generator for step-by-step animation
 *
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param config - Animation configuration
 * @returns Generator yielding animation frames
 *
 * @example
 * ```ts
 * const frames = createAnimationFrames(100, 200, { duration: 1 });
 * for (const frame of frames) {
 *   console.log(`Value: ${frame.value}, Progress: ${frame.progress}`);
 * }
 * ```
 */
export function* createAnimationFrames(
  startValue: number,
  endValue: number,
  config: Partial<AnimationConfig> = {}
): Generator<AnimationFrame> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const totalSteps = Math.max(1, Math.floor(finalConfig.duration * 60)); // 60 FPS
  const valueDiff = endValue - startValue;

  for (let step = 0; step <= totalSteps; step++) {
    const progress = step / totalSteps;
    const easedProgress = easeProgress(progress, finalConfig.easing);
    const currentValue = startValue + (valueDiff * easedProgress);

    yield {
      value: Math.round(currentValue * 100) / 100, // Round to 2 decimals
      progress: easedProgress,
      isComplete: step === totalSteps,
    };
  }
}

/**
 * Apply easing function to progress value
 *
 * @param progress - Raw progress (0-1)
 * @param easing - Easing function name
 * @returns Eased progress value
 */
function easeProgress(progress: number, easing: string): number {
  const easingFunction = EASING_PRESETS[easing as keyof typeof EASING_PRESETS];
  if (!easingFunction) {
    return progress; // Linear fallback
  }

  // Cubic bezier easing implementation
  const [x1, y1, x2, y2] = easingFunction;
  return cubicBezier(progress, x1, y1, x2, y2);
}

/**
 * Cubic bezier easing function
 *
 * @param t - Time parameter (0-1)
 * @param p1x - Control point 1 x
 * @param p1y - Control point 1 y
 * @param p2x - Control point 2 x
 * @param p2y - Control point 2 y
 * @returns Eased value
 */
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  // Solve cubic equation for t
  let x = t;
  for (let i = 0; i < 8; i++) {
    const slope = getSlope(x, ax, bx, cx);
    if (slope === 0) break;
    x -= (getX(x, ax, bx, cx) - t) / slope;
  }

  return getY(x, ay, by, cy);
}

function getSlope(t: number, a: number, b: number, c: number): number {
  return 3 * a * t * t + 2 * b * t + c;
}

function getX(t: number, a: number, b: number, c: number): number {
  return a * t * t * t + b * t * t + c * t;
}

function getY(t: number, a: number, b: number, c: number): number {
  return a * t * t * t + b * t * t + c * t;
}

// ============================================================================
// Animation State Management
// ============================================================================

/**
 * Animation state controller for managing pause/resume
 */
export class AnimationController {
  private isPaused = false;
  private currentAnimation: { stop: () => void } | null = null;

  /**
   * Start a new animation
   */
  animate(
    startValue: number,
    endValue: number,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    // Stop any existing animation
    this.stop();

    if (this.isPaused) {
      return Promise.resolve();
    }

    const promise = animateCounter(startValue, endValue, config);
    this.currentAnimation = {
      stop: () => {
        // Note: animateCounter doesn't return a stoppable control
        // This is a placeholder for future enhancement
      },
    };

    return promise.finally(() => {
      this.currentAnimation = null;
    });
  }

  /**
   * Pause current animation
   */
  pause(): void {
    this.isPaused = true;
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
  }

  /**
   * Resume animation capability
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Stop and cleanup animation
   */
  stop(): void {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
      this.currentAnimation = null;
    }
  }

  /**
   * Check if animation is currently paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }
}

// ============================================================================
// Color Animation Utilities
// ============================================================================

/**
 * Animate color transition for revenue trend changes
 *
 * @param fromColor - Starting color class
 * @param toColor - Target color class
 * @param duration - Animation duration in seconds
 * @returns Promise that resolves when color animation completes
 */
export async function animateColorTransition(
  fromColor: string,
  toColor: string,
  duration: number = 0.5
): Promise<void> {
  // Color animation is handled by CSS transitions in the component
  // This function provides timing control for coordinated animations
  return new Promise(resolve => {
    setTimeout(resolve, duration * 1000);
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format number with smooth decimal transitions
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatAnimatedNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Calculate optimal animation duration based on value difference
 *
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param baseDuration - Base duration in seconds
 * @returns Calculated duration
 */
export function calculateAnimationDuration(
  startValue: number,
  endValue: number,
  baseDuration: number = 1.5
): number {
  const diff = Math.abs(endValue - startValue);
  const magnitude = Math.log10(Math.max(diff, 1));

  // Scale duration based on magnitude (larger changes = longer animation)
  const scaledDuration = baseDuration * Math.min(1 + magnitude * 0.1, 3);

  return Math.max(0.3, Math.min(scaledDuration, 5)); // Clamp between 0.3-5 seconds
}