import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to the correct database location relative to this script
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

console.log(`Using database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const migrateEmails = () => {
    const sqlVantage = `
        UPDATE users 
        SET email = REPLACE(email, '@vantage.com', '@constructify.com') 
        WHERE email LIKE '%@vantage.com'
    `;

    const sqlConstructAI = `
        UPDATE users 
        SET email = REPLACE(email, '@constructai.com', '@constructify.com') 
        WHERE email LIKE '%@constructai.com'
    `;

    db.serialize(() => {
        db.run(sqlVantage, function (err) {
            if (err) {
                console.error('Error updating @vantage.com emails:', err.message);
            } else {
                console.log(`Successfully updated ${this.changes} user(s) from @vantage.com to @constructify.com.`);
            }
        });

        db.run(sqlConstructAI, function (err) {
            if (err) {
                console.error('Error updating @constructai.com emails:', err.message);
            } else {
                console.log(`Successfully updated ${this.changes} user(s) from @constructai.com to @constructify.com.`);
            }
            db.close();
        });
    });
};

migrateEmails();
