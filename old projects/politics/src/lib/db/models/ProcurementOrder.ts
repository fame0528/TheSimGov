/**
 * @file src/lib/db/models/ProcurementOrder.ts
 * @description ProcurementOrder Mongoose schema for purchase order management
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * ProcurementOrder model for managing purchase orders from suppliers.
 * Tracks order lifecycle (Draft → Submitted → Approved → Received → Completed),
 * line items, delivery tracking, invoice matching, and receiving quality control.
 * Integrates with Supplier, Inventory, and ManufacturingFacility models.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - orderNumber: Unique PO identifier (e.g., "PO-2024-001")
 * - supplier: Reference to Supplier document (required)
 * - facility: Reference to ManufacturingFacility (delivery location)
 * - status: Order status (Draft, Submitted, Approved, InTransit, Received, Completed, Cancelled)
 * - priority: Order priority (Low, Medium, High, Urgent)
 * - orderType: Type (Standard, Blanket, Contract, Spot)
 * 
 * Dates:
 * - orderDate: Date order created
 * - submittedDate: Date submitted to supplier
 * - approvedDate: Date approved by management
 * - requestedDeliveryDate: Requested delivery date
 * - promisedDeliveryDate: Supplier promised date
 * - actualDeliveryDate: Actual received date
 * - expectedDeliveryDate: Current expected date
 * 
 * Line Items:
 * - items: Array of ProcurementItem
 *   - sku: Item SKU (reference to Inventory)
 *   - description: Item description
 *   - quantity: Quantity ordered
 *   - unitPrice: Price per unit
 *   - totalPrice: Extended price (quantity × unitPrice)
 *   - uom: Unit of measure
 *   - requestedDate: Requested delivery date
 *   - receivedQuantity: Quantity received
 *   - acceptedQuantity: Quantity accepted
 *   - rejectedQuantity: Quantity rejected
 *   - status: Item status (Pending, PartiallyReceived, Received, Cancelled)
 * 
 * Financials:
 * - subtotal: Sum of line item totals
 * - tax: Sales tax amount
 * - shippingCost: Shipping/freight cost
 * - otherCharges: Miscellaneous charges
 * - totalAmount: Grand total (subtotal + tax + shipping + other)
 * - currency: Currency code (USD, EUR, etc.)
 * - exchangeRate: Exchange rate if foreign currency
 * - paymentTerms: Payment terms (Net30, Net60, etc.)
 * - earlyPaymentDiscount: Discount for early payment (%)
 * 
 * Delivery & Shipping:
 * - shippingMethod: Shipping method (Ground, Air, Ocean, Rail)
 * - trackingNumber: Shipment tracking number
 * - carrierName: Carrier company name
 * - deliveryAddress: Delivery address
 * - incoterms: International commercial terms (FOB, CIF, etc.)
 * - expectedTransitDays: Expected shipping duration
 * - actualTransitDays: Actual shipping duration
 * 
 * Receiving:
 * - receivingNotes: Notes from receiving dock
 * - qualityInspectionPassed: Whether passed quality check
 * - inspectionNotes: Quality inspection notes
 * - damagesReported: Damages/defects reported
 * - returnRequired: Whether return/credit needed
 * - receivedBy: Employee who received (reference)
 * 
 * Approval Workflow:
 * - requestedBy: Employee who created order
 * - approvedBy: Employee who approved
 * - approvalNotes: Approval notes/comments
 * - requiresApproval: Whether approval needed (based on amount)
 * - approvalThreshold: Amount requiring approval
 * 
 * Performance:
 * - onTimeDelivery: Whether delivered on time
 * - deliveryVarianceDays: Days early/late (negative = early)
 * - qualityIssues: Count of quality issues
 * - priceVariance: Difference from quoted price
 * - quantityVariance: Difference from ordered quantity
 * 
 * Contract & Compliance:
 * - contractReference: Reference to blanket/contract PO
 * - releaseNumber: Release number for blanket orders
 * - certificationRequired: Required certifications
 * - certificationsReceived: Certifications provided
 * - complianceNotes: Compliance documentation
 * 
 * USAGE:
 * ```typescript
 * import ProcurementOrder from '@/lib/db/models/ProcurementOrder';
 * 
 * // Create purchase order
 * const po = await ProcurementOrder.create({
 *   company: companyId,
 *   orderNumber: "PO-2024-001",
 *   supplier: supplierId,
 *   facility: facilityId,
 *   status: 'Draft',
 *   items: [
 *     {
 *       sku: "STEEL-A36-001",
 *       description: "A36 Steel Plate 1/4in",
 *       quantity: 1000,
 *       unitPrice: 2.50,
 *       uom: "lb"
 *     }
 *   ],
 *   requestedDeliveryDate: new Date(Date.now() + 14*24*60*60*1000)
 * });
 * 
 * // Submit order
 * po.status = 'Submitted';
 * po.submittedDate = new Date();
 * await po.save();
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Order lifecycle: Draft → Submitted → Approved → InTransit → Received → Completed
 * - Draft: Order being created, not sent to supplier
 * - Submitted: Sent to supplier, awaiting acknowledgment
 * - Approved: Internally approved, supplier confirmed
 * - InTransit: Shipped, en route to facility
 * - Received: Arrived at receiving dock
 * - Completed: Fully received, accepted, invoiced
 * - Cancelled: Order cancelled before completion
 * - On-time delivery: Within ±2 days of promised date (industry standard)
 * - Approval threshold: Typically $10k-$50k depending on company policy
 * - Blanket PO: Standing order with releases (reduce admin overhead)
 * - Spot buy: One-time purchase outside regular suppliers
 * - Incoterms: FOB (buyer pays freight from origin), CIF (seller pays to destination)
 * - Quality inspection: Sample inspection or 100% check (based on risk)
 * - Three-way match: PO + Receipt + Invoice (prevent overpayment fraud)
 * - Early payment discount: 2/10 Net30 (2% discount if paid within 10 days)
 * - Lead time tracking: Promised date vs actual (supplier performance metric)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Procurement order status
 */
export type ProcurementOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'InTransit'
  | 'Received'
  | 'Completed'
  | 'Cancelled';

/**
 * Order priority
 */
export type OrderPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Urgent';

/**
 * Order type
 */
export type OrderType =
  | 'Standard'    // Regular one-time order
  | 'Blanket'     // Standing order with releases
  | 'Contract'    // Contract-based order
  | 'Spot';       // Spot buy (one-time, non-regular)

/**
 * Shipping method
 */
export type ShippingMethod =
  | 'Ground'
  | 'Air'
  | 'Ocean'
  | 'Rail';

/**
 * Procurement item status
 */
export type ProcurementItemStatus =
  | 'Pending'
  | 'PartiallyReceived'
  | 'Received'
  | 'Cancelled';

/**
 * Procurement item interface
 */
export interface IProcurementItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom: string;
  requestedDate?: Date;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  status: ProcurementItemStatus;
}

/**
 * ProcurementOrder document interface
 * 
 * @interface IProcurementOrder
 * @extends {Document}
 */
export interface IProcurementOrder extends Document {
  // Core
  company: Types.ObjectId;
  orderNumber: string;
  supplier: Types.ObjectId;
  facility?: Types.ObjectId;
  status: ProcurementOrderStatus;
  priority: OrderPriority;
  orderType: OrderType;

  // Dates
  orderDate: Date;
  submittedDate?: Date;
  approvedDate?: Date;
  requestedDeliveryDate: Date;
  promisedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  expectedDeliveryDate: Date;

  // Line Items
  items: IProcurementItem[];

  // Financials
  subtotal: number;
  tax: number;
  shippingCost: number;
  otherCharges: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  paymentTerms: string;
  earlyPaymentDiscount: number;

  // Delivery & Shipping
  shippingMethod: ShippingMethod;
  trackingNumber?: string;
  carrierName?: string;
  deliveryAddress: string;
  incoterms: string;
  expectedTransitDays: number;
  actualTransitDays: number;

  // Receiving
  receivingNotes?: string;
  qualityInspectionPassed: boolean;
  inspectionNotes?: string;
  damagesReported: boolean;
  returnRequired: boolean;
  receivedBy?: Types.ObjectId;

  // Approval Workflow
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvalNotes?: string;
  requiresApproval: boolean;
  approvalThreshold: number;

  // Performance
  onTimeDelivery: boolean;
  deliveryVarianceDays: number;
  qualityIssues: number;
  priceVariance: number;
  quantityVariance: number;

  // Contract & Compliance
  contractReference?: string;
  releaseNumber?: number;
  certificationRequired: string[];
  certificationsReceived: string[];
  complianceNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isOverdue: boolean;
  daysUntilDelivery: number;
  completionPercentage: number;
  needsApproval: boolean;
  deliveryStatus: string;
}

/**
 * ProcurementItem schema
 */
const ProcurementItemSchema = new Schema<IProcurementItem>(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    uom: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
      maxlength: [20, 'UOM cannot exceed 20 characters'],
    },
    requestedDate: {
      type: Date,
      default: null,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Received quantity cannot be negative'],
    },
    acceptedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Accepted quantity cannot be negative'],
    },
    rejectedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rejected quantity cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'PartiallyReceived', 'Received', 'Cancelled'],
        message: '{VALUE} is not a valid item status',
      },
      default: 'Pending',
    },
  },
  { _id: false }
);

/**
 * ProcurementOrder schema definition
 */
const ProcurementOrderSchema = new Schema<IProcurementOrder>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Order number must be at least 3 characters'],
      maxlength: [50, 'Order number cannot exceed 50 characters'],
      index: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'ManufacturingFacility',
      default: null,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Draft', 'Submitted', 'Approved', 'InTransit', 'Received', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Draft',
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
      index: true,
    },
    orderType: {
      type: String,
      required: true,
      enum: {
        values: ['Standard', 'Blanket', 'Contract', 'Spot'],
        message: '{VALUE} is not a valid order type',
      },
      default: 'Standard',
    },

    // Dates
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedDate: {
      type: Date,
      default: null,
    },
    approvedDate: {
      type: Date,
      default: null,
    },
    requestedDeliveryDate: {
      type: Date,
      required: [true, 'Requested delivery date is required'],
    },
    promisedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },
    expectedDeliveryDate: {
      type: Date,
      required: true,
      default: function (this: IProcurementOrder) {
        return this.requestedDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      },
    },

    // Line Items
    items: {
      type: [ProcurementItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: function (items: IProcurementItem[]) {
          return items && items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },

    // Financials
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    otherCharges: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Other charges cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: [3, 'Currency must be 3 characters'],
      maxlength: [3, 'Currency must be 3 characters'],
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 1.0,
      min: [0, 'Exchange rate must be positive'],
    },
    paymentTerms: {
      type: String,
      required: true,
      default: 'Net30',
      trim: true,
      maxlength: [50, 'Payment terms cannot exceed 50 characters'],
    },
    earlyPaymentDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Early payment discount cannot be negative'],
      max: [10, 'Early payment discount cannot exceed 10%'],
    },

    // Delivery & Shipping
    shippingMethod: {
      type: String,
      required: true,
      enum: {
        values: ['Ground', 'Air', 'Ocean', 'Rail'],
        message: '{VALUE} is not a valid shipping method',
      },
      default: 'Ground',
    },
    trackingNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Tracking number cannot exceed 100 characters'],
      default: null,
    },
    carrierName: {
      type: String,
      trim: true,
      maxlength: [100, 'Carrier name cannot exceed 100 characters'],
      default: null,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: [500, 'Delivery address cannot exceed 500 characters'],
    },
    incoterms: {
      type: String,
      required: true,
      default: 'FOB',
      uppercase: true,
      trim: true,
      maxlength: [10, 'Incoterms cannot exceed 10 characters'],
    },
    expectedTransitDays: {
      type: Number,
      required: true,
      default: 7,
      min: [1, 'Expected transit days must be at least 1'],
      max: [365, 'Expected transit days cannot exceed 365'],
    },
    actualTransitDays: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Actual transit days cannot be negative'],
    },

    // Receiving
    receivingNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Receiving notes cannot exceed 2000 characters'],
      default: null,
    },
    qualityInspectionPassed: {
      type: Boolean,
      required: true,
      default: true,
    },
    inspectionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Inspection notes cannot exceed 2000 characters'],
      default: null,
    },
    damagesReported: {
      type: Boolean,
      required: true,
      default: false,
    },
    returnRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // Approval Workflow
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Requester reference is required'],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    approvalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Approval notes cannot exceed 1000 characters'],
      default: null,
    },
    requiresApproval: {
      type: Boolean,
      required: true,
      default: false,
    },
    approvalThreshold: {
      type: Number,
      required: true,
      default: 10000,
      min: [0, 'Approval threshold cannot be negative'],
    },

    // Performance
    onTimeDelivery: {
      type: Boolean,
      required: true,
      default: true,
    },
    deliveryVarianceDays: {
      type: Number,
      required: true,
      default: 0,
    },
    qualityIssues: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quality issues cannot be negative'],
    },
    priceVariance: {
      type: Number,
      required: true,
      default: 0,
    },
    quantityVariance: {
      type: Number,
      required: true,
      default: 0,
    },

    // Contract & Compliance
    contractReference: {
      type: String,
      trim: true,
      maxlength: [100, 'Contract reference cannot exceed 100 characters'],
      default: null,
    },
    releaseNumber: {
      type: Number,
      min: [1, 'Release number must be at least 1'],
      default: null,
    },
    certificationRequired: {
      type: [String],
      default: [],
    },
    certificationsReceived: {
      type: [String],
      default: [],
    },
    complianceNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Compliance notes cannot exceed 2000 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'procurement_orders',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ProcurementOrderSchema.index({ company: 1, orderNumber: 1 }, { unique: true });
ProcurementOrderSchema.index({ company: 1, status: 1 });
ProcurementOrderSchema.index({ supplier: 1, status: 1 });
ProcurementOrderSchema.index({ requestedDeliveryDate: 1 });

/**
 * Virtual field: isOverdue
 */
ProcurementOrderSchema.virtual('isOverdue').get(function (this: IProcurementOrder): boolean {
  if (this.status === 'Completed' || this.status === 'Cancelled') {
    return false;
  }
  return new Date() > this.expectedDeliveryDate;
});

/**
 * Virtual field: daysUntilDelivery
 */
ProcurementOrderSchema.virtual('daysUntilDelivery').get(function (this: IProcurementOrder): number {
  const now = new Date();
  const diff = this.expectedDeliveryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field: completionPercentage
 */
ProcurementOrderSchema.virtual('completionPercentage').get(function (this: IProcurementOrder): number {
  if (!this.items || this.items.length === 0) return 0;

  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  if (totalQuantity === 0) return 0;
  return (receivedQuantity / totalQuantity) * 100;
});

/**
 * Virtual field: needsApproval
 */
ProcurementOrderSchema.virtual('needsApproval').get(function (this: IProcurementOrder): boolean {
  return this.requiresApproval && !this.approvedBy;
});

/**
 * Virtual field: deliveryStatus
 */
ProcurementOrderSchema.virtual('deliveryStatus').get(function (this: IProcurementOrder): string {
  if (this.status === 'Completed') return 'Delivered';
  if (this.status === 'Cancelled') return 'Cancelled';
  if (this.isOverdue) return 'Overdue';
  if (this.daysUntilDelivery <= 2) return 'Due Soon';
  return 'On Track';
});

/**
 * Pre-save hook: Calculate totals and performance metrics
 */
ProcurementOrderSchema.pre<IProcurementOrder>('save', function (next) {
  // Calculate item totals
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice;

    // Update item status
    if (item.receivedQuantity === 0) {
      item.status = 'Pending';
    } else if (item.receivedQuantity >= item.quantity) {
      item.status = 'Received';
    } else {
      item.status = 'PartiallyReceived';
    }
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate total amount
  this.totalAmount = this.subtotal + this.tax + this.shippingCost + this.otherCharges;

  // Check if requires approval
  this.requiresApproval = this.totalAmount >= this.approvalThreshold;

  // Calculate delivery variance
  if (this.actualDeliveryDate && this.promisedDeliveryDate) {
    const diff = this.actualDeliveryDate.getTime() - this.promisedDeliveryDate.getTime();
    this.deliveryVarianceDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    this.onTimeDelivery = Math.abs(this.deliveryVarianceDays) <= 2; // ±2 days tolerance
  }

  // Calculate actual transit days
  if (this.actualDeliveryDate && this.submittedDate) {
    const diff = this.actualDeliveryDate.getTime() - this.submittedDate.getTime();
    this.actualTransitDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Calculate quantity variance
  const totalOrdered = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  this.quantityVariance = totalReceived - totalOrdered;

  next();
});

/**
 * ProcurementOrder model
 * 
 * @example
 * ```typescript
 * import ProcurementOrder from '@/lib/db/models/ProcurementOrder';
 * 
 * // Create purchase order
 * const po = await ProcurementOrder.create({
 *   company: companyId,
 *   orderNumber: "PO-2024-001",
 *   supplier: supplierId,
 *   requestedBy: employeeId,
 *   items: [
 *     {
 *       sku: "STEEL-001",
 *       description: "Steel plate",
 *       quantity: 100,
 *       unitPrice: 50,
 *       uom: "lb"
 *     }
 *   ],
 *   deliveryAddress: "123 Factory St",
 *   requestedDeliveryDate: new Date(Date.now() + 14*24*60*60*1000)
 * });
 * ```
 */
const ProcurementOrder: Model<IProcurementOrder> =
  mongoose.models.ProcurementOrder ||
  mongoose.model<IProcurementOrder>('ProcurementOrder', ProcurementOrderSchema);

export default ProcurementOrder;
