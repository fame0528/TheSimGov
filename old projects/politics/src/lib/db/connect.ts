import mongoose from 'mongoose';

let isConnected = false;

export default async function connectDB(): Promise<void> {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/politics';
  await mongoose.connect(uri, { autoIndex: true }).catch((err) => {
    console.error('Mongo connection error:', err);
    throw err;
  });
  isConnected = true;
}
