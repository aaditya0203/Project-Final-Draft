import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import imageRoutes from './routes/images.js';
import exportRoutes from './routes/export.js';

// Import services
import imageAnalysis from './services/imageAnalysis.js';
import initDatabase from './db/init.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        modelLoaded: imageAnalysis.isModelLoaded
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
        }
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize and start server
async function startServer() {
    try {
        console.log('🚀 Starting ConstructAI Server...');

        // Initialize database
        console.log('📊 Initializing database...');
        await initDatabase();

        // Pre-load AI model
        console.log('🤖 Loading AI model...');
        try {
            await imageAnalysis.loadModel();
        } catch (err) {
            console.warn('⚠️ Failed to load AI model (running in fallback mode):', err.message);
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📡 API endpoints:`);
            console.log(`   - POST /api/auth/register`);
            console.log(`   - POST /api/auth/login`);
            console.log(`   - GET  /api/projects`);
            console.log(`   - POST /api/projects`);
            console.log(`   - POST /api/images/upload`);
            console.log(`   - GET  /api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
