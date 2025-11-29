/**
 * @fileoverview E-Commerce Industry Dashboard Component
 * @module lib/components/ecommerce/EcommerceDashboard
 * 
 * OVERVIEW:
 * Main E-Commerce industry dashboard that aggregates all marketplace operations.
 * Provides unified view of products, orders, reviews, and marketing campaigns.
 * Entry point for E-Commerce company management.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { addToast } from '@heroui/toast';
import { LoadingSpinner } from '@/lib/components/shared/LoadingSpinner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EcommerceDashboardProps {
  companyId: string;
  companyName?: string;
  onDataChange?: () => void;
  
  // Pre-fetched summary data
  totalProducts?: number;
  activeProducts?: number;
  totalRevenue?: number;
  totalOrders?: number;
  avgRating?: number;
  
  // Action callbacks
  onNewProduct?: () => void;
  onViewOrders?: () => void;
  onViewReviews?: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case 'Delivered': return 'success';
    case 'Shipped': case 'Processing': return 'warning';
    case 'Cancelled': return 'danger';
    default: return 'default';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EcommerceDashboard({
  companyId,
  companyName,
  onDataChange,
  totalProducts: prefetchedProducts,
  activeProducts: prefetchedActive,
  totalRevenue: prefetchedRevenue,
  totalOrders: prefetchedOrders,
  avgRating: prefetchedRating,
  onNewProduct,
  onViewOrders,
  onViewReviews,
}: EcommerceDashboardProps) {
  const hasPrefetchedData = prefetchedProducts !== undefined;
  const [loading, setLoading] = useState(!hasPrefetchedData);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ecommerce/summary?company=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        onDataChange?.();
      }
    } catch (error) {
      addToast({
        title: 'Error loading e-commerce data',
        description: error instanceof Error ? error.message : 'Failed to fetch summary',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, onDataChange]);

  useEffect(() => {
    if (!hasPrefetchedData) {
      fetchSummary();
    }
  }, [fetchSummary, hasPrefetchedData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const products = summary?.products || { total: prefetchedProducts || 0, active: prefetchedActive || 0, avgRating: prefetchedRating || 0 };
  const orders = summary?.orders || { total: prefetchedOrders || 0, totalRevenue: prefetchedRevenue || 0 };
  const reviews = summary?.reviews || { total: 0, pending: 0 };
  const campaigns = summary?.campaigns || { active: 0, roi: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">E-Commerce Operations</h1>
          {companyName && <p className="text-default-500">{companyName}</p>}
        </div>
        <div className="flex gap-2">
          <Button color="primary" onPress={onNewProduct}>New Product</Button>
          <Button variant="flat" onPress={fetchSummary}>Refresh</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total Products</p>
            <p className="text-2xl font-bold">{products.total}</p>
            <p className="text-xs text-success">{products.active} active</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(orders.totalRevenue)}</p>
            <p className="text-xs text-default-500">{orders.total} orders</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Avg Rating</p>
            <p className="text-2xl font-bold">{products.avgRating.toFixed(1)} ⭐</p>
            <p className="text-xs text-default-500">{reviews.total} reviews</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Marketing ROI</p>
            <p className="text-2xl font-bold">{formatPercent(campaigns.roi)}</p>
            <p className="text-xs text-success">{campaigns.active} campaigns</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Top Products</h3>
                  {summary?.topProducts?.map((product: any) => (
                    <div key={product._id} className="flex justify-between items-center p-2 hover:bg-default-100 rounded">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-default-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                        <p className="text-xs">{product.totalSold} sold • {product.rating.toFixed(1)}⭐</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="products" title={`Products (${products.total})`}>
          <Card>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active Products:</span>
                  <span className="font-semibold">{products.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Stock:</span>
                  <span className="font-semibold text-warning">{products.lowStock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inventory Value:</span>
                  <span className="font-semibold">{formatCurrency(products.inventoryValue || 0)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="orders" title={`Orders (${orders.total})`}>
          <Card>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <Chip color="warning" size="sm">{orders.pending || 0}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Processing:</span>
                  <Chip color="primary" size="sm">{orders.processing || 0}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Delivered:</span>
                  <Chip color="success" size="sm">{orders.delivered || 0}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Avg Order Value:</span>
                  <span className="font-semibold">{formatCurrency(orders.avgOrderValue || 0)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="reviews" title={`Reviews (${reviews.total})`}>
          <Card>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Published:</span>
                  <Chip color="success" size="sm">{reviews.published || 0}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Pending Moderation:</span>
                  <Chip color="warning" size="sm">{reviews.pending}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Average Rating:</span>
                  <span className="font-semibold">{(reviews.avgRating || 0).toFixed(1)} ⭐</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="campaigns" title={`Campaigns (${campaigns.total || 0})`}>
          <Card>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <Chip color="success" size="sm">{campaigns.active}</Chip>
                </div>
                <div className="flex justify-between">
                  <span>Total Spent:</span>
                  <span className="font-semibold">{formatCurrency(campaigns.totalSpent || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue Generated:</span>
                  <span className="font-semibold text-success">{formatCurrency(campaigns.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <span className="font-semibold">{formatPercent(campaigns.roi)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversions:</span>
                  <span className="font-semibold">{campaigns.conversions || 0}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

export default EcommerceDashboard;
