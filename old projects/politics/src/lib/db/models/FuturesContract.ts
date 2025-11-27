/**
 * @fileoverview FuturesContract Model - Energy Futures Trading
 * 
 * OVERVIEW:
 * Manages futures contracts for energy commodities, enabling players to hedge price risk,
 * speculate on future prices, and lock in supply/sales agreements. Includes margin requirements,
 * contract settlement mechanics, position tracking, and profit/loss calculations.
 * 
 * KEY FEATURES:
 * - Futures for all 6 energy commodities (crude oil, nat gas, electricity, etc.)
 * - Initial margin (10-20% of contract value) and maintenance margin (75% of initial)
 * - Long/Short positions with unrealized P&L tracking
 * - Contract settlement at expiry (cash settlement or physical delivery)
 * - Margin call mechanics when equity falls below maintenance margin
 * - Mark-to-market daily P&L calculation
 * 
 * CONTRACT SPECIFICATIONS:
 * - Crude Oil: 1,000 barrels per contract
 * - Natural Gas: 10,000 MMBtu per contract
 * - Electricity: 1,000 MWh per contract
 * - Gasoline: 42,000 gallons per contract
 * - Diesel: 42,000 gallons per contract
 * - Coal: 1,000 tons per contract
 * 
 * MARGIN REQUIREMENTS:
 * - Initial Margin: 10% (low volatility) to 20% (high volatility)
 * - Maintenance Margin: 75% of initial margin
 * - Margin Call: Triggered when equity < maintenance margin
 * - Liquidation: Forced if margin call not met within 24 hours
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Commodity types (must match CommodityPrice)
 */
export type CommodityType = 
  | 'CrudeOil'
  | 'NaturalGas'
  | 'Electricity'
  | 'Gasoline'
  | 'Diesel'
  | 'Coal';

/**
 * Position types
 */
export type PositionType = 
  | 'Long'   // Buying futures (profit when price rises)
  | 'Short'; // Selling futures (profit when price falls)

/**
 * Contract status
 */
export type ContractStatus =
  | 'Open'      // Active contract
  | 'Settled'   // Expired and settled
  | 'Liquidated' // Margin call forced closure
  | 'Closed';   // Early exit by trader

/**
 * Settlement method
 */
export type SettlementMethod =
  | 'Cash'     // Cash settlement at expiry
  | 'Physical'; // Physical delivery of commodity

// ================== INTERFACE ==================

/**
 * FuturesContract document interface
 */
export interface IFuturesContract extends Document {
  // Core Identification
  _id: Types.ObjectId;
  company: Types.ObjectId;        // Company holding the position
  commodity: CommodityType;
  
  // Contract Specifications
  contractSize: number;            // Units per contract (1000 barrels, 10000 MMBtu, etc.)
  strikePrice: number;             // Price at which contract was opened
  currentMarketPrice: number;      // Latest market price for mark-to-market
  expiryDate: Date;
  settlementMethod: SettlementMethod;
  
  // Position Details
  positionType: PositionType;      // Long or Short
  numberOfContracts: number;       // Quantity of contracts (1-1000)
  totalContractValue: number;      // strikePrice × contractSize × numberOfContracts
  
  // Margin Management
  initialMarginRate: number;       // Initial margin % (10-20%)
  maintenanceMarginRate: number;   // Maintenance margin % (75% of initial)
  initialMarginRequired: number;   // Cash required to open position
  currentMarginBalance: number;    // Current margin account balance
  marginCallTriggered: boolean;
  marginCallDate?: Date;
  marginCallAmount?: number;       // Additional margin needed
  
  // P&L Tracking
  unrealizedPnL: number;          // Current profit/loss (not realized)
  realizedPnL: number;            // Profit/loss after settlement
  dailyPnL: number;               // Today's mark-to-market P&L
  
  // Status & Lifecycle
  status: ContractStatus;
  openedAt: Date;
  closedAt?: Date;
  settledAt?: Date;
  
  // Methods
  calculateUnrealizedPnL(): number;
  updateMarketPrice(newPrice: number): Promise<IFuturesContract>;
  checkMarginCall(): boolean;
  settleContract(settlementPrice: number): Promise<IFuturesContract>;
  closePosition(exitPrice: number): Promise<IFuturesContract>;
  addMargin(amount: number): Promise<IFuturesContract>;
  isExpired(): boolean;
  getPositionSummary(): {
    positionType: PositionType;
    contracts: number;
    value: number;
    pnl: number;
    pnlPercent: number;
    marginUtilization: number;
  };
}

// ================== SCHEMA ==================

const FuturesContractSchema = new Schema<IFuturesContract>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    commodity: {
      type: String,
      enum: ['CrudeOil', 'NaturalGas', 'Electricity', 'Gasoline', 'Diesel', 'Coal'],
      required: true,
      index: true,
    },
    
    // Contract Specifications
    contractSize: {
      type: Number,
      required: true,
      min: 1,
    },
    strikePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentMarketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    settlementMethod: {
      type: String,
      enum: ['Cash', 'Physical'],
      default: 'Cash',
    },
    
    // Position Details
    positionType: {
      type: String,
      enum: ['Long', 'Short'],
      required: true,
    },
    numberOfContracts: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    totalContractValue: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Margin Management
    initialMarginRate: {
      type: Number,
      required: true,
      min: 0.05,  // 5% minimum
      max: 0.30,  // 30% maximum
    },
    maintenanceMarginRate: {
      type: Number,
      required: true,
      min: 0.03,  // 3% minimum
      max: 0.25,  // 25% maximum
    },
    initialMarginRequired: {
      type: Number,
      required: true,
      min: 0,
    },
    currentMarginBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    marginCallTriggered: {
      type: Boolean,
      default: false,
    },
    marginCallDate: {
      type: Date,
      default: undefined,
    },
    marginCallAmount: {
      type: Number,
      min: 0,
      default: undefined,
    },
    
    // P&L Tracking
    unrealizedPnL: {
      type: Number,
      default: 0,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    dailyPnL: {
      type: Number,
      default: 0,
    },
    
    // Status & Lifecycle
    status: {
      type: String,
      enum: ['Open', 'Settled', 'Liquidated', 'Closed'],
      default: 'Open',
      index: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: undefined,
    },
    settledAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'futurescontracts',
  }
);

// ================== INDEXES ==================

FuturesContractSchema.index({ company: 1, status: 1 });
FuturesContractSchema.index({ commodity: 1, expiryDate: 1 });
FuturesContractSchema.index({ marginCallTriggered: 1, marginCallDate: -1 });

// ================== HELPER FUNCTIONS ==================

/**
 * Get standard contract size for commodity
 */
function getStandardContractSize(commodity: CommodityType): number {
  const sizes: Record<CommodityType, number> = {
    CrudeOil: 1000,      // 1,000 barrels
    NaturalGas: 10000,   // 10,000 MMBtu
    Electricity: 1000,   // 1,000 MWh
    Gasoline: 42000,     // 42,000 gallons (1000 barrels)
    Diesel: 42000,       // 42,000 gallons (1000 barrels)
    Coal: 1000,          // 1,000 tons
  };
  return sizes[commodity];
}

/**
 * Calculate initial margin rate based on volatility
 */
function calculateMarginRate(volatility: number): number {
  // Low volatility (<10%): 10% margin
  // Medium volatility (10-20%): 15% margin
  // High volatility (>20%): 20% margin
  if (volatility < 10) return 0.10;
  if (volatility < 20) return 0.15;
  return 0.20;
}

// ================== INSTANCE METHODS ==================

/**
 * Calculate current unrealized profit/loss
 * 
 * @returns Unrealized P&L in dollars
 * 
 * @example
 * const pnl = contract.calculateUnrealizedPnL();
 * // Long position: $5,000 profit if price rose $5/barrel
 */
FuturesContractSchema.methods.calculateUnrealizedPnL = function(
  this: IFuturesContract
): number {
  const priceDiff = this.currentMarketPrice - this.strikePrice;
  const multiplier = this.positionType === 'Long' ? 1 : -1;
  const pnl = priceDiff * this.contractSize * this.numberOfContracts * multiplier;
  
  return pnl;
};

/**
 * Update market price and recalculate P&L
 * 
 * @param newPrice - New market price
 * @returns Updated futures contract
 * 
 * @example
 * await contract.updateMarketPrice(78.50);
 */
FuturesContractSchema.methods.updateMarketPrice = async function(
  this: IFuturesContract,
  newPrice: number
): Promise<IFuturesContract> {
  if (this.status !== 'Open') {
    throw new Error('Cannot update price for non-open contract');
  }
  
  // Calculate daily P&L before updating price
  const previousUnrealizedPnL = this.unrealizedPnL;
  this.currentMarketPrice = newPrice;
  
  // Recalculate unrealized P&L
  this.unrealizedPnL = this.calculateUnrealizedPnL();
  this.dailyPnL = this.unrealizedPnL - previousUnrealizedPnL;
  
  // Update margin balance (margin + unrealized P&L)
  this.currentMarginBalance = this.initialMarginRequired + this.unrealizedPnL;
  
  // Check for margin call
  const maintenanceMargin = this.totalContractValue * this.maintenanceMarginRate;
  if (this.currentMarginBalance < maintenanceMargin && !this.marginCallTriggered) {
    this.marginCallTriggered = true;
    this.marginCallDate = new Date();
    this.marginCallAmount = maintenanceMargin - this.currentMarginBalance;
  }
  
  return this.save();
};

/**
 * Check if margin call is active
 * 
 * @returns True if margin call triggered and not resolved
 * 
 * @example
 * if (contract.checkMarginCall()) { console.log('Add margin or close position!'); }
 */
FuturesContractSchema.methods.checkMarginCall = function(
  this: IFuturesContract
): boolean {
  return this.marginCallTriggered && this.status === 'Open';
};

/**
 * Settle futures contract at expiry
 * 
 * @param settlementPrice - Final settlement price
 * @returns Settled contract with realized P&L
 * 
 * @example
 * await contract.settleContract(82.00); // Settle at $82/barrel
 */
FuturesContractSchema.methods.settleContract = async function(
  this: IFuturesContract,
  settlementPrice: number
): Promise<IFuturesContract> {
  if (this.status !== 'Open') {
    throw new Error('Contract already settled or closed');
  }
  
  if (new Date() < this.expiryDate) {
    throw new Error('Cannot settle contract before expiry date');
  }
  
  // Update to settlement price
  this.currentMarketPrice = settlementPrice;
  
  // Realize P&L
  this.realizedPnL = this.calculateUnrealizedPnL();
  this.unrealizedPnL = 0;
  
  // Update status
  this.status = 'Settled';
  this.settledAt = new Date();
  this.closedAt = new Date();
  
  return this.save();
};

/**
 * Close position early before expiry
 * 
 * @param exitPrice - Price at which to close position
 * @returns Closed contract with realized P&L
 * 
 * @example
 * await contract.closePosition(80.00); // Exit at $80/barrel
 */
FuturesContractSchema.methods.closePosition = async function(
  this: IFuturesContract,
  exitPrice: number
): Promise<IFuturesContract> {
  if (this.status !== 'Open') {
    throw new Error('Contract already closed');
  }
  
  // Update to exit price
  this.currentMarketPrice = exitPrice;
  
  // Realize P&L
  this.realizedPnL = this.calculateUnrealizedPnL();
  this.unrealizedPnL = 0;
  
  // Update status
  this.status = 'Closed';
  this.closedAt = new Date();
  
  return this.save();
};

/**
 * Add margin to account (resolve margin call)
 * 
 * @param amount - Amount to add to margin balance
 * @returns Updated contract with increased margin
 * 
 * @example
 * await contract.addMargin(5000); // Add $5,000 to margin
 */
FuturesContractSchema.methods.addMargin = async function(
  this: IFuturesContract,
  amount: number
): Promise<IFuturesContract> {
  if (amount <= 0) {
    throw new Error('Margin amount must be positive');
  }
  
  this.currentMarginBalance += amount;
  this.initialMarginRequired += amount;
  
  // Check if margin call resolved
  const maintenanceMargin = this.totalContractValue * this.maintenanceMarginRate;
  if (this.currentMarginBalance >= maintenanceMargin && this.marginCallTriggered) {
    this.marginCallTriggered = false;
    this.marginCallDate = undefined;
    this.marginCallAmount = undefined;
  }
  
  return this.save();
};

/**
 * Check if contract has expired
 * 
 * @returns True if expiry date has passed
 * 
 * @example
 * if (contract.isExpired()) { await contract.settleContract(marketPrice); }
 */
FuturesContractSchema.methods.isExpired = function(this: IFuturesContract): boolean {
  return new Date() >= this.expiryDate;
};

/**
 * Get comprehensive position summary
 * 
 * @returns Position analysis object
 * 
 * @example
 * const summary = contract.getPositionSummary();
 * // { positionType: 'Long', contracts: 10, value: 750000, pnl: 5000, pnlPercent: 0.67, marginUtilization: 85 }
 */
FuturesContractSchema.methods.getPositionSummary = function(this: IFuturesContract) {
  const pnlPercent = this.unrealizedPnL / this.initialMarginRequired * 100;
  const marginUtilization = (this.initialMarginRequired / this.currentMarginBalance) * 100;
  
  return {
    positionType: this.positionType,
    contracts: this.numberOfContracts,
    value: this.totalContractValue,
    pnl: this.unrealizedPnL,
    pnlPercent,
    marginUtilization,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Calculate contract value and margin requirements
 */
FuturesContractSchema.pre('save', function(this: IFuturesContract, next) {
  // Calculate total contract value if not set
  if (!this.totalContractValue) {
    this.totalContractValue = this.strikePrice * this.contractSize * this.numberOfContracts;
  }
  
  // Calculate initial margin if not set
  if (!this.initialMarginRequired) {
    this.initialMarginRequired = this.totalContractValue * this.initialMarginRate;
  }
  
  // Set maintenance margin rate if not set (75% of initial)
  if (!this.maintenanceMarginRate) {
    this.maintenanceMarginRate = this.initialMarginRate * 0.75;
  }
  
  // Set current margin balance if not set
  if (!this.currentMarginBalance) {
    this.currentMarginBalance = this.initialMarginRequired;
  }
  
  next();
});

// ================== STATIC METHODS ==================

/**
 * Create new futures contract with standard specifications
 * 
 * @param params - Contract parameters
 * @returns New futures contract
 * 
 * @example
 * const contract = await FuturesContract.createContract({
 *   company: companyId,
 *   commodity: 'CrudeOil',
 *   strikePrice: 75.00,
 *   positionType: 'Long',
 *   numberOfContracts: 10,
 *   expiryDate: new Date('2025-12-31'),
 *   volatility: 12
 * });
 */
FuturesContractSchema.statics.createContract = async function(
  params: {
    company: Types.ObjectId;
    commodity: CommodityType;
    strikePrice: number;
    positionType: PositionType;
    numberOfContracts: number;
    expiryDate: Date;
    volatility: number;
  }
) {
  const contractSize = getStandardContractSize(params.commodity);
  const marginRate = calculateMarginRate(params.volatility);
  
  return this.create({
    company: params.company,
    commodity: params.commodity,
    contractSize,
    strikePrice: params.strikePrice,
    currentMarketPrice: params.strikePrice,
    positionType: params.positionType,
    numberOfContracts: params.numberOfContracts,
    expiryDate: params.expiryDate,
    initialMarginRate: marginRate,
    settlementMethod: 'Cash',
  });
};

// ================== MODEL ==================

export const FuturesContract: Model<IFuturesContract> = 
  mongoose.models.FuturesContract || 
  mongoose.model<IFuturesContract>('FuturesContract', FuturesContractSchema);

export default FuturesContract;
