import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/constructai.db';

async function initDatabase() {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(DB_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        // Create database connection
        const db = new sqlite3.Database(DB_PATH);

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');

        // Execute schema
        await new Promise((resolve, reject) => {
            db.exec(schema, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('✅ Database initialized successfully');

        db.close();
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initDatabase();
}

export default initDatabase;
