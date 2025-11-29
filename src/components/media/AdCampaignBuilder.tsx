// src/components/media/AdCampaignBuilder.tsx
// Ad Campaign Builder Component
// FID-20251127-MEDIA: P1 Core Media Component
// Features: Campaign wizard, creative manager, budget allocation, audience targeting, performance analytics
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
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Progress,
  Chip,
  Avatar,
  Badge,
  Slider,
  Checkbox,
  RadioGroup,
  Radio,
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
import {
  Plus,
  Upload,
  Image,
  Video,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Play,
  Pause,
  Settings,
  BarChart3,
  Calendar,
  Globe,
  Filter,
  AlertCircle
} from 'lucide-react';

// Import types and utilities
import type {
  AdCampaign,
  TargetAudience,
  CreativeAsset,
  CampaignBudget,
  CampaignPerformance
} from '@/lib/types/media';
import { MediaPlatform, CampaignStatus } from '@/lib/types/media';
import {
  PLATFORM_BUDGET_MULTIPLIERS,
  AUDIENCE_SIZE_ESTIMATES,
  CREATIVE_FORMAT_REQUIREMENTS,
  CAMPAIGN_OBJECTIVES,
  calculateEstimatedReach,
  calculateEstimatedCost,
  validateCampaignBudget
} from '@/lib/utils/media';

// Mock data for development - using proper types
const MOCK_CAMPAIGNS: AdCampaign[] = [
  {
    _id: 'camp1',
    advertiser: 'comp1',
    platform: 'Instagram',
    platforms: [MediaPlatform.INSTAGRAM, MediaPlatform.TIKTOK],
    name: 'Summer Fitness Launch',
    type: 'Sponsored', // Using valid AdCampaignType
    status: CampaignStatus.ACTIVE, // Using enum
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targetedContent: [],
    targetedInfluencers: [],
    targetedAudience: [],
    audienceType: 'Targeted',
    biddingModel: 'CPC',
    bidAmount: 2.50,
    dailyBudget: 250,
    totalBudget: 5000,
    goals: {
      impressions: 100000,
      clicks: 5000,
      conversions: 250
    },
    metrics: {
      impressions: 75000,
      clicks: 3750,
      conversions: 188,
      spend: 3750,
      revenue: 9400
    },
    budget: {
      total: 5000,
      daily: 250,
      platformBreakdown: {
        [MediaPlatform.INSTAGRAM]: 3000,
        [MediaPlatform.TIKTOK]: 2000
      },
      currency: 'USD',
      autoOptimize: true
    },
    performance: {
      impressions: 75000,
      clicks: 3750,
      ctr: 5.0,
      cpc: 1.0,
      conversions: 188,
      conversionRate: 5.01,
      roas: 2.51,
      spend: 3750,
      reach: 65000,
      engagementRate: 8.5
    },
    qualityScore: 8.5,
    relevanceScore: 85,
    engagementScore: 90,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface AdCampaignBuilderProps {
  companyId: string;
}

export const AdCampaignBuilder: React.FC<AdCampaignBuilderProps> = ({ companyId }) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<Partial<AdCampaign>>({
    advertiser: companyId,
    targetAudience: {
      ageRange: [18, 65],
      gender: ['all'],
      interests: [],
      locations: ['United States'],
      languages: ['English'],
      followerCount: [1000, 1000000]
    },
    budget: {
      total: 1000,
      daily: 50,
      platformBreakdown: {},
      currency: 'USD',
      autoOptimize: false
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [selectedInfluencerTier, setSelectedInfluencerTier] = useState<string>('');

  const totalSteps = 5;
  const steps = [
    { id: 1, title: 'Campaign Basics', description: 'Name and objective' },
    { id: 2, title: 'Target Audience', description: 'Define your audience' },
    { id: 3, title: 'Creative Assets', description: 'Upload and manage creatives' },
    { id: 4, title: 'Budget & Schedule', description: 'Set budget and timeline' },
    { id: 5, title: 'Review & Launch', description: 'Review and launch campaign' }
  ];

  // Handle wizard navigation
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Update campaign data
  const updateCampaignData = useCallback((updates: Partial<AdCampaign>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  // Handle platform selection change
  const handlePlatformChange = useCallback((keys: Set<string> | 'all') => {
    if (keys === 'all') {
      const allPlatforms = Object.values(MediaPlatform);
      setSelectedPlatforms(new Set(allPlatforms));
      updateCampaignData({ platforms: allPlatforms });
    } else {
      setSelectedPlatforms(keys as Set<string>);
      updateCampaignData({ platforms: Array.from(keys) as MediaPlatform[] });
    }
  }, [updateCampaignData]);

  // Handle influencer tier selection
  const handleInfluencerTierChange = useCallback((tier: string) => {
    setSelectedInfluencerTier(tier);
    const ranges: Record<string, [number, number]> = {
      nano: [1000, 9999],
      micro: [10000, 99999],
      mid: [100000, 499999],
      macro: [500000, 999999],
      mega: [1000000, 10000000]
    };
    updateCampaignData({
      targetAudience: {
        ...campaignData.targetAudience!,
        followerCount: ranges[tier] || [1000, 1000000]
      }
    });
  }, [campaignData.targetAudience, updateCampaignData]);

  // Calculate estimated metrics
  const estimatedMetrics = useMemo(() => {
    const platforms = campaignData.platforms || [];
    const budget = campaignData.budget;
    const targetAudience = campaignData.targetAudience;
    
    if (platforms.length === 0 || !budget?.total) {
      return null;
    }

    const reach = calculateEstimatedReach(
      budget.total,
      platforms as MediaPlatform[],
      targetAudience
    );

    const cost = calculateEstimatedCost(
      reach,
      platforms as MediaPlatform[],
      targetAudience
    );

    return { reach, cost };
  }, [campaignData.platforms, campaignData.budget, campaignData.targetAudience]);

  // Step 1: Campaign Basics
  const CampaignBasicsStep: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Campaign Basics</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              placeholder="Enter campaign name"
              value={campaignData.name || ''}
              onValueChange={(value) => updateCampaignData({ name: value })}
              isRequired
            />

            <Select
              label="Campaign Objective"
              placeholder="Select campaign objective"
              selectedKeys={campaignData.objective ? new Set([campaignData.objective]) : new Set()}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                updateCampaignData({ objective: value });
              }}
            >
              {Object.entries(CAMPAIGN_OBJECTIVES).map(([key, label]) => (
                <SelectItem key={key}>
                  {label}
                </SelectItem>
              ))}
            </Select>

            <Textarea
              label="Campaign Description"
              placeholder="Describe your campaign goals and target audience..."
              value={campaignData.description || ''}
              onValueChange={(value) => updateCampaignData({ description: value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Platforms"
                placeholder="Select platforms"
                selectionMode="multiple"
                selectedKeys={selectedPlatforms}
                onSelectionChange={(keys) => handlePlatformChange(keys as Set<string>)}
              >
                <SelectItem key={MediaPlatform.INSTAGRAM}>Instagram</SelectItem>
                <SelectItem key={MediaPlatform.TIKTOK}>TikTok</SelectItem>
                <SelectItem key={MediaPlatform.YOUTUBE}>YouTube</SelectItem>
                <SelectItem key={MediaPlatform.TWITTER}>Twitter</SelectItem>
                <SelectItem key={MediaPlatform.FACEBOOK}>Facebook</SelectItem>
                <SelectItem key={MediaPlatform.LINKEDIN}>LinkedIn</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Step 2: Target Audience
  const TargetAudienceStep: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Target Audience</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Age Range</label>
              <Slider
                step={1}
                minValue={13}
                maxValue={65}
                value={campaignData.targetAudience?.ageRange || [18, 35]}
                onChange={(value) => updateCampaignData({
                  targetAudience: {
                    ...campaignData.targetAudience!,
                    ageRange: value as [number, number]
                  }
                })}
                className="max-w-md"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{campaignData.targetAudience?.ageRange?.[0] ?? 18} years</span>
                <span>{campaignData.targetAudience?.ageRange?.[1] ?? 35}+ years</span>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <RadioGroup
                value={campaignData.targetAudience?.gender?.[0] || 'all'}
                onValueChange={(value) => updateCampaignData({
                  targetAudience: {
                    ...campaignData.targetAudience!,
                    gender: [value]
                  }
                })}
              >
                <Radio value="all">All genders</Radio>
                <Radio value="male">Male</Radio>
                <Radio value="female">Female</Radio>
              </RadioGroup>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium mb-2">Interests</label>
              <div className="grid grid-cols-2 gap-2">
                {['fitness', 'technology', 'fashion', 'food', 'travel', 'gaming', 'music', 'sports'].map(interest => (
                  <Checkbox
                    key={interest}
                    isSelected={campaignData.targetAudience?.interests?.includes(interest) ?? false}
                    onValueChange={(checked) => {
                      const currentInterests = campaignData.targetAudience?.interests || [];
                      const newInterests = checked
                        ? [...currentInterests, interest]
                        : currentInterests.filter(i => i !== interest);
                      updateCampaignData({
                        targetAudience: {
                          ...campaignData.targetAudience!,
                          interests: newInterests
                        }
                      });
                    }}
                  >
                    {interest.charAt(0).toUpperCase() + interest.slice(1)}
                  </Checkbox>
                ))}
              </div>
            </div>

            {/* Follower Count Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Influencer Size</label>
              <Select
                placeholder="Select influencer tier"
                selectedKeys={selectedInfluencerTier ? new Set([selectedInfluencerTier]) : new Set()}
                onSelectionChange={(keys) => {
                  const tier = Array.from(keys)[0] as string;
                  handleInfluencerTierChange(tier);
                }}
              >
                <SelectItem key="nano">Nano (1K-10K)</SelectItem>
                <SelectItem key="micro">Micro (10K-100K)</SelectItem>
                <SelectItem key="mid">Mid-tier (100K-500K)</SelectItem>
                <SelectItem key="macro">Macro (500K-1M)</SelectItem>
                <SelectItem key="mega">Mega (1M+)</SelectItem>
              </Select>
            </div>

            {/* Estimated Reach */}
            {estimatedMetrics && (
              <Card className="bg-blue-50">
                <CardBody>
                  <h3 className="font-semibold mb-2">Estimated Reach</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Potential Reach</p>
                      <p className="font-bold text-lg">{estimatedMetrics.reach.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Cost</p>
                      <p className="font-bold text-lg">${estimatedMetrics.cost.toLocaleString()}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Step 3: Creative Assets
  const CreativeAssetsStep: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Creative Assets</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Creative Assets</h3>
              <p className="text-gray-600 mb-4">
                Upload images, videos, or carousel posts for your campaign
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button as="span" color="primary" startContent={<Upload className="w-4 h-4" />}>
                  Choose Files
                </Button>
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-8 h-8 text-blue-500" />
                        ) : (
                          <Video className="w-8 h-8 text-red-500" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="danger"
                          onPress={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Creative Requirements */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Creative Requirements</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {(campaignData.platforms || []).map(platform => (
                    <div key={platform} className="border rounded-lg p-4">
                      <h4 className="font-semibold capitalize mb-2">{platform}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Image Formats</p>
                          <p>JPG, PNG (max 10MB)</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Video Formats</p>
                          <p>MP4 (max 100MB)</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Aspect Ratios</p>
                          <p>1:1, 4:5, 9:16</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Text Limit</p>
                          <p>125 characters</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Step 4: Budget & Schedule
  const BudgetScheduleStep: React.FC = () => {
    // Budget validation
    const budgetValidation = useMemo(() => {
      if (!campaignData.budget || !campaignData.platforms?.length) {
        return { isValid: true, errors: [] };
      }
      return validateCampaignBudget(
        {
          total: campaignData.budget.total,
          daily: campaignData.budget.daily,
          platformBreakdown: campaignData.budget.platformBreakdown
        },
        campaignData.platforms as MediaPlatform[]
      );
    }, []);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Budget & Schedule</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Total Budget */}
              <div>
                <label className="block text-sm font-medium mb-2">Total Budget ($)</label>
                <Input
                  type="number"
                  placeholder="Enter total budget"
                  value={campaignData.budget?.total?.toString() || ''}
                  onValueChange={(value) => {
                    const total = Number(value);
                    const daily = Math.round(total / 30);
                    updateCampaignData({
                      budget: {
                        ...campaignData.budget!,
                        total,
                        daily
                      }
                    });
                  }}
                  startContent={<DollarSign className="w-4 h-4" />}
                />
              </div>

              {/* Daily Budget */}
              <div>
                <label className="block text-sm font-medium mb-2">Daily Budget ($)</label>
                <Input
                  type="number"
                  value={campaignData.budget?.daily?.toString() || ''}
                  onValueChange={(value) => updateCampaignData({
                    budget: {
                      ...campaignData.budget!,
                      daily: Number(value)
                    }
                  })}
                  startContent={<DollarSign className="w-4 h-4" />}
                />
              </div>

              {/* Platform Budget Allocation */}
              {campaignData.platforms && campaignData.platforms.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-bold">Platform Budget Allocation</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {campaignData.platforms.map(platform => {
                        const currentAllocation = campaignData.budget?.platformBreakdown?.[platform] || 0;
                        const percentage = campaignData.budget?.total
                          ? (currentAllocation / campaignData.budget.total) * 100
                          : 0;

                        return (
                          <div key={platform} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">{platform}</span>
                              <span className="text-sm text-gray-600">
                                ${currentAllocation} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <Slider
                              step={50}
                              minValue={0}
                              maxValue={campaignData.budget?.total || 1000}
                              value={currentAllocation}
                              onChange={(value) => {
                                const newBreakdown: Record<string, number> = {
                                  ...campaignData.budget?.platformBreakdown,
                                  [platform]: value as number
                                };
                                updateCampaignData({
                                  budget: {
                                    ...campaignData.budget!,
                                    platformBreakdown: newBreakdown
                                  }
                                });
                              }}
                              className="max-w-md"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={campaignData.startDate?.toISOString().split('T')[0] || ''}
                  onValueChange={(value) => updateCampaignData({ startDate: new Date(value) })}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={campaignData.endDate?.toISOString().split('T')[0] || ''}
                  onValueChange={(value) => updateCampaignData({ endDate: new Date(value) })}
                />
              </div>

              {/* Budget Validation */}
              {!budgetValidation.isValid && (
                <Card className="bg-red-50 border-red-200">
                  <CardBody>
                    <div className="flex items-start gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Budget Validation Issues:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {budgetValidation.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // Step 5: Review & Launch
  const ReviewLaunchStep: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Review & Launch Campaign</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Campaign Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold">Campaign Details</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{campaignData.name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Objective:</span>
                      <span className="font-medium">
                        {campaignData.objective 
                          ? CAMPAIGN_OBJECTIVES[campaignData.objective as keyof typeof CAMPAIGN_OBJECTIVES]
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platforms:</span>
                      <span className="font-medium">{campaignData.platforms?.join(', ') || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {campaignData.startDate?.toLocaleDateString()} - {campaignData.endDate?.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold">Budget Summary</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span className="font-medium">${campaignData.budget?.total ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Budget:</span>
                      <span className="font-medium">${campaignData.budget?.daily ?? 0}</span>
                    </div>
                    {campaignData.budget?.platformBreakdown && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Platform Breakdown:</p>
                        {Object.entries(campaignData.budget.platformBreakdown).map(([platform, amount]) => (
                          <div key={platform} className="flex justify-between text-sm">
                            <span className="capitalize">{platform}:</span>
                            <span>${amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Audience Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Target Audience</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Age Range</p>
                    <p className="font-medium">
                      {campaignData.targetAudience?.ageRange?.[0] ?? 18} - {campaignData.targetAudience?.ageRange?.[1] ?? 65}+
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-medium capitalize">
                      {campaignData.targetAudience?.gender?.[0] || 'All'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Interests</p>
                    <p className="font-medium">
                      {campaignData.targetAudience?.interests?.join(', ') || 'None specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Influencer Size</p>
                    <p className="font-medium">
                      {(campaignData.targetAudience?.followerCount?.[0] ?? 1000).toLocaleString()} - {(campaignData.targetAudience?.followerCount?.[1] ?? 1000000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Launch Button */}
            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                color="primary"
                startContent={<Play className="w-5 h-5" />}
                onPress={() => {
                  console.log('Launching campaign:', campaignData);
                }}
              >
                Launch Campaign
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <CampaignBasicsStep />;
      case 2: return <TargetAudienceStep />;
      case 3: return <CreativeAssetsStep />;
      case 4: return <BudgetScheduleStep />;
      case 5: return <ReviewLaunchStep />;
      default: return <CampaignBasicsStep />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ad Campaign Builder</h1>
          <p className="text-gray-600">Create and manage your advertising campaigns</p>
        </div>
        <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
          New Campaign
        </Button>
      </div>

      {/* Tabs - HeroUI v2 pattern */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="builder" title="Campaign Builder" />
        <Tab key="campaigns" title="My Campaigns" />
        <Tab key="analytics" title="Performance Analytics" />
      </Tabs>

      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Campaign Setup Progress</h2>
                <span className="text-sm text-gray-600">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} color="primary" />

              <div className="flex justify-between mt-4">
                {steps.map(step => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center text-center ${
                      step.id <= currentStep ? 'text-primary' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                      step.id < currentStep ? 'bg-primary text-white' :
                      step.id === currentStep ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                      {step.id}
                    </div>
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="flat"
              onPress={handlePrevious}
              isDisabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              color="primary"
              onPress={handleNext}
              isDisabled={currentStep === totalSteps}
            >
              {currentStep === totalSteps ? 'Launch Campaign' : 'Next'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">My Campaigns</h2>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>Campaign</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Budget</TableColumn>
                <TableColumn>Performance</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {MOCK_CAMPAIGNS.map(campaign => (
                  <TableRow key={campaign._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{campaign.platforms?.join(', ') ?? 'No platforms'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          campaign.status === CampaignStatus.ACTIVE ? 'success' :
                          campaign.status === CampaignStatus.PAUSED ? 'warning' :
                          campaign.status === CampaignStatus.COMPLETED ? 'primary' : 'default'
                        }
                        variant="flat"
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${campaign.budget?.total?.toLocaleString() ?? 0}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Reach: {campaign.performance?.reach?.toLocaleString() ?? 0}</p>
                        <p>ROI: {campaign.performance?.roas ?? 0}x</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="flat" onPress={() => setSelectedCampaign(campaign)}>
                          View
                        </Button>
                        <Button size="sm" variant="flat">
                          Edit
                        </Button>
                        <Button size="sm" variant="flat" color={
                          campaign.status === CampaignStatus.ACTIVE ? 'warning' : 'success'
                        }>
                          {campaign.status === CampaignStatus.ACTIVE ? 'Pause' : 'Resume'}
                        </Button>
                      </div>
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
                <Eye className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Impressions</p>
                  <p className="text-2xl font-bold">1.2M</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold">850K</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg CTR</p>
                  <p className="text-2xl font-bold">2.4%</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          size="2xl"
        >
          <ModalContent>
            <ModalHeader>
              <h2 className="text-xl font-bold">{selectedCampaign.name}</h2>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Campaign Details</h3>
                    <div className="space-y-1 text-sm">
                      <p>Objective: {selectedCampaign.objective ? CAMPAIGN_OBJECTIVES[selectedCampaign.objective as keyof typeof CAMPAIGN_OBJECTIVES] : 'Not set'}</p>
                      <p>Platforms: {selectedCampaign.platforms?.join(', ') ?? 'None'}</p>
                      <p>Status: <Badge color="success" variant="flat">{selectedCampaign.status}</Badge></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Performance</h3>
                    <div className="space-y-1 text-sm">
                      <p>Reach: {selectedCampaign.performance?.reach?.toLocaleString() ?? 0}</p>
                      <p>Impressions: {selectedCampaign.performance?.impressions?.toLocaleString() ?? 0}</p>
                      <p>Clicks: {selectedCampaign.performance?.clicks?.toLocaleString() ?? 0}</p>
                      <p>CTR: {selectedCampaign.performance?.ctr ?? 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setSelectedCampaign(null)}>
                Close
              </Button>
              <Button color="primary">
                View Full Report
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default AdCampaignBuilder;
