import mongoose from 'mongoose';

async function initDatabase() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.warn('⚠️ No DATABASE_URL found, skipping database initialization');
        return;
    }

    try {
        await mongoose.connect(connectionString);
        console.log('✅ MongoDB Database connected successfully');
    } catch (error) {
        console.error('❌ MongoDB Database connection failed:', error);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

export default initDatabase;
