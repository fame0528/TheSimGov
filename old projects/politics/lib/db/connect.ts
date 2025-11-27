import mongoose from 'mongoose';
let isConnected = false;
export default async function connectDB(): Promise<void> {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/politics';
  await mongoose.connect(uri).catch(err => { console.error('Mongo error', err); throw err; });
  isConnected = true;
}
