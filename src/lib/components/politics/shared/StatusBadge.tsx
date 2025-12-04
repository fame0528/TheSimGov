/**
 * @fileoverview Status Badge Component
 * @module lib/components/politics/shared/StatusBadge
 * 
 * OVERVIEW:
 * Reusable badge for displaying bill status, debate positions, and chamber.
 * Consistent color coding across entire legislative system.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { Chip } from '@heroui/chip';
import type { BillStatus, Chamber } from '@/lib/db/models/Bill';
import type { DebatePosition } from '@/lib/db/models/DebateStatement';
import {
  getBillStatusColor,
  getBillStatusText,
  getPositionColor,
  getPositionIcon,
  getChamberColor,
  getChamberShortName,
} from '@/lib/utils/politics/billFormatting';

type BadgeType = 'status' | 'position' | 'chamber';

export interface StatusBadgeProps {
  /** Badge type */
  type: BadgeType;
  /** Value to display (status, position, or chamber) */
  value: BillStatus | DebatePosition | Chamber;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * StatusBadge - Consistent status/position/chamber display
 * 
 * Features:
 * - Type-safe value handling
 * - Automatic color mapping
 * - Optional icons
 * - Responsive sizing
 * 
 * @example
 * ```tsx
 * <StatusBadge type="status" value="ACTIVE" />
 * <StatusBadge type="position" value="FOR" showIcon />
 * <StatusBadge type="chamber" value="senate" size="lg" />
 * ```
 */
export function StatusBadge({
  type,
  value,
  size = 'md',
  showIcon = false,
  className = '',
}: StatusBadgeProps) {
  let color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  let text: string;
  let icon: string | null = null;
  
  switch (type) {
    case 'status':
      color = getBillStatusColor(value as BillStatus);
      text = getBillStatusText(value as BillStatus);
      break;
      
    case 'position':
      color = getPositionColor(value as DebatePosition);
      text = value as string;
      if (showIcon) {
        icon = getPositionIcon(value as DebatePosition);
      }
      break;
      
    case 'chamber':
      color = getChamberColor(value as Chamber);
      text = getChamberShortName(value as Chamber);
      break;
      
    default:
      color = 'default';
      text = value as string;
  }
  
  return (
    <Chip
      color={color}
      size={size}
      variant="flat"
      className={className}
      startContent={icon ? <span>{icon}</span> : undefined}
    >
      {text}
    </Chip>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Strict typing prevents invalid value/type combos
 * 2. **Centralized Logic**: All color/text mapping in billFormatting utils
 * 3. **Consistent Display**: Same badge appearance across all components
 * 4. **HeroUI Integration**: Uses HeroUI Chip component for styling
 * 5. **Icon Support**: Optional icons for visual enhancement
 * 
 * PREVENTS:
 * - Inconsistent badge styling
 * - Hardcoded color values
 * - Duplicate status display logic
 */
