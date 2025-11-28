import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatUnread extends Document {
  userId: string;
  room: string;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatUnreadSchema = new Schema<IChatUnread>({
  userId: { type: String, required: true },
  room: { type: String, required: true },
  lastReadAt: { type: Date, required: true },
}, { timestamps: true });

ChatUnreadSchema.index({ userId: 1, room: 1 }, { unique: true });

export const ChatUnread: Model<IChatUnread> = mongoose.models.ChatUnread || mongoose.model<IChatUnread>('ChatUnread', ChatUnreadSchema);

export default ChatUnread;