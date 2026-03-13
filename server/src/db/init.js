import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.warn('⚠️ No DATABASE_URL found, skipping cloud initialization');
        return;
    }

    try {
        const pool = new pg.Pool({
            connectionString: connectionString,
            ssl: { rejectUnauthorized: false } // Required for Supabase/Render
        });

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema_postgres.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ PostgreSQL Database initialized successfully');
        await pool.end();
    } catch (error) {
        console.error('❌ PostgreSQL Database initialization failed:', error);
        // Don't exit if it's just a connection error in dev
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initDatabase();
}

export default initDatabase;
