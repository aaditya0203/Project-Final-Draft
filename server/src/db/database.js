import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';

const DB_PATH = process.env.DB_PATH || './data/constructai.db';

class Database {
    constructor() {
        this.db = null;
        this.run = null;
        this.get = null;
        this.all = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        // Ensure data directory exists
        const dataDir = path.dirname(DB_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        this.db = new sqlite3.Database(DB_PATH);

        // Manually promisify database methods to preserve 'this' context for run()
        this.run = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        };

        this.get = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                this.db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        this.all = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };
    }

    async ensureReady() {
        await this.initPromise;
    }

    // User operations
    async createUser(email, passwordHash, name, role = 'user') {
        await this.ensureReady();
        const result = await this.run(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
            [email, passwordHash, name, role]
        );
        return result.lastID;
    }

    async getUserByEmail(email) {
        await this.ensureReady();
        return await this.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    async getUserById(id) {
        await this.ensureReady();
        return await this.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    async saveResetToken(email, token, expiry) {
        await this.ensureReady();
        await this.run(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [token, expiry, email]
        );
    }

    async getUserByResetToken(token) {
        await this.ensureReady();
        return await this.get(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")',
            [token]
        );
    }

    async updatePassword(userId, passwordHash) {
        await this.ensureReady();
        await this.run(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [passwordHash, userId]
        );
    }

    // Project operations
    async createProject(userId, name, stage, location, description) {
        await this.ensureReady();
        const result = await this.run(
            'INSERT INTO projects (user_id, name, stage, location, description) VALUES (?, ?, ?, ?, ?)',
            [userId, name, stage, location, description]
        );
        return result.lastID;
    }

    async getProjectById(id) {
        await this.ensureReady();
        return await this.get('SELECT * FROM projects WHERE id = ?', [id]);
    }

    async getProjectsByUser(userId, search = '') {
        await this.ensureReady();
        let sql = 'SELECT * FROM projects WHERE user_id = ?';
        const params = [userId];

        if (search) {
            sql += ' AND (name LIKE ? OR location LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY updated_at DESC';

        return await this.all(sql, params);
    }

    async getAllProjects(search = '') {
        await this.ensureReady();
        let sql = 'SELECT * FROM projects';
        const params = [];

        if (search) {
            sql += ' WHERE (name LIKE ? OR location LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY updated_at DESC';

        return await this.all(sql, params);
    }

    async updateProject(id, updates) {
        await this.ensureReady();
        const { name, stage, location, description } = updates;
        await this.run(
            'UPDATE projects SET name = ?, stage = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, stage, location, description, id]
        );
    }

    async deleteProject(id) {
        await this.ensureReady();
        await this.run('DELETE FROM projects WHERE id = ?', [id]);
    }

    // Image operations
    async createImage(projectId, filePath, fileName, fileSize) {
        await this.ensureReady();
        const result = await this.run(
            'INSERT INTO images (project_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?)',
            [projectId, filePath, fileName, fileSize]
        );
        return result.lastID;
    }

    async getImagesByProject(projectId) {
        await this.ensureReady();
        return await this.all('SELECT * FROM images WHERE project_id = ? ORDER BY upload_date DESC', [projectId]);
    }

    async getImageById(id) {
        await this.ensureReady();
        return await this.get('SELECT * FROM images WHERE id = ?', [id]);
    }

    async deleteImage(id) {
        await this.ensureReady();
        await this.run('DELETE FROM images WHERE id = ?', [id]);
    }

    async deleteImagesByProject(projectId) {
        await this.ensureReady();
        await this.run('DELETE FROM images WHERE project_id = ?', [projectId]);
    }

    // Analysis operations
    async createAnalysis(imageId, analysisData) {
        await this.ensureReady();
        const {
            progressPercentage,
            elementsDetected,
            timeEstimateDays,
            confidenceScore,
            structuralElements,
            safetyIssues,
            weatherConditions
        } = analysisData;

        const result = await this.run(
            `INSERT INTO analysis_results 
       (image_id, progress_percentage, elements_detected, time_estimate_days, 
        confidence_score, structural_elements, safety_issues, weather_conditions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                imageId,
                progressPercentage,
                JSON.stringify(elementsDetected),
                timeEstimateDays,
                confidenceScore,
                JSON.stringify(structuralElements),
                JSON.stringify(safetyIssues),
                weatherConditions
            ]
        );
        return result.lastID;
    }

    async getAnalysisByImage(imageId) {
        await this.ensureReady();
        const result = await this.get('SELECT * FROM analysis_results WHERE image_id = ? ORDER BY analyzed_at DESC LIMIT 1', [imageId]);
        if (result) {
            result.elements_detected = JSON.parse(result.elements_detected || '[]');
            result.structural_elements = JSON.parse(result.structural_elements || '{}');
            result.safety_issues = JSON.parse(result.safety_issues || '[]');
        }
        return result;
    }

    async getLatestAnalysisByProject(projectId) {
        await this.ensureReady();
        const query = `
      SELECT ar.*, i.file_path, i.upload_date 
      FROM analysis_results ar
      JOIN images i ON ar.image_id = i.id
      WHERE i.project_id = ?
      ORDER BY ar.analyzed_at DESC
      LIMIT 1
    `;
        const result = await this.get(query, [projectId]);
        if (result) {
            result.elements_detected = JSON.parse(result.elements_detected || '[]');
            result.structural_elements = JSON.parse(result.structural_elements || '{}');
            result.safety_issues = JSON.parse(result.safety_issues || '[]');
        }
        return result;
    }

    async deleteAnalysisByImage(imageId) {
        await this.ensureReady();
        await this.run('DELETE FROM analysis_results WHERE image_id = ?', [imageId]);
    }

    async deleteAnalysisByProject(projectId) {
        await this.ensureReady();
        // Delete analysis results for all images in the project
        await this.run(`
            DELETE FROM analysis_results 
            WHERE image_id IN (SELECT id FROM images WHERE project_id = ?)
        `, [projectId]);
    }

    // Progress history
    async addProgressHistory(projectId, date, progressPercentage, notes) {
        await this.ensureReady();
        const result = await this.run(
            'INSERT INTO progress_history (project_id, date, progress_percentage, notes) VALUES (?, ?, ?, ?)',
            [projectId, date, progressPercentage, notes]
        );
        return result.lastID;
    }

    async getProgressHistory(projectId) {
        await this.ensureReady();
        return await this.all(
            'SELECT * FROM progress_history WHERE project_id = ? ORDER BY date ASC',
            [projectId]
        );
    }

    async deleteProgressHistoryByProject(projectId) {
        await this.ensureReady();
        await this.run('DELETE FROM progress_history WHERE project_id = ?', [projectId]);
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

export default new Database();
