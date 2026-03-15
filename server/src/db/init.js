import mongoose from 'mongoose';

async function initDatabase() {
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('❌ FATAL: DATABASE_URL environment variable is not set!');
        process.exit(1);
    }

    // Workaround for Node.js DNS SRV timeout issues (Deprecated/Breaking in Node 20+)
    /*
    if (connectionString.startsWith('mongodb+srv://') && connectionString.includes('cluster0.4rrkabe.mongodb.net')) {
        try {
            const credentials = connectionString.match(/mongodb\+srv:\/\/(.*?)@/)[1];
            const dbNameAndQuery = connectionString.split('.mongodb.net/')[1];
            connectionString = `mongodb://${credentials}@ac-pezvipn-shard-00-00.4rrkabe.mongodb.net:27017,ac-pezvipn-shard-00-01.4rrkabe.mongodb.net:27017,ac-pezvipn-shard-00-02.4rrkabe.mongodb.net:27017/${dbNameAndQuery}&ssl=true&replicaSet=atlas-pezvipn-shard-0&authSource=admin`;
        } catch (e) {
            console.error('Failed to parse and convert connection string', e);
        }
    }
    */

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
