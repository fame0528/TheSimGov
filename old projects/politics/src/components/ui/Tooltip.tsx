/**
 * @fileoverview Tooltip Component - Wrapper for Tippy.js
 * @module components/ui/Tooltip
 * @description Reusable tooltip component for displaying contextual information
 * throughout the application. Provides consistent styling and behavior for
 * tooltips on hover, click, or focus interactions.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

'use client';

import type { ReactElement, ReactNode } from 'react';
import Tippy, { TippyProps } from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';
import 'tippy.js/themes/material.css';
import 'tippy.js/themes/translucent.css';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This component wraps @tippyjs/react to provide:
 * - Consistent tooltip styling across the app
 * - Multiple tooltip themes and placements
 * - Smart positioning with boundary detection
 * - Interactive tooltips (clickable content)
 * - Delay and animation options
 * - Accessibility compliance (ARIA labels)
 * 
 * Used for:
 * - Skill explanations (what does "Skill: 75" mean?)
 * - Stat details (morale, loyalty, experience breakdowns)
 * - Action tooltips (button explanations)
 * - Info icons (help text)
 * - Data visualization (chart point details)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Tooltip placement options
 */
export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'auto'
  | 'auto-start'
  | 'auto-end';

/**
 * Tooltip trigger options
 */
export type TooltipTrigger = 'mouseenter focus' | 'click' | 'focusin' | 'mouseenter' | 'manual';

/**
 * Tooltip theme options
 */
export type TooltipTheme = 'dark' | 'light' | 'light-border' | 'material' | 'translucent' | 'custom';

/**
 * Tooltip animation options
 */
export type TooltipAnimation = 'shift-away' | 'shift-toward' | 'scale' | 'perspective' | 'fade' | false;

/**
 * Tooltip component props
 */
export interface TooltipProps {
  /** Content to display in tooltip */
  content: ReactNode;
  
  /** Element that triggers the tooltip */
  children: ReactElement;
  
  /** Tooltip placement (default: 'top') */
  placement?: TooltipPlacement;
  
  /** Trigger behavior (default: 'mouseenter focus') */
  trigger?: TooltipTrigger;
  
  /** Theme/styling (default: 'dark') */
  theme?: TooltipTheme;
  
  /** Animation type (default: 'shift-away') */
  animation?: TooltipAnimation;
  
  /** Delay before showing (ms, default: 0) */
  delay?: number | [number, number];
  
  /** Maximum width (default: '350px') */
  maxWidth?: number | string;
  
  /** Allow HTML content (default: false) */
  allowHTML?: boolean;
  
  /** Interactive tooltip (clickable content, default: false) */
  interactive?: boolean;
  
  /** Arrow visibility (default: true) */
  arrow?: boolean;
  
  /** Z-index (default: 9999) */
  zIndex?: number;
  
  /** Disabled state (default: false) */
  disabled?: boolean;
  
  /** Custom className for tooltip */
  className?: string;
  
  /** Offset from target [skidding, distance] */
  offset?: [number, number];
  
  /** Show tooltip immediately (default: false) */
  visible?: boolean;
  
  /** Callback when shown */
  onShow?: () => void;
  
  /** Callback when hidden */
  onHide?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Tooltip component for contextual information
 * 
 * @example
 * ```tsx
 * // Simple tooltip
 * <Tooltip content="Click to hire this employee">
 *   <button>Hire</button>
 * </Tooltip>
 * 
 * // Rich content tooltip
 * <Tooltip
 *   content={
 *     <div>
 *       <strong>Skill: 75</strong>
 *       <p>Above average performance</p>
 *       <p>Bonus: +15% productivity</p>
 *     </div>
 *   }
 *   placement="right"
 *   theme="light-border"
 * >
 *   <span className="stat-badge">Skill: 75</span>
 * </Tooltip>
 * 
 * // Interactive tooltip (stays open when hovering content)
 * <Tooltip
 *   content={<a href="/help">Learn more</a>}
 *   interactive={true}
 *   trigger="click"
 * >
 *   <button>?</button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  trigger = 'mouseenter focus',
  theme = 'dark',
  animation = 'shift-away',
  delay = 0,
  maxWidth = '350px',
  allowHTML = false,
  interactive = false,
  arrow = true,
  zIndex = 9999,
  disabled = false,
  className,
  offset,
  visible,
  onShow,
  onHide,
}: TooltipProps) {
  // Don't render tooltip if disabled
  if (disabled) {
    return children;
  }

  // Convert delay to tuple if single number
  const delayTuple: [number | null, number | null] = typeof delay === 'number' ? [delay, delay] : delay;

  // Build Tippy props
  const tippyProps: Partial<TippyProps> = {
    content,
    placement,
    trigger,
    theme: theme === 'custom' ? undefined : theme,
    animation: animation || undefined,
    delay: delayTuple,
    maxWidth,
    allowHTML,
    interactive,
    arrow,
    zIndex,
    className,
    offset,
    visible,
    onShow,
    onHide,
    // Accessibility
    role: 'tooltip',
    // Performance
    popperOptions: {
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
      ],
    },
  };

  return <Tippy {...tippyProps}>{children}</Tippy>;
}

// ============================================================================
// PRESET TOOLTIPS
// ============================================================================

/**
 * Info tooltip (light theme with border, right placement)
 * 
 * @example
 * ```tsx
 * <InfoTooltip content="This is additional information">
 *   <InfoIcon />
 * </InfoTooltip>
 * ```
 */
export function InfoTooltip({ content, children, ...props }: Omit<TooltipProps, 'theme' | 'placement'>) {
  return (
    <Tooltip
      content={content}
      theme="light-border"
      placement="right"
      {...props}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Help tooltip (interactive, click trigger)
 * 
 * @example
 * ```tsx
 * <HelpTooltip content={<HelpContent />}>
 *   <button>?</button>
 * </HelpTooltip>
 * ```
 */
export function HelpTooltip({ content, children, ...props }: Omit<TooltipProps, 'trigger' | 'interactive'>) {
  return (
    <Tooltip
      content={content}
      trigger="click"
      interactive={true}
      theme="light-border"
      {...props}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Stat tooltip (for game stats and numbers)
 * 
 * @example
 * ```tsx
 * <StatTooltip
 *   content={
 *     <div>
 *       <div>Base Skill: 65</div>
 *       <div>Training Bonus: +10</div>
 *       <div>Total: 75</div>
 *     </div>
 *   }
 * >
 *   <span className="stat">Skill: 75</span>
 * </StatTooltip>
 * ```
 */
export function StatTooltip({ content, children, placement = 'top', ...props }: TooltipProps) {
  return (
    <Tooltip
      content={content}
      placement={placement}
      theme="dark"
      delay={[300, 0]}
      {...props}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Quick tooltip (no delay, for instant feedback)
 * 
 * @example
 * ```tsx
 * <QuickTooltip content="Copy to clipboard">
 *   <button onClick={copyToClipboard}>Copy</button>
 * </QuickTooltip>
 * ```
 */
export function QuickTooltip({ content, children, ...props }: TooltipProps) {
  return (
    <Tooltip
      content={content}
      delay={0}
      animation="fade"
      {...props}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Error tooltip (for validation errors)
 * 
 * @example
 * ```tsx
 * <ErrorTooltip content="Invalid salary amount">
 *   <input className="error" />
 * </ErrorTooltip>
 * ```
 */
export function ErrorTooltip({ content, children, ...props }: TooltipProps) {
  return (
    <Tooltip
      content={content}
      theme="material"
      placement="bottom"
      trigger="focusin"
      className="tooltip-error"
      {...props}
    >
      {children}
    </Tooltip>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create tooltip content with title and description
 * 
 * @param title - Tooltip title
 * @param description - Tooltip description
 * @returns Formatted tooltip content
 * 
 * @example
 * ```tsx
 * <Tooltip content={createTooltipContent('Skill Level', 'Affects productivity and quality')}>
 *   <span>Skill: 75</span>
 * </Tooltip>
 * ```
 */
export function createTooltipContent(title: string, description: string): ReactNode {
  return (
    <div className="tooltip-content">
      <div className="tooltip-title" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {title}
      </div>
      <div className="tooltip-description" style={{ fontSize: '0.9em', opacity: 0.9 }}>
        {description}
      </div>
    </div>
  );
}

/**
 * Create stat breakdown tooltip
 * 
 * @param stat - Stat name
 * @param value - Current value
 * @param breakdown - Breakdown of components
 * @returns Formatted stat tooltip
 * 
 * @example
 * ```tsx
 * <Tooltip
 *   content={createStatBreakdown('Skill', 75, [
 *     { label: 'Base', value: 65 },
 *     { label: 'Training', value: +10 },
 *   ])}
 * >
 *   <span>Skill: 75</span>
 * </Tooltip>
 * ```
 */
export function createStatBreakdown(
  stat: string,
  value: number,
  breakdown: Array<{ label: string; value: number }>
): ReactNode {
  return (
    <div className="stat-breakdown" style={{ minWidth: '180px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
        {stat}: {value}
      </div>
      <div style={{ fontSize: '0.9em' }}>
        {breakdown.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ opacity: 0.8 }}>{item.label}:</span>
            <span style={{ fontWeight: 'bold', color: item.value >= 0 ? '#4ade80' : '#f87171' }}>
              {item.value >= 0 ? '+' : ''}{item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Create list tooltip
 * 
 * @param title - List title
 * @param items - List items
 * @returns Formatted list tooltip
 * 
 * @example
 * ```tsx
 * <Tooltip
 *   content={createListTooltip('Benefits', [
 *     '+15% productivity',
 *     '+10% loyalty',
 *     'Access to training'
 *   ])}
 * >
 *   <span>Senior Developer</span>
 * </Tooltip>
 * ```
 */
export function createListTooltip(title: string, items: string[]): ReactNode {
  return (
    <div className="list-tooltip">
      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em' }}>
        {items.map((item, index) => (
          <li key={index} style={{ padding: '2px 0' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default Tooltip;

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Library Choice:
 *    - Uses @tippyjs/react (React wrapper for Tippy.js)
 *    - Lightweight, performant, accessible
 *    - Excellent positioning with Popper.js
 *    - Rich feature set (themes, animations, interactivity)
 * 
 * 2. Accessibility:
 *    - ARIA role="tooltip" for screen readers
 *    - Keyboard navigation support (focus trigger)
 *    - High contrast themes available
 *    - Proper focus management
 * 
 * 3. Performance:
 *    - Lazy rendering (tooltip created on demand)
 *    - Smart positioning (viewport boundary detection)
 *    - GPU-accelerated animations
 *    - Minimal re-renders
 * 
 * 4. Theming:
 *    - 5 built-in themes (dark, light, light-border, material, translucent)
 *    - Custom theme support via className
 *    - CSS variables for easy customization
 *    - Consistent with app design system
 * 
 * 5. Interactive Tooltips:
 *    - Can contain clickable content (links, buttons)
 *    - Stays open when hovering tooltip content
 *    - Useful for complex help content
 *    - Click trigger for mobile-friendly tooltips
 * 
 * 6. Positioning:
 *    - 12 placement options (top, right, bottom, left + variations)
 *    - Auto placement (finds best position)
 *    - Smart flip (avoids viewport edges)
 *    - Configurable offset for fine-tuning
 * 
 * 7. Animations:
 *    - 5 animation types (shift-away, scale, perspective, fade)
 *    - Configurable delay for hover intent
 *    - Smooth transitions (CSS-based)
 *    - Can disable animations for accessibility
 * 
 * 8. Preset Components:
 *    - InfoTooltip: Light theme, right placement
 *    - HelpTooltip: Interactive, click trigger
 *    - StatTooltip: Dark theme, delayed hover
 *    - QuickTooltip: Instant feedback, no delay
 *    - ErrorTooltip: Validation errors, focus trigger
 * 
 * 9. Utility Functions:
 *    - createTooltipContent: Title + description format
 *    - createStatBreakdown: Game stat breakdowns
 *    - createListTooltip: Bullet point lists
 * 
 * 10. Best Practices:
 *     - Keep tooltip content concise (< 350px width)
 *     - Use delays for hover intent (prevent accidental triggers)
 *     - Interactive tooltips for complex content
 *     - Match theme to surrounding UI
 *     - Test with keyboard navigation
 * 
 * 11. Common Use Cases:
 *     - Employee stats (skill, morale, loyalty breakdowns)
 *     - Action buttons (explain what button does)
 *     - Info icons (additional context)
 *     - Chart data points (show exact values)
 *     - Form validation (error messages)
 *     - Help text (clickable help content)
 * 
 * 12. Future Enhancements:
 *     - Rich media tooltips (images, videos)
 *     - Tooltip groups (mutual exclusivity)
 *     - Touch gesture support
 *     - Tooltip history/breadcrumbs
 *     - Analytics tracking (which tooltips used most)
 */
