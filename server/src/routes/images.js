import express from 'express';
import db from '../db/database.js';
import upload from '../middleware/upload.js';
import imageAnalysis from '../services/imageAnalysis.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import { promises as fs } from 'fs';

const router = express.Router();

// Upload and analyze image
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Verify project ownership
        const project = await db.getProjectById(projectId);
        if (!project || project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Save image to database
        const imageId = await db.createImage(
            projectId,
            req.file.path,
            req.file.filename,
            req.file.size
        );

        // Analyze image
        console.log(`Analyzing image: ${req.file.path}`);
        const analysisResult = await imageAnalysis.analyzeImage(req.file.path);

        // Save analysis results
        const analysisId = await db.createAnalysis(imageId, analysisResult);

        // Add to progress history
        await db.addProgressHistory(
            projectId,
            new Date().toISOString().split('T')[0],
            analysisResult.progressPercentage,
            `Image uploaded: ${req.file.filename}`
        );

        res.status(201).json({
            message: 'Image uploaded and analyzed successfully',
            image: {
                id: imageId,
                filename: req.file.filename,
                path: req.file.path
            },
            analysis: {
                id: analysisId,
                ...analysisResult
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload and analyze image' });
    }
});

// Get images for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project ownership
        const project = await db.getProjectById(projectId);
        if (!project || project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const images = await db.getImagesByProject(projectId);

        // Get analysis for each image
        const imagesWithAnalysis = await Promise.all(
            images.map(async (image) => {
                const analysis = await db.getAnalysisByImage(image.id);
                return { ...image, analysis };
            })
        );

        res.json({ images: imagesWithAnalysis });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Get analysis for specific image
router.get('/:imageId/analysis', authenticateToken, async (req, res) => {
    try {
        const { imageId } = req.params;

        const image = await db.getImageById(imageId);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Verify ownership through project
        const project = await db.getProjectById(image.project_id);
        if (!project || project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const analysis = await db.getAnalysisByImage(imageId);

        res.json({ analysis });
    } catch (error) {
        console.error('Get analysis error:', error);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

// Serve image file
router.get('/:imageId/file', authenticateToken, async (req, res) => {
    try {
        const { imageId } = req.params;

        const image = await db.getImageById(imageId);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Verify ownership
        const project = await db.getProjectById(image.project_id);
        if (!project || project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.sendFile(path.resolve(image.file_path));
    } catch (error) {
        console.error('Serve image error:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// Delete image
router.delete('/:imageId', authenticateToken, async (req, res) => {
    try {
        const { imageId } = req.params;

        const image = await db.getImageById(imageId);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Verify ownership
        const project = await db.getProjectById(image.project_id);
        if (!project || project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete file from disk
        try {
            await fs.unlink(image.file_path);
        } catch (err) {
            console.error(`Failed to delete file ${image.file_path}:`, err);
            // Continue to delete DB record even if file delete fails (e.g. file missing)
        }

        // Delete analysis results
        await db.deleteAnalysisByImage(imageId);

        // Delete image record
        await db.deleteImage(imageId);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;
