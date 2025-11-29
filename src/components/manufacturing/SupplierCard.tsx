/**
 * @fileoverview Supplier Card Component
 * @module components/manufacturing/SupplierCard
 * 
 * OVERVIEW:
 * Displays supplier vendor information with performance scorecard including on-time
 * delivery rate, quality rating, cost score, and overall score. Supports
 * multi-tier supply chain (Strategic/Preferred/Tier 1/2/3) with tier-specific badges
 * and strategic partner indicators.
 * 
 * FEATURES:
 * - Supplier tier badge (Strategic: purple, Preferred: blue, Tier 1/2/3: green/yellow/gray)
 * - Performance trend indicator (Improving/Stable/Declining)
 * - Overall score with color coding (>90: green, 70-90: yellow, <70: red)
 * - 5 key scorecard metrics
 * - Strategic partner star indicator
 * - Risk level display
 * - Total spend and annual metrics
 * - Click handler for supplier details navigation
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Progress,
  Chip,
} from '@heroui/react';
import {
  Star,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Settings,
  Building,
} from 'lucide-react';

/**
 * Supplier interface
 */
export interface SupplierData {
  _id: string;
  name: string;
  code: string;
  company: string;
  type: 'raw_materials' | 'components' | 'sub_assembly' | 'packaging' | 'mro' | 'services' | 'logistics';
  tier: 'tier_1' | 'tier_2' | 'tier_3' | 'strategic' | 'preferred' | 'approved' | 'conditional';
  status: 'Active' | 'On Hold' | 'Under Review' | 'Suspended' | 'Terminated';
  region: string;
  contact?: {
    name?: string;
    address?: {
      city?: string;
      country?: string;
    };
  };
  performance: {
    onTimeDeliveryRate: number;
    orderFillRate: number;
    defectRate: number;
    averageLeadTime: number;
    responseTime: number;
  };
  scorecard: {
    qualityScore: number;
    deliveryScore: number;
    costScore: number;
    responseScore: number;
    flexibilityScore: number;
    overallScore: number;
    trend: 'Improving' | 'Stable' | 'Declining';
  };
  financials: {
    annualSpend: number;
    averageOrderValue: number;
    paymentTerms: string;
    currentBalance?: number;
  };
  risk: {
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    factors?: string[];
    singleSourceRisk?: boolean;
  };
  certifications?: string[];
  strategicPartner: boolean;
}

interface SupplierCardProps {
  supplier: SupplierData;
  onClick?: (supplierId: string) => void;
  onViewDetails?: (supplierId: string) => void;
  onEdit?: (supplierId: string) => void;
  compact?: boolean;
}

/**
 * Get tier badge configuration
 */
const getTierConfig = (tier: string): { 
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'; 
  label: string 
} => {
  switch (tier) {
    case 'strategic':
      return { color: 'secondary', label: 'Strategic' };
    case 'preferred':
      return { color: 'primary', label: 'Preferred' };
    case 'tier_1':
      return { color: 'success', label: 'Tier 1' };
    case 'tier_2':
      return { color: 'warning', label: 'Tier 2' };
    case 'tier_3':
      return { color: 'default', label: 'Tier 3' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'conditional':
      return { color: 'warning', label: 'Conditional' };
    default:
      return { color: 'default', label: tier };
  }
};

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: string): { 
  color: 'success' | 'warning' | 'danger' | 'default' | 'primary'; 
  label: string 
} => {
  switch (status) {
    case 'Active':
      return { color: 'success', label: 'Active' };
    case 'On Hold':
      return { color: 'warning', label: 'On Hold' };
    case 'Under Review':
      return { color: 'primary', label: 'Under Review' };
    case 'Suspended':
      return { color: 'danger', label: 'Suspended' };
    case 'Terminated':
      return { color: 'default', label: 'Terminated' };
    default:
      return { color: 'default', label: status };
  }
};

/**
 * Get risk level configuration
 */
const getRiskConfig = (level: string): { 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
} => {
  switch (level) {
    case 'Low':
      return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <Shield className="h-4 w-4" /> };
    case 'Medium':
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <AlertTriangle className="h-4 w-4" /> };
    case 'High':
      return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <AlertTriangle className="h-4 w-4" /> };
    case 'Critical':
      return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> };
    default:
      return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Shield className="h-4 w-4" /> };
  }
};

/**
 * Get trend icon
 */
const getTrendIcon = (trend: string): React.ReactNode => {
  switch (trend) {
    case 'Improving':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'Declining':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-600" />;
  }
};

/**
 * Get score color
 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Get metric color
 */
const getMetricColor = (value: number): string => {
  if (value >= 90) return 'text-green-600';
  if (value >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Format currency
 */
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

/**
 * SupplierCard Component
 * Displays supplier with performance scorecard
 */
export function SupplierCard({ 
  supplier, 
  onClick, 
  onViewDetails, 
  onEdit, 
  compact = false 
}: SupplierCardProps) {
  const tierConfig = getTierConfig(supplier.tier);
  const statusConfig = getStatusConfig(supplier.status);
  const riskConfig = getRiskConfig(supplier.risk.level);

  const handleClick = () => {
    if (onClick) {
      onClick(supplier._id);
    }
  };

  // Compact view for list displays
  if (compact) {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        isPressable={!!onClick}
        onPress={handleClick}
      >
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-purple-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-sm">{supplier.name}</h3>
                  {supplier.strategicPartner && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{supplier.code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Chip size="sm" color={tierConfig.color} variant="flat">
                {tierConfig.label}
              </Chip>
              <div className={`text-sm font-semibold ${getScoreColor(supplier.scorecard.overallScore)}`}>
                {supplier.scorecard.overallScore.toFixed(0)}/100
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Full card view
  return (
    <Card 
      className="hover:shadow-lg transition-all hover:-translate-y-0.5"
      isPressable={!!onClick}
      onPress={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">{supplier.name}</h3>
                {supplier.strategicPartner && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-sm text-gray-500">{supplier.code}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip size="sm" color={tierConfig.color} variant="flat">
              {tierConfig.label}
            </Chip>
            <Chip size="sm" color={statusConfig.color} variant="dot">
              {statusConfig.label}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Location and Type */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          {supplier.contact?.address?.city && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{supplier.contact.address.city}, {supplier.contact.address.country}</span>
            </div>
          )}
          <span className="capitalize">{supplier.type.replace('_', ' ')}</span>
        </div>

        {/* Overall Score */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Overall Score</div>
          <div className={`text-4xl font-bold ${getScoreColor(supplier.scorecard.overallScore)}`}>
            {supplier.scorecard.overallScore.toFixed(0)}
          </div>
          <div className="flex items-center justify-center space-x-1 mt-1">
            {getTrendIcon(supplier.scorecard.trend)}
            <span className="text-xs text-gray-500">{supplier.scorecard.trend}</span>
          </div>
        </div>

        {/* Scorecard Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Quality</div>
            <div className={`text-lg font-semibold ${getMetricColor(supplier.scorecard.qualityScore)}`}>
              {supplier.scorecard.qualityScore.toFixed(0)}
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Delivery</div>
            <div className={`text-lg font-semibold ${getMetricColor(supplier.scorecard.deliveryScore)}`}>
              {supplier.scorecard.deliveryScore.toFixed(0)}
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Cost</div>
            <div className={`text-lg font-semibold ${getMetricColor(supplier.scorecard.costScore)}`}>
              {supplier.scorecard.costScore.toFixed(0)}
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Response</div>
            <div className={`text-lg font-semibold ${getMetricColor(supplier.scorecard.responseScore)}`}>
              {supplier.scorecard.responseScore.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xs text-gray-500">On-Time</div>
            <div className={`text-sm font-semibold ${getMetricColor(supplier.performance.onTimeDeliveryRate)}`}>
              {supplier.performance.onTimeDeliveryRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xs text-gray-500">Fill Rate</div>
            <div className={`text-sm font-semibold ${getMetricColor(supplier.performance.orderFillRate)}`}>
              {supplier.performance.orderFillRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xs text-gray-500">Lead Time</div>
            <div className="text-sm font-semibold text-gray-700">
              {supplier.performance.averageLeadTime}d
            </div>
          </div>
        </div>

        {/* Financial and Risk */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Annual Spend</div>
              <div className="font-semibold">{formatCurrency(supplier.financials.annualSpend)}</div>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded ${riskConfig.bgColor}`}>
            <span className={riskConfig.color}>{riskConfig.icon}</span>
            <span className={`text-sm font-medium ${riskConfig.color}`}>
              {supplier.risk.level} Risk
            </span>
          </div>
        </div>

        {/* Certifications (if available) */}
        {supplier.certifications && supplier.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.certifications.slice(0, 3).map((cert, index) => (
              <Chip key={index} size="sm" variant="bordered" className="text-xs">
                {cert}
              </Chip>
            ))}
            {supplier.certifications.length > 3 && (
              <Chip size="sm" variant="flat" className="text-xs">
                +{supplier.certifications.length - 3} more
              </Chip>
            )}
          </div>
        )}
      </CardBody>

      {/* Action Buttons */}
      {(onViewDetails || onEdit) && (
        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="flat" 
                color="primary"
                className="flex-1"
                onPress={() => onViewDetails(supplier._id)}
              >
                View Scorecard
              </Button>
            )}
            {onEdit && (
              <Button 
                size="sm" 
                variant="bordered"
                className="flex-1"
                startContent={<Settings className="h-4 w-4" />}
                onPress={() => onEdit(supplier._id)}
              >
                Manage
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default SupplierCard;

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Follows HeroUI component patterns from existing codebase
 * - Supports compact and full card views
 * - Color-coded scorecard metrics for quick visual assessment
 * - Strategic partner and risk level indicators
 * 
 * FEATURES PORTED FROM LEGACY:
 * - Tier badges (Strategic/Preferred/Tier 1/2/3)
 * - Overall score with /100 display
 * - 4-metric scorecard (Quality, Delivery, Cost, Response)
 * - On-time delivery rate display
 * - Preferred supplier star indicator (now strategicPartner)
 * - Total spend tracking
 * 
 * NEW FEATURES:
 * - Risk level indicator with color coding
 * - Performance trend indicator (Improving/Stable/Declining)
 * - Fill rate and lead time metrics
 * - Certifications display
 * - Status badge (Active/On Hold/Suspended)
 * - Compact view option
 * 
 * USAGE:
 * ```tsx
 * <SupplierCard
 *   supplier={supplierData}
 *   onClick={(id) => router.push(`/manufacturing/suppliers/${id}`)}
 *   onViewDetails={(id) => setSelectedSupplier(id)}
 *   onEdit={(id) => openEditModal(id)}
 * />
 * ```
 */
