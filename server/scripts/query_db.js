import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/constructai.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM projects WHERE user_id = (SELECT id FROM users WHERE email = 'jaiswalaaditya322@gmail.com')", (err, rows) => {
    if (err) throw err;
    console.log('Projects:', rows.length);
    if (rows.length > 0) {
        db.all('SELECT * FROM analysis_results WHERE image_id IN (SELECT id FROM images WHERE project_id = ?)', [rows[0].id], (err, aRows) => {
            console.log('Analysis for first project:', aRows.length, aRows[0]);
        });
        db.all('SELECT * FROM images WHERE project_id = ?', [rows[0].id], (err, iRows) => {
            console.log('Images for first project:', iRows.length, iRows[0]);
        });
    }
});
