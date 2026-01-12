import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../data/constructai.db');

const db = new sqlite3.Database(DB_PATH);

const all = (sql) => new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function viewData() {
    try {
        console.log('\n--- USERS ---');
        const users = await all('SELECT id, email, name, created_at FROM users');
        if (users.length === 0) console.log('No users found.');
        else console.table(users);

        console.log('\n--- PROJECTS ---');
        const projects = await all('SELECT id, user_id, name, stage, location FROM projects');
        if (projects.length === 0) console.log('No projects found.');
        else console.table(projects);

        console.log('\n--- IMAGES ---');
        const images = await all('SELECT id, project_id, file_name, upload_date FROM images');
        if (images.length === 0) console.log('No images found.');
        else console.table(images);

        console.log('\n--- ANALYSIS RESULTS ---');
        const results = await all('SELECT id, image_id, progress_percentage, confidence_score FROM analysis_results');
        if (results.length === 0) console.log('No analysis results found.');
        else console.table(results);

    } catch (err) {
        console.error(err);
    } finally {
        db.close();
    }
}

viewData();
