/**
 * @file components/ui/QuickActionsWrapper.tsx
 * @description Client wrapper for QuickActionsOverlay with default actions
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Client component that provides default quick action menu items for the global overlay.
 * Separates client-side logic from server layout component.
 */

"use client";

import { useMemo } from 'react';
import QuickActionsOverlay from './QuickActionsOverlay';

/**
 * QuickActionsWrapper component
 * 
 * @description
 * Provides default quick action menu items for global navigation overlay.
 * Uses client-side hooks for action definitions.
 * 
 * @returns {JSX.Element} QuickActionsOverlay with default actions
 */
export default function QuickActionsWrapper() {
  // Build default actions using useMemo for performance
  const actions = useMemo(() => [
    { 
      label: 'New Company', 
      icon: 'fa-solid fa-building', 
      onClick: () => window.location.href = '/companies/new' 
    },
    { 
      label: 'Map', 
      icon: 'fa-solid fa-map', 
      onClick: () => window.location.href = '/map' 
    },
    { 
      label: 'Market', 
      icon: 'fa-solid fa-chart-line', 
      onClick: () => window.location.href = '/market' 
    },
    { 
      label: 'Dashboard', 
      icon: 'fa-solid fa-home', 
      onClick: () => window.location.href = '/dashboard' 
    },
  ], []);

  return <QuickActionsOverlay actions={actions} />;
}
