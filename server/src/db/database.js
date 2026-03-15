import { User, Project, Image, Analysis, ProgressHistory } from './models.js';

class Database {
    // User operations
    async createUser(email, passwordHash, name, role = 'user', googleId = null) {
        const user = new User({ email, password_hash: passwordHash, google_id: googleId, name, role });
        await user.save();
        return user._id.toString();
    }

    async getUserByEmail(email) {
        const user = await User.findOne({ email }).lean();
        if (!user) return null;
        return { ...user, id: user._id.toString() };
    }

    async getUserById(id) {
        const user = await User.findById(id).lean();
        if (!user) return null;
        return { ...user, id: user._id.toString() };
    }

    async saveResetToken(email, token, expiry) {
        await User.updateOne({ email }, { reset_token: token, reset_token_expiry: new Date(expiry) });
    }

    async getUserByResetToken(token) {
        const user = await User.findOne({ reset_token: token, reset_token_expiry: { $gt: new Date() } }).lean();
        if (!user) return null;
        return { ...user, id: user._id.toString() };
    }

    async updatePassword(userId, passwordHash) {
        await User.findByIdAndUpdate(userId, { password_hash: passwordHash, reset_token: null, reset_token_expiry: null });
    }

    // Project operations
    async createProject(userId, name, stage, location, description) {
        const project = new Project({ user_id: userId, name, stage, location, description });
        await project.save();
        return project._id.toString();
    }

    async getProjectById(id) {
        try {
            const project = await Project.findById(id).lean();
            if (!project) return null;
            return { ...project, id: project._id.toString(), user_id: project.user_id.toString() };
        } catch { return null; }
    }

    async getProjectsByUser(userId, search = '') {
        const query = { user_id: userId };
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [{ name: regex }, { location: regex }, { description: regex }];
        }
        const projects = await Project.find(query).sort({ updated_at: -1 }).lean();
        return projects.map(p => ({ ...p, id: p._id.toString(), user_id: p.user_id.toString() }));
    }

    async getAllProjects(search = '') {
        const query = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [{ name: regex }, { location: regex }, { description: regex }];
        }
        const projects = await Project.find(query).sort({ updated_at: -1 }).lean();
        return projects.map(p => ({ ...p, id: p._id.toString(), user_id: p.user_id.toString() }));
    }

    async updateProject(id, updates) {
        const { name, stage, location, description } = updates;
        await Project.findByIdAndUpdate(id, { name, stage, location, description, updated_at: new Date() });
    }

    async deleteProject(id) {
        await Project.findByIdAndDelete(id);
    }

    // Image operations
    async createImage(projectId, filePath, fileName, fileSize) {
        const image = new Image({ project_id: projectId, file_path: filePath, file_name: fileName, file_size: fileSize });
        await image.save();
        return image._id.toString();
    }

    async getImagesByProject(projectId) {
        const images = await Image.find({ project_id: projectId }).sort({ upload_date: -1 }).lean();
        return images.map(i => ({ ...i, id: i._id.toString(), project_id: i.project_id.toString() }));
    }

    async getImageById(id) {
        try {
            const image = await Image.findById(id).lean();
            if (!image) return null;
            return { ...image, id: image._id.toString(), project_id: image.project_id.toString() };
        } catch { return null; }
    }

    async deleteImage(id) {
        await Image.findByIdAndDelete(id);
    }

    async deleteImagesByProject(projectId) {
        await Image.deleteMany({ project_id: projectId });
    }

    // Analysis operations
    async createAnalysis(imageId, analysisData) {
        const { progressPercentage, elementsDetected, timeEstimateDays, confidenceScore, structuralElements, safetyIssues, weatherConditions } = analysisData;
        const analysis = new Analysis({
            image_id: imageId,
            progress_percentage: progressPercentage,
            elements_detected: JSON.stringify(elementsDetected),
            time_estimate_days: timeEstimateDays,
            confidence_score: confidenceScore,
            structural_elements: JSON.stringify(structuralElements),
            safety_issues: JSON.stringify(safetyIssues),
            weather_conditions: weatherConditions
        });
        await analysis.save();
        return analysis._id.toString();
    }

    async getAnalysisByImage(imageId) {
        const data = await Analysis.findOne({ image_id: imageId }).sort({ analyzed_at: -1 }).lean();
        if (data) {
            data.id = data._id.toString();
            data.elements_detected = JSON.parse(data.elements_detected || '[]');
            data.structural_elements = JSON.parse(data.structural_elements || '{}');
            data.safety_issues = JSON.parse(data.safety_issues || '[]');
        }
        return data;
    }

    async getLatestAnalysisByProject(projectId) {
        const images = await Image.find({ project_id: projectId }).lean();
        if (!images.length) return null;
        const imageIds = images.map(i => i._id);
        const data = await Analysis.findOne({ image_id: { $in: imageIds } }).sort({ analyzed_at: -1 }).lean();
        if (data) {
            data.id = data._id.toString();
            data.elements_detected = JSON.parse(data.elements_detected || '[]');
            data.structural_elements = JSON.parse(data.structural_elements || '{}');
            data.safety_issues = JSON.parse(data.safety_issues || '[]');
            // attach file_path from image
            const img = images.find(i => i._id.toString() === data.image_id.toString());
            if (img) { data.file_path = img.file_path; data.upload_date = img.upload_date; }
        }
        return data;
    }

    async deleteAnalysisByImage(imageId) {
        await Analysis.deleteMany({ image_id: imageId });
    }

    async deleteAnalysisByProject(projectId) {
        const images = await Image.find({ project_id: projectId }).lean();
        const imageIds = images.map(i => i._id);
        await Analysis.deleteMany({ image_id: { $in: imageIds } });
    }

    // Progress history
    async addProgressHistory(projectId, date, progressPercentage, notes) {
        const history = new ProgressHistory({ project_id: projectId, date, progress_percentage: progressPercentage, notes });
        await history.save();
        return history._id.toString();
    }

    async getProgressHistory(projectId) {
        const history = await ProgressHistory.find({ project_id: projectId }).sort({ date: 1 }).lean();
        return history.map(h => ({ ...h, id: h._id.toString(), project_id: h.project_id.toString() }));
    }

    async deleteProgressHistoryByProject(projectId) {
        await ProgressHistory.deleteMany({ project_id: projectId });
    }

    async close() {
        // Mongoose handles connection pooling automatically
    }
}

export default new Database();
