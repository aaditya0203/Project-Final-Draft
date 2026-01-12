import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { promises as fs } from 'fs';

const router = express.Router();

// Create new project
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Restrict contractors from creating projects
        if (req.user.role === 'contractor') {
            return res.status(403).json({ error: 'Contractors are not allowed to create projects' });
        }

        const { name, stage, location, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const projectId = await db.createProject(userId, name, stage, location, description);
        const project = await db.getProjectById(projectId);

        res.status(201).json({ message: 'Project created', project });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get all projects for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;

        // Get user to check role
        const user = await db.getUserById(userId);

        let projects;
        if (user.role === 'contractor') {
            // Contractors see all projects
            projects = await db.getAllProjects(search);
        } else {
            // Regular users see only their own projects
            projects = await db.getProjectsByUser(userId, search);
        }

        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db.getProjectById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get user to check role
        const user = await db.getUserById(req.user.id);

        // Verify ownership (contractors can view all projects, regular users only their own)
        if (user.role !== 'contractor' && project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get latest analysis
        const latestAnalysis = await db.getLatestAnalysisByProject(projectId);

        // Get progress history
        const progressHistory = await db.getProgressHistory(projectId);

        res.json({
            project,
            latestAnalysis,
            progressHistory
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db.getProjectById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.updateProject(projectId, req.body);
        const updatedProject = await db.getProjectById(projectId);

        res.json({ message: 'Project updated', project: updatedProject });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db.getProjectById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        console.log(`Attempting to delete project ${projectId} for user ${req.user.id}`);

        // Get all images to delete files
        const images = await db.getImagesByProject(projectId);
        console.log(`Found ${images.length} images to delete`);

        // Delete image files
        for (const image of images) {
            try {
                await fs.unlink(image.file_path);
                console.log(`Deleted file: ${image.file_path}`);
            } catch (err) {
                console.error(`Failed to delete file ${image.file_path}:`, err);
            }
        }

        // Delete related data in DB
        await db.deleteAnalysisByProject(projectId);
        console.log('Deleted analysis results');

        await db.deleteImagesByProject(projectId);
        console.log('Deleted images from DB');

        await db.deleteProgressHistoryByProject(projectId);
        console.log('Deleted progress history');

        // Delete project
        await db.deleteProject(projectId);
        console.log(`Deleted project ${projectId} from DB`);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
