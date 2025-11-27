/**
 * @fileoverview Countdown Timer Component
 * @module lib/components/politics/shared/CountdownTimer
 * 
 * OVERVIEW:
 * Real-time countdown timer for bill voting deadlines.
 * Updates every second with urgency-based color indicators.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Chip } from '@heroui/chip';
import { formatTimeRemaining, formatTimeWithUrgency } from '@/lib/utils/politics/billFormatting';

export interface CountdownTimerProps {
  /** Voting deadline as Date or ISO string */
  deadline: Date | string;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Callback when timer expires */
  onExpire?: () => void;
}

/**
 * CountdownTimer - Real-time voting deadline countdown
 * 
 * Features:
 * - Updates every second
 * - Color-coded urgency (normal/warning/urgent/expired)
 * - Optional expiration callback
 * - Responsive sizing
 * 
 * @example
 * ```tsx
 * <CountdownTimer
 *   deadline={bill.votingDeadline}
 *   onExpire={() => refetchBill()}
 * />
 * 
 * <CountdownTimer
 *   deadline={new Date(Date.now() + 3600000)}
 *   size="lg"
 *   showIcon
 * />
 * ```
 */
export function CountdownTimer({
  deadline,
  showIcon = true,
  size = 'md',
  className = '',
  onExpire,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(() => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    return deadlineDate.getTime() - Date.now();
  });
  
  useEffect(() => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    
    const interval = setInterval(() => {
      const ms = deadlineDate.getTime() - Date.now();
      setRemaining(ms);
      
      // Call onExpire when timer hits zero
      if (ms <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [deadline, onExpire]);
  
  const { text, urgency } = formatTimeWithUrgency(remaining);
  
  // Map urgency to HeroUI color
  const colorMap = {
    normal: 'primary',
    warning: 'warning',
    urgent: 'danger',
    expired: 'default',
  } as const;
  
  const color = colorMap[urgency];
  
  // Icon based on urgency
  const icon = showIcon ? (
    urgency === 'expired' ? '⏱️' : 
    urgency === 'urgent' ? '⚠️' : 
    urgency === 'warning' ? '⏰' : 
    '🕐'
  ) : null;
  
  return (
    <Chip
      color={color}
      size={size}
      variant={urgency === 'expired' ? 'flat' : 'solid'}
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
 * 1. **Real-Time Updates**: setInterval updates every second
 * 2. **Memory Safety**: Clears interval on unmount
 * 3. **Expiration Callback**: Optional onExpire for refetching data
 * 4. **Color Urgency**: Visual feedback as deadline approaches
 * 5. **Type Flexibility**: Accepts Date objects or ISO strings
 * 
 * PREVENTS:
 * - Memory leaks from uncleaned intervals
 * - Stale deadline displays
 * - Inconsistent urgency indicators
 */
