import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

console.log(`Using database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const migrateResetToken = () => {
    db.serialize(() => {
        // Add reset_token column
        db.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding reset_token column:', err.message);
            } else {
                console.log('Added reset_token column (or it already exists).');
            }
        });

        // Add reset_token_expiry column
        db.run(`ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding reset_token_expiry column:', err.message);
            } else {
                console.log('Added reset_token_expiry column (or it already exists).');
            }
            db.close();
        });
    });
};

migrateResetToken();
