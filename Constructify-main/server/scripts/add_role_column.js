import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../data/constructai.db');

const db = new sqlite3.Database(DB_PATH);

console.log('Adding role column to users table...');

db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (err) {
        if (err.message.includes('duplicate column')) {
            console.log('✅ Role column already exists');
        } else {
            console.error('❌ Error:', err.message);
        }
    } else {
        console.log('✅ Role column added successfully');
    }

    db.close();
});
