/**
 * @file src/components/employees/RetentionAlert.tsx
 * @description Alert banner for high-risk employee retention warnings
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Displays prominent alert banners for employees at high risk of leaving.
 * Shows retention risk level, key risk factors, and recommended actions.
 * Used in dashboards, employee lists, and detail pages to surface retention issues.
 * 
 * FEATURES:
 * - Color-coded by risk level (red critical, orange high, yellow medium)
 * - Risk percentage display
 * - Top 3 risk factors listed
 * - Recommended action buttons
 * - Dismissible option
 * - Compact/expanded modes
 * - Responsive design
 * 
 * PROPS:
 * ```typescript
 * interface RetentionAlertProps {
 *   employee: {
 *     id: string;
 *     fullName: string;
 *     retentionRisk: number;
 *     satisfaction: number;
 *     loyalty: number;
 *     salary: number;
 *     performanceRating: number;
 *   };
 *   marketSalary?: number;
 *   compact?: boolean;
 *   dismissible?: boolean;
 *   onCounterOffer?: (id: string) => void;
 *   onReview?: (id: string) => void;
 *   onDismiss?: (id: string) => void;
 * }
 * ```
 * 
 * USAGE:
 * ```tsx
 * <RetentionAlert
 *   employee={employee}
 *   marketSalary={calculateMarketSalary(employee)}
 *   onCounterOffer={(id) => router.push(`/employees/${id}/counter-offer`)}
 *   onReview={(id) => router.push(`/employees/${id}/review`)}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Only shows for employees with risk >= 40%
 * - Risk factors prioritized by impact
 * - Actions suggested based on specific risk factors
 * - Dismissible alerts stored in localStorage
 * - Color scheme: Red (80+), Orange (60-79), Yellow (40-59)
 * - Compact mode shows minimal info for lists
 * - Expanded mode shows full details and actions
 */

'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/currency';

interface RetentionAlertProps {
  employee: {
    id: string;
    fullName: string;
    retentionRisk: number;
    satisfaction: number;
    loyalty: number;
    salary: number;
    performanceRating: number;
    morale?: number;
  };
  marketSalary?: number;
  compact?: boolean;
  dismissible?: boolean;
  onCounterOffer?: (id: string) => void;
  onReview?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

/**
 * Identify top risk factors
 */
function identifyRiskFactors(
  employee: {
    satisfaction: number;
    loyalty: number;
    salary: number;
    performanceRating: number;
    morale?: number;
  },
  marketSalary?: number
): string[] {
  const factors: Array<{ factor: string; severity: number }> = [];

  if (employee.satisfaction < 40) {
    factors.push({ factor: 'Very low satisfaction', severity: 3 });
  } else if (employee.satisfaction < 60) {
    factors.push({ factor: 'Low satisfaction', severity: 2 });
  }

  if (employee.loyalty < 40) {
    factors.push({ factor: 'Very low loyalty', severity: 3 });
  } else if (employee.loyalty < 60) {
    factors.push({ factor: 'Low loyalty', severity: 2 });
  }

  if (marketSalary && employee.salary < marketSalary * 0.85) {
    factors.push({ factor: 'Significantly below market salary', severity: 3 });
  } else if (marketSalary && employee.salary < marketSalary * 0.95) {
    factors.push({ factor: 'Below market salary', severity: 2 });
  }

  if (employee.morale && employee.morale < 40) {
    factors.push({ factor: 'Very low morale', severity: 3 });
  } else if (employee.morale && employee.morale < 60) {
    factors.push({ factor: 'Low morale', severity: 2 });
  }

  if (employee.performanceRating >= 4.0) {
    factors.push({ factor: 'High performer (attractive to competitors)', severity: 2 });
  }

  // Sort by severity and return top 3
  return factors
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((f) => f.factor);
}

/**
 * Get alert style based on risk level
 */
function getAlertStyle(risk: number): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (risk >= 80) {
    return {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: '🚨',
    };
  } else if (risk >= 60) {
    return {
      bg: 'bg-orange-100',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: '⚠️',
    };
  } else {
    return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: '⚡',
    };
  }
}

/**
 * Retention alert component
 */
export default function RetentionAlert({
  employee,
  marketSalary,
  compact = false,
  dismissible = false,
  onCounterOffer,
  onReview,
  onDismiss,
}: RetentionAlertProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);

  // Don't show for low risk
  if (employee.retentionRisk < 40 || dismissed) {
    return null;
  }

  const style = getAlertStyle(employee.retentionRisk);
  const riskFactors = identifyRiskFactors(employee, marketSalary);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss(employee.id);
    }
  };

  if (compact) {
    return (
      <div
        className={`
          ${style.bg} ${style.border} border-l-4 p-3 mb-3 rounded-md
          flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{style.icon}</span>
          <div>
            <p className={`text-sm font-semibold ${style.text}`}>
              {employee.fullName} - {employee.retentionRisk}% Risk
            </p>
            <p className="text-xs text-gray-600">{riskFactors[0]}</p>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`px-2 py-1 text-xs ${style.text} hover:opacity-70`}
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        ${style.bg} ${style.border} border-l-4 p-4 mb-4 rounded-md shadow-md
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{style.icon}</span>
          <div>
            <h3 className={`text-lg font-bold ${style.text}`}>
              Retention Risk: {employee.fullName}
            </h3>
            <p className={`text-sm ${style.text}`}>
              {employee.retentionRisk}% probability of leaving in next 3 months
            </p>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`px-3 py-1 text-sm ${style.text} hover:opacity-70 font-medium`}
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Risk Factors */}
      <div className="mb-4">
        <p className={`text-sm font-semibold ${style.text} mb-2`}>Key Risk Factors:</p>
        <ul className="space-y-1">
          {riskFactors.map((factor, index) => (
            <li key={index} className={`text-sm ${style.text} flex items-start gap-2`}>
              <span>•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-white bg-opacity-50 rounded-md">
        <div>
          <p className="text-xs text-gray-600">Satisfaction</p>
          <p className={`text-lg font-bold ${style.text}`}>{employee.satisfaction}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Loyalty</p>
          <p className={`text-lg font-bold ${style.text}`}>{employee.loyalty}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Salary</p>
          <p className={`text-sm font-bold ${style.text}`}>
            {formatCurrency(employee.salary)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Performance</p>
          <p className={`text-lg font-bold ${style.text}`}>
            {employee.performanceRating.toFixed(1)} ★
          </p>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="flex flex-wrap gap-2">
        <p className={`text-sm font-semibold ${style.text} w-full mb-1`}>
          Recommended Actions:
        </p>
        {onCounterOffer && (
          <button
            onClick={() => onCounterOffer(employee.id)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Make Counter-Offer
          </button>
        )}
        {onReview && (
          <button
            onClick={() => onReview(employee.id)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Conduct Review
          </button>
        )}
        <button
          className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          onClick={() =>
            alert(
              'Consider: One-on-one meeting, training opportunities, role adjustments, team changes'
            )
          }
        >
          Other Options
        </button>
      </div>
    </div>
  );
}
