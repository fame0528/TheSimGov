/**
 * @file src/lib/db/models/Order.ts
 * @description Order Mongoose schema for e-commerce order management
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Order model for e-commerce transaction processing with line items, customer info,
 * payment tracking, fulfillment simulation, and shipping. Supports multiple products
 * per order with variants, quantity pricing, and automatic sales tax calculation.
 * Integrates with ProductListing for inventory management and Transaction for
 * financial audit trail.
 * 
 * SCHEMA FIELDS:
 * - orderNumber: Unique human-readable order ID (auto-generated)
 * - company: Reference to Company document (required, indexed)
 * - items: Array of order line items (product, variant, quantity, price)
 * - customerName: Customer full name (required)
 * - customerEmail: Customer email (required, validated)
 * - customerPhone: Customer phone (optional)
 * - shippingAddress: Full shipping address object
 * - billingAddress: Billing address (optional, defaults to shipping)
 * - subtotal: Order subtotal before tax/fees (required)
 * - taxRate: Sales tax percentage (default 8.5%)
 * - taxAmount: Calculated tax amount
 * - shippingCost: Shipping fee (default $0)
 * - processingFee: Payment processing fee 2-5% (required)
 * - totalAmount: Final order total (required)
 * - paymentMethod: Payment type (Credit Card, PayPal, etc.)
 * - paymentStatus: Payment state (Pending, Paid, Failed, Refunded)
 * - paidAt: Payment timestamp (optional)
 * - fulfillmentStatus: Order fulfillment state (Pending, Processing, Shipped, Delivered)
 * - shippingMethod: Shipping tier (Standard, Express, Overnight)
 * - estimatedDelivery: Expected delivery date
 * - shippedAt: Shipping timestamp (optional)
 * - deliveredAt: Delivery timestamp (optional)
 * - trackingNumber: Shipping tracking ID (optional)
 * - notes: Customer or admin notes (optional)
 * - createdAt: Order creation timestamp
 * - updatedAt: Last update timestamp
 * 
 * VIRTUAL FIELDS:
 * - isPaid: Boolean indicating if payment is complete
 * - isShipped: Boolean indicating if order has shipped
 * - isDelivered: Boolean indicating if order is delivered
 * - daysToDeliver: Number of days from order to delivery
 * 
 * USAGE:
 * ```typescript
 * import Order from '@/lib/db/models/Order';
 * 
 * // Create order
 * const order = await Order.create({
 *   company: companyId,
 *   items: [
 *     {
 *       product: productId,
 *       name: 'Premium Laptop Bag',
 *       variant: 'Size: 15-inch, Color: Black',
 *       quantity: 2,
 *       unitPrice: 89.99,
 *       lineTotal: 179.98
 *     }
 *   ],
 *   customerName: 'John Smith',
 *   customerEmail: 'john@example.com',
 *   shippingAddress: {
 *     street: '123 Main St',
 *     city: 'Springfield',
 *     state: 'IL',
 *     zipCode: '62701',
 *     country: 'USA'
 *   },
 *   subtotal: 179.98,
 *   taxRate: 8.5,
 *   shippingCost: 12.50,
 *   paymentMethod: 'Credit Card',
 *   shippingMethod: 'Standard'
 * });
 * 
 * // Mark as paid
 * await order.updateOne({
 *   paymentStatus: 'Paid',
 *   paidAt: new Date()
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - orderNumber auto-generated with format ORD-YYYYMMDD-XXXXX
 * - Items array preserves order snapshot (price, variant) for audit trail
 * - Payment processing fee simulates 2-5% gateway fees
 * - Fulfillment status tracks order lifecycle
 * - Virtual fields compute delivery metrics
 * - Immutable pattern: no updates once shipped (similar to Transaction)
 * - Company reference indexed for order history queries
 * - PaymentStatus and FulfillmentStatus indexed for dashboard filtering
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Valid payment methods
 */
export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'PayPal'
  | 'Bank Transfer'
  | 'Cash on Delivery';

/**
 * Payment status states
 */
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

/**
 * Fulfillment status states
 */
export type FulfillmentStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

/**
 * Shipping method tiers
 */
export type ShippingMethod = 'Standard' | 'Express' | 'Overnight' | 'Pickup';

/**
 * Order line item interface
 */
export interface OrderItem {
  product: Types.ObjectId; // ProductListing reference
  name: string; // Product name at time of order
  variant?: string; // Selected variant (e.g., "Size: Large, Color: Blue")
  quantity: number; // Quantity ordered
  unitPrice: number; // Price per unit at time of order
  lineTotal: number; // quantity * unitPrice
}

/**
 * Shipping address interface
 */
export interface ShippingAddress {
  street: string;
  street2?: string; // Apartment, suite, etc.
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Order document interface
 */
export interface IOrder extends Document {
  orderNumber: string;
  company: Types.ObjectId;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  processingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  fulfillmentStatus: FulfillmentStatus;
  shippingMethod: ShippingMethod;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  isPaid: boolean;
  isShipped: boolean;
  isDelivered: boolean;
  daysToDeliver: number | null;
}

/**
 * Order schema definition
 */
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    items: {
      type: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: 'ProductListing',
            required: true,
          },
          name: {
            type: String,
            required: true,
            trim: true,
          },
          variant: {
            type: String,
            trim: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
          },
          unitPrice: {
            type: Number,
            required: true,
            min: [0.01, 'Unit price must be at least $0.01'],
          },
          lineTotal: {
            type: Number,
            required: true,
            min: [0.01, 'Line total must be at least $0.01'],
          },
        },
      ],
      required: true,
      validate: {
        validator: (arr: OrderItem[]) => arr.length > 0,
        message: 'Order must have at least one item',
      },
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      street2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: 'USA',
        trim: true,
      },
    },
    billingAddress: {
      street: String,
      street2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0.01, 'Subtotal must be at least $0.01'],
    },
    taxRate: {
      type: Number,
      required: true,
      default: 8.5,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    processingFee: {
      type: Number,
      required: [true, 'Processing fee is required'],
      min: [0, 'Processing fee cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be at least $0.01'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    paymentStatus: {
      type: String,
      required: true,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Paid', 'Failed', 'Refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      index: true,
    },
    paidAt: {
      type: Date,
    },
    fulfillmentStatus: {
      type: String,
      required: true,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        message: '{VALUE} is not a valid fulfillment status',
      },
      index: true,
    },
    shippingMethod: {
      type: String,
      required: [true, 'Shipping method is required'],
      enum: {
        values: ['Standard', 'Express', 'Overnight', 'Pickup'],
        message: '{VALUE} is not a valid shipping method',
      },
    },
    estimatedDelivery: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'orders',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for efficient queries
 */
OrderSchema.index({ company: 1, createdAt: -1 }); // Order history by date
OrderSchema.index({ company: 1, paymentStatus: 1 }); // Filter by payment status
OrderSchema.index({ company: 1, fulfillmentStatus: 1 }); // Filter by fulfillment
OrderSchema.index({ customerEmail: 1 }); // Customer order lookup

/**
 * Virtual: isPaid
 * Indicates if payment is complete
 */
OrderSchema.virtual('isPaid').get(function (this: IOrder): boolean {
  return this.paymentStatus === 'Paid';
});

/**
 * Virtual: isShipped
 * Indicates if order has shipped
 */
OrderSchema.virtual('isShipped').get(function (this: IOrder): boolean {
  return this.fulfillmentStatus === 'Shipped' || this.fulfillmentStatus === 'Delivered';
});

/**
 * Virtual: isDelivered
 * Indicates if order is delivered
 */
OrderSchema.virtual('isDelivered').get(function (this: IOrder): boolean {
  return this.fulfillmentStatus === 'Delivered';
});

/**
 * Virtual: daysToDeliver
 * Calculates days from order creation to delivery
 */
OrderSchema.virtual('daysToDeliver').get(function (this: IOrder): number | null {
  if (!this.deliveredAt) return null;
  const diffMs = this.deliveredAt.getTime() - this.createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save hook: Auto-generate order number
 */
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `ORD-${dateStr}-${randomNum}`;
  }
  
  // Calculate tax amount if not set
  if (!this.taxAmount || this.taxAmount === 0) {
    this.taxAmount = (this.subtotal * this.taxRate) / 100;
  }
  
  next();
});

/**
 * Pre-save hook: Prevent modifications after shipping (immutable audit trail)
 */
OrderSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && this.shippedAt) {
    // Allow status updates only
    const modifiedPaths = this.modifiedPaths();
    const allowedUpdates = ['fulfillmentStatus', 'deliveredAt', 'trackingNumber'];
    const hasInvalidUpdates = modifiedPaths.some(
      (path) => !allowedUpdates.includes(path)
    );
    
    if (hasInvalidUpdates) {
      next(new Error('Cannot modify shipped order details'));
      return;
    }
  }
  next();
});

/**
 * Order model
 */
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
