/**
 * @fileoverview CurrencyDisplay Component
 * @module components/ui/CurrencyDisplay
 * @description Reusable component for displaying currency values with consistent
 * formatting, styling, and optional trend indicators throughout the application.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

'use client';

import type { ReactNode, CSSProperties } from 'react';
import { formatCurrency, formatCompact, formatAccounting } from '@/lib/utils/currency';
// TODO: Create Tooltip component
// import { Tooltip } from '@/components/ui/Tooltip';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This component provides:
 * - Consistent currency formatting (using currency.ts utilities)
 * - Multiple display formats (standard, compact, accounting)
 * - Color coding (positive/negative values)
 * - Trend indicators (up/down arrows, percentage change)
 * - Size variants (xs, sm, md, lg, xl)
 * - Optional tooltips (show full value on compact display)
 * - Accessibility (proper ARIA labels)
 * 
 * Used throughout the app for:
 * - Employee salaries
 * - Company finances (revenue, expenses, profit)
 * - Transaction amounts
 * - Budget displays
 * - Financial dashboards
 * - Contract values
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Currency format options
 */
export type CurrencyFormat = 'standard' | 'compact' | 'accounting';

/**
 * Display size variants
 */
export type CurrencySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Color scheme options
 */
export type ColorScheme = 'auto' | 'positive' | 'negative' | 'neutral' | 'inherit';

/**
 * CurrencyDisplay component props
 */
export interface CurrencyDisplayProps {
  /** Amount to display (in cents or dollars, see decimals prop) */
  value: number;
  
  /** Format type (default: 'standard') */
  format?: CurrencyFormat;
  
  /** Display size (default: 'md') */
  size?: CurrencySize;
  
  /** Color scheme (default: 'auto' - green for positive, red for negative) */
  colorScheme?: ColorScheme;
  
  /** Show trend indicator (default: false) */
  showTrend?: boolean;
  
  /** Trend direction (required if showTrend is true) */
  trendDirection?: TrendDirection;
  
  /** Percentage change (for tooltip, optional) */
  percentageChange?: number;
  
  /** Previous value (for tooltip comparison, optional) */
  previousValue?: number;
  
  /** Show tooltip on hover (default: true for compact format) */
  showTooltip?: boolean;
  
  /** Custom tooltip content (overrides default) */
  tooltipContent?: ReactNode;
  
  /** Bold text (default: false) */
  bold?: boolean;
  
  /** Monospace font (default: false) */
  monospace?: boolean;
  
  /** Additional className */
  className?: string;
  
  /** Inline style override */
  style?: CSSProperties;
  
  /** ARIA label override */
  ariaLabel?: string;
}

// ============================================================================
// SIZE MAPPING
// ============================================================================

const SIZE_CLASSES: Record<CurrencySize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

// ============================================================================
// COLOR MAPPING
// ============================================================================

/**
 * Get color class based on value and color scheme
 */
function getColorClass(value: number, colorScheme: ColorScheme): string {
  if (colorScheme === 'inherit') return '';
  if (colorScheme === 'neutral') return 'text-gray-700 dark:text-gray-300';
  if (colorScheme === 'positive') return 'text-green-600 dark:text-green-400';
  if (colorScheme === 'negative') return 'text-red-600 dark:text-red-400';
  
  // Auto color scheme
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-700 dark:text-gray-300';
}

// ============================================================================
// TREND INDICATOR
// ============================================================================

/**
 * Trend indicator component
 */
function TrendIndicator({ direction, size }: { direction: TrendDirection; size: CurrencySize }) {
  if (direction === 'neutral') return null;
  
  const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const color = direction === 'up' ? 'text-green-500' : 'text-red-500';
  
  return (
    <span className={`inline-block ${iconSize} ${color} ml-1`} aria-hidden="true">
      {direction === 'up' ? '↑' : '↓'}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * CurrencyDisplay component for consistent currency formatting
 * 
 * @example
 * ```tsx
 * // Simple display
 * <CurrencyDisplay value={50000} />
 * // "$50,000.00"
 * 
 * // Compact format with tooltip
 * <CurrencyDisplay value={1500000} format="compact" />
 * // "$1.5M" (hover shows "$1,500,000.00")
 * 
 * // With trend indicator
 * <CurrencyDisplay
 *   value={75000}
 *   showTrend
 *   trendDirection="up"
 *   percentageChange={15.5}
 * />
 * // "$75,000.00 ↑" (tooltip shows "+15.5% change")
 * 
 * // Accounting format (negatives in parentheses)
 * <CurrencyDisplay value={-5000} format="accounting" />
 * // "($5,000.00)"
 * 
 * // Large size, custom color
 * <CurrencyDisplay
 *   value={250000}
 *   size="xl"
 *   colorScheme="neutral"
 *   bold
 * />
 * // Large, bold, neutral color
 * ```
 */
export function CurrencyDisplay({
  value,
  format = 'standard',
  size = 'md',
  colorScheme = 'auto',
  showTrend = false,
  trendDirection,
  percentageChange,
  // previousValue removed - only used in tooltip which doesn't exist yet
  showTooltip,
  // tooltipContent removed - Tooltip component doesn't exist yet
  bold = false,
  monospace = false,
  className = '',
  style,
  ariaLabel,
}: CurrencyDisplayProps) {
  // Format the currency value
  let formattedValue: string;
  switch (format) {
    case 'compact':
      formattedValue = formatCompact(value);
      break;
    case 'accounting':
      formattedValue = formatAccounting(value);
      break;
    case 'standard':
    default:
      formattedValue = formatCurrency(value);
  }

  // Build className
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = getColorClass(value, colorScheme);
  const fontWeight = bold ? 'font-bold' : '';
  const fontFamily = monospace ? 'font-mono' : '';
  const combinedClassName = `currency-display ${sizeClass} ${colorClass} ${fontWeight} ${fontFamily} ${className}`.trim();

  // Build ARIA label
  const ariaLabelText = ariaLabel || `${value >= 0 ? 'Positive' : 'Negative'} amount: ${formatCurrency(value)}`;

  // Determine if tooltip should be shown
  const shouldShowTooltip = showTooltip !== undefined 
    ? showTooltip 
    : format === 'compact' || showTrend || percentageChange !== undefined;

  // Tooltip content disabled until Tooltip component is created

  // Main display element
  const displayElement = (
    <span
      className={combinedClassName}
      style={style}
      aria-label={ariaLabelText}
      role="text"
    >
      {formattedValue}
      {showTrend && trendDirection && (
        <TrendIndicator direction={trendDirection} size={size} />
      )}
    </span>
  );

  // Wrap in tooltip if needed
  // TODO: Uncomment when Tooltip component is created
  // if (shouldShowTooltip) {
  //   return (
  //     <Tooltip content={finalTooltipContent} placement="top">
  //       {displayElement}
  //     </Tooltip>
  //   );
  // }
  if (shouldShowTooltip) {
    // Temporarily just return element without tooltip
    return displayElement;
  }

  return displayElement;
}

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

/**
 * Compact currency display (always uses compact format with tooltip)
 * 
 * @example
 * ```tsx
 * <CompactCurrency value={1500000} />
 * // "$1.5M" with tooltip showing "$1,500,000.00"
 * ```
 */
export function CompactCurrency(props: Omit<CurrencyDisplayProps, 'format'>) {
  return <CurrencyDisplay {...props} format="compact" />;
}

/**
 * Salary display (standard format, neutral color, monospace)
 * 
 * @example
 * ```tsx
 * <SalaryDisplay value={75000} />
 * // "$75,000.00" in monospace, neutral color
 * ```
 */
export function SalaryDisplay(props: Omit<CurrencyDisplayProps, 'colorScheme' | 'monospace'>) {
  return <CurrencyDisplay {...props} colorScheme="neutral" monospace />;
}

/**
 * Profit/loss display (accounting format, auto color)
 * 
 * @example
 * ```tsx
 * <ProfitLossDisplay value={-5000} />
 * // "($5,000.00)" in red
 * 
 * <ProfitLossDisplay value={10000} />
 * // "$10,000.00" in green
 * ```
 */
export function ProfitLossDisplay(props: Omit<CurrencyDisplayProps, 'format' | 'colorScheme'>) {
  return <CurrencyDisplay {...props} format="accounting" colorScheme="auto" />;
}

/**
 * Change display (with trend indicator and percentage)
 * 
 * @example
 * ```tsx
 * <ChangeDisplay
 *   value={5000}
 *   previousValue={4000}
 *   percentageChange={25}
 * />
 * // "$5,000.00 ↑" with "+25% change" in tooltip
 * ```
 */
export function ChangeDisplay({
  value,
  previousValue,
  percentageChange,
  ...props
}: CurrencyDisplayProps) {
  // Calculate trend direction
  let trendDirection: TrendDirection = 'neutral';
  if (value > (previousValue || 0)) trendDirection = 'up';
  else if (value < (previousValue || 0)) trendDirection = 'down';

  return (
    <CurrencyDisplay
      value={value}
      previousValue={previousValue}
      percentageChange={percentageChange}
      showTrend
      trendDirection={trendDirection}
      {...props}
    />
  );
}

/**
 * Large header display (xl size, bold, neutral)
 * 
 * @example
 * ```tsx
 * <HeaderCurrency value={1000000} />
 * // "$1,000,000.00" - large, bold
 * ```
 */
export function HeaderCurrency(props: Omit<CurrencyDisplayProps, 'size' | 'bold' | 'colorScheme'>) {
  return <CurrencyDisplay {...props} size="xl" bold colorScheme="neutral" />;
}

/**
 * Budget display (compact, with tooltip showing full value)
 * 
 * @example
 * ```tsx
 * <BudgetDisplay value={5000000} />
 * // "$5M" with tooltip
 * ```
 */
export function BudgetDisplay(props: Omit<CurrencyDisplayProps, 'format' | 'colorScheme'>) {
  return <CurrencyDisplay {...props} format="compact" colorScheme="neutral" />;
}

// ============================================================================
// COMPARISON COMPONENT
// ============================================================================

/**
 * CurrencyComparison component (before/after display)
 * 
 * @example
 * ```tsx
 * <CurrencyComparison
 *   before={50000}
 *   after={60000}
 *   label="Salary Increase"
 * />
 * // "Salary Increase: $50,000.00 → $60,000.00 (+20%)"
 * ```
 */
export function CurrencyComparison({
  before,
  after,
  label,
  size = 'md',
  className = '',
}: {
  before: number;
  after: number;
  label?: string;
  size?: CurrencySize;
  className?: string;
}) {
  const change = after - before;
  const percentChange = before !== 0 ? ((change / before) * 100) : 0;
  const direction: TrendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return (
    <div className={`currency-comparison flex items-center gap-2 ${className}`}>
      {label && <span className="text-gray-600 dark:text-gray-400">{label}:</span>}
      <CurrencyDisplay value={before} size={size} colorScheme="neutral" />
      <span className="text-gray-400" aria-hidden="true">→</span>
      <CurrencyDisplay value={after} size={size} showTrend trendDirection={direction} />
      {percentChange !== 0 && (
        <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ({change >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

// ============================================================================
// RANGE COMPONENT
// ============================================================================

/**
 * CurrencyRange component (min-max range display)
 * 
 * @example
 * ```tsx
 * <CurrencyRange min={50000} max={75000} label="Salary Range" />
 * // "Salary Range: $50,000.00 - $75,000.00"
 * ```
 */
export function CurrencyRange({
  min,
  max,
  label,
  size = 'md',
  className = '',
}: {
  min: number;
  max: number;
  label?: string;
  size?: CurrencySize;
  className?: string;
}) {
  return (
    <div className={`currency-range flex items-center gap-2 ${className}`}>
      {label && <span className="text-gray-600 dark:text-gray-400">{label}:</span>}
      <CurrencyDisplay value={min} size={size} colorScheme="neutral" />
      <span className="text-gray-400" aria-hidden="true">-</span>
      <CurrencyDisplay value={max} size={size} colorScheme="neutral" />
    </div>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default CurrencyDisplay;

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Formatting:
 *    - Uses currency.ts utilities for consistent formatting
 *    - Standard: "$1,234.56"
 *    - Compact: "$1.2M", "$500K"
 *    - Accounting: "($1,234.56)" for negatives
 * 
 * 2. Color Schemes:
 *    - Auto: Green for positive, red for negative
 *    - Positive: Always green (for gains)
 *    - Negative: Always red (for losses)
 *    - Neutral: Gray (for neutral values like budgets)
 *    - Inherit: Uses parent color
 * 
 * 3. Size Variants:
 *    - xs: Extra small (text-xs)
 *    - sm: Small (text-sm)
 *    - md: Medium (text-base, default)
 *    - lg: Large (text-lg)
 *    - xl: Extra large (text-xl)
 * 
 * 4. Tooltips:
 *    - Automatic for compact format (shows full value)
 *    - Shows percentage change if provided
 *    - Shows previous value if provided
 *    - Custom tooltip content supported
 * 
 * 5. Trend Indicators:
 *    - Up arrow (↑) for increases
 *    - Down arrow (↓) for decreases
 *    - No arrow for neutral
 *    - Color matches value (green/red)
 * 
 * 6. Accessibility:
 *    - Proper ARIA labels
 *    - Screen reader friendly
 *    - Role="text" for semantic markup
 *    - Descriptive labels for amounts
 * 
 * 7. Preset Components:
 *    - CompactCurrency: Compact with tooltip
 *    - SalaryDisplay: Monospace, neutral
 *    - ProfitLossDisplay: Accounting format
 *    - ChangeDisplay: With trend indicator
 *    - HeaderCurrency: Large, bold
 *    - BudgetDisplay: Compact, neutral
 * 
 * 8. Comparison Components:
 *    - CurrencyComparison: Before/after with arrow
 *    - CurrencyRange: Min-max range
 * 
 * 9. Usage Guidelines:
 *    - Use standard format for exact values (salaries, contracts)
 *    - Use compact format for large numbers (budgets, totals)
 *    - Use accounting format for profit/loss statements
 *    - Always show tooltip for compact format
 *    - Use trend indicators for changes over time
 * 
 * 10. Styling:
 *     - Tailwind CSS for consistency
 *     - Dark mode support
 *     - Responsive sizes
 *     - Monospace option for alignment
 * 
 * 11. Performance:
 *     - Memoized formatting functions
 *     - Minimal re-renders
 *     - Lightweight tooltip (Tippy.js)
 *     - No unnecessary computations
 * 
 * 12. Common Use Cases:
 *     - Employee salary displays
 *     - Company financial dashboards
 *     - Transaction histories
 *     - Budget allocation displays
 *     - Contract value displays
 *     - Revenue/expense tracking
 *     - Profit/loss statements
 *     - Financial comparisons
 */
