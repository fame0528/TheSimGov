/**
 * @file src/lib/services/fulfillmentSimulator.ts
 * @description Order fulfillment simulation service for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Comprehensive fulfillment simulation service handling order processing, shipping
 * cost calculation, delivery estimation, inventory management, and financial tracking.
 * Simulates real-world e-commerce fulfillment workflows including payment processing
 * fees, tax calculation, and inventory deduction with low-stock alerts.
 * 
 * CORE FUNCTIONS:
 * - processOrder(): Complete order processing pipeline
 * - calculateShippingCost(): Distance-based shipping cost calculation
 * - estimateDelivery(): Delivery date estimation by shipping method
 * - updateInventory(): Stock deduction with low-stock alerts
 * - recordTransaction(): Financial audit trail creation
 * - simulateFulfillment(): Multi-day fulfillment workflow simulation
 * 
 * USAGE:
 * ```typescript
 * import { processOrder, simulateFulfillment } from '@/lib/services/fulfillmentSimulator';
 * 
 * // Process new order
 * const result = await processOrder({
 *   companyId,
 *   items: [{ productId, variant: 'Size: Large', quantity: 2 }],
 *   customerInfo: { name: 'John Smith', email: 'john@example.com', phone: '555-0100' },
 *   shippingAddress: { street: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701' },
 *   shippingMethod: 'Standard',
 *   paymentMethod: 'Credit Card'
 * });
 * 
 * // Simulate fulfillment progression
 * await simulateFulfillment(orderId, { daysToShip: 2, daysToDeliver: 5 });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Payment processing fee: 2.9% + $0.30 per transaction (industry standard)
 * - Sales tax: 8.5% default (configurable by state)
 * - Shipping costs vary by method and distance
 * - Inventory updates are atomic (transaction-safe)
 * - Low-stock alerts trigger at threshold
 * - Financial transactions recorded for all monetary operations
 * - Order immutability enforced after shipping
 */

import { Types } from 'mongoose';
import ProductListing from '@/lib/db/models/ProductListing';
import Order, { ShippingAddress, ShippingMethod, PaymentMethod } from '@/lib/db/models/Order';
import Transaction from '@/lib/db/models/Transaction';
import Company from '@/lib/db/models/Company';
import type { Order as OrderType } from '@/types/api';

/**
 * Order item interface for processing
 */
export interface OrderItemInput {
  productId: string;
  variant?: string;
  quantity: number;
}

/**
 * Customer information interface
 */
export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

/**
 * Order processing input
 */
export interface ProcessOrderInput {
  companyId: string;
  items: OrderItemInput[];
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  taxRate?: number; // Optional override (default 8.5%)
}

/**
 * Order processing result
 */
export interface ProcessOrderResult {
  success: boolean;
  order?: OrderType;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  estimatedDelivery?: Date;
  error?: string;
  lowStockWarnings?: string[];
}

/**
 * Fulfillment simulation options
 */
export interface FulfillmentSimulationOptions {
  daysToShip?: number; // Days until shipped (default 1-3)
  daysToDeliver?: number; // Days from ship to delivery (default by method)
  autoComplete?: boolean; // Auto-mark as delivered (default true)
}

/**
 * Shipping cost calculation based on method and distance
 * 
 * @param method - Shipping method (Standard/Express/Overnight/Pickup)
 * @param distance - Distance in miles (default 500 for simulation)
 * @returns Shipping cost in dollars
 */
export function calculateShippingCost(
  method: ShippingMethod,
  distance: number = 500
): number {
  // Base rates by method
  const baseRates: Record<ShippingMethod, number> = {
    'Standard': 5.99,
    'Express': 14.99,
    'Overnight': 29.99,
    'Pickup': 0,
  };

  const baseRate = baseRates[method];
  if (method === 'Pickup') return 0;

  // Distance surcharge (per 100 miles over 100)
  const extraMiles = Math.max(0, distance - 100);
  const distanceSurcharge = Math.ceil(extraMiles / 100) * 1.50;

  return Math.round((baseRate + distanceSurcharge) * 100) / 100;
}

/**
 * Estimate delivery date based on shipping method
 * 
 * @param method - Shipping method
 * @param orderDate - Order placement date (default now)
 * @returns Estimated delivery date
 */
export function estimateDelivery(
  method: ShippingMethod,
  orderDate: Date = new Date()
): Date {
  const businessDays: Record<ShippingMethod, number> = {
    'Standard': 5, // 5-7 business days
    'Express': 2, // 2-3 business days
    'Overnight': 1, // Next business day
    'Pickup': 0, // Same day
  };

  const days = businessDays[method];
  const deliveryDate = new Date(orderDate);
  
  // Add business days (skip weekends)
  let addedDays = 0;
  while (addedDays < days) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return deliveryDate;
}

/**
 * Process complete order with inventory updates and financial tracking
 * 
 * @param input - Order processing input data
 * @returns Processing result with order details or error
 */
export async function processOrder(
  input: ProcessOrderInput
): Promise<ProcessOrderResult> {
  const session = await ProductListing.startSession();
  session.startTransaction();

  try {
    const {
      companyId,
      items,
      customerInfo,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      taxRate = 8.5,
    } = input;

    // Validate company exists
    const company = await Company.findById(companyId).session(session);
    if (!company) {
      throw new Error('Company not found');
    }

    // Validate and fetch products
    const orderItems = [];
    let subtotal = 0;
    const lowStockWarnings: string[] = [];

    for (const item of items) {
      const product = await ProductListing.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is not available`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
      }

      // Calculate line total
      const unitPrice = product.effectivePrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });

      // Update inventory
      product.stockQuantity -= item.quantity;
      product.totalSold += item.quantity;
      product.totalRevenue += lineTotal;
      await product.save({ session });

      // Check low stock
      if (product.isLowStock) {
        lowStockWarnings.push(
          `Low stock alert: "${product.name}" (${product.stockQuantity} remaining, threshold: ${product.lowStockThreshold})`
        );
      }
    }

    // Calculate costs
    const shippingCost = calculateShippingCost(shippingMethod);
    const taxAmount = (subtotal * taxRate) / 100;
    const processingFee = subtotal * 0.029 + 0.30; // 2.9% + $0.30
    const totalAmount = subtotal + taxAmount + shippingCost + processingFee;

    // Estimate delivery
    const estimatedDelivery = estimateDelivery(shippingMethod);

    // Create order
    const order = await Order.create(
      [
        {
          company: new Types.ObjectId(companyId),
          items: orderItems,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          subtotal,
          taxRate,
          taxAmount,
          shippingCost,
          processingFee,
          totalAmount,
          paymentMethod,
          shippingMethod,
          estimatedDelivery,
        },
      ],
      { session }
    );

    // Record revenue transaction
    const createdOrder = order[0];
    const createdOrderId = createdOrder._id?.toString() || '';
    await Transaction.create(
      [
        {
          company: new Types.ObjectId(companyId),
          type: 'revenue',
          category: 'Product Sales',
          amount: subtotal,
          description: `Order ${createdOrder.orderNumber} - ${orderItems.length} item(s)`,
          metadata: {
            orderId: createdOrderId,
            orderNumber: createdOrder.orderNumber,
            itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
          },
        },
      ],
      { session }
    );

    // Record processing fee expense
    await Transaction.create(
      [
        {
          company: new Types.ObjectId(companyId),
          type: 'expense',
          category: 'Payment Processing',
          amount: processingFee,
          description: `Payment processing fee for order ${createdOrder.orderNumber}`,
          metadata: {
            orderId: createdOrderId,
            orderNumber: createdOrder.orderNumber,
            paymentMethod,
          },
        },
      ],
      { session }
    );

    // Update company revenue
    company.revenue += subtotal;
    company.expenses += processingFee;
    await company.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      order: createdOrder as unknown as OrderType,
      orderId: createdOrderId,
      orderNumber: createdOrder.orderNumber,
      totalAmount,
      estimatedDelivery,
      lowStockWarnings: lowStockWarnings.length > 0 ? lowStockWarnings : undefined,
    };
  } catch (error) {
    await session.abortTransaction();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order processing failed',
    };
  } finally {
    session.endSession();
  }
}

/**
 * Simulate order fulfillment progression (Processing → Shipped → Delivered)
 * 
 * @param orderId - Order ID to process
 * @param options - Simulation timing options
 * @returns Success status and updated order
 */
export async function simulateFulfillment(
  orderId: string,
  options: FulfillmentSimulationOptions = {}
): Promise<{ success: boolean; order?: OrderType; error?: string }> {
  try {
    const {
      daysToShip = Math.floor(Math.random() * 3) + 1, // 1-3 days
      daysToDeliver = 0, // Auto-calculate from shipping method
      autoComplete = true,
    } = options;

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Mark as paid (if pending)
    if (order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Paid';
      order.paidAt = new Date();
    }

    // Move to processing
    if (order.fulfillmentStatus === 'Pending') {
      order.fulfillmentStatus = 'Processing';
    }

    // Simulate shipping
    const shippedDate = new Date();
    shippedDate.setDate(shippedDate.getDate() + daysToShip);
    
    order.fulfillmentStatus = 'Shipped';
    order.shippedAt = shippedDate;
    order.trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Calculate delivery
    let deliveryDays = daysToDeliver;
    if (deliveryDays === 0) {
      // Auto-calculate from shipping method
      const methodDays: Record<ShippingMethod, number> = {
        'Standard': 5,
        'Express': 2,
        'Overnight': 1,
        'Pickup': 0,
      };
      deliveryDays = methodDays[order.shippingMethod];
    }

    const deliveredDate = new Date(shippedDate);
    deliveredDate.setDate(deliveredDate.getDate() + deliveryDays);

    if (autoComplete) {
      order.fulfillmentStatus = 'Delivered';
      order.deliveredAt = deliveredDate;
    }

    await order.save();

    return { success: true, order: order as unknown as OrderType };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fulfillment simulation failed',
    };
  }
}

/**
 * Get fulfillment statistics for a company
 * 
 * @param companyId - Company ID
 * @returns Fulfillment metrics
 */
export async function getFulfillmentStats(companyId: string) {
  const orders = await Order.find({ company: companyId });

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    averageOrderValue: 0,
    deliveredCount: orders.filter((o) => o.fulfillmentStatus === 'Delivered').length,
    shippedCount: orders.filter((o) => o.fulfillmentStatus === 'Shipped').length,
    processingCount: orders.filter((o) => o.fulfillmentStatus === 'Processing').length,
    pendingCount: orders.filter((o) => o.fulfillmentStatus === 'Pending').length,
    averageDeliveryDays: 0,
    onTimeDeliveryRate: 0,
  };

  if (stats.totalOrders > 0) {
    stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
  }

  // Calculate delivery metrics
  const deliveredOrders = orders.filter((o) => o.daysToDeliver !== null);
  if (deliveredOrders.length > 0) {
    const totalDays = deliveredOrders.reduce((sum, o) => sum + (o.daysToDeliver || 0), 0);
    stats.averageDeliveryDays = totalDays / deliveredOrders.length;

    // On-time = delivered within estimated window
    const onTimeCount = deliveredOrders.filter((o) => {
      if (!o.estimatedDelivery || !o.deliveredAt) return false;
      return o.deliveredAt <= o.estimatedDelivery;
    }).length;
    stats.onTimeDeliveryRate = (onTimeCount / deliveredOrders.length) * 100;
  }

  return stats;
}
