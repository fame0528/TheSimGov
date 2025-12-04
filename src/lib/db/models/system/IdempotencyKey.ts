import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IdempotencyKeyDocument extends Document {
  key: string;
  scope: string;
  userId?: string;
  requestHash?: string;
  status: 'pending' | 'succeeded' | 'failed';
  statusCode?: number;
  responseHash?: string;
  summary?: Record<string, any>;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // TTL cleanup
}

const IdempotencyKeySchema = new Schema<IdempotencyKeyDocument>({
  key: { type: String, required: true, index: true, unique: true },
  scope: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  requestHash: { type: String },
  status: { type: String, enum: ['pending','succeeded','failed'], required: true, default: 'pending' },
  statusCode: { type: Number },
  responseHash: { type: String },
  summary: { type: Schema.Types.Mixed },
  lockedAt: { type: Date },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

IdempotencyKeySchema.index({ scope: 1, userId: 1 });

const IdempotencyKeyModel: Model<IdempotencyKeyDocument> =
  mongoose.models.IdempotencyKey || mongoose.model<IdempotencyKeyDocument>('IdempotencyKey', IdempotencyKeySchema);

export default IdempotencyKeyModel;
