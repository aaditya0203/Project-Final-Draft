import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/constructai.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

async function deleteAllProjects() {
    try {
        // 1. Get all image paths
        const images = await new Promise((resolve, reject) => {
            db.all('SELECT file_path FROM images', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log(`Found ${images.length} images to delete.`);

        // 2. Delete files from disk
        let deletedFiles = 0;
        for (const img of images) {
            try {
                if (img.file_path) {
                    await fs.unlink(img.file_path);
                    deletedFiles++;
                }
            } catch (err) {
                console.warn(`Failed to delete file ${img.file_path}:`, err.message);
            }
        }
        console.log(`Deleted ${deletedFiles} image files from disk.`);

        // 3. Delete all projects (Cascade should handle related tables)
        // We need to enable foreign keys for cascade to work, or manually delete
        await new Promise((resolve, reject) => {
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM projects', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('All projects deleted from database.');

        // Verify emptiness
        const projectCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        const imageCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM images', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        console.log(`Remaining projects: ${projectCount}`);
        console.log(`Remaining images in DB: ${imageCount}`);

    } catch (error) {
        console.error('Error deleting projects:', error);
    } finally {
        db.close();
    }
}

deleteAllProjects();
