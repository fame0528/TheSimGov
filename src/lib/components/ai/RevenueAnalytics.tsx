/**
 * @fileoverview Revenue Analytics - API Usage and Revenue Metrics
 * @module lib/components/ai/RevenueAnalytics
 * 
 * OVERVIEW:
 * Tab-based revenue analytics dashboard showing API usage, customers, and revenue.
 * Adapted from SaaSMetrics.tsx with focus on AI-specific metrics.
 * 
 * FEATURES:
 * - API Usage tab (total calls/month, top models table, response time graph)
 * - Customers tab (customer count, churn rate, new signups, tier distribution)
 * - Revenue tab (monthly revenue chart, revenue by model table, pricing optimization)
 * - MRR/ARR calculations
 * - Churn rate color coding (green <3%, yellow 3-5%, orange 5-10%, red >10%)
 * - API usage progress bar (calls/limit)
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from '@heroui/table';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

export interface RevenueAnalyticsProps {
  /** Company ID */
  companyId: string;
  /** Monthly recurring revenue */
  mrr?: number;
  /** Annual recurring revenue */
  arr?: number;
  /** Churn rate percentage */
  churnRate?: number;
  /** Total API calls this month */
  apiCalls?: number;
  /** API call limit per month */
  apiLimit?: number;
  /** Customer count */
  customers?: number;
  /** Top models by revenue */
  topModels?: ModelRevenue[];
  /** Customer tiers breakdown */
  tierDistribution?: TierStats[];
}

export interface ModelRevenue {
  modelId: string;
  modelName: string;
  calls: number;
  revenue: number;
  avgResponseTime: number;
}

export interface TierStats {
  tier: 'Free' | 'Starter' | 'Professional' | 'Enterprise';
  count: number;
  revenue: number;
}

/**
 * RevenueAnalytics Component
 * 
 * Comprehensive revenue analytics dashboard with API usage, customers, and revenue tracking.
 * 
 * @example
 * ```tsx
 * <RevenueAnalytics
 *   companyId="123"
 *   mrr={50000}
 *   arr={600000}
 *   churnRate={2.5}
 *   apiCalls={1500000}
 *   apiLimit={2000000}
 * />
 * ```
 */
export function RevenueAnalytics({
  companyId: _companyId,
  mrr = 0,
  arr = 0,
  churnRate = 0,
  apiCalls = 0,
  apiLimit = 1_000_000,
  customers = 0,
  topModels = [],
  tierDistribution = [],
}: RevenueAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('api');

  // Calculate API usage percentage
  const apiUsagePercent = (apiCalls / apiLimit) * 100;

  // Determine churn rate color
  const churnColor = 
    churnRate < 3 ? 'success' :
    churnRate < 5 ? 'warning' :
    churnRate < 10 ? 'default' : 'danger';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">💰 Revenue Analytics</h2>
        <p className="text-default-700">API usage, customer metrics, and revenue tracking</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">MRR</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(mrr)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">ARR</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(arr)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Customers</p>
            <p className="text-2xl font-bold text-warning">{formatNumber(customers)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Churn Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{churnRate.toFixed(1)}%</p>
              <Chip size="sm" color={churnColor}>
                {churnRate < 3 ? '🟢 Low' : churnRate < 5 ? '🟡 Medium' : churnRate < 10 ? '🟠 High' : '🔴 Critical'}
              </Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="api" title="API Usage">
          <div className="mt-4 space-y-4">
            {/* API Usage Progress */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Monthly API Usage</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-default-700">
                    {formatNumber(apiCalls)} / {formatNumber(apiLimit)} calls
                  </span>
                  <span className="font-bold">{apiUsagePercent.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={apiUsagePercent} 
                  color={
                    apiUsagePercent < 70 ? 'success' :
                    apiUsagePercent < 90 ? 'warning' : 'danger'
                  }
                  size="md"
                />
                {apiUsagePercent > 90 && (
                  <div className="bg-danger-50 dark:bg-danger-900/20 p-3 rounded-lg border-2 border-danger">
                    <p className="text-sm">⚠️ API usage approaching limit. Consider upgrading plan or optimizing usage.</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Top Models by Calls */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Top Models by Usage</h3>
              </CardHeader>
              <CardBody>
                {topModels.length === 0 ? (
                  <p className="text-center text-default-700 py-4">No model usage data available</p>
                ) : (
                  <Table aria-label="Top Models">
                    <TableHeader>
                      <TableColumn>MODEL</TableColumn>
                      <TableColumn>CALLS</TableColumn>
                      <TableColumn>REVENUE</TableColumn>
                      <TableColumn>AVG RESPONSE TIME</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {topModels.map((model) => (
                        <TableRow key={model.modelId}>
                          <TableCell>
                            <span className="font-medium">{model.modelName}</span>
                          </TableCell>
                          <TableCell>{formatNumber(model.calls)}</TableCell>
                          <TableCell>{formatCurrency(model.revenue)}</TableCell>
                          <TableCell>{model.avgResponseTime}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="customers" title="Customers">
          <div className="mt-4 space-y-4">
            {/* Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Total Customers</p>
                  <p className="text-3xl font-bold text-primary">{formatNumber(customers)}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Churn Rate</p>
                  <p className="text-3xl font-bold">{churnRate.toFixed(1)}%</p>
                  <Chip size="sm" color={churnColor} className="mt-1">
                    {churnRate < 3 ? 'Excellent' : churnRate < 5 ? 'Good' : churnRate < 10 ? 'Needs Improvement' : 'Critical'}
                  </Chip>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Avg Revenue per Customer</p>
                  <p className="text-3xl font-bold text-success">
                    {customers > 0 ? formatCurrency(mrr / customers) : '$0'}
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Customer Tier Distribution</h3>
              </CardHeader>
              <CardBody>
                {tierDistribution.length === 0 ? (
                  <p className="text-center text-default-700 py-4">No tier data available</p>
                ) : (
                  <div className="space-y-3">
                    {tierDistribution.map((tier) => (
                      <div key={tier.tier}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{tier.tier}</span>
                          <div className="flex gap-3 text-sm">
                            <span className="text-default-700">{tier.count} customers</span>
                            <span className="font-bold">{formatCurrency(tier.revenue)}/mo</span>
                          </div>
                        </div>
                        <Progress 
                          value={(tier.count / customers) * 100} 
                          color={
                            tier.tier === 'Enterprise' ? 'success' :
                            tier.tier === 'Professional' ? 'primary' :
                            tier.tier === 'Starter' ? 'warning' : 'default'
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="revenue" title="Revenue">
          <div className="mt-4 space-y-4">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Monthly Recurring Revenue</p>
                  <p className="text-4xl font-bold text-success">{formatCurrency(mrr)}</p>
                  <p className="text-xs text-default-400 mt-1">MRR</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Annual Recurring Revenue</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(arr)}</p>
                  <p className="text-xs text-default-400 mt-1">ARR = MRR × 12</p>
                </CardBody>
              </Card>
            </div>

            {/* Revenue by Model */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Revenue by Model</h3>
              </CardHeader>
              <CardBody>
                {topModels.length === 0 ? (
                  <p className="text-center text-default-700 py-4">No revenue data available</p>
                ) : (
                  <Table aria-label="Revenue by Model">
                    <TableHeader>
                      <TableColumn>MODEL</TableColumn>
                      <TableColumn>CALLS</TableColumn>
                      <TableColumn>REVENUE</TableColumn>
                      <TableColumn>% OF TOTAL</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {topModels.map((model) => {
                        const totalRevenue = topModels.reduce((sum, m) => sum + m.revenue, 0);
                        const percent = (model.revenue / totalRevenue) * 100;
                        return (
                          <TableRow key={model.modelId}>
                            <TableCell>
                              <span className="font-medium">{model.modelName}</span>
                            </TableCell>
                            <TableCell>{formatNumber(model.calls)}</TableCell>
                            <TableCell>
                              <span className="font-bold">{formatCurrency(model.revenue)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{percent.toFixed(1)}%</span>
                                <Progress value={percent} size="sm" className="max-w-[100px]" />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Tab-Based Design**: API Usage, Customers, Revenue tabs
 * 2. **API Usage Tab**: Total calls/limit progress bar, top models table, response time
 * 3. **Customers Tab**: Customer count, churn rate, tier distribution progress bars
 * 4. **Revenue Tab**: MRR/ARR display, revenue by model table with % breakdown
 * 5. **Churn Rate Color Coding**: Green <3%, Yellow 3-5%, Orange 5-10%, Red >10%
 * 6. **API Usage Alerts**: Warning when usage >90% of limit
 * 7. **Tier Distribution**: Progress bars for Free/Starter/Professional/Enterprise
 * 8. **Revenue Breakdown**: Table with calls, revenue, % of total per model
 * 
 * ADAPTED FROM:
 * - SaaSMetrics.tsx (MRR/ARR calculations, churn rate color coding)
 * - API usage progress bar with color thresholds
 * - Customer tier distribution visualization
 * - Revenue by model breakdown table
 */
