/**
 * @fileoverview Company Dashboard Page - Industry-Contextual
 * @module app/(game)/companies/[id]
 * 
 * OVERVIEW:
 * Industry-aware company dashboard that renders specialized dashboards
 * based on company.industry and company.subcategory.
 * 
 * PATTERN:
 * Technology + AI → AICompanyDashboard (13,500+ lines of AI code!)
 * Technology + Software → SoftwareDashboard (future)
 * Energy → EnergyDashboard (future)
 * Default → GenericDashboard (financials, level progression)
 * 
 * @created 2025-11-20
 * @updated 2025-11-28 - Added industry-contextual dashboard detection
 * @author ECHO v1.3.1
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCompany } from '@/lib/hooks/useCompany';
import { useAICompanySummary } from '@/lib/hooks/useAI';
import { useEnergySummary } from '@/lib/hooks/useEnergy';
import { useSoftwareProducts } from '@/lib/hooks/useSoftware';
import { useEcommerceSummary } from '@/lib/hooks/useEcommerce';
import { useManufacturingSummary } from '@/lib/hooks/useManufacturing';
import { useConsulting } from '@/hooks/useConsulting';
import { useCrimeSummary } from '@/hooks/useCrime';
import { useHealthcareSummary } from '@/lib/hooks/useHealthcare';
import { useMediaSummary } from '@/lib/hooks/useMedia';
import { IndustryType, TechnologySubcategory } from '@/lib/types';
import { COMPANY_LEVELS } from '@/lib/utils/constants';
import { formatCurrency } from '@/lib/utils';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { AICompanyDashboard } from '@/lib/components/ai';
import { EnergyDashboard } from '@/lib/components/energy';
import { SoftwareDashboard } from '@/lib/components/software';
import { EcommerceDashboard } from '@/lib/components/ecommerce';
import { ManufacturingDashboard } from '@/components/manufacturing';
import { ConsultingDashboard } from '@/components/consulting';
import { CrimeDashboard } from '@/components/crime';
import { HealthcareDashboard } from '@/components/healthcare';
import { MediaDashboard } from '@/components/media';
import { BankingDashboard } from '@/components/banking';
import { EdTechDashboardWrapper } from '@/components/edtech';
import { EmployeeDashboardWrapper } from '@/components/employee';
import { Button, Progress } from '@heroui/react';
import Image from 'next/image';
import ImageUpload from '@/components/shared/ImageUpload';

/**
 * Extended company type for runtime properties
 */
interface ExtendedCompany {
  id: string;
  name: string;
  industry: IndustryType | string;
  subcategory?: TechnologySubcategory;
  level: number;
  cash: number;
  revenue: number;
  expenses: number;
  employees: string[];
  contracts: string[];
  loans: string[];
  logoUrl?: string;
  ownerUsername?: string;
}

/**
 * Detect if company should use AI Dashboard
 */
function isAICompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  const subcategory = company.subcategory?.toLowerCase();
  
  return (industry === 'technology' || industry === 'tech') && subcategory === 'ai';
}

/**
 * Detect if company should use Energy Dashboard
 * Matches: Energy industry (any subcategory: oil, gas, renewable, utilities)
 */
function isEnergyCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'energy';
}

/**
 * Detect if company should use Software Dashboard
 * Matches: Technology industry with Software subcategory
 */
function isSoftwareCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  const subcategory = company.subcategory?.toLowerCase();
  
  return (industry === 'technology' || industry === 'tech') && subcategory === 'software';
}

/**
 * Detect if company should use E-Commerce Dashboard
 * Matches: Retail industry OR Technology with E-Commerce subcategory
 */
function isEcommerceCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  const subcategory = company.subcategory?.toLowerCase();
  
  return industry === 'retail' || 
         ((industry === 'technology' || industry === 'tech') && subcategory === 'e-commerce');
}

/**
 * Detect if company should use EdTech Dashboard
 * Matches: Education industry OR Technology with EdTech subcategory
 */
function isEdTechCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  const subcategory = company.subcategory?.toLowerCase();
  
  return industry === 'education' || 
         ((industry === 'technology' || industry === 'tech') && subcategory === 'edtech');
}

/**
 * Detect if company should use Manufacturing Dashboard
 * Matches: Manufacturing industry (any subcategory)
 */
function isManufacturingCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'manufacturing';
}

/**
 * Detect if company should use Consulting Dashboard
 * Matches: Consulting industry OR Professional Services industry
 */
function isConsultingCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'consulting' || industry === 'professional services';
}

/**
 * Detect if company should use Crime Dashboard
 * Matches: Crime industry OR Underworld subcategory
 */
function isCrimeCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  const subcategory = company.subcategory?.toLowerCase();
  
  return industry === 'crime' || 
         industry === 'underworld' || 
         subcategory === 'crime' || 
         subcategory === 'underworld';
}

/**
 * Detect if company should use Healthcare Dashboard
 * Matches: Healthcare industry (hospitals, clinics, pharma, devices, insurance)
 */
function isHealthcareCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'healthcare' || 
         industry === 'medical' || 
         industry === 'pharmaceutical' ||
         industry === 'biotech';
}

/**
 * Detect if company should use Media Dashboard
 * Matches: Media industry (entertainment, advertising, content, influencers)
 */
function isMediaCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'media' || 
         industry === 'entertainment' || 
         industry === 'advertising' ||
         industry === 'broadcasting';
}

/**
 * Detect if company should use Banking Dashboard
 * Matches: Banking/Finance industry (banks, lending, investments)
 */
function isBankingCompany(company: ExtendedCompany): boolean {
  const industry = String(company.industry).toLowerCase();
  return industry === 'banking' || 
         industry === 'finance' || 
         industry === 'financial services' ||
         industry === 'fintech';
}

/**
 * Detect if company should show Employee Management Dashboard
 * ALL companies with employees should have access to employee management
 * This is a universal feature, not industry-specific
 */
function hasEmployeeManagement(company: ExtendedCompany): boolean {
  return (company.employees?.length ?? 0) > 0;
}

/**
 * AI Company Dashboard Wrapper
 * Fetches AI-specific data and renders AICompanyDashboard
 */
function AICompanyDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: aiSummary, isLoading: aiLoading, error: aiError } = useAICompanySummary(companyId);
  
  if (aiLoading) {
    return (
      <DashboardLayout title={company.name} subtitle="🤖 AI Company • Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (aiError) {
    return (
      <DashboardLayout title={company.name} subtitle="🤖 AI Company">
        <ErrorMessage error={aiError || 'Failed to load AI data'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🤖 AI Company • Level ${company.level}`}
    >
      <AICompanyDashboard
        companyId={companyId}
        totalModels={aiSummary?.totalModels ?? 0}
        activeResearch={aiSummary?.activeResearch ?? 0}
        gpuUtilization={aiSummary?.gpuUtilization ?? 0}
        monthlyRevenue={aiSummary?.monthlyRevenue ?? 0}
        recentActivity={aiSummary?.recentActivity ?? []}
        onNewModel={() => router.push(`/game/companies/${companyId}/ai/models/new`)}
        onNewResearch={() => router.push(`/game/companies/${companyId}/ai/research/new`)}
        onHireTalent={() => router.push(`/game/companies/${companyId}/ai/talent`)}
      />
    </DashboardLayout>
  );
}

/**
 * Energy Company Dashboard Wrapper
 * Fetches energy-specific data and renders EnergyDashboard
 */
function EnergyDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: energySummary, isLoading: energyLoading, error: energyError } = useEnergySummary(companyId);
  
  if (energyLoading) {
    return (
      <DashboardLayout title={company.name} subtitle="⚡ Energy Company • Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (energyError) {
    return (
      <DashboardLayout title={company.name} subtitle="⚡ Energy Company">
        <ErrorMessage error={energyError || 'Failed to load energy data'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`⚡ Energy Company • Level ${company.level}`}
    >
      <EnergyDashboard
        companyId={companyId}
        totalOilWells={energySummary?.totalOilWells ?? 0}
        dailyOilProduction={energySummary?.dailyOilProduction ?? 0}
        totalGasFields={energySummary?.totalGasFields ?? 0}
        dailyGasProduction={energySummary?.dailyGasProduction ?? 0}
        totalSolarFarms={energySummary?.totalSolarFarms ?? 0}
        solarCapacityMW={energySummary?.solarCapacityMW ?? 0}
        totalWindTurbines={energySummary?.totalWindTurbines ?? 0}
        windCapacityMW={energySummary?.windCapacityMW ?? 0}
        totalPowerPlants={energySummary?.totalPowerPlants ?? 0}
        powerPlantCapacityMW={energySummary?.powerPlantCapacityMW ?? 0}
        totalStorageUnits={energySummary?.totalStorageUnits ?? 0}
        storageCapacityMWh={energySummary?.storageCapacityMWh ?? 0}
        totalCapacityMW={energySummary?.totalCapacityMW ?? 0}
        currentOutputMW={energySummary?.currentOutputMW ?? 0}
        renewablePercentage={energySummary?.renewablePercentage ?? 0}
        carbonEmissions={energySummary?.carbonEmissions ?? 0}
        monthlyRevenue={energySummary?.monthlyRevenue ?? 0}
        onNewWell={() => router.push(`/game/companies/${companyId}/energy/wells/new`)}
        onNewSolarFarm={() => router.push(`/game/companies/${companyId}/energy/solar/new`)}
        onNewWindFarm={() => router.push(`/game/companies/${companyId}/energy/wind/new`)}
      />
    </DashboardLayout>
  );
}

/**
 * Software Company Dashboard Wrapper
 * Fetches software-specific data and renders SoftwareDashboard
 */
function SoftwareDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: softwareData, isLoading: softwareLoading, error: softwareError } = useSoftwareProducts(companyId);
  
  if (softwareLoading) {
    return (
      <DashboardLayout title={company.name} subtitle="💻 Software Company • Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (softwareError) {
    return (
      <DashboardLayout title={company.name} subtitle="💻 Software Company">
        <ErrorMessage error={softwareError || 'Failed to load software data'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`💻 Software Company • Level ${company.level}`}
    >
      <SoftwareDashboard
        companyId={companyId}
        companyName={company.name}
        totalProducts={softwareData?.count ?? 0}
        activeProducts={softwareData?.activeProducts ?? 0}
        avgQualityScore={softwareData?.avgQuality ?? 0}
        totalRevenue={softwareData?.totalRevenue ?? 0}
        mrr={softwareData?.totalMRR ?? 0}
        arr={(softwareData?.totalMRR ?? 0) * 12}
        onNewProduct={() => router.push(`/game/companies/${companyId}/software/products/new`)}
        onViewBugs={() => router.push(`/game/companies/${companyId}/software/bugs`)}
        onViewFeatures={() => router.push(`/game/companies/${companyId}/software/features`)}
      />
    </DashboardLayout>
  );
}

/**
 * E-Commerce Company Dashboard Wrapper
 * Fetches e-commerce-specific data and renders EcommerceDashboard
 */
function EcommerceDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { data: ecommerceSummary, isLoading: ecommerceLoading, error: ecommerceError } = useEcommerceSummary(companyId);
  
  if (ecommerceLoading) {
    return (
      <DashboardLayout title={company.name} subtitle="🛒 E-Commerce Company • Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (ecommerceError) {
    return (
      <DashboardLayout title={company.name} subtitle="🛒 E-Commerce Company">
        <ErrorMessage error={ecommerceError || 'Failed to load e-commerce data'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🛒 E-Commerce Company • Level ${company.level}`}
    >
      <EcommerceDashboard
        companyId={companyId}
        companyName={company.name}
        totalProducts={ecommerceSummary?.products.total ?? 0}
        activeProducts={ecommerceSummary?.products.active ?? 0}
        totalRevenue={ecommerceSummary?.orders.totalRevenue ?? 0}
        totalOrders={ecommerceSummary?.orders.total ?? 0}
        avgRating={ecommerceSummary?.products.avgRating ?? 0}
        onNewProduct={() => router.push(`/game/companies/${companyId}/ecommerce/products/new`)}
        onViewOrders={() => router.push(`/game/companies/${companyId}/ecommerce/orders`)}
        onViewReviews={() => router.push(`/game/companies/${companyId}/ecommerce/reviews`)}
      />
    </DashboardLayout>
  );
}

/**
 * Manufacturing Company Dashboard Wrapper
 * Renders ManufacturingDashboard with company context
 */
function ManufacturingDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  // ManufacturingDashboard fetches its own data internally via useManufacturing hooks
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🏭 Manufacturing Company • Level ${company.level}`}
    >
      <ManufacturingDashboard
        companyId={companyId}
        onFacilityClick={(facilityId) => router.push(`/game/companies/${companyId}/manufacturing/facilities/${facilityId}`)}
        onProductionLineClick={(lineId) => router.push(`/game/companies/${companyId}/manufacturing/lines/${lineId}`)}
        onSupplierClick={(supplierId) => router.push(`/game/companies/${companyId}/manufacturing/suppliers/${supplierId}`)}
        onAddFacility={() => router.push(`/game/companies/${companyId}/manufacturing/facilities/new`)}
        onAddProductionLine={() => router.push(`/game/companies/${companyId}/manufacturing/lines/new`)}
        onAddSupplier={() => router.push(`/game/companies/${companyId}/manufacturing/suppliers/new`)}
      />
    </DashboardLayout>
  );
}

/**
 * Consulting Company Dashboard Wrapper
 * Renders ConsultingDashboard with company context
 */
function ConsultingDashboardWrapper({ 
  company, 
  companyId,
}: { 
  company: ExtendedCompany; 
  companyId: string;
}) {
  // ConsultingDashboard fetches its own data internally via useConsulting hooks
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`💼 Consulting Company • Level ${company.level}`}
    >
      <ConsultingDashboard companyId={companyId} />
    </DashboardLayout>
  );
}

/**
 * Crime Company Dashboard Wrapper
 * Fetches crime-specific data and renders CrimeDashboard
 */
function CrimeDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch crime summary data - we need userId from session
  // For now, pass companyId as owner context
  const { data: crimeSummary, isLoading: crimeLoading, error: crimeError } = useCrimeSummary(companyId, null);
  
  if (crimeLoading) {
    return (
      <DashboardLayout title={company.name} subtitle="🔫 Underworld Operations • Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (crimeError || !crimeSummary) {
    return (
      <DashboardLayout title={company.name} subtitle="🔫 Underworld Operations">
        <ErrorMessage error={crimeError || 'Failed to load crime data'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🔫 Underworld Operations • Level ${company.level}`}
    >
      <CrimeDashboard
        summary={crimeSummary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateFacility={() => router.push(`/game/companies/${companyId}/crime/facilities/new`)}
        onCreateRoute={() => router.push(`/game/companies/${companyId}/crime/routes/new`)}
        onCreateListing={() => router.push(`/game/companies/${companyId}/crime/marketplace/new`)}
        onCreateChannel={() => router.push(`/game/companies/${companyId}/crime/laundering/new`)}
      />
    </DashboardLayout>
  );
}

/**
 * Healthcare Company Dashboard Wrapper
 * Renders HealthcareDashboard with company context
 */
function HealthcareDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🏥 Healthcare Company • Level ${company.level}`}
    >
      <HealthcareDashboard
        companyId={companyId}
        onSectorSelect={(sector) => router.push(`/game/companies/${companyId}/healthcare/${sector}`)}
      />
    </DashboardLayout>
  );
}

/**
 * Media Company Dashboard Wrapper
 * Renders MediaDashboard with company context
 */
function MediaDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`📺 Media Company • Level ${company.level}`}
    >
      <MediaDashboard
        companyId={companyId}
        onNewCampaign={() => router.push(`/game/companies/${companyId}/media/campaigns/new`)}
        onNewContent={() => router.push(`/game/companies/${companyId}/media/content/new`)}
        onNewSponsorship={() => router.push(`/game/companies/${companyId}/media/sponsorships/new`)}
        onViewAnalytics={() => router.push(`/game/companies/${companyId}/media/analytics`)}
      />
    </DashboardLayout>
  );
}

/**
 * Banking Company Dashboard Wrapper
 * Renders BankingDashboard with company context
 */
function BankingDashboardWrapper({ 
  company, 
  companyId,
  router 
}: { 
  company: ExtendedCompany; 
  companyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <DashboardLayout 
      title={company.name} 
      subtitle={`🏦 Banking & Finance • Level ${company.level}`}
    >
      <BankingDashboard
        companyId={companyId}
        onApplyLoan={() => alert('Loan application coming soon!')}
        onMakePayment={() => alert('Payment system coming soon!')}
        onViewInvestments={() => alert('Investment tracking coming soon!')}
        onViewTransactions={() => alert('Transaction history coming soon!')}
      />
    </DashboardLayout>
  );
}

/**
 * Generic Company Dashboard
 * Shows financials, level progression, and quick actions
 */
function GenericCompanyDashboard({
  company,
  companyId,
  router,
  refetch,
}: {
  company: ExtendedCompany;
  companyId: string;
  router: ReturnType<typeof useRouter>;
  refetch: () => Promise<unknown>;
}) {
  const [levelingUp, setLevelingUp] = useState(false);
  const [levelUpError, setLevelUpError] = useState('');

  const handleLevelUp = async () => {
    setLevelingUp(true);
    setLevelUpError('');

    try {
      const response = await fetch(`/api/companies/${companyId}/level-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Level-up failed');
      }

      await refetch();
    } catch (err) {
      setLevelUpError(err instanceof Error ? err.message : 'Level-up failed');
    } finally {
      setLevelingUp(false);
    }
  };

  // Level configuration
  const currentLevelKey = Object.keys(COMPANY_LEVELS).find(
    (key) => COMPANY_LEVELS[key as keyof typeof COMPANY_LEVELS].level === company.level
  ) as keyof typeof COMPANY_LEVELS | undefined;
  
  const currentLevel = currentLevelKey ? COMPANY_LEVELS[currentLevelKey] : null;
  
  const nextLevelKey = Object.keys(COMPANY_LEVELS).find(
    (key) => COMPANY_LEVELS[key as keyof typeof COMPANY_LEVELS].level === company.level + 1
  ) as keyof typeof COMPANY_LEVELS | undefined;
  
  const nextLevel = nextLevelKey ? COMPANY_LEVELS[nextLevelKey] : null;

  const levelUpCost = nextLevel ? Math.round(nextLevel.minRevenue * 0.1) : 0;

  const revenueProgress = nextLevel 
    ? Math.min(100, (company.revenue / nextLevel.minRevenue) * 100)
    : 100;
  
  const employeeProgress = nextLevel && nextLevel.maxEmployees !== -1
    ? Math.min(100, ((company.employees?.length ?? 0) / nextLevel.maxEmployees) * 100)
    : 100;
  
  const capitalProgress = levelUpCost > 0
    ? Math.min(100, ((company.cash ?? 0) / levelUpCost) * 100)
    : 100;

  const canLevelUp = nextLevel && 
    (company.revenue ?? 0) >= nextLevel.minRevenue &&
    (nextLevel.maxEmployees === -1 || (company.employees?.length ?? 0) <= nextLevel.maxEmployees) &&
    (company.cash ?? 0) >= levelUpCost;

  return (
    <DashboardLayout
      title={company.name}
      subtitle={`${company.industry} • Level ${company.level}`}
    >
      <div className="space-y-6">

        {/* Company Logo */}
        <Card title="Company Logo" showDivider>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
              {company.logoUrl ? (
                <Image src={company.logoUrl} alt={`${company.name} logo`} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No logo</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">Upload a custom company logo (optional).</p>
              <ImageUpload
                endpoint="/api/upload/company-logo"
                onUploadSuccess={async (url) => {
                  await fetch(`/api/companies/${companyId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logoUrl: url }),
                  });
                  await refetch();
                }}
                onUploadError={(errs) => console.warn('Logo upload failed', errs)}
              />
            </div>
          </div>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Cash" showDivider>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(company.cash)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available funds</p>
          </Card>

          <Card title="Revenue" showDivider>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(company.revenue)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total income</p>
          </Card>

          <Card title="Expenses" showDivider>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(company.expenses)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total costs</p>
          </Card>

          <Card title="Profit" showDivider>
            <div className={`text-3xl font-bold ${
              (company.revenue ?? 0) - (company.expenses ?? 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency((company.revenue ?? 0) - (company.expenses ?? 0))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Net income</p>
          </Card>
        </div>

        {/* Level Progression */}
        <Card title="Level Progression" showDivider>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  Level {company.level}: {currentLevel?.name || 'Unknown'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {(company.employees?.length ?? 0)} employees • {(company.contracts?.length ?? 0)} contracts • {(company.loans?.length ?? 0)} loans
                </p>
              </div>
              {nextLevel && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next Level</p>
                  <p className="font-semibold text-lg">Level {nextLevel.level}: {nextLevel.name}</p>
                </div>
              )}
            </div>

            {nextLevel && (
              <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                <h4 className="font-semibold">Level-Up Requirements</h4>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Revenue: {formatCurrency(company.revenue)} / {formatCurrency(nextLevel.minRevenue)}</span>
                    <span>{revenueProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={revenueProgress} color={revenueProgress >= 100 ? 'success' : 'primary'} size="sm" className="h-2" />
                </div>

                {nextLevel.maxEmployees !== -1 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Employees: {company.employees?.length ?? 0} / {nextLevel.maxEmployees} max</span>
                      <span>{employeeProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={employeeProgress} color={employeeProgress <= 100 ? 'success' : 'warning'} size="sm" className="h-2" />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level-Up Cost: {formatCurrency(company.cash)} / {formatCurrency(levelUpCost)}</span>
                    <span>{capitalProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={capitalProgress} color={capitalProgress >= 100 ? 'success' : 'primary'} size="sm" className="h-2" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    color="primary"
                    onPress={handleLevelUp}
                    isDisabled={!canLevelUp || levelingUp}
                    isLoading={levelingUp}
                    className="w-full"
                  >
                    {canLevelUp ? `Level Up for ${formatCurrency(levelUpCost)}` : 'Requirements Not Met'}
                  </Button>
                </div>

                {levelUpError && <ErrorMessage error={levelUpError} />}
              </div>
            )}

            {!nextLevel && (
              <div className="text-center py-4 text-green-600 dark:text-green-400 font-semibold">
                🎉 Maximum Level Reached!
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          {hasEmployeeManagement(company) && (
            <Button 
              color="primary" 
              variant="flat"
              onPress={() => router.push(`/game/companies/${companyId}/employees`)}
            >
              👥 Employee Management
            </Button>
          )}
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/edit`)}>
            Edit Company
          </Button>
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/employees`)}>
            Manage Employees
          </Button>
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/contracts`)}>
            View Contracts
          </Button>
          <Button color="danger" variant="bordered" onPress={() => {
            if (confirm('Are you sure you want to delete this company? This cannot be undone.')) {
              router.push('/dashboard');
            }
          }}>
            Delete Company
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * Main Company Dashboard Page
 * Routes to industry-specific dashboard based on company type
 */
export default function CompanyDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  
  const { data: company, isLoading, error, refetch } = useCompany(companyId);

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !company) {
    return (
      <DashboardLayout title="Error" subtitle="">
        <ErrorMessage error={error || 'Company not found'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }

  // Cast to extended company type
  const extendedCompany = company as ExtendedCompany;

  // Route to industry-specific dashboard
  if (isAICompany(extendedCompany)) {
    return (
      <AICompanyDashboardWrapper 
        company={extendedCompany} 
        companyId={companyId}
        router={router}
      />
    );
  }

  // Energy industry dashboard
  if (isEnergyCompany(extendedCompany)) {
    return (
      <EnergyDashboardWrapper 
        company={extendedCompany} 
        companyId={companyId}
        router={router}
      />
    );
  }

  // Software industry dashboard
  if (isSoftwareCompany(extendedCompany)) {
    return (
      <SoftwareDashboardWrapper 
        company={extendedCompany} 
        companyId={companyId}
        router={router}
      />
    );
  }

  // E-Commerce industry dashboard
  if (isEcommerceCompany(extendedCompany)) {
    return (
      <EcommerceDashboardWrapper 
        company={extendedCompany} 
        companyId={companyId}
        router={router}
      />
    );
  }

  // EdTech industry dashboard
  if (isEdTechCompany(extendedCompany)) {
    return (
      <EdTechDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
      />
    );
  }

  // Manufacturing industry dashboard
  if (isManufacturingCompany(extendedCompany)) {
    return (
      <ManufacturingDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
        router={router}
      />
    );
  }

  // Consulting industry dashboard
  if (isConsultingCompany(extendedCompany)) {
    return (
      <ConsultingDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
      />
    );
  }

  // Crime/Underworld industry dashboard
  if (isCrimeCompany(extendedCompany)) {
    return (
      <CrimeDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
        router={router}
      />
    );
  }

  // Healthcare industry dashboard
  if (isHealthcareCompany(extendedCompany)) {
    return (
      <HealthcareDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
        router={router}
      />
    );
  }

  // Media industry dashboard
  if (isMediaCompany(extendedCompany)) {
    return (
      <MediaDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
        router={router}
      />
    );
  }

  // Banking/Finance industry dashboard
  if (isBankingCompany(extendedCompany)) {
    return (
      <BankingDashboardWrapper
        company={extendedCompany}
        companyId={companyId}
        router={router}
      />
    );
  }

  // Default: Generic dashboard
  return (
    <GenericCompanyDashboard
      company={extendedCompany}
      companyId={companyId}
      router={router}
      refetch={refetch}
    />
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * INDUSTRY-CONTEXTUAL DASHBOARD PATTERN:
 * 1. Company page detects industry + subcategory
 * 2. Routes to appropriate specialized dashboard
 * 3. Each dashboard fetches its own domain-specific data
 * 4. Shared components (Card, DashboardLayout) maintain consistency
 * 
 * SUPPORTED INDUSTRIES (11 total):
 * - Technology + AI → AICompanyDashboard ✓
 * - Technology + Software → SoftwareDashboard ✓
 * - Energy → EnergyDashboard ✓
 * - Retail / Technology + E-Commerce → EcommerceDashboard ✓
 * - Education / Technology + EdTech → EdTechDashboard ✓
 * - Manufacturing → ManufacturingDashboard ✓
 * - Consulting / Professional Services → ConsultingDashboard ✓
 * - Crime / Underworld → CrimeDashboard ✓
 * - Healthcare / Medical / Pharma → HealthcareDashboard ✓
 * - Media / Entertainment / Advertising → MediaDashboard ✓
 * - Banking / Finance / Fintech → BankingDashboard ✓
 * - Default → GenericDashboard
 * 
 * TO ADD NEW INDUSTRY:
 * 1. Create detection function (e.g., isNewIndustryCompany)
 * 2. Create DashboardWrapper that fetches industry data
 * 3. Add conditional render in CompanyDashboardPage
 * 
 * @updated 2025-12-05
 * @author ECHO v1.4.0
 */
