import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const email = 'aaditya@constructify.com';
const newPassword = 'password123';

async function resetPassword() {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.run('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email], function (err) {
        if (err) {
            console.error('Error updating password:', err.message);
        } else {
            console.log(`Password for ${email} updated to: ${newPassword}`);
            console.log(`Rows modified: ${this.changes}`);
        }
        db.close();
    });
}

resetPassword();
