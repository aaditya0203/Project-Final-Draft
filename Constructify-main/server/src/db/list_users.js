import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

db.all('SELECT id, email, role FROM users', [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Users found:', rows.length);
    rows.forEach((row) => {
        console.log(`${row.id}: ${row.email} (${row.role})`);
    });
    db.close();
});
