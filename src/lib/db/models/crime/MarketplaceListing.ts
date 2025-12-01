import mongoose, { Schema, Document, Model } from 'mongoose';

export type ListingStatus = 'Active' | 'Sold' | 'Expired' | 'Seized';

export interface IDeliveryOption {
  method: string; // Road | Air | Rail | Courier
  cost: number; // additional cost
  risk: number; // 0-100
}

export interface IMarketplaceListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  substance: string; // validated externally
  quantity: number; // total units available
  purity: number; // 0-100
  pricePerUnit: number;
  location: { state: string; city: string };
  deliveryOptions: IDeliveryOption[];
  minOrder?: number;
  bulkDiscounts?: { qty: number; discount: number }[];
  status: ListingStatus;
  sellerRep?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOptionSchema = new Schema<IDeliveryOption>({
  method: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  risk: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const MarketplaceListingSchema = new Schema<IMarketplaceListing>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  substance: { type: String, required: true, index: true },
  quantity: { type: Number, required: true, min: 1 },
  purity: { type: Number, required: true, min: 0, max: 100 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  location: { state: { type: String, required: true, index: true }, city: { type: String, required: true } },
  deliveryOptions: { type: [DeliveryOptionSchema], default: [] },
  minOrder: { type: Number, min: 1 },
  bulkDiscounts: { type: [{ qty: { type: Number, required: true, min: 1 }, discount: { type: Number, required: true, min: 0, max: 100 } }], default: [] },
  status: { type: String, enum: ['Active','Sold','Expired','Seized'], required: true, default: 'Active', index: true },
  sellerRep: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

MarketplaceListingSchema.index({ status: 1, substance: 1 });
MarketplaceListingSchema.index({ 'location.state': 1, pricePerUnit: 1 });

export const MarketplaceListing: Model<IMarketplaceListing> = mongoose.models.MarketplaceListing || mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);

export default MarketplaceListing;
