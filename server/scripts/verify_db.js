import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/constructai.db');

async function verifyDatabase() {
    console.log(`🔍 Verifying database at: ${DB_PATH}`);

    try {
        await fs.access(DB_PATH);
        console.log('✅ Database file exists');
    } catch (error) {
        console.error('❌ Database file does not exist');
        return;
    }

    const db = new sqlite3.Database(DB_PATH);

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    try {
        // Check tables
        const tables = await all("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map(t => t.name);
        console.log('📊 Tables found:', tableNames.join(', '));

        const requiredTables = ['users', 'projects', 'images', 'analysis_results', 'progress_history'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            console.error('❌ Missing tables:', missingTables.join(', '));
        } else {
            console.log('✅ All required tables present');
        }

        // Test Insert User
        const testEmail = `test_${Date.now()}@example.com`;
        console.log(`📝 Testing user insertion with email: ${testEmail}`);

        await run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [testEmail, 'hash123', 'Test User']);
        const user = await get('SELECT * FROM users WHERE email = ?', [testEmail]);

        if (user) {
            console.log('✅ User inserted and retrieved successfully:', user.id);

            // Test Insert Project
            console.log('📝 Testing project insertion...');
            await run('INSERT INTO projects (user_id, name, stage, location) VALUES (?, ?, ?, ?)', [user.id, 'Test Project', 'Planning', 'Test Location']);
            const project = await get('SELECT * FROM projects WHERE user_id = ?', [user.id]);

            if (project) {
                console.log('✅ Project inserted and retrieved successfully:', project.id);
            } else {
                console.error('❌ Failed to retrieve inserted project');
            }
        } else {
            console.error('❌ Failed to retrieve inserted user');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        db.close();
    }
}

verifyDatabase();
