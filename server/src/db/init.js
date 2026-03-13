import mongoose from 'mongoose';

async function initDatabase() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('❌ FATAL: DATABASE_URL environment variable is not set!');
        process.exit(1);
    }

    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
        });
        console.log('✅ MongoDB Database connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

export default initDatabase;
