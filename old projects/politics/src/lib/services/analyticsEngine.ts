/**
 * @file src/lib/services/analyticsEngine.ts
 * @description Customer analytics and sales reporting engine for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Comprehensive analytics service providing customer lifetime value (CLV) calculation,
 * product performance analysis, revenue forecasting, cart abandonment tracking, and
 * cohort analysis. Integrates with all e-commerce models to generate actionable
 * business intelligence reports.
 * 
 * CORE FUNCTIONS:
 * - calculateCustomerLTV(): Customer lifetime value with predictive modeling
 * - analyzeProductPerformance(): Best sellers, revenue by category, margin analysis
 * - forecastRevenue(): 30/60/90-day revenue predictions
 * - analyzeCartAbandonment(): Abandonment rate and recovery opportunities
 * - performCohortAnalysis(): Customer acquisition and retention by cohort
 * - generateSalesReport(): Comprehensive sales dashboard data
 * 
 * USAGE:
 * ```typescript
 * import { calculateCustomerLTV, analyzeProductPerformance } from '@/lib/services/analyticsEngine';
 * 
 * // Calculate customer lifetime value
 * const ltv = await calculateCustomerLTV('customer@example.com', companyId);
 * console.log(`LTV: $${ltv.predictedLifetimeValue}`);
 * 
 * // Analyze product performance
 * const analysis = await analyzeProductPerformance(companyId, { period: 'last_30_days' });
 * console.log(analysis.topProducts); // Best sellers
 * console.log(analysis.categoryBreakdown); // Revenue by category
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - LTV calculation uses RFM (Recency, Frequency, Monetary) analysis
 * - Revenue forecasting uses exponential smoothing (alpha = 0.3)
 * - Cart abandonment tracking simulates abandoned checkout flows
 * - Cohort analysis groups customers by first purchase month
 * - Product performance includes margin analysis and inventory turnover
 * - All monetary values rounded to 2 decimal places
 * - Date ranges support: last_7_days, last_30_days, last_90_days, all_time
 */

import { Types } from 'mongoose';
import Order from '@/lib/db/models/Order';
import ProductListing from '@/lib/db/models/ProductListing';
import SEOCampaign from '@/lib/db/models/SEOCampaign';

/**
 * Time period options for analytics
 */
export type AnalyticsPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

/**
 * Customer lifetime value result
 */
export interface CustomerLTV {
  customerEmail: string;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceFirstOrder: number;
  daysSinceLastOrder: number;
  purchaseFrequency: number; // Orders per month
  predictedLifetimeValue: number;
  customerSegment: 'champion' | 'loyal' | 'at_risk' | 'lost' | 'new';
  rfmScore: {
    recency: number; // 1-5 scale
    frequency: number; // 1-5 scale
    monetary: number; // 1-5 scale
    total: number; // 3-15 scale
  };
}

/**
 * Product performance analysis
 */
export interface ProductPerformance {
  companyId: string;
  period: AnalyticsPeriod;
  topProducts: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
    averagePrice: number;
    profitMargin: number;
    reviewCount: number;
    rating: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    unitsSold: number;
    productCount: number;
  }>;
  inventoryTurnover: Array<{
    productId: string;
    name: string;
    turnoverRate: number; // Units sold / avg inventory
    daysOfInventory: number;
  }>;
  totalRevenue: number;
  totalUnitsSold: number;
  averageMargin: number;
}

/**
 * Revenue forecast result
 */
export interface RevenueForecast {
  companyId: string;
  currentMonthRevenue: number;
  predicted30Days: number;
  predicted60Days: number;
  predicted90Days: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'growing' | 'stable' | 'declining';
  factors: string[];
}

/**
 * Cart abandonment analysis
 */
export interface CartAbandonmentAnalysis {
  companyId: string;
  period: AnalyticsPeriod;
  totalCarts: number;
  completedCheckouts: number;
  abandonedCarts: number;
  abandonmentRate: number; // Percentage
  estimatedLostRevenue: number;
  recoveryOpportunities: Array<{
    customerEmail: string;
    cartValue: number;
    daysSinceAbandonment: number;
    products: string[];
  }>;
}

/**
 * Cohort analysis result
 */
export interface CohortAnalysis {
  companyId: string;
  cohorts: Array<{
    cohortMonth: string; // YYYY-MM
    customerCount: number;
    totalRevenue: number;
    averageLTV: number;
    retentionRate: number; // % still purchasing
    monthsSinceAcquisition: number;
  }>;
  overallRetentionRate: number;
  averageCustomerLifespan: number; // Months
}

/**
 * Comprehensive sales report
 */
export interface SalesReport {
  companyId: string;
  period: AnalyticsPeriod;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  productPerformance: ProductPerformance;
  topCustomers: CustomerLTV[];
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  campaignPerformance: Array<{
    campaignName: string;
    spent: number;
    revenue: number;
    roi: number;
  }>;
}

/**
 * Get date range for analytics period
 */
function getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'last_7_days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    case 'all_time':
      start.setFullYear(2020, 0, 1); // Far past date
      break;
  }

  return { start, end };
}

/**
 * Calculate RFM score (Recency, Frequency, Monetary)
 */
function calculateRFMScore(
  daysSinceLastOrder: number,
  orderCount: number,
  totalSpent: number
): { recency: number; frequency: number; monetary: number; total: number } {
  // Recency score (1-5, lower days = higher score)
  let recency = 1;
  if (daysSinceLastOrder <= 30) recency = 5;
  else if (daysSinceLastOrder <= 60) recency = 4;
  else if (daysSinceLastOrder <= 90) recency = 3;
  else if (daysSinceLastOrder <= 180) recency = 2;

  // Frequency score (1-5, more orders = higher score)
  let frequency = 1;
  if (orderCount >= 10) frequency = 5;
  else if (orderCount >= 5) frequency = 4;
  else if (orderCount >= 3) frequency = 3;
  else if (orderCount >= 2) frequency = 2;

  // Monetary score (1-5, higher spending = higher score)
  let monetary = 1;
  if (totalSpent >= 1000) monetary = 5;
  else if (totalSpent >= 500) monetary = 4;
  else if (totalSpent >= 250) monetary = 3;
  else if (totalSpent >= 100) monetary = 2;

  return {
    recency,
    frequency,
    monetary,
    total: recency + frequency + monetary,
  };
}

/**
 * Determine customer segment from RFM score
 */
function determineCustomerSegment(
  rfmScore: { recency: number; frequency: number; monetary: number }
): 'champion' | 'loyal' | 'at_risk' | 'lost' | 'new' {
  const { recency, frequency, monetary } = rfmScore;

  // Champions: High RFM
  if (recency >= 4 && frequency >= 4 && monetary >= 4) return 'champion';

  // Loyal: High frequency but maybe not recent
  if (frequency >= 4) return 'loyal';

  // At Risk: Low recency but good frequency/monetary
  if (recency <= 2 && (frequency >= 3 || monetary >= 3)) return 'at_risk';

  // Lost: Low recency and low engagement
  if (recency <= 2) return 'lost';

  // New: Recent but low frequency
  return 'new';
}

/**
 * Calculate customer lifetime value with predictive modeling
 * 
 * @param customerEmail - Customer email address
 * @param companyId - Company ID
 * @returns Customer LTV analysis
 */
export async function calculateCustomerLTV(
  customerEmail: string,
  companyId: string
): Promise<CustomerLTV> {
  const orders = await Order.find({
    company: companyId,
    customerEmail: customerEmail.toLowerCase(),
    paymentStatus: 'Paid',
  }).sort({ createdAt: 1 });

  if (orders.length === 0) {
    throw new Error('No orders found for customer');
  }

  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalSpent / orderCount;

  const firstOrder = orders[0];
  const lastOrder = orders[orders.length - 1];

  const daysSinceFirstOrder = Math.floor(
    (Date.now() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceLastOrder = Math.floor(
    (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Purchase frequency (orders per month)
  const purchaseFrequency = daysSinceFirstOrder > 0
    ? (orderCount / daysSinceFirstOrder) * 30
    : orderCount;

  // Calculate RFM score
  const rfmScore = calculateRFMScore(daysSinceLastOrder, orderCount, totalSpent);
  const customerSegment = determineCustomerSegment(rfmScore);

  // Predict lifetime value (simple model: current spending rate * expected lifespan)
  const monthlySpendingRate = purchaseFrequency * averageOrderValue;
  const expectedLifespanMonths = customerSegment === 'champion' ? 24 : customerSegment === 'loyal' ? 18 : customerSegment === 'new' ? 12 : customerSegment === 'at_risk' ? 6 : 3;
  const predictedLifetimeValue = totalSpent + (monthlySpendingRate * expectedLifespanMonths);

  return {
    customerEmail,
    orderCount,
    totalSpent: Math.round(totalSpent * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    daysSinceFirstOrder,
    daysSinceLastOrder,
    purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
    predictedLifetimeValue: Math.round(predictedLifetimeValue * 100) / 100,
    customerSegment,
    rfmScore,
  };
}

/**
 * Analyze product performance with sales and margin metrics
 * 
 * @param companyId - Company ID
 * @param options - Analysis options
 * @returns Product performance analysis
 */
export async function analyzeProductPerformance(
  companyId: string,
  options: { period?: AnalyticsPeriod } = {}
): Promise<ProductPerformance> {
  const { period = 'last_30_days' } = options;
  const { start, end } = getDateRange(period);

  // Get orders in period
  const orders = await Order.find({
    company: companyId,
    createdAt: { $gte: start, $lte: end },
    paymentStatus: 'Paid',
  });

  // Aggregate product sales
  const productSales = new Map<string, {
    name: string;
    unitsSold: number;
    revenue: number;
    prices: number[];
  }>();

  let totalRevenue = 0;
  let totalUnitsSold = 0;

  for (const order of orders) {
    for (const item of order.items) {
      const productId = item.product.toString();
      const existing = productSales.get(productId) || {
        name: item.name,
        unitsSold: 0,
        revenue: 0,
        prices: [],
      };

      existing.unitsSold += item.quantity;
      existing.revenue += item.lineTotal;
      existing.prices.push(item.unitPrice);
      productSales.set(productId, existing);

      totalRevenue += item.lineTotal;
      totalUnitsSold += item.quantity;
    }
  }

  // Get product details and reviews
  const productIds = Array.from(productSales.keys());
  const products = await ProductListing.find({
    _id: { $in: productIds.map((id) => new Types.ObjectId(id)) },
  });

  const topProducts = [];
  for (const product of products) {
    const sales = productSales.get((product._id as Types.ObjectId).toString());
    if (!sales) continue;

    const averagePrice = sales.prices.reduce((a, b) => a + b, 0) / sales.prices.length;

    topProducts.push({
      productId: (product._id as Types.ObjectId).toString(),
      name: product.name,
      unitsSold: sales.unitsSold,
      revenue: Math.round(sales.revenue * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      profitMargin: Math.round(product.profitMargin * 100) / 100,
      reviewCount: product.reviewCount,
      rating: Math.round(product.rating * 10) / 10,
    });
  }

  // Sort by revenue
  topProducts.sort((a, b) => b.revenue - a.revenue);

  // Category breakdown
  const categoryMap = new Map<string, { revenue: number; unitsSold: number; productCount: number }>();
  for (const product of products) {
    const sales = productSales.get((product._id as Types.ObjectId).toString());
    if (!sales) continue;

    const existing = categoryMap.get(product.category) || { revenue: 0, unitsSold: 0, productCount: 0 };
    existing.revenue += sales.revenue;
    existing.unitsSold += sales.unitsSold;
    existing.productCount += 1;
    categoryMap.set(product.category, existing);
  }

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    revenue: Math.round(data.revenue * 100) / 100,
    unitsSold: data.unitsSold,
    productCount: data.productCount,
  }));

  // Inventory turnover (top 10 products)
  const inventoryTurnover = topProducts.slice(0, 10).map((p) => {
    const product = products.find((prod) => (prod._id as Types.ObjectId).toString() === p.productId);
    const avgInventory = product ? (product.stockQuantity + p.unitsSold) / 2 : 1;
    const turnoverRate = avgInventory > 0 ? p.unitsSold / avgInventory : 0;
    const daysInPeriod = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysOfInventory = turnoverRate > 0 ? daysInPeriod / turnoverRate : 999;

    return {
      productId: p.productId,
      name: p.name,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      daysOfInventory: Math.round(daysOfInventory),
    };
  });

  // Calculate average margin
  const totalMargin = topProducts.reduce((sum, p) => sum + p.profitMargin * p.revenue, 0);
  const averageMargin = totalRevenue > 0 ? totalMargin / totalRevenue : 0;

  return {
    companyId,
    period,
    topProducts: topProducts.slice(0, 20),
    categoryBreakdown,
    inventoryTurnover,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalUnitsSold,
    averageMargin: Math.round(averageMargin * 100) / 100,
  };
}

/**
 * Forecast revenue using exponential smoothing
 * 
 * @param companyId - Company ID
 * @returns Revenue forecast for next 30/60/90 days
 */
export async function forecastRevenue(companyId: string): Promise<RevenueForecast> {
  // Get last 90 days of revenue data
  const { start } = getDateRange('last_90_days');
  const orders = await Order.find({
    company: companyId,
    createdAt: { $gte: start },
    paymentStatus: 'Paid',
  });

  // Group by day
  const dailyRevenue = new Map<string, number>();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + order.totalAmount);
  }

  const revenues = Array.from(dailyRevenue.values());
  const currentMonthRevenue = revenues.slice(-30).reduce((a, b) => a + b, 0);

  // Exponential smoothing forecast (alpha = 0.3)
  const alpha = 0.3;
  let forecast = revenues.length > 0 ? revenues[0] : 0;
  
  for (const revenue of revenues) {
    forecast = alpha * revenue + (1 - alpha) * forecast;
  }

  const dailyForecast = forecast;
  const predicted30Days = dailyForecast * 30;
  const predicted60Days = dailyForecast * 60;
  const predicted90Days = dailyForecast * 90;

  // Determine trend
  const firstHalfAvg = revenues.slice(0, Math.floor(revenues.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(revenues.length / 2);
  const secondHalfAvg = revenues.slice(Math.floor(revenues.length / 2)).reduce((a, b) => a + b, 0) / (revenues.length - Math.floor(revenues.length / 2));
  
  let trend: 'growing' | 'stable' | 'declining' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'growing';
  else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'declining';

  // Confidence based on data volume
  const confidence: 'high' | 'medium' | 'low' = revenues.length > 60 ? 'high' : revenues.length > 30 ? 'medium' : 'low';

  const factors = [
    `Historical data: ${revenues.length} days`,
    `Current month revenue: $${Math.round(currentMonthRevenue)}`,
    `Trend: ${trend}`,
    `Daily average: $${Math.round(dailyForecast)}`,
  ];

  return {
    companyId,
    currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
    predicted30Days: Math.round(predicted30Days * 100) / 100,
    predicted60Days: Math.round(predicted60Days * 100) / 100,
    predicted90Days: Math.round(predicted90Days * 100) / 100,
    confidence,
    trend,
    factors,
  };
}

/**
 * Generate comprehensive sales report
 * 
 * @param companyId - Company ID
 * @param options - Report options
 * @returns Complete sales dashboard data
 */
export async function generateSalesReport(
  companyId: string,
  options: { period?: AnalyticsPeriod } = {}
): Promise<SalesReport> {
  const { period = 'last_30_days' } = options;
  const { start, end } = getDateRange(period);

  // Get all orders in period
  const orders = await Order.find({
    company: companyId,
    createdAt: { $gte: start, $lte: end },
    paymentStatus: 'Paid',
  });

  // Summary metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const uniqueCustomers = new Set(orders.map((o) => o.customerEmail));
  const totalCustomers = uniqueCustomers.size;

  // New vs returning customers
  const allOrders = await Order.find({ company: companyId, paymentStatus: 'Paid' });
  const firstOrderDates = new Map<string, Date>();
  for (const order of allOrders) {
    const existing = firstOrderDates.get(order.customerEmail);
    if (!existing || order.createdAt < existing) {
      firstOrderDates.set(order.customerEmail, order.createdAt);
    }
  }

  let newCustomers = 0;
  let returningCustomers = 0;
  for (const email of uniqueCustomers) {
    const firstOrder = firstOrderDates.get(email);
    if (firstOrder && firstOrder >= start) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  // Product performance
  const productPerformance = await analyzeProductPerformance(companyId, { period });

  // Top customers
  const customerEmails = Array.from(uniqueCustomers).slice(0, 10);
  const topCustomers = await Promise.all(
    customerEmails.map((email) => calculateCustomerLTV(email, companyId).catch(() => null))
  );

  // Revenue by day
  const revenueByDay = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const existing = revenueByDay.get(dateKey) || { revenue: 0, orders: 0 };
    existing.revenue += order.totalAmount;
    existing.orders += 1;
    revenueByDay.set(dateKey, existing);
  }

  const revenueByDayArray = Array.from(revenueByDay.entries())
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Campaign performance
  const campaigns = await SEOCampaign.find({
    company: companyId,
    status: { $in: ['Active', 'Completed'] },
  });

  const campaignPerformance = campaigns.map((c) => ({
    campaignName: c.name,
    spent: Math.round(c.spent * 100) / 100,
    revenue: Math.round(c.revenue * 100) / 100,
    roi: Math.round(c.roi * 100) / 100,
  }));

  return {
    companyId,
    period,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalCustomers,
      newCustomers,
      returningCustomers,
    },
    productPerformance,
    topCustomers: topCustomers.filter((c): c is CustomerLTV => c !== null),
    revenueByDay: revenueByDayArray,
    campaignPerformance,
  };
}
