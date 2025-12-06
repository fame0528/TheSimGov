/**
 * @file src/lib/game/tick/retailProcessor.ts
 * @description Retail/E-Commerce tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based retail/e-commerce events each game tick:
 * - Order processing (pending → shipped → delivered)
 * - Inventory turnover and restocking
 * - Returns and refunds processing
 * - Sales revenue calculation
 * - Customer acquisition costs
 *
 * GAMEPLAY IMPACT:
 * Retail is the primary "sell to consumers" industry:
 * - Orders generate revenue when fulfilled
 * - Inventory management affects availability
 * - Returns reduce net revenue
 * - Shipping costs eat into margins
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
} from '@/lib/types/gameTick';
import Order, { IOrder, FulfillmentStatus, PaymentStatus } from '@/lib/db/models/ecommerce/Order';
import ProductListing, { IProductListing } from '@/lib/db/models/ecommerce/ProductListing';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Summary of retail tick processing
 */
export interface RetailTickSummary {
  [key: string]: unknown;
  
  // Orders processed
  ordersPending: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersReturned: number;
  ordersCancelled: number;
  
  // Financial
  grossRevenue: number;
  returnsRefunded: number;
  shippingCosts: number;
  processingFees: number;
  netRevenue: number;
  
  // Inventory
  productsProcessed: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  
  // Metrics
  averageOrderValue: number;
  fulfillmentRate: number;
}

/**
 * Order processing result
 */
interface OrderProcessResult {
  processed: number;
  shipped: number;
  delivered: number;
  revenue: number;
  shippingCosts: number;
  processingFees: number;
  errors: TickError[];
}

/**
 * Returns processing result
 */
interface ReturnsProcessResult {
  returns: number;
  refundAmount: number;
  restockedItems: number;
  errors: TickError[];
}

/**
 * Inventory check result
 */
interface InventoryCheckResult {
  productsChecked: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  errors: TickError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'retail';
const PROCESSOR_PRIORITY = 50; // Run after core systems

// Order fulfillment timing (game days)
const DAYS_TO_SHIP = 2;       // Pending → Processing → Shipped
const DAYS_TO_DELIVER = 5;    // Shipped → Delivered (standard)
const EXPRESS_DELIVERY = 2;   // Express shipping days
const OVERNIGHT_DELIVERY = 1; // Overnight shipping days

// Costs
const SHIPPING_COST_STANDARD = 5.99;
const SHIPPING_COST_EXPRESS = 12.99;
const SHIPPING_COST_OVERNIGHT = 24.99;
const PROCESSING_FEE_RATE = 0.029; // 2.9% payment processing

// Return rate (random chance per delivered order)
const BASE_RETURN_RATE = 0.05; // 5% base return rate

// ============================================================================
// RETAIL PROCESSOR
// ============================================================================

/**
 * Retail tick processor
 * Handles all time-based retail/e-commerce operations
 */
export class RetailProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      await Order.findOne().limit(1);
      await ProductListing.findOne().limit(1);
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for retail
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    try {
      // Build filter based on options
      const filter: Record<string, unknown> = {};
      if (options?.playerId) {
        // Filter by player's companies
        filter['company'] = { $in: await this.getPlayerCompanyIds(options.playerId) };
      }
      if (options?.companyId) {
        filter['company'] = options.companyId;
      }
      
      // Process orders (advance fulfillment states)
      const orderResults = await this.processOrders(filter, gameTime, options?.dryRun);
      errors.push(...orderResults.errors);
      
      // Process returns
      const returnResults = await this.processReturns(filter, gameTime, options?.dryRun);
      errors.push(...returnResults.errors);
      
      // Check inventory levels
      const inventoryResults = await this.checkInventoryLevels(filter, options?.dryRun);
      errors.push(...inventoryResults.errors);
      
      // Build summary
      const summary = this.buildSummary(orderResults, returnResults, inventoryResults);
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed: orderResults.processed + returnResults.returns + inventoryResults.productsChecked,
        durationMs: Date.now() - startTime,
        summary,
        errors,
      };
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        durationMs: Date.now() - startTime,
        summary: {} as RetailTickSummary,
        errors: [{
          entityId: 'retail-processor',
          entityType: 'System',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
      };
    }
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Get company IDs for a player
   */
  private async getPlayerCompanyIds(playerId: string): Promise<string[]> {
    // For now, return empty - would need Company model query
    // This filters to show how it would work
    return [];
  }
  
  /**
   * Process orders through fulfillment stages
   */
  private async processOrders(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<OrderProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let shipped = 0;
    let delivered = 0;
    let revenue = 0;
    let shippingCosts = 0;
    let processingFees = 0;
    
    // Get pending and processing orders
    const pendingOrders = await Order.find({
      ...filter,
      fulfillmentStatus: { $in: ['Pending', 'Processing', 'Shipped'] },
      paymentStatus: 'Paid',
    });
    
    for (const order of pendingOrders) {
      try {
        const orderAge = this.getOrderAgeDays(order.createdAt, gameTime);
        let statusChanged = false;
        
        // Advance pending → processing (immediate)
        if (order.fulfillmentStatus === 'Pending') {
          if (!dryRun) {
            order.fulfillmentStatus = 'Processing';
            statusChanged = true;
          }
          processed++;
        }
        
        // Advance processing → shipped
        if (order.fulfillmentStatus === 'Processing' && orderAge >= DAYS_TO_SHIP) {
          if (!dryRun) {
            order.fulfillmentStatus = 'Shipped';
            order.shippedAt = new Date();
            statusChanged = true;
          }
          shipped++;
          
          // Calculate shipping cost
          const cost = this.getShippingCost(order.shippingMethod);
          shippingCosts += cost;
        }
        
        // Advance shipped → delivered
        if (order.fulfillmentStatus === 'Shipped') {
          const deliveryDays = this.getDeliveryDays(order.shippingMethod);
          const shippedAge = order.shippedAt 
            ? this.getOrderAgeDays(order.shippedAt, gameTime)
            : 0;
          
          if (shippedAge >= deliveryDays) {
            if (!dryRun) {
              order.fulfillmentStatus = 'Delivered';
              order.deliveredAt = new Date();
              statusChanged = true;
            }
            delivered++;
            
            // Revenue recognized on delivery
            revenue += order.totalAmount;
            processingFees += order.totalAmount * PROCESSING_FEE_RATE;
            
            // Update product sales metrics
            await this.updateProductSales(order, dryRun);
          }
        }
        
        if (statusChanged && !dryRun) {
          await order.save();
        }
      } catch (error) {
        errors.push({
          entityId: order._id.toString(),
          entityType: 'Order',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    return {
      processed,
      shipped,
      delivered,
      revenue,
      shippingCosts,
      processingFees,
      errors,
    };
  }
  
  /**
   * Process returns (simulated)
   */
  private async processReturns(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<ReturnsProcessResult> {
    const errors: TickError[] = [];
    let returns = 0;
    let refundAmount = 0;
    let restockedItems = 0;
    
    // Get recently delivered orders (within return window)
    const deliveredOrders = await Order.find({
      ...filter,
      fulfillmentStatus: 'Delivered',
      deliveredAt: { $gte: this.getDateDaysAgo(30, gameTime) },
    });
    
    for (const order of deliveredOrders) {
      try {
        // Random return check based on return rate
        if (Math.random() < BASE_RETURN_RATE) {
          if (!dryRun) {
            // Mark as refunded
            order.paymentStatus = 'Refunded';
            await order.save();
            
            // Restock items
            for (const item of order.items) {
              await ProductListing.findByIdAndUpdate(
                item.product,
                { $inc: { stockQuantity: item.quantity } }
              );
              restockedItems += item.quantity;
            }
          }
          
          returns++;
          refundAmount += order.totalAmount;
        }
      } catch (error) {
        errors.push({
          entityId: order._id.toString(),
          entityType: 'Order',
          message: error instanceof Error ? error.message : 'Unknown error processing return',
          recoverable: true,
        });
      }
    }
    
    return {
      returns,
      refundAmount,
      restockedItems,
      errors,
    };
  }
  
  /**
   * Check inventory levels and flag low stock
   */
  private async checkInventoryLevels(
    filter: Record<string, unknown>,
    dryRun?: boolean
  ): Promise<InventoryCheckResult> {
    const errors: TickError[] = [];
    
    // Get active products
    const products = await ProductListing.find({
      ...filter,
      isActive: true,
    });
    
    let lowStockAlerts = 0;
    let outOfStockCount = 0;
    
    for (const product of products) {
      if (product.stockQuantity <= 0) {
        outOfStockCount++;
      } else if (product.stockQuantity <= product.lowStockThreshold) {
        lowStockAlerts++;
      }
    }
    
    return {
      productsChecked: products.length,
      lowStockAlerts,
      outOfStockCount,
      errors,
    };
  }
  
  /**
   * Update product sales metrics when order delivered
   */
  private async updateProductSales(order: IOrder, dryRun?: boolean): Promise<void> {
    if (dryRun) return;
    
    for (const item of order.items) {
      await ProductListing.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            totalSold: item.quantity,
            totalRevenue: item.lineTotal,
          },
        }
      );
    }
  }
  
  /**
   * Calculate order age in game days
   */
  private getOrderAgeDays(orderDate: Date, gameTime: GameTime): number {
    const now = new Date(gameTime.year, gameTime.month - 1, 1);
    const diffMs = now.getTime() - orderDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Get date X days ago from game time
   */
  private getDateDaysAgo(days: number, gameTime: GameTime): Date {
    const now = new Date(gameTime.year, gameTime.month - 1, 1);
    now.setDate(now.getDate() - days);
    return now;
  }
  
  /**
   * Get shipping cost based on method
   */
  private getShippingCost(method: string): number {
    switch (method) {
      case 'Express':
        return SHIPPING_COST_EXPRESS;
      case 'Overnight':
        return SHIPPING_COST_OVERNIGHT;
      case 'Pickup':
        return 0;
      default:
        return SHIPPING_COST_STANDARD;
    }
  }
  
  /**
   * Get delivery days based on shipping method
   */
  private getDeliveryDays(method: string): number {
    switch (method) {
      case 'Express':
        return EXPRESS_DELIVERY;
      case 'Overnight':
        return OVERNIGHT_DELIVERY;
      case 'Pickup':
        return 0;
      default:
        return DAYS_TO_DELIVER;
    }
  }
  
  /**
   * Build tick summary
   */
  private buildSummary(
    orderResults: OrderProcessResult,
    returnResults: ReturnsProcessResult,
    inventoryResults: InventoryCheckResult
  ): RetailTickSummary {
    const netRevenue = orderResults.revenue 
      - returnResults.refundAmount 
      - orderResults.shippingCosts 
      - orderResults.processingFees;
    
    const totalOrders = orderResults.processed + orderResults.shipped + orderResults.delivered;
    const avgOrderValue = totalOrders > 0 ? orderResults.revenue / orderResults.delivered : 0;
    const fulfillmentRate = totalOrders > 0 
      ? (orderResults.delivered / totalOrders) * 100 
      : 100;
    
    return {
      // Orders processed
      ordersPending: orderResults.processed,
      ordersShipped: orderResults.shipped,
      ordersDelivered: orderResults.delivered,
      ordersReturned: returnResults.returns,
      ordersCancelled: 0, // Not yet implemented
      
      // Financial
      grossRevenue: orderResults.revenue,
      returnsRefunded: returnResults.refundAmount,
      shippingCosts: orderResults.shippingCosts,
      processingFees: orderResults.processingFees,
      netRevenue,
      
      // Inventory
      productsProcessed: inventoryResults.productsChecked,
      lowStockAlerts: inventoryResults.lowStockAlerts,
      outOfStockCount: inventoryResults.outOfStockCount,
      
      // Metrics
      averageOrderValue: avgOrderValue,
      fulfillmentRate,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance
 */
export const retailProcessor = new RetailProcessor();

export default retailProcessor;
