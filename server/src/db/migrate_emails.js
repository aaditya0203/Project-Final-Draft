import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to the correct database location relative to this script
// Assuming this script is in server/src/db/ and db is in server/data/ or root/data/
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

console.log(`Using database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const migrateEmails = () => {
    const sql = `
        UPDATE users 
        SET email = REPLACE(REPLACE(email, '@constructai.com', '@constructify.com'), '@vantage.com', '@constructify.com')
        WHERE email LIKE '%@constructai.com' OR email LIKE '%@vantage.com'
    `;

    db.run(sql, function (err) {
        if (err) {
            console.error('Error updating emails:', err.message);
        } else {
            console.log(`Successfully updated ${this.changes} user(s) to @vantage.com domain.`);
        }
        db.close();
    });
};

migrateEmails();
