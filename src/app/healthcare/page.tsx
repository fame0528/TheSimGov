/**
 * @fileoverview Healthcare Industry Dashboard Page
 * @description Main entry point for healthcare portfolio management
 * @version 1.0.0
 * @created 2025-11-25
 * @lastModified 2025-11-25
 * @author ECHO v1.3.0 Healthcare Component Library
 */

import { Suspense } from 'react';
import { HealthcareDashboard } from '@/components/healthcare';

/**
 * Healthcare Page Component
 * Entry point for healthcare industry management
 * 
 * Features:
 * - Complete healthcare portfolio dashboard
 * - Hospital, clinic, pharmaceutical, device, research, and insurance management
 * - Real-time metrics and analytics
 * - SWR-powered data fetching with auto-refresh
 * 
 * @route /healthcare
 */
export default function HealthcarePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <HealthcareDashboard />
      </Suspense>
    </div>
  );
}
