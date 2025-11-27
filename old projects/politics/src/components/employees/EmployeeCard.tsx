/**
 * @file src/components/employees/EmployeeCard.tsx
 * @description Employee summary card component with skill visualization
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Displays employee summary information in a card format with visual skill indicators,
 * performance rating, retention risk level, and quick action buttons. Used in employee
 * lists, dashboards, and management interfaces. Supports compact and expanded modes.
 * 
 * FEATURES:
 * - Employee photo and basic info (name, role, tenure)
 * - Visual skill bars for top 3 skills
 * - Performance rating with star display
 * - Retention risk indicator with color coding
 * - Quick actions: Train, Review, Counter-offer, Fire
 * - Compact/expanded view modes
 * - Responsive design for mobile/desktop
 * - Tooltip support for detailed metrics
 * 
 * PROPS:
 * ```typescript
 * interface EmployeeCardProps {
 *   employee: {
 *     id: string;
 *     fullName: string;
 *     role: string;
 *     hiredAt: Date;
 *     skills: Record<string, number>;
 *     performanceRating: number;
 *     salary: number;
 *     retentionRisk: number;
 *     morale: number;
 *     loyalty: number;
 *     satisfaction: number;
 *   };
 *   compact?: boolean;              // Use compact display
 *   showActions?: boolean;          // Show action buttons
 *   onTrain?: (id: string) => void;
 *   onReview?: (id: string) => void;
 *   onCounterOffer?: (id: string) => void;
 *   onFire?: (id: string) => void;
 *   onClick?: (id: string) => void; // Card click handler
 * }
 * ```
 * 
 * USAGE:
 * ```tsx
 * <EmployeeCard
 *   employee={employee}
 *   showActions={true}
 *   onTrain={(id) => router.push(`/employees/${id}/train`)}
 *   onReview={(id) => router.push(`/employees/${id}/review`)}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Uses Tooltip component for hover details
 * - Color coding: Green (low risk), Yellow (medium), Red (high), Critical (very high)
 * - Skills sorted by value, top 3 displayed
 * - Performance rating displayed as stars (1-5)
 * - Tenure calculated from hiredAt to current date
 * - Responsive grid layout for mobile/desktop
 * - Action buttons hidden in compact mode
 * - Click on card triggers onClick handler if provided
 */

'use client';

import { formatCurrency } from '@/lib/utils/currency';
// TODO: Create Tooltip component
// import Tooltip from '@/components/ui/Tooltip';

interface EmployeeCardProps {
  employee: {
    _id: string;
    fullName: string;
    role: string;
    hiredAt: string | Date;
    skills: Record<string, number>;
    performanceRating: number;
    salary: number;
    retentionRisk: number;
    morale: number;
    loyalty: number;
    satisfaction: number;
    firedAt?: string | Date;
  };
  compact?: boolean;
  showActions?: boolean;
  onTrain?: (_id: string) => void;
  onReview?: (_id: string) => void;
  onCounterOffer?: (_id: string) => void;
  onFire?: (_id: string) => void;
  onClick?: (_id: string) => void;
}

/**
 * Get retention risk level and color
 */
function getRetentionRiskStyle(risk: number): {
  level: string;
  color: string;
  bgColor: string;
} {
  if (risk >= 80) {
    return {
      level: 'Critical',
      color: 'text-red-700',
      bgColor: 'bg-red-100 border-red-300',
    };
  } else if (risk >= 60) {
    return {
      level: 'High',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100 border-orange-300',
    };
  } else if (risk >= 40) {
    return {
      level: 'Medium',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100 border-yellow-300',
    };
  } else if (risk >= 20) {
    return {
      level: 'Low',
      color: 'text-green-700',
      bgColor: 'bg-green-100 border-green-300',
    };
  } else {
    return {
      level: 'Very Low',
      color: 'text-green-800',
      bgColor: 'bg-green-200 border-green-400',
    };
  }
}

/**
 * Get performance rating stars
 */
function renderStars(rating: number): JSX.Element {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-500 text-sm">
          ★
        </span>
      ))}
      {hasHalfStar && (
        <span className="text-yellow-500 text-sm">☆</span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 text-sm">
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-gray-600">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Calculate tenure in years
 */
function calculateTenure(hiredAt: string | Date): string {
  const hiredDate = typeof hiredAt === 'string' ? new Date(hiredAt) : hiredAt;
  const months = Math.floor(
    (Date.now() - hiredDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  } else {
    return `${years}y ${remainingMonths}m`;
  }
}

/**
 * Get top 3 skills sorted by value
 */
function getTopSkills(skills: Record<string, number>): Array<{
  name: string;
  value: number;
}> {
  return Object.entries(skills)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

/**
 * Format skill name for display
 */
function formatSkillName(skill: string): string {
  // Convert camelCase to Title Case
  return skill
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Employee card component
 */
export default function EmployeeCard({
  employee,
  compact = false,
  showActions = true,
  onTrain,
  onReview,
  onCounterOffer,
  onFire,
  onClick,
}: EmployeeCardProps): JSX.Element {
  const riskStyle = getRetentionRiskStyle(employee.retentionRisk);
  const topSkills = getTopSkills(employee.skills);
  const tenure = calculateTenure(employee.hiredAt);
  const isFired = !!employee.firedAt;

  const handleCardClick = () => {
    if (onClick && !isFired) {
      onClick(employee._id);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border border-gray-200
        transition-all duration-200
        ${onClick && !isFired ? 'cursor-pointer hover:shadow-lg hover:border-blue-300' : ''}
        ${isFired ? 'opacity-60' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {employee.fullName}
            </h3>
            {isFired && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                Fired
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {employee.role} • {tenure}
          </p>
        </div>

        {/* Retention Risk Badge */}
        {!isFired && (
          // TODO: Uncomment when Tooltip component is created
          // <Tooltip content={`Retention Risk: ${employee.retentionRisk}%`}>
            <div
              className={`
                px-2 py-1 rounded-md border text-xs font-medium
                ${riskStyle.bgColor} ${riskStyle.color}
              `}
            >
              {riskStyle.level}
            </div>
          // </Tooltip>
        )}
      </div>

      {/* Performance & Salary */}
      {!compact && !isFired && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Performance</p>
            {renderStars(employee.performanceRating)}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Salary</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(employee.salary)}
            </p>
          </div>
        </div>
      )}

      {/* Top Skills */}
      {!isFired && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Top Skills</p>
          <div className="space-y-2">
            {topSkills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-700">{formatSkillName(skill.name)}</span>
                  <span className="text-gray-500 font-medium">{skill.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Metrics */}
      {!compact && !isFired && (
        <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-100">
          {/* TODO: Uncomment when Tooltip component is created */}
          {/* <Tooltip content="Employee morale (0-100)"> */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Morale</p>
              <p
                className={`text-sm font-semibold ${
                  employee.morale >= 70
                    ? 'text-green-600'
                    : employee.morale >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {employee.morale}
              </p>
            </div>
          {/* </Tooltip> */}

          {/* <Tooltip content="Employee loyalty (0-100)"> */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Loyalty</p>
              <p
                className={`text-sm font-semibold ${
                  employee.loyalty >= 70
                    ? 'text-green-600'
                    : employee.loyalty >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {employee.loyalty}
              </p>
            </div>
          {/* </Tooltip> */}

          {/* <Tooltip content="Job satisfaction (0-100)"> */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Satisfaction</p>
              <p
                className={`text-sm font-semibold ${
                  employee.satisfaction >= 70
                    ? 'text-green-600'
                    : employee.satisfaction >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {employee.satisfaction}
              </p>
            </div>
          {/* </Tooltip> */}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && !compact && !isFired && (
        <div className="grid grid-cols-2 gap-2">
          {onTrain && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrain(employee._id);
              }}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors"
            >
              Train
            </button>
          )}

          {onReview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview(employee._id);
              }}
              className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-md hover:bg-green-100 transition-colors"
            >
              Review
            </button>
          )}

          {onCounterOffer && employee.retentionRisk >= 40 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCounterOffer(employee._id);
              }}
              className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-md hover:bg-yellow-100 transition-colors"
            >
              Counter-Offer
            </button>
          )}

          {onFire && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `Are you sure you want to fire ${employee.fullName}? This action cannot be undone.`
                  )
                ) {
                  onFire(employee._id);
                }
              }}
              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
            >
              Fire
            </button>
          )}
        </div>
      )}
    </div>
  );
}
