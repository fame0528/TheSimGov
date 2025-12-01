/**
 * @fileoverview Crime Domain Dashboard Page
 * @module app/game/crime
 * 
 * OVERVIEW:
 * Main Crime domain dashboard showing all 5 entity types (Facilities, Routes,
 * Marketplace, Laundering, Heat). Uses CrimeDashboard component for maximum
 * code reuse and provides tab-based navigation between entity types.
 * 
 * FEATURES:
 * - Summary cards with key metrics
 * - Tabbed interface for each entity type
 * - Create modals for facilities, routes, listings, channels
 * - Heat level monitoring
 * - Real-time data via SWR hooks
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CrimeDashboard } from '@/components/crime';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import {
  CreateFacilityModal,
  CreateRouteModal,
  CreateListingModal,
  CreateChannelModal,
} from '@/components/crime/modals';
import { useCrimeSummary } from '@/hooks/useCrime';

/**
 * Crime Domain Dashboard Page
 * 
 * NAVIGATION:
 * - Tabs switch between entity types
 * - Click entity card → detail view (future)
 * - Click create → modal for that entity type
 * 
 * SECURITY:
 * - All data is user-scoped via auth session
 * - Facilities/Routes/Channels filtered by ownerId
 * - Marketplace filtered by sellerId
 */
export default function CrimePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

  // Fetch dashboard summary data
  const { data: summary, error, isLoading } = useCrimeSummary(
    session?.user?.companyId || null,
    session?.user?.id || null
  );

  /**
   * Handle tab change
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  /**
   * Handle entity creation success
   */
  const handleCreateSuccess = () => {
    // SWR will auto-revalidate
    setShowFacilityModal(false);
    setShowRouteModal(false);
    setShowListingModal(false);
    setShowChannelModal(false);
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout title="Crime Operations" subtitle="Underground economy management">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Crime Operations" subtitle="Underground economy management">
        <ErrorMessage error={error.message || 'Failed to load crime data'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Crime Operations"
      subtitle={`Managing ${summary?.totalFacilities || 0} facilities, ${summary?.totalRoutes || 0} routes`}
    >
      {summary && (
        <CrimeDashboard
          summary={summary}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onCreateFacility={() => setShowFacilityModal(true)}
          onCreateRoute={() => setShowRouteModal(true)}
          onCreateListing={() => setShowListingModal(true)}
          onCreateChannel={() => setShowChannelModal(true)}
        />
      )}

      {/* Modals */}
      <CreateFacilityModal
        isOpen={showFacilityModal}
        onClose={() => setShowFacilityModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <CreateRouteModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <CreateListingModal
        isOpen={showListingModal}
        onClose={() => setShowListingModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <CreateChannelModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Session Management: Uses next-auth for user authentication
 * 2. SWR Integration: useCrimeSummary hook provides cached data with auto-revalidation
 * 3. Modal Pattern: Create modals for each entity type, closed on success
 * 4. Tab State: Local state manages active tab, passed to CrimeDashboard
 * 5. Loading States: Shows spinner during initial load, error message on failure
 * 
 * FUTURE ENHANCEMENTS:
 * - Individual entity detail pages
 * - Edit/Delete modals
 * - Batch operations
 * - Export to CSV
 * - Real-time notifications (raids, seizures)
 * 
 * @created 2025-12-01
 * @version 1.0.0
 */

