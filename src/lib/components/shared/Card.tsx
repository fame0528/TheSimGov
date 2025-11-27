/**
 * @fileoverview Card Component
 * @module lib/components/shared/Card
 * 
 * OVERVIEW:
 * Reusable card container with consistent styling.
 * Used for content sections, dashboards, and lists.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Card as HeroCard, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { ReactNode } from 'react';

export interface CardProps {
  /** Card title */
  title?: string;
  /** Card content */
  children: ReactNode;
  /** Show divider after title */
  showDivider?: boolean;
  /** Padding size */
  padding?: number;
  /** Hover effect */
  hoverable?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Card - Consistent content container
 * 
 * @example
 * ```tsx
 * <Card title="Company Details" showDivider>
 *   <Text>Revenue: {formatCurrency(revenue)}</Text>
 *   <Text>Employees: {employeeCount}</Text>
 * </Card>
 * 
 * <Card hoverable onClick={() => router.push(`/companies/${id}`)}>
 *   <Heading size="md">{name}</Heading>
 *   <Text>{industry}</Text>
 * </Card>
 * ```
 */
export function Card({
  title,
  children,
  showDivider = false,
  padding = 6,
  hoverable = false,
  onClick,
}: CardProps) {
  const paddingClass = `p-${padding}`;
  const hoverClass = hoverable || onClick
    ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
    : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <HeroCard
      className={`bg-white ${paddingClass} ${hoverClass} ${cursorClass}`}
      shadow="sm"
      isPressable={!!onClick}
      onPress={onClick}
    >
      {title && (
        <>
          <CardHeader className={showDivider ? 'pb-0' : ''}>
            <h3 className="text-xl font-semibold">{title}</h3>
          </CardHeader>
          {showDivider && <Divider />}
        </>
      )}
      <CardBody className={title ? 'pt-4' : ''}>
        {children}
      </CardBody>
    </HeroCard>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **HeroUI Card**: Uses @heroui/card components (Card, CardHeader, CardBody)
 * 2. **Flexible**: Works with/without title and divider
 * 3. **Interactive**: Optional hover and click effects via isPressable
 * 4. **Responsive**: Adapts to content size
 * 5. **Tailwind CSS**: Custom classes for padding, hover, cursor
 * 
 * PREVENTS:
 * - Duplicate card styling across components
 * - Inconsistent spacing and shadows
 * - Missing hover states for clickable cards
 */
