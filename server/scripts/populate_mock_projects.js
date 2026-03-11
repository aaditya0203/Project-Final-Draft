import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/constructai.db');
const uploadsDir = path.resolve(__dirname, '../uploads/mock_images');
const db = new sqlite3.Database(dbPath);

const targetEmail = 'jaiswalaaditya322@gmail.com';

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

async function downloadImage(url, destPath) {
    if (fs.existsSync(destPath)) {
        return destPath;
    }
    let response = await fetch(url);
    if (!response.ok) {
        console.warn(`Failed to get '${url}' (${response.status}), using fallback.`);
        response = await fetch('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80');
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return destPath;
}

function runAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

const projectsToCreate = [
    {
        name: 'aadi 1', stage: 'Foundation', location: 'Downtown Finance District',
        desc: 'Phase 1 development of the new 40-story commercial tower.', progress: 22,
        images: [
            'https://images.unsplash.com/photo-1607133201405-8dd98656d9f7?w=1200&q=80',
            'https://images.unsplash.com/photo-1612945533382-4ae1f539654b?w=1200&q=80',
            'https://images.unsplash.com/photo-1626233558206-28a3e90ef311?w=1200&q=80'
        ]
    },
    {
        name: 'aadi 2', stage: 'Framing', location: 'Westside Tech Park',
        desc: 'Structural framing for a sprawling 3-building tech campus.', progress: 65,
        images: [
            'https://images.unsplash.com/photo-1656956479776-637a2d453e7e?w=1200&q=80',
            'https://images.unsplash.com/photo-1675352237878-cd90d63d0a7b?w=1200&q=80',
            'https://images.unsplash.com/photo-1675352306826-389b0718edb6?w=1200&q=80',
            'https://images.unsplash.com/photo-1678664522230-4d1237da942f?w=1200&q=80'
        ]
    },
    {
        name: 'aadi 3', stage: 'Finishing', location: 'Lakeview Residential',
        desc: 'Final architectural finishes and inspections for luxury condos.', progress: 92,
        images: [
            'https://images.unsplash.com/photo-1649766964924-1d257ddf0742?w=1200&q=80',
            'https://images.unsplash.com/photo-1761986757577-140af8859587?w=1200&q=80',
            'https://images.unsplash.com/photo-1768321902529-8679230e0aa9?w=1200&q=80'
        ]
    },
];

async function populate() {
    try {
        console.log(`Connecting to DB at ${dbPath}`);
        const user = await getAsync('SELECT id FROM users WHERE email = ?', [targetEmail]);
        if (!user) {
            console.error('User not found. Please create the user first or correct the email.');
            return;
        }
        const userId = user.id;

        await runAsync(`DELETE FROM projects WHERE user_id = ? AND name LIKE 'aadi %'`, [userId]);

        for (const p of projectsToCreate) {
            const res = await runAsync(
                'INSERT INTO projects (user_id, name, stage, location, description) VALUES (?, ?, ?, ?, ?)',
                [userId, p.name, p.stage, p.location, p.desc]
            );
            const projectId = res.lastID;

            for (let i = 0; i < p.images.length; i++) {
                const imgUrl = p.images[i];
                const filename = `project_${projectId}_img_${i + 1}.jpg`;
                const destPath = path.join(uploadsDir, filename);

                await downloadImage(imgUrl, destPath);
                const stats = fs.statSync(destPath);

                const dbPathStr = path.join('uploads', 'mock_images', filename);

                const imageRes = await runAsync(
                    'INSERT INTO images (project_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?)',
                    [projectId, dbPathStr, filename, stats.size]
                );
                const imageId = imageRes.lastID;

                const currentProgress = Math.max(0, p.progress - (p.images.length - 1 - i) * 5);

                const elements = JSON.stringify(['Excavator', 'Rebar', 'Scaffolding', 'Hardhats'].slice(0, Math.floor(Math.random() * 4) + 1));
                const structural = JSON.stringify({
                    columns: Math.floor(Math.random() * 20) + 10, beams: Math.floor(Math.random() * 30) + 15, walls: Math.floor(Math.random() * 10) + 5
                });

                const safety = JSON.stringify([
                    { description: 'No PPE Detected', severity: 'Medium', location: 'Zone B' },
                    { description: 'Unsecured Scaffolding', severity: 'High', location: 'Zone C' }
                ].slice(0, Math.floor(Math.random() * 3)));

                const weather = ['Sunny, 75°F', 'Cloudy, 68°F', 'Clear, 82°F', 'Overcast, 65°F'][Math.floor(Math.random() * 4)];

                const mockDate = new Date();
                mockDate.setHours(mockDate.getHours() - (p.images.length - i) * 24);

                await runAsync(
                    `INSERT INTO analysis_results (image_id, progress_percentage, elements_detected, time_estimate_days,
                    confidence_score, structural_elements, safety_issues, weather_conditions, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [imageId, currentProgress, elements, Math.floor(Math.random() * 45) + 10, 0.94 + (Math.random() * 0.05), structural, safety, weather, mockDate.toISOString()]
                );
            }

            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const dateStr = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const histProgress = Math.max(0, p.progress - (i * 12));
                await runAsync(
                    'INSERT INTO progress_history (project_id, date, progress_percentage, notes) VALUES (?, ?, ?, ?)',
                    [projectId, dateStr, histProgress, `Weekly milestone reached. Site inspection complete.`]
                );
            }
            console.log(`  -> Populated ${p.images.length} images, analysis, and history for '${p.name}'`);
        }

        console.log('Successfully completed db mocking!');
    } catch (e) {
        console.error('Error populating database:', e);
    } finally {
        db.close();
    }
}

populate();
