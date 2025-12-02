// server.js - Express backend for ConstructAI
// ------------------------------------------------------------
// Run with: node server.js
// ------------------------------------------------------------
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import * as tf from '@tensorflow/tfjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Initialize SQLite database
let db;

async function initDatabase() {
    db = await open({
        filename: path.join(__dirname, 'constructai.db'),
        driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      stage TEXT,
      progress REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      analysis_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

    console.log('✅ Database initialized');
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload image
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }

        // Store image metadata in database
        const result = await db.run(
            'INSERT INTO images (project_id, filename, filepath) VALUES (?, ?, ?)',
            [projectId, req.file.filename, req.file.path]
        );

        res.json({
            success: true,
            imageId: result.lastID,
            filename: req.file.filename,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Get project images
app.get('/api/images/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;

        const images = await db.all(
            'SELECT id, filename, created_at, analysis_data FROM images WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );

        res.json({ images });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
});

// Get image file
app.get('/api/image/:imageId', authenticateToken, async (req, res) => {
    try {
        const { imageId } = req.params;

        const image = await db.get('SELECT filepath FROM images WHERE id = ?', [imageId]);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.sendFile(image.filepath);
    } catch (error) {
        console.error('Get image error:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

// Export report (Excel/PDF)
app.get('/api/export/:projectId/:format', authenticateToken, async (req, res) => {
    try {
        const { projectId, format } = req.params;

        if (!['excel', 'pdf'].includes(format)) {
            return res.status(400).json({ error: 'Invalid format. Use excel or pdf' });
        }

        // Get project data
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const images = await db.all('SELECT * FROM images WHERE project_id = ?', [projectId]);

        // For now, return a simple JSON response
        // TODO: Implement actual Excel/PDF generation using libraries like exceljs or pdfkit
        const reportData = {
            project,
            images,
            generatedAt: new Date().toISOString()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=report-${projectId}.json`);
        res.json(reportData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Sign out endpoint
app.post('/api/signout', authenticateToken, (req, res) => {
    // In a real app, you might invalidate the token in a blacklist
    res.json({ message: 'Signed out successfully' });
});

// Delete project endpoint
app.delete('/api/projects/:projectId', authenticateToken, async (req, res) => {
    console.log(`🗑️ Received delete request for project ID: ${req.params.projectId}`);
    try {
        const { projectId } = req.params;

        // 1. Get associated images
        const images = await db.all('SELECT filepath FROM images WHERE project_id = ?', [projectId]);
        console.log(`Found ${images.length} images to delete for project ${projectId}`);

        // 2. Delete image files
        for (const img of images) {
            try {
                if (fs.existsSync(img.filepath)) {
                    fs.unlinkSync(img.filepath);
                    console.log(`Deleted file: ${img.filepath}`);
                } else {
                    console.warn(`File not found, skipping: ${img.filepath}`);
                }
            } catch (err) {
                console.error(`Failed to delete file ${img.filepath}:`, err.message);
                // Continue deleting other files even if one fails
            }
        }

        // 3. Delete image records from DB
        await db.run('DELETE FROM images WHERE project_id = ?', [projectId]);
        console.log(`Deleted image records for project ${projectId}`);

        // 4. Delete project record
        const result = await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
        console.log(`Deleted project record. Changes: ${result.changes}`);

        if (result.changes === 0) {
            console.warn(`Project ${projectId} not found in database`);
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('❌ Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project', details: error.message });
    }
});

// Start server
async function startServer() {
    try {
        await initDatabase();

        // Serve model files statically
        app.use('/model', express.static(path.join(__dirname, 'model')));

        // Load model
        let model;
        try {
            // Use tf.loadLayersModel with the file:// protocol for Node.js environment
            // Note: We need to use the absolute path to the model.json file
            const modelPath = `file://${path.join(__dirname, 'model', 'model.json')}`;
            console.log(`Loading model from: ${modelPath}`);
            model = await tf.loadLayersModel(modelPath);
            console.log('✅ Model loaded successfully');
        } catch (err) {
            console.error('⚠️ Failed to load model:', err.message);
            console.log('Prediction endpoint will be unavailable until model is retrained/fixed.');
        }

        // Prediction endpoint
        app.post('/api/predict', authenticateToken, async (req, res) => {
            if (!model) {
                return res.status(503).json({ error: 'Model not available' });
            }

            try {
                const { features } = req.body;

                if (!features || !Array.isArray(features) || features.length !== 18) {
                    return res.status(400).json({
                        error: 'Invalid features. Expected array of 18 numeric values.',
                        expectedFeatures: [
                            'timestamp', 'temperature', 'humidity', 'vibration_level',
                            'material_usage', 'machinery_status', 'worker_count',
                            'energy_consumption', 'task_progress', 'cost_deviation',
                            'time_deviation', 'safety_incidents', 'equipment_utilization_rate',
                            'material_shortage_alert', 'risk_score', 'simulation_deviation',
                            'update_frequency', 'optimization_suggestion'
                        ]
                    });
                }

                // Convert features to tensor
                const inputTensor = tf.tensor2d([features]);

                // Run prediction
                const predictionTensor = model.predict(inputTensor);
                const predictionValue = predictionTensor.dataSync()[0];

                // Cleanup tensors
                inputTensor.dispose();
                predictionTensor.dispose();

                res.json({
                    performance_score: predictionValue,
                    time_estimate: Math.max(0, 100 - predictionValue) * 1.5 // Simple heuristic for demo
                });
            } catch (error) {
                console.error('Prediction error:', error);
                res.status(500).json({ error: 'Prediction failed' });
            }
        });

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📁 Uploads directory: ${uploadsDir}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
