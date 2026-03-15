import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.DATABASE_URL;

console.log('Testing with URI:', uri.replace(/:([^:@]+)@/, ':****@'));

async function run() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully to MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
}

run();
