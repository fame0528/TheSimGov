// src/components/media/MonetizationSettings.tsx
// Monetization Settings Component
// FID-20251127-MEDIA: P1 Core Media Component (Clean Rewrite with HeroUI v2 patterns)
// Features: Revenue streams, pricing tiers, payment processing, analytics dashboard

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
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
  Badge,
  Avatar,
  Tooltip,
  Divider
} from '@heroui/react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  Settings,
  Plus,
  Edit,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Import types and utilities
import type {
  MonetizationSettingsType,
  RevenueStream,
  PricingTier,
  PaymentMethod,
  PayoutSchedule,
  RevenueAnalytics
} from '@/lib/types/media';
import {
  MONETIZATION_FEES,
  PAYOUT_THRESHOLDS,
  SUBSCRIPTION_TIERS,
  REVENUE_STREAM_TYPES,
  calculatePlatformFees,
  calculatePayoutAmount,
  validatePricingTier
} from '@/lib/utils/media';

// Mock data for development
const MOCK_MONETIZATION_SETTINGS: MonetizationSettingsType = {
  _id: 'settings1',
  company: 'comp1',
  isActive: true,
  strategy: 'Hybrid',
  defaultCPM: 5.0,
  subscriptionTiers: [],
  affiliateEnabled: true,
  affiliateCommissionRate: 10,
  affiliateCategories: {},
  platformRevShares: {},
  minCPM: 2.0,
  maxCPM: 20.0,
  targetDemographics: [],
  excludedAdvertisers: [],
  preferredAdvertisers: [],
  totalSubscribers: 1247,
  totalMRR: 2450,
  totalARR: 29400,
  avgRevenuePerUser: 1.96,
  churnRate: 23,
  createdAt: new Date(),
  updatedAt: new Date(),
  revenueStreams: [
    {
      id: 'sponsorships',
      type: 'sponsorships',
      enabled: true,
      commission: 8,
      minimumPayout: 100,
      payoutSchedule: 'monthly',
      settings: {
        autoApproval: false,
        requireContract: true,
        allowNegotiations: true
      }
    },
    {
      id: 'affiliates',
      type: 'affiliates',
      enabled: true,
      commission: 15,
      minimumPayout: 50,
      payoutSchedule: 'weekly',
      settings: {
        trackingEnabled: true,
        cookieDuration: 30,
        allowCustomLinks: true
      }
    },
    {
      id: 'merchandise',
      type: 'merchandise',
      enabled: false,
      commission: 20,
      minimumPayout: 25,
      payoutSchedule: 'biweekly',
      settings: {
        printfulIntegration: false,
        customProducts: false,
        shippingSettings: 'standard'
      }
    }
  ],
  pricingTiers: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic analytics', 'Limited campaigns'],
      limits: { campaigns: 1, influencers: 5 },
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 49,
      features: ['Advanced analytics', 'Unlimited campaigns', 'Priority support'],
      limits: { campaigns: -1, influencers: 50 },
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      features: ['White-label solution', 'API access', 'Dedicated support'],
      limits: { campaigns: -1, influencers: -1 },
      popular: false
    }
  ],
  paymentMethods: [
    {
      id: 'stripe',
      type: 'stripe',
      enabled: true,
      settings: {
        publicKey: 'pk_test_...',
        webhookSecret: 'whsec_...'
      }
    }
  ],
  payoutSettings: {
    schedule: 'monthly',
    method: 'bank_transfer',
    minimumThreshold: 100,
    processingFee: 2.9
  },
  taxSettings: {
    collectTaxes: true,
    taxRate: 8.25,
    taxId: 'TAX123456'
  }
};

const MOCK_REVENUE_DATA = [
  { month: 'Jan', revenue: 12500, transactions: 145, avgOrder: 86.21 },
  { month: 'Feb', revenue: 15200, transactions: 167, avgOrder: 91.02 },
  { month: 'Mar', revenue: 18900, transactions: 203, avgOrder: 93.10 },
  { month: 'Apr', revenue: 22100, transactions: 238, avgOrder: 92.86 },
  { month: 'May', revenue: 25600, transactions: 276, avgOrder: 92.75 },
  { month: 'Jun', revenue: 28300, transactions: 301, avgOrder: 94.02 }
];

interface MonetizationSettingsComponentProps {
  companyId: string;
}

export const MonetizationSettings: React.FC<MonetizationSettingsComponentProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [settings, setSettings] = useState<MonetizationSettingsType>(MOCK_MONETIZATION_SETTINGS);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStream, setEditingStream] = useState<RevenueStream | null>(null);
  const [showNewTierModal, setShowNewTierModal] = useState(false);

  // Calculate revenue metrics
  const revenueMetrics = useMemo(() => {
    const totalRevenue = MOCK_REVENUE_DATA.reduce((sum, month) => sum + month.revenue, 0);
    const totalTransactions = MOCK_REVENUE_DATA.reduce((sum, month) => sum + month.transactions, 0);
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const growthRate = MOCK_REVENUE_DATA.length > 0 && MOCK_REVENUE_DATA[0].revenue > 0
      ? ((MOCK_REVENUE_DATA[MOCK_REVENUE_DATA.length - 1].revenue - MOCK_REVENUE_DATA[0].revenue) / MOCK_REVENUE_DATA[0].revenue) * 100
      : 0;

    return {
      totalRevenue,
      totalTransactions,
      avgOrderValue,
      growthRate,
      monthlyAvg: MOCK_REVENUE_DATA.length > 0 ? totalRevenue / MOCK_REVENUE_DATA.length : 0
    };
  }, []);

  // Handle revenue stream toggle - HeroUI v2: onValueChange for Switch
  const handleStreamToggle = useCallback((streamId: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      revenueStreams: prev.revenueStreams?.map(stream =>
        stream.id === streamId ? { ...stream, enabled } : stream
      ) ?? []
    }));
  }, []);

  // Handle stream editing
  const handleEditStream = useCallback((stream: RevenueStream) => {
    setEditingStream(stream);
    setShowEditModal(true);
  }, []);

  // Handle pricing tier update
  const handleUpdateTier = useCallback((tierId: string, updates: Partial<PricingTier>) => {
    setSettings(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers?.map(tier =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ) ?? []
    }));
  }, []);

  // Revenue Stream Card Component
  const RevenueStreamCard: React.FC<{ stream: RevenueStream }> = ({ stream }) => {
    const platformFee = MONETIZATION_FEES[stream.type as keyof typeof MONETIZATION_FEES] ?? 0;
    
    return (
      <Card className={`transition-all ${!stream.enabled ? 'opacity-60' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                stream.enabled ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <div>
                <h3 className="font-semibold capitalize">{stream.type}</h3>
                <p className="text-sm text-gray-600">
                  {stream.commission}% commission • {stream.payoutSchedule} payouts
                </p>
              </div>
            </div>
            {/* HeroUI v2 Switch: onValueChange (not onChange) */}
            <Switch
              isSelected={stream.enabled}
              onValueChange={(enabled) => handleStreamToggle(stream.id, enabled)}
            />
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Min Payout</p>
                <p className="font-medium">${stream.minimumPayout}</p>
              </div>
              <div>
                <p className="text-gray-600">Platform Fee</p>
                <p className="font-medium">{platformFee}%</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={() => handleEditStream(stream)}>
                <Settings className="w-4 h-4" />
                Configure
              </Button>
              <Button size="sm" variant="flat">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  // Pricing Tier Card Component
  const PricingTierCard: React.FC<{ tier: PricingTier; isEditable?: boolean }> = ({ tier, isEditable = true }) => (
    <Card className={`relative ${tier.popular ? 'border-primary border-2' : ''}`}>
      {tier.popular && (
        <Badge color="primary" className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <div className="text-center w-full">
          <h3 className="text-xl font-bold">{tier.name}</h3>
          <div className="flex items-center justify-center gap-1 mt-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-3xl font-bold">{tier.price}</span>
            <span className="text-gray-600">/month</span>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <ul className="space-y-2">
            {tier.features?.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            )) ?? <li className="text-gray-500">No features listed</li>}
          </ul>

          <Divider />

          <div className="text-sm text-gray-600">
            <p>Limits:</p>
            <ul className="mt-1 space-y-1">
              <li>• {tier.limits?.campaigns === -1 ? 'Unlimited' : tier.limits?.campaigns ?? 0} campaigns</li>
              <li>• {tier.limits?.influencers === -1 ? 'Unlimited' : tier.limits?.influencers ?? 0} influencers</li>
            </ul>
          </div>

          {isEditable && (
            <Button
              fullWidth
              variant="flat"
              onPress={() => handleUpdateTier(tier.id, {})}
            >
              <Edit className="w-4 h-4" />
              Edit Tier
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );

  // Edit Revenue Stream Modal
  const EditStreamModal: React.FC = () => {
    const [commission, setCommission] = useState(editingStream?.commission ?? 0);
    const [minimumPayout, setMinimumPayout] = useState(editingStream?.minimumPayout ?? 0);
    const [payoutSchedule, setPayoutSchedule] = useState<string>(editingStream?.payoutSchedule ?? 'monthly');

    if (!editingStream) return null;

    return (
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Configure {editingStream.type}</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Commission Rate (%)"
                type="number"
                value={commission.toString()}
                onChange={(e) => setCommission(Number(e.target.value))}
                min={0}
                max={50}
              />

              <Input
                label="Minimum Payout ($)"
                type="number"
                value={minimumPayout.toString()}
                onChange={(e) => setMinimumPayout(Number(e.target.value))}
                min={0}
              />

              {/* HeroUI v2 Select: selectedKeys + onSelectionChange, SelectItem key only */}
              <Select
                label="Payout Schedule"
                selectedKeys={new Set([payoutSchedule])}
                onSelectionChange={(keys) => setPayoutSchedule(Array.from(keys)[0] as string)}
              >
                <SelectItem key="weekly">Weekly</SelectItem>
                <SelectItem key="biweekly">Bi-weekly</SelectItem>
                <SelectItem key="monthly">Monthly</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={() => {
              setSettings(prev => ({
                ...prev,
                revenueStreams: prev.revenueStreams?.map(stream =>
                  stream.id === editingStream.id
                    ? { ...stream, commission, minimumPayout, payoutSchedule: payoutSchedule as PayoutSchedule }
                    : stream
                ) ?? []
              }));
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
          <h1 className="text-2xl font-bold">Monetization Settings</h1>
          <p className="text-gray-600">Configure revenue streams, pricing, and payment processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="flat" startContent={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
          <Button color="primary" startContent={<Settings className="w-4 h-4" />}>
            Payment Settings
          </Button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${revenueMetrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{revenueMetrics.growthRate.toFixed(1)}% growth</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{revenueMetrics.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Avg: ${revenueMetrics.avgOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Monthly Avg</p>
                <p className="text-2xl font-bold">${revenueMetrics.monthlyAvg.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Last 6 months</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Active Streams</p>
                <p className="text-2xl font-bold">
                  {settings.revenueStreams?.filter(s => s.enabled).length ?? 0}
                </p>
                <p className="text-xs text-gray-600">Of {settings.revenueStreams?.length ?? 0} configured</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs - HeroUI v2: selectedKey + onSelectionChange */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview" />
        <Tab key="revenue-streams" title="Revenue Streams" />
        <Tab key="pricing" title="Pricing Tiers" />
        <Tab key="payments" title="Payment Processing" />
        <Tab key="analytics" title="Revenue Analytics" />
      </Tabs>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Recent Transactions</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { id: '1', amount: 250, type: 'Sponsorship', date: '2024-01-15', status: 'completed' },
                  { id: '2', amount: 150, type: 'Affiliate', date: '2024-01-14', status: 'completed' },
                  { id: '3', amount: 89, type: 'Merchandise', date: '2024-01-13', status: 'pending' }
                ].map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">${transaction.amount}</p>
                        <p className="text-sm text-gray-600">{transaction.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{transaction.date}</p>
                      <Badge
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'revenue-streams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Revenue Streams</h2>
            <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
              Add Revenue Stream
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.revenueStreams?.map(stream => (
              <RevenueStreamCard key={stream.id} stream={stream} />
            )) ?? <p className="text-gray-500">No revenue streams configured</p>}
          </div>

          {/* Revenue Stream Performance */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Stream Performance</h2>
            </CardHeader>
            <CardBody>
              <Table>
                <TableHeader>
                  <TableColumn>Stream</TableColumn>
                  <TableColumn>Revenue</TableColumn>
                  <TableColumn>Transactions</TableColumn>
                  <TableColumn>Growth</TableColumn>
                </TableHeader>
                <TableBody>
                  {settings.revenueStreams?.filter(s => s.enabled).map(stream => (
                    <TableRow key={stream.id}>
                      <TableCell className="capitalize">{stream.type}</TableCell>
                      <TableCell>$12,500</TableCell>
                      <TableCell>145</TableCell>
                      <TableCell>
                        <span className="text-green-600">+12.5%</span>
                      </TableCell>
                    </TableRow>
                  )) ?? []}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Pricing Tiers</h2>
            <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => setShowNewTierModal(true)}>
              Add Pricing Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings.pricingTiers?.map(tier => (
              <PricingTierCard key={tier.id} tier={tier} />
            )) ?? <p className="text-gray-500">No pricing tiers configured</p>}
          </div>

          {/* Subscription Analytics */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Subscription Analytics</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">1,247</p>
                  <p className="text-sm text-gray-600">Active Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">89%</p>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">$2,450</p>
                  <p className="text-sm text-gray-600">MRR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">23%</p>
                  <p className="text-sm text-gray-600">Churn Rate</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Payment Processing</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-sm text-gray-600">Primary payment processor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="success" variant="flat">Connected</Badge>
                    <Button size="sm" variant="flat">
                      <Settings className="w-4 h-4" />
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Payout Schedule"
                    value={settings.payoutSettings?.schedule ?? 'monthly'}
                    isReadOnly
                  />
                  <Input
                    label="Minimum Payout Threshold ($)"
                    type="number"
                    value={(settings.payoutSettings?.minimumThreshold ?? 100).toString()}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payoutSettings: { 
                        ...prev.payoutSettings,
                        schedule: prev.payoutSettings?.schedule ?? 'monthly',
                        method: prev.payoutSettings?.method ?? 'bank_transfer',
                        processingFee: prev.payoutSettings?.processingFee ?? 2.9,
                        minimumThreshold: Number(e.target.value) 
                      }
                    }))}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Recent Payouts</h2>
            </CardHeader>
            <CardBody>
              <Table>
                <TableHeader>
                  <TableColumn>Date</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Method</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                  {[
                    { date: '2024-01-15', amount: 1250, method: 'Bank Transfer', status: 'completed' },
                    { date: '2024-01-08', amount: 980, method: 'Bank Transfer', status: 'completed' },
                    { date: '2024-01-01', amount: 1450, method: 'Bank Transfer', status: 'processing' }
                  ].map((payout, index) => (
                    <TableRow key={index}>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell>${payout.amount}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>
                        <Badge
                          color={payout.status === 'completed' ? 'success' : 'warning'}
                          variant="flat"
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Revenue Analytics</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <PieChart className="w-12 h-12" />
                <span className="ml-2">Revenue breakdown chart will be implemented</span>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Top Revenue Streams</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Sponsorships</span>
                    <span className="font-bold">$45,200</span>
                  </div>
                  <Progress value={68} color="primary" />

                  <div className="flex justify-between items-center">
                    <span>Affiliate Marketing</span>
                    <span className="font-bold">$28,900</span>
                  </div>
                  <Progress value={43} color="success" />

                  <div className="flex justify-between items-center">
                    <span>Merchandise</span>
                    <span className="font-bold">$12,400</span>
                  </div>
                  <Progress value={19} color="warning" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Conversion Funnel</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Visitors</span>
                    <span className="font-bold">10,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sign-ups</span>
                    <span className="font-bold">2,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Paid Users</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Users</span>
                    <span className="font-bold">1,113</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditStreamModal />
    </div>
  );
};

export default MonetizationSettings;
