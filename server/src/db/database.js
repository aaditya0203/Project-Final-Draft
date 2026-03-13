import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

class Database {
    constructor() {
        this.pool = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        if (!connectionString) {
            console.warn('⚠️ DATABASE_URL not set. Running without a database connection.');
            return;
        }

        this.pool = new pg.Pool({
            connectionString: connectionString,
            ssl: { rejectUnauthorized: false }
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async ensureReady() {
        await this.initPromise;
        if (!this.pool) throw new Error('Database not initialized (missing DATABASE_URL)');
    }

    async query(sql, params = []) {
        await this.ensureReady();
        return await this.pool.query(sql, params);
    }

    // User operations
    async createUser(email, passwordHash, name, role = 'user') {
        const result = await this.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, passwordHash, name, role]
        );
        return result.rows[0].id;
    }

    async getUserByEmail(email) {
        const result = await this.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    async getUserById(id) {
        const result = await this.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    async saveResetToken(email, token, expiry) {
        await this.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [token, expiry, email]
        );
    }

    async getUserByResetToken(token) {
        const result = await this.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );
        return result.rows[0];
    }

    async updatePassword(userId, passwordHash) {
        await this.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [passwordHash, userId]
        );
    }

    // Project operations
    async createProject(userId, name, stage, location, description) {
        const result = await this.query(
            'INSERT INTO projects (user_id, name, stage, location, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, name, stage, location, description]
        );
        return result.rows[0].id;
    }

    async getProjectById(id) {
        const result = await this.query('SELECT * FROM projects WHERE id = $1', [id]);
        return result.rows[0];
    }

    async getProjectsByUser(userId, search = '') {
        let sql = 'SELECT * FROM projects WHERE user_id = $1';
        const params = [userId];

        if (search) {
            sql += ' AND (name ILIKE $2 OR location ILIKE $2 OR description ILIKE $2)';
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY updated_at DESC';
        const result = await this.query(sql, params);
        return result.rows;
    }

    async getAllProjects(search = '') {
        let sql = 'SELECT * FROM projects';
        const params = [];

        if (search) {
            sql += ' WHERE (name ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)';
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY updated_at DESC';
        const result = await this.query(sql, params);
        return result.rows;
    }

    async updateProject(id, updates) {
        const { name, stage, location, description } = updates;
        await this.query(
            'UPDATE projects SET name = $1, stage = $2, location = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [name, stage, location, description, id]
        );
    }

    async deleteProject(id) {
        await this.query('DELETE FROM projects WHERE id = $1', [id]);
    }

    // Image operations
    async createImage(projectId, filePath, fileName, fileSize) {
        const result = await this.query(
            'INSERT INTO images (project_id, file_path, file_name, file_size) VALUES ($1, $2, $3, $4) RETURNING id',
            [projectId, filePath, fileName, fileSize]
        );
        return result.rows[0].id;
    }

    async getImagesByProject(projectId) {
        const result = await this.query('SELECT * FROM images WHERE project_id = $1 ORDER BY upload_date DESC', [projectId]);
        return result.rows;
    }

    async getImageById(id) {
        const result = await this.query('SELECT * FROM images WHERE id = $1', [id]);
        return result.rows[0];
    }

    async deleteImage(id) {
        await this.query('DELETE FROM images WHERE id = $1', [id]);
    }

    async deleteImagesByProject(projectId) {
        await this.query('DELETE FROM images WHERE project_id = $1', [projectId]);
    }

    // Analysis operations
    async createAnalysis(imageId, analysisData) {
        const {
            progressPercentage,
            elementsDetected,
            timeEstimateDays,
            confidenceScore,
            structuralElements,
            safetyIssues,
            weatherConditions
        } = analysisData;

        const result = await this.query(
            `INSERT INTO analysis_results 
       (image_id, progress_percentage, elements_detected, time_estimate_days, 
        confidence_score, structural_elements, safety_issues, weather_conditions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
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
        return result.rows[0].id;
    }

    async getAnalysisByImage(imageId) {
        const result = await this.query('SELECT * FROM analysis_results WHERE image_id = $1 ORDER BY analyzed_at DESC LIMIT 1', [imageId]);
        const data = result.rows[0];
        if (data) {
            data.elements_detected = JSON.parse(data.elements_detected || '[]');
            data.structural_elements = JSON.parse(data.structural_elements || '{}');
            data.safety_issues = JSON.parse(data.safety_issues || '[]');
        }
        return data;
    }

    async getLatestAnalysisByProject(projectId) {
        const query = `
      SELECT ar.*, i.file_path, i.upload_date 
      FROM analysis_results ar
      JOIN images i ON ar.image_id = i.id
      WHERE i.project_id = $1
      ORDER BY ar.analyzed_at DESC
      LIMIT 1
    `;
        const result = await this.query(query, [projectId]);
        const data = result.rows[0];
        if (data) {
            data.elements_detected = JSON.parse(data.elements_detected || '[]');
            data.structural_elements = JSON.parse(data.structural_elements || '{}');
            data.safety_issues = JSON.parse(data.safety_issues || '[]');
        }
        return data;
    }

    async deleteAnalysisByImage(imageId) {
        await this.query('DELETE FROM analysis_results WHERE image_id = $1', [imageId]);
    }

    async deleteAnalysisByProject(projectId) {
        await this.query(`
            DELETE FROM analysis_results 
            WHERE image_id IN (SELECT id FROM images WHERE project_id = $1)
        `, [projectId]);
    }

    // Progress history
    async addProgressHistory(projectId, date, progressPercentage, notes) {
        const result = await this.query(
            'INSERT INTO progress_history (project_id, date, progress_percentage, notes) VALUES ($1, $2, $3, $4) RETURNING id',
            [projectId, date, progressPercentage, notes]
        );
        return result.rows[0].id;
    }

    async getProgressHistory(projectId) {
        const result = await this.query(
            'SELECT * FROM progress_history WHERE project_id = $1 ORDER BY date ASC',
            [projectId]
        );
        return result.rows;
    }

    async deleteProgressHistoryByProject(projectId) {
        await this.query('DELETE FROM progress_history WHERE project_id = $1', [projectId]);
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

export default new Database();
