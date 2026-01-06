import express from 'express';
import db from '../db/database.js';
import upload from '../middleware/upload.js';
import imageAnalysis from '../services/imageAnalysis.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import ssimjs from 'ssim.js';

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

// Compare two images using SSIM
router.post('/compare', authenticateToken, async (req, res) => {
    try {
        const { image1Id, image2Id } = req.body;

        if (!image1Id || !image2Id) {
            return res.status(400).json({ error: 'Both image1Id and image2Id are required' });
        }

        const img1 = await db.getImageById(image1Id);
        const img2 = await db.getImageById(image2Id);

        if (!img1 || !img2) {
            return res.status(404).json({ error: 'One or both images not found' });
        }

        // Verify ownership (check project ownership for both)
        const project1 = await db.getProjectById(img1.project_id);
        const project2 = await db.getProjectById(img2.project_id);

        if (project1.user_id !== req.user.id || project2.user_id !== req.user.id) {
            // Allow contractors to view/compare if they have access (simplified: if they are contractor)
            if (req.user.role !== 'contractor') {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        console.log('Comparing images:', img1.file_path, img2.file_path);

        const width = 512;
        const height = 512;

        const processImage = async (filePath) => {
            try {
                // Resolve the image file path relative to the project root or use absolute path if already absolute
                const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
                console.log('Processing image at:', absolutePath);

                const buffer = await fs.readFile(absolutePath);
                const { data, info } = await sharp(buffer)
                    .resize(width, height)
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });
                return { data, width: info.width, height: info.height, channels: info.channels };
            } catch (err) {
                console.error('Error processing image:', filePath, err);
                throw err;
            }
        };

        const [data1, data2] = await Promise.all([
            processImage(img1.file_path),
            processImage(img2.file_path)
        ]);

        console.log('Images processed, calculating SSIM...');
        const { mssim } = ssimjs.default(data1, data2);
        console.log('SSIM calculated:', mssim);

        res.json({
            ssim: mssim,
            similarity: `${(mssim * 100).toFixed(2)}%`,
            message: 'Comparison complete',
            image1: { id: img1.id, upload_date: img1.upload_date },
            image2: { id: img2.id, upload_date: img2.upload_date }
        });

    } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({ error: 'Failed to compare images', details: error.message });
    }
});

export default router;
