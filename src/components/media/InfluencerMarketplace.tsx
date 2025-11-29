// src/components/media/InfluencerMarketplace.tsx
// Influencer Marketplace Component
// FID-20251127-MEDIA: P1 Core Media Component
// Features: Directory, profiles, deal management, campaign matching, performance tracking
// REWRITTEN: Fixed HeroUI v2 patterns, TypeScript strict compliance

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Avatar,
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
  Pagination,
  Spinner,
  Tooltip
} from '@heroui/react';
import { Search, Filter, Star, Users, TrendingUp, DollarSign, MessageSquare, Heart } from 'lucide-react';

// Import types and utilities
import type {
  InfluencerProfile,
  SponsorshipDeal
} from '@/lib/types/media';
import { MediaPlatform, DealStatus } from '@/lib/types/media';
import {
  INFLUENCER_TIER_THRESHOLDS,
  PLATFORM_ENGAGEMENT_THRESHOLDS,
  INFLUENCER_BASE_RATES,
  ENGAGEMENT_MULTIPLIERS,
  NICHE_PREMIUMS
} from '@/lib/utils/media';

// Mock data for development - replace with API calls
const MOCK_INFLUENCERS: InfluencerProfile[] = [
  {
    _id: '1',
    userId: 'user1',
    companyId: 'comp1',
    name: 'Sarah Johnson',
    bio: 'Lifestyle and wellness content creator passionate about healthy living',
    niche: ['fitness', 'wellness', 'lifestyle'],
    platforms: [
      {
        platform: MediaPlatform.INSTAGRAM,
        handle: '@sarahfitlife',
        followers: 45000,
        engagement: 4.2,
        verified: true,
        connected: true,
        lastSync: new Date()
      }
    ],
    rates: { post: 350, story: 150, video: 650, live: 400 },
    portfolio: [],
    rating: 4.8,
    reviewsCount: 24,
    dealsCompleted: 18,
    totalEarnings: 12500,
    availability: 'available',
    location: 'Los Angeles, CA',
    languages: ['English'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    userId: 'user2',
    companyId: 'comp1',
    name: 'TechGuru Pro',
    bio: 'Tech reviews and gadget unboxings for the modern consumer',
    niche: ['technology', 'gaming', 'reviews'],
    platforms: [
      {
        platform: MediaPlatform.YOUTUBE,
        handle: 'TechGuruPro',
        followers: 125000,
        engagement: 6.8,
        verified: true,
        connected: true,
        lastSync: new Date()
      }
    ],
    rates: { post: 1200, story: 600, video: 2500, live: 1500 },
    portfolio: [],
    rating: 4.9,
    reviewsCount: 67,
    dealsCompleted: 45,
    totalEarnings: 45000,
    availability: 'busy',
    location: 'Austin, TX',
    languages: ['English'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_DEALS: SponsorshipDeal[] = [
  {
    _id: 'deal1',
    sponsor: 'brand1',
    recipient: '1',
    dealValue: 2000,
    dealStructure: 'Flat',
    duration: 1,
    status: DealStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    upfrontPayment: 1000,
    monthlyPayment: 500,
    revenueSharePercent: 8,
    performanceBonuses: [],
    totalPaid: 1000,
    remainingPayments: 2,
    requiredMentions: 3,
    contentRequirements: ['Instagram posts', 'Stories'],
    deliveredContent: [],
    approvalRequired: true,
    brandGuidelines: 'https://brand1.com/guidelines',
    exclusivityClause: false,
    competitorCategories: [],
    exclusivityDuration: 0,
    penaltyForViolation: 0,
    totalImpressions: 0,
    totalEngagement: 0,
    brandMentions: 0,
    brandSentiment: 0,
    brandLift: 0,
    estimatedReach: 50000,
    actualReach: 0,
    milestonesAchieved: 0,
    totalMilestones: 2,
    overdueDeliverables: 0,
    completionRate: 0,
    contractTerms: 'Standard terms',
    terminationClause: 'Standard termination',
    disputeResolution: 'Arbitration',
    intellectualProperty: 'Shared',
    usageRights: 'Social media only',
    createdAt: new Date(),
    updatedAt: new Date(),
    // UI-friendly optional fields
    title: 'Fitness Apparel Partnership',
    description: 'Promote activewear line through Instagram posts and stories',
    platforms: [MediaPlatform.INSTAGRAM as string],
    budget: 2000,
    commission: 8,
    paymentStatus: 'pending',
    deliverables: [
      { type: 'SocialPost', platform: MediaPlatform.INSTAGRAM as string, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false, metrics: { reach: 0, engagement: 0, clicks: 0 } }
    ],
    performance: { impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, conversionRate: 0, roas: 0, spend: 0, reach: 0, engagementRate: 0 }
  }
];

// Utility functions
const getInfluencerTier = (followers: number): string => {
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MEGA.min) return 'MEGA';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MACRO.min) return 'MACRO';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MID.min) return 'MID';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MICRO.min) return 'MICRO';
  return 'NANO';
};

const getEngagementTier = (platform: MediaPlatform, rate: number): string => {
  const thresholds = PLATFORM_ENGAGEMENT_THRESHOLDS[platform];
  if (rate >= thresholds.EXCELLENT) return 'EXCELLENT';
  if (rate >= thresholds.GOOD) return 'GOOD';
  if (rate >= thresholds.AVERAGE) return 'AVERAGE';
  return 'POOR';
};

const calculateAdjustedRate = (
  baseRate: number,
  platform: MediaPlatform,
  engagement: number,
  niche: string[]
): number => {
  const engagementTier = getEngagementTier(platform, engagement);
  const engagementMultiplier = ENGAGEMENT_MULTIPLIERS[engagementTier as keyof typeof ENGAGEMENT_MULTIPLIERS] || 1;

  const nicheMultiplier = Math.max(
    ...niche.map(n => NICHE_PREMIUMS[n as keyof typeof NICHE_PREMIUMS] || 1)
  );

  return Math.round(baseRate * engagementMultiplier * nicheMultiplier);
};

interface InfluencerMarketplaceProps {
  companyId: string;
}

export const InfluencerMarketplace: React.FC<InfluencerMarketplaceProps> = ({ companyId }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('directory');

  const itemsPerPage = 12;

  // Filter and search influencers
  const filteredInfluencers = useMemo(() => {
    return MOCK_INFLUENCERS.filter(influencer => {
      const matchesSearch = !searchTerm ||
        influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (influencer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        influencer.niche.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesNiche = !selectedNiche || influencer.niche.includes(selectedNiche);
      const matchesTier = !selectedTier ||
        getInfluencerTier(influencer.platforms[0]?.followers || 0) === selectedTier;
      const matchesPlatform = !selectedPlatform ||
        influencer.platforms.some(p => p.platform === selectedPlatform);

      return matchesSearch && matchesNiche && matchesTier && matchesPlatform;
    });
  }, [searchTerm, selectedNiche, selectedTier, selectedPlatform]);

  // Paginate results
  const paginatedInfluencers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInfluencers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInfluencers, currentPage]);

  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);

  // Get unique values for filters
  const availableNiches = useMemo(() => {
    const niches = new Set<string>();
    MOCK_INFLUENCERS.forEach(inf => inf.niche.forEach(n => niches.add(n)));
    return Array.from(niches).sort();
  }, []);

  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    MOCK_INFLUENCERS.forEach(inf => inf.platforms.forEach(p => platforms.add(p.platform)));
    return Array.from(platforms);
  }, []);

  // Handle influencer selection
  const handleInfluencerSelect = useCallback((influencer: InfluencerProfile) => {
    setSelectedInfluencer(influencer);
  }, []);

  // Handle deal creation
  const handleCreateDeal = useCallback(() => {
    if (!selectedInfluencer) return;
    setShowDealModal(true);
  }, [selectedInfluencer]);

  // Influencer card component
  const InfluencerCard: React.FC<{ influencer: InfluencerProfile }> = ({ influencer }) => {
    const primaryPlatform = influencer.platforms[0];
    const tier = getInfluencerTier(primaryPlatform?.followers || 0);

    return (
      <Card className="w-full hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleInfluencerSelect(influencer)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar
              src={influencer.avatar}
              name={influencer.name}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{influencer.name}</h3>
                {primaryPlatform?.verified && (
                  <Badge color="primary" variant="flat" size="sm">Verified</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{primaryPlatform?.handle}</p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-2">
          <div className="space-y-3">
            {/* Platform and metrics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="flat" color="secondary">
                  {primaryPlatform?.platform}
                </Chip>
                <Chip size="sm" variant="flat" color={
                  tier === 'MEGA' ? 'success' :
                  tier === 'MACRO' ? 'warning' :
                  tier === 'MID' ? 'primary' : 'default'
                }>
                  {tier}
                </Chip>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{influencer.rating}</span>
                <span className="text-sm text-gray-500">({influencer.reviewsCount})</span>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Followers</span>
                </div>
                <p className="font-semibold">
                  {(primaryPlatform?.followers || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Engagement</span>
                </div>
                <p className="font-semibold">{primaryPlatform?.engagement}%</p>
              </div>
            </div>

            {/* Niche tags */}
            <div className="flex flex-wrap gap-1">
              {influencer.niche.slice(0, 3).map(niche => (
                <Chip key={niche} size="sm" variant="bordered">
                  {niche}
                </Chip>
              ))}
              {influencer.niche.length > 3 && (
                <Chip size="sm" variant="bordered">
                  +{influencer.niche.length - 3}
                </Chip>
              )}
            </div>

            {/* Rates preview */}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600 mb-1">Starting rates</p>
              <div className="flex gap-2 text-sm">
                <span>Post: ${influencer.rates.post}</span>
                <span>Story: ${influencer.rates.story}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  // Deal modal component
  const DealModal: React.FC = () => {
    const [dealType, setDealType] = useState<string>('post');
    const [budget, setBudget] = useState(500);
    const [description, setDescription] = useState('');

    if (!selectedInfluencer) return null;

    const primaryPlatform = selectedInfluencer.platforms[0];
    const adjustedRate = calculateAdjustedRate(
      INFLUENCER_BASE_RATES[getInfluencerTier(primaryPlatform.followers) as keyof typeof INFLUENCER_BASE_RATES]?.post || 100,
      primaryPlatform.platform,
      primaryPlatform.engagement,
      selectedInfluencer.niche
    );

    return (
      <Modal isOpen={showDealModal} onClose={() => setShowDealModal(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Create Deal with {selectedInfluencer.name}</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Influencer summary */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedInfluencer.avatar} name={selectedInfluencer.name} />
                    <div>
                      <h3 className="font-semibold">{selectedInfluencer.name}</h3>
                      <p className="text-sm text-gray-600">{primaryPlatform.handle}</p>
                      <p className="text-sm">
                        {primaryPlatform.followers.toLocaleString()} followers •
                        {primaryPlatform.engagement}% engagement
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Deal configuration */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Content Type"
                  selectedKeys={dealType ? new Set([dealType]) : new Set()}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setDealType(value);
                  }}
                >
                  <SelectItem key="post">Social Media Post</SelectItem>
                  <SelectItem key="story">Story</SelectItem>
                  <SelectItem key="video">Video Content</SelectItem>
                  <SelectItem key="live">Live Session</SelectItem>
                </Select>

                <Input
                  type="number"
                  label="Budget ($)"
                  value={budget.toString()}
                  onValueChange={(value) => setBudget(Number(value))}
                  min={adjustedRate}
                />
              </div>

              <Input
                label="Campaign Description"
                placeholder="Describe your campaign goals and requirements..."
                value={description}
                onValueChange={(value) => setDescription(value)}
              />

              {/* Pricing breakdown */}
              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Rate:</span>
                      <span>${adjustedRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Commission (8%):</span>
                      <span>-${Math.round(budget * 0.08)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Cost:</span>
                      <span>${budget}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDealModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={() => {
              // Handle deal creation
              setShowDealModal(false);
            }}>
              Create Deal
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
          <h1 className="text-2xl font-bold">Influencer Marketplace</h1>
          <p className="text-gray-600">Find and collaborate with influencers for your campaigns</p>
        </div>
        <Button color="primary" startContent={<MessageSquare className="w-4 h-4" />}>
          View My Deals
        </Button>
      </div>

      {/* Tabs - HeroUI v2 pattern */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="directory" title="Influencer Directory" />
        <Tab key="deals" title="Active Deals" />
        <Tab key="analytics" title="Performance Analytics" />
      </Tabs>

      {activeTab === 'directory' && (
        <>
          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Search influencers..."
                  value={searchTerm}
                  onValueChange={(value) => setSearchTerm(value)}
                  startContent={<Search className="w-4 h-4" />}
                />

                <Select
                  placeholder="All Niches"
                  selectedKeys={selectedNiche ? new Set([selectedNiche]) : new Set()}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setSelectedNiche(value || '');
                  }}
                >
                  {availableNiches.map(niche => (
                    <SelectItem key={niche}>
                      {niche.charAt(0).toUpperCase() + niche.slice(1)}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder="All Tiers"
                  selectedKeys={selectedTier ? new Set([selectedTier]) : new Set()}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setSelectedTier(value || '');
                  }}
                >
                  <SelectItem key="NANO">Nano (1-999)</SelectItem>
                  <SelectItem key="MICRO">Micro (1K-10K)</SelectItem>
                  <SelectItem key="MID">Mid (10K-100K)</SelectItem>
                  <SelectItem key="MACRO">Macro (100K-1M)</SelectItem>
                  <SelectItem key="MEGA">Mega (1M+)</SelectItem>
                </Select>

                <Select
                  placeholder="All Platforms"
                  selectedKeys={selectedPlatform ? new Set([selectedPlatform]) : new Set()}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setSelectedPlatform(value || '');
                  }}
                >
                  {availablePlatforms.map(platform => (
                    <SelectItem key={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </Select>

                <Button
                  variant="flat"
                  onPress={() => {
                    setSearchTerm('');
                    setSelectedNiche('');
                    setSelectedTier('');
                    setSelectedPlatform('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Results summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {paginatedInfluencers.length} of {filteredInfluencers.length} influencers
            </p>
          </div>

          {/* Influencer grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedInfluencers.map(influencer => (
              <InfluencerCard key={influencer._id} influencer={influencer} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'deals' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Active Deals</h2>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>Influencer</TableColumn>
                <TableColumn>Campaign</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Budget</TableColumn>
                <TableColumn>Performance</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {MOCK_DEALS.map(deal => (
                  <TableRow key={deal._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" name={deal.title} />
                        <span>{deal.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{deal.title}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          deal.status === DealStatus.ACTIVE ? 'success' :
                          deal.status === DealStatus.COMPLETED ? 'primary' : 'default'
                        }
                      >
                        {deal.status}
                      </Chip>
                    </TableCell>
                    <TableCell>${(deal.budget ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Reach: {(deal.performance?.reach ?? 0).toLocaleString()}</p>
                        <p>Engagement: {(deal.performance?.engagementRate ?? 0).toFixed(1)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="flat">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">$12,500</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg ROI</p>
                  <p className="text-2xl font-bold">3.2x</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Deal Modal */}
      <DealModal />

      {/* Influencer Detail Modal */}
      {selectedInfluencer && !showDealModal && (
        <Modal
          isOpen={!!selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          size="3xl"
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <Avatar src={selectedInfluencer.avatar} name={selectedInfluencer.name} size="lg" />
                <div>
                  <h2 className="text-xl font-bold">{selectedInfluencer.name}</h2>
                  <p className="text-gray-600">{selectedInfluencer.platforms[0]?.handle}</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-gray-700">{selectedInfluencer.bio}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Platform Stats</h3>
                    <div className="space-y-1 text-sm">
                      <p>Followers: {selectedInfluencer.platforms[0]?.followers.toLocaleString()}</p>
                      <p>Engagement: {selectedInfluencer.platforms[0]?.engagement}%</p>
                      <p>Rating: {selectedInfluencer.rating} ⭐ ({selectedInfluencer.reviewsCount} reviews)</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Rates</h3>
                    <div className="space-y-1 text-sm">
                      <p>Post: ${selectedInfluencer.rates.post}</p>
                      <p>Story: ${selectedInfluencer.rates.story}</p>
                      <p>Video: ${selectedInfluencer.rates.video}</p>
                      <p>Live: ${selectedInfluencer.rates.live}/hr</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Niches</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfluencer.niche.map(niche => (
                      <Chip key={niche} size="sm">{niche}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setSelectedInfluencer(null)}>
                Close
              </Button>
              <Button color="primary" onPress={handleCreateDeal}>
                Start Collaboration
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default InfluencerMarketplace;
