// src/components/media/SponsorshipDashboard.tsx
// Sponsorship Dashboard Component
// FID-20251127-MEDIA: P1 Core Media Component (Clean Rewrite with HeroUI v2 patterns)
// Features: Active deals, revenue tracking, contract management, performance metrics, deal pipeline

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
  Chip,
  Avatar,
  Tooltip,
  Select,
  SelectItem,
  Input,
  Textarea
} from '@heroui/react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target,
  BarChart3,
  Plus,
  Edit,
  Eye
} from 'lucide-react';

// Import types and utilities
import type {
  SponsorshipDeal,
  PaymentStatus,
  DealPerformance
} from '@/lib/types/media';
import { DealStatus } from '@/lib/types/media';
import { calculateDealROI, calculateEngagementRate, calculateConversionRate } from '@/lib/utils/media';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPercent as formatPercentage } from '@/lib/utils/formatting';

// Mock data for development - replace with API calls
// Using minimal required fields from SponsorshipContract (alias SponsorshipDeal)
const MOCK_DEALS: SponsorshipDeal[] = [
  {
    _id: 'deal1',
    sponsor: 'brand1',
    recipient: 'comp1',
    dealValue: 2500,
    dealStructure: 'Flat',
    duration: 1,
    status: DealStatus.ACTIVE,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    upfrontPayment: 1000,
    monthlyPayment: 750,
    revenueSharePercent: 8,
    performanceBonuses: [],
    totalPaid: 1000,
    remainingPayments: 2,
    requiredMentions: 5,
    contentRequirements: ['Instagram posts', 'Stories'],
    deliveredContent: [],
    approvalRequired: true,
    brandGuidelines: 'https://brand1.com/guidelines',
    exclusivityClause: false,
    competitorCategories: [],
    exclusivityDuration: 0,
    penaltyForViolation: 0,
    totalImpressions: 150000,
    totalEngagement: 4.2,
    brandMentions: 3,
    brandSentiment: 75,
    brandLift: 12,
    estimatedReach: 120000,
    actualReach: 125000,
    milestonesAchieved: 1,
    totalMilestones: 3,
    overdueDeliverables: 0,
    completionRate: 33,
    contractTerms: 'Standard terms',
    terminationClause: 'Standard termination',
    disputeResolution: 'Arbitration',
    intellectualProperty: 'Shared',
    usageRights: 'Social media only',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    // UI-friendly optional fields
    title: 'Summer Fitness Campaign',
    description: 'Promote activewear through Instagram posts and stories',
    platforms: ['instagram'],
    budget: 2500,
    commission: 8,
    paymentStatus: 'pending',
    deliverables: [
      { type: 'SocialPost', platform: 'instagram', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false, metrics: { reach: 0, engagement: 0, clicks: 0 } },
      { type: 'SocialPost', platform: 'instagram', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), completed: false, metrics: { reach: 0, engagement: 0, clicks: 0 } }
    ],
    performance: { impressions: 150000, clicks: 1250, ctr: 0.83, cpc: 2.0, conversions: 45, conversionRate: 3.6, roas: 3.8, spend: 500, reach: 125000, engagementRate: 4.2, totalReach: 125000, totalEngagement: 4.2, totalClicks: 1250, roi: 3.8, brandSatisfaction: 4.5, influencerRating: 4.8 }
  },
  {
    _id: 'deal2',
    sponsor: 'brand2',
    recipient: 'comp1',
    dealValue: 1500,
    dealStructure: 'Flat',
    duration: 1,
    status: DealStatus.COMPLETED,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    upfrontPayment: 750,
    monthlyPayment: 375,
    revenueSharePercent: 8,
    performanceBonuses: [],
    totalPaid: 1500,
    remainingPayments: 0,
    requiredMentions: 3,
    contentRequirements: ['YouTube video'],
    deliveredContent: ['vid1'],
    approvalRequired: true,
    brandGuidelines: 'https://brand2.com/guidelines',
    exclusivityClause: false,
    competitorCategories: [],
    exclusivityDuration: 0,
    penaltyForViolation: 0,
    totalImpressions: 60000,
    totalEngagement: 8.5,
    brandMentions: 5,
    brandSentiment: 85,
    brandLift: 18,
    estimatedReach: 45000,
    actualReach: 50000,
    milestonesAchieved: 3,
    totalMilestones: 3,
    overdueDeliverables: 0,
    completionRate: 100,
    contractTerms: 'Standard terms',
    terminationClause: 'Standard termination',
    disputeResolution: 'Arbitration',
    intellectualProperty: 'Shared',
    usageRights: 'YouTube only',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    // UI-friendly optional fields
    title: 'Tech Product Launch',
    description: 'YouTube review and unboxing of new smartphone',
    platforms: ['youtube'],
    budget: 1500,
    commission: 8,
    paymentStatus: 'paid',
    deliverables: [
      { type: 'Video', platform: 'youtube', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), completed: true, metrics: { reach: 50000, engagement: 8.5, clicks: 2100 } }
    ],
    performance: { impressions: 60000, clicks: 2100, ctr: 3.5, cpc: 0.71, conversions: 85, conversionRate: 4.05, roas: 4.2, spend: 300, reach: 50000, engagementRate: 8.5, totalReach: 50000, totalEngagement: 8.5, totalClicks: 2100, roi: 4.2, brandSatisfaction: 4.9, influencerRating: 4.7 }
  },
  {
    _id: 'deal3',
    sponsor: 'brand3',
    recipient: 'comp1',
    dealValue: 800,
    dealStructure: 'Flat',
    duration: 1,
    status: DealStatus.NEGOTIATING,
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    upfrontPayment: 400,
    monthlyPayment: 200,
    revenueSharePercent: 8,
    performanceBonuses: [],
    totalPaid: 0,
    remainingPayments: 4,
    requiredMentions: 2,
    contentRequirements: ['TikTok videos'],
    deliveredContent: [],
    approvalRequired: true,
    brandGuidelines: 'https://brand3.com/guidelines',
    exclusivityClause: false,
    competitorCategories: [],
    exclusivityDuration: 0,
    penaltyForViolation: 0,
    totalImpressions: 0,
    totalEngagement: 0,
    brandMentions: 0,
    brandSentiment: 0,
    brandLift: 0,
    estimatedReach: 80000,
    actualReach: 0,
    milestonesAchieved: 0,
    totalMilestones: 2,
    overdueDeliverables: 0,
    completionRate: 0,
    contractTerms: 'Standard terms',
    terminationClause: 'Standard termination',
    disputeResolution: 'Arbitration',
    intellectualProperty: 'Shared',
    usageRights: 'TikTok only',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    // UI-friendly optional fields
    title: 'Beauty Tutorial Series',
    description: 'TikTok makeup tutorials featuring new product line',
    platforms: ['tiktok'],
    budget: 800,
    commission: 8,
    paymentStatus: 'pending',
    deliverables: [
      { type: 'Video', platform: 'tiktok', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), completed: false, metrics: { reach: 0, engagement: 0, clicks: 0 } }
    ],
    performance: { impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, conversionRate: 0, roas: 0, spend: 0, reach: 0, engagementRate: 0, totalReach: 0, totalEngagement: 0, totalClicks: 0, roi: 0, brandSatisfaction: 0, influencerRating: 0 }
  }
];

// Revenue data for charts
const REVENUE_DATA = [
  { month: 'Jan', revenue: 8500, deals: 12 },
  { month: 'Feb', revenue: 9200, deals: 15 },
  { month: 'Mar', revenue: 11800, deals: 18 },
  { month: 'Apr', revenue: 10200, deals: 14 },
  { month: 'May', revenue: 13500, deals: 22 },
  { month: 'Jun', revenue: 12800, deals: 19 }
];

// Status config map for consistent styling
const STATUS_CONFIG: Record<DealStatus, { color: 'success' | 'primary' | 'danger' | 'warning' | 'default'; icon: React.FC<{ className?: string }> }> = {
  [DealStatus.PENDING]: { color: 'warning', icon: Clock },
  [DealStatus.ACTIVE]: { color: 'success', icon: Clock },
  [DealStatus.COMPLETED]: { color: 'primary', icon: CheckCircle },
  [DealStatus.CANCELLED]: { color: 'danger', icon: AlertCircle },
  [DealStatus.NEGOTIATING]: { color: 'warning', icon: Users },
  [DealStatus.DRAFT]: { color: 'default', icon: FileText },
  [DealStatus.BREACHED]: { color: 'danger', icon: AlertCircle }
};

interface SponsorshipDashboardProps {
  companyId: string;
}

export const SponsorshipDashboard: React.FC<SponsorshipDashboardProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedDeal, setSelectedDeal] = useState<SponsorshipDeal | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const activeDeals = MOCK_DEALS.filter(d => d.status === DealStatus.ACTIVE);
    const completedDeals = MOCK_DEALS.filter(d => d.status === DealStatus.COMPLETED);
    const totalRevenue = completedDeals.reduce((sum, deal) => sum + (deal.budget ?? deal.dealValue ?? 0), 0);
    const avgROI = completedDeals.length > 0
      ? completedDeals.reduce((sum, deal) => sum + (deal.performance?.roi ?? 0), 0) / completedDeals.length
      : 0;

    return {
      activeDeals: activeDeals.length,
      totalRevenue,
      avgROI,
      completedDeals: completedDeals.length,
      pendingPayments: MOCK_DEALS.filter(d => d.paymentStatus === 'pending').length
    };
  }, []);

  // Filter deals based on status
  const filteredDeals = useMemo(() => {
    if (filterStatus === 'all') return MOCK_DEALS;
    return MOCK_DEALS.filter(deal => deal.status === filterStatus);
  }, [filterStatus]);

  // Handle deal selection
  const handleDealSelect = useCallback((deal: SponsorshipDeal) => {
    setSelectedDeal(deal);
    setShowDealModal(true);
  }, []);

  // Handle deal editing
  const handleEditDeal = useCallback((deal: SponsorshipDeal) => {
    setSelectedDeal(deal);
    setShowEditModal(true);
  }, []);

  // Deal status badge
  const DealStatusBadge: React.FC<{ status: DealStatus }> = ({ status }) => {
    const config = STATUS_CONFIG[status];
    if (!config) {
      return <Badge color="default" variant="flat">{status}</Badge>;
    }
    const Icon = config.icon;

    return (
      <Chip color={config.color} variant="flat" startContent={<Icon className="w-3 h-3" />}>
        {status}
      </Chip>
    );
  };

  // Deal modal component
  const DealModal: React.FC = () => {
    if (!selectedDeal) return null;

    const completedDeliverables = selectedDeal.deliverables?.filter(d => d.completed).length ?? 0;
    const totalDeliverables = selectedDeal.deliverables?.length ?? 0;
    const progressPercentage = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0;

    return (
      <Modal isOpen={showDealModal} onClose={() => setShowDealModal(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold">{selectedDeal.title}</h2>
              <DealStatusBadge status={selectedDeal.status} />
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Deal overview */}
              <Card>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Campaign Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Budget:</strong> {formatCurrency(selectedDeal.budget)}</p>
                        <p><strong>Commission:</strong> {selectedDeal.commission}%</p>
                        <p><strong>Platforms:</strong> {selectedDeal.platforms?.join(', ') ?? 'N/A'}</p>
                        <p><strong>Duration:</strong> {selectedDeal.startDate?.toLocaleDateString() ?? 'N/A'} - {selectedDeal.endDate?.toLocaleDateString() ?? 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Performance</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Reach:</strong> {selectedDeal.performance?.totalReach?.toLocaleString() ?? '0'}</p>
                        <p><strong>Engagement:</strong> {formatPercentage(selectedDeal.performance?.totalEngagement ?? 0)}</p>
                        <p><strong>Clicks:</strong> {selectedDeal.performance?.totalClicks?.toLocaleString() ?? '0'}</p>
                        <p><strong>ROI:</strong> {selectedDeal.performance?.roi ?? 0}x</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Deliverables progress */}
              <Card>
                <CardBody>
                  <h3 className="font-semibold mb-4">Deliverables Progress</h3>
                  <div className="space-y-4">
                    <Progress
                      value={progressPercentage}
                      color="primary"
                      size="lg"
                      label={`${completedDeliverables}/${totalDeliverables} completed`}
                    />
                    <div className="space-y-2">
                      {selectedDeal.deliverables?.map((deliverable, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {deliverable.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium capitalize">{deliverable.type} on {deliverable.platform}</p>
                              <p className="text-sm text-gray-600">
                                Due: {deliverable.dueDate?.toLocaleDateString() ?? 'N/A'}
                              </p>
                            </div>
                          </div>
                          {deliverable.completed && deliverable.metrics && (
                            <div className="text-sm text-gray-600">
                              <p>Reach: {deliverable.metrics.reach?.toLocaleString() ?? '0'}</p>
                              <p>Engagement: {formatPercentage(deliverable.metrics.engagement ?? 0)}</p>
                            </div>
                          )}
                        </div>
                      )) ?? <p className="text-gray-500">No deliverables</p>}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Ratings and feedback */}
              {selectedDeal.status === DealStatus.COMPLETED && selectedDeal.performance && (
                <Card>
                  <CardBody>
                    <h3 className="font-semibold mb-4">Ratings & Feedback</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedDeal.performance.brandSatisfaction ?? 0}/5
                        </div>
                        <p className="text-sm text-gray-600">Brand Satisfaction</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedDeal.performance.influencerRating ?? 0}/5
                        </div>
                        <p className="text-sm text-gray-600">Influencer Rating</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDealModal(false)}>
              Close
            </Button>
            {selectedDeal.status === DealStatus.ACTIVE && (
              <Button color="primary" onPress={() => handleEditDeal(selectedDeal)}>
                Edit Deal
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // Edit deal modal
  const EditDealModal: React.FC = () => {
    const [budget, setBudget] = useState(selectedDeal?.budget ?? 0);
    const [description, setDescription] = useState(selectedDeal?.description ?? '');

    if (!selectedDeal) return null;

    return (
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Edit Deal</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Budget"
                type="number"
                value={budget.toString()}
                onChange={(e) => setBudget(Number(e.target.value))}
                startContent={<DollarSign className="w-4 h-4" />}
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Update campaign description..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={() => {
              // Handle deal update
              setShowEditModal(false);
            }}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sponsorship Dashboard</h1>
          <p className="text-gray-600">Manage your influencer partnerships and track performance</p>
        </div>
        <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
          New Deal
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardMetrics.totalRevenue)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold">{dashboardMetrics.activeDeals}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg ROI</p>
                <p className="text-2xl font-bold">{dashboardMetrics.avgROI.toFixed(1)}x</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold">{dashboardMetrics.pendingPayments}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs - HeroUI v2 pattern: selectedKey + onSelectionChange */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview" />
        <Tab key="deals" title="All Deals" />
        <Tab key="analytics" title="Analytics" />
        <Tab key="pipeline" title="Deal Pipeline" />
      </Tabs>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Recent Deals</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {MOCK_DEALS.slice(0, 5).map(deal => (
                  <div key={deal._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" name={deal.title} />
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(deal.budget)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <DealStatusBadge status={deal.status} />
                      <p className="text-sm text-gray-600 mt-1">
                        {(deal.performance?.roi ?? 0) > 0 ? `${deal.performance?.roi ?? 0}x ROI` : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Revenue Trend</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="w-12 h-12" />
                <span className="ml-2">Revenue chart will be implemented</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'deals' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold">All Deals</h2>
              {/* HeroUI v2 Select: selectedKeys + onSelectionChange, SelectItem key only (no value) */}
              <Select
                placeholder="Filter by status"
                selectedKeys={new Set([filterStatus])}
                onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                className="w-48"
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key={DealStatus.ACTIVE}>Active</SelectItem>
                <SelectItem key={DealStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem key={DealStatus.NEGOTIATING}>Negotiating</SelectItem>
                <SelectItem key={DealStatus.CANCELLED}>Cancelled</SelectItem>
              </Select>
            </div>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>Campaign</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Budget</TableColumn>
                <TableColumn>Progress</TableColumn>
                <TableColumn>Performance</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredDeals.map(deal => {
                  const completedDeliverables = deal.deliverables?.filter(d => d.completed).length ?? 0;
                  const totalDeliverables = deal.deliverables?.length ?? 0;
                  const progressPercentage = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0;

                  return (
                    <TableRow key={deal._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-gray-600">{deal.platforms?.join(', ') ?? 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DealStatusBadge status={deal.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(deal.budget)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercentage} size="sm" className="w-20" />
                          <span className="text-sm">{completedDeliverables}/{totalDeliverables}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Reach: {deal.performance?.totalReach?.toLocaleString() ?? '0'}</p>
                          <p>ROI: {deal.performance?.roi ?? 0}x</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip content="View Details">
                            <Button size="sm" variant="flat" onPress={() => handleDealSelect(deal)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          {deal.status === DealStatus.ACTIVE && (
                            <Tooltip content="Edit Deal">
                              <Button size="sm" variant="flat" onPress={() => handleEditDeal(deal)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Performance Metrics</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Engagement Rate</span>
                  <span className="font-bold">6.2%</span>
                </div>
                <Progress value={62} color="primary" />

                <div className="flex justify-between items-center">
                  <span>Average ROI</span>
                  <span className="font-bold">4.0x</span>
                </div>
                <Progress value={80} color="success" />

                <div className="flex justify-between items-center">
                  <span>Conversion Rate</span>
                  <span className="font-bold">3.8%</span>
                </div>
                <Progress value={38} color="warning" />

                <div className="flex justify-between items-center">
                  <span>Brand Satisfaction</span>
                  <span className="font-bold">4.7/5</span>
                </div>
                <Progress value={94} color="secondary" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Top Performing Platforms</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Instagram</span>
                  <span className="font-bold">4.8x ROI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>YouTube</span>
                  <span className="font-bold">4.2x ROI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>TikTok</span>
                  <span className="font-bold">3.9x ROI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Twitter</span>
                  <span className="font-bold">3.1x ROI</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Deal Pipeline</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {MOCK_DEALS.filter(deal => deal.status === DealStatus.NEGOTIATING).map(deal => (
                <div key={deal._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{deal.title}</h3>
                    <Chip color="warning" variant="flat">Negotiating</Chip>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{deal.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Budget: {formatCurrency(deal.budget)}</span>
                    <span>Platforms: {deal.platforms?.join(', ') ?? 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" color="primary">Accept Terms</Button>
                    <Button size="sm" variant="flat">Counter Offer</Button>
                    <Button size="sm" variant="flat" color="danger">Decline</Button>
                  </div>
                </div>
              ))}
              {MOCK_DEALS.filter(deal => deal.status === DealStatus.NEGOTIATING).length === 0 && (
                <p className="text-center text-gray-500 py-8">No deals in negotiation</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <DealModal />
      <EditDealModal />
    </div>
  );
};

export default SponsorshipDashboard;
