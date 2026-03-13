-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user', -- 'user' or 'contractor'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage TEXT,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    progress_percentage REAL,
    elements_detected TEXT, -- JSON string of detected elements
    time_estimate_days INTEGER,
    confidence_score REAL,
    structural_elements TEXT, -- JSON: columns, beams, walls counts
    safety_issues TEXT, -- JSON: detected safety concerns
    weather_conditions TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Progress history for tracking over time
CREATE TABLE IF NOT EXISTS progress_history (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    progress_percentage REAL,
    notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_images_project ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_image ON analysis_results(image_id);
CREATE INDEX IF NOT EXISTS idx_progress_project ON progress_history(project_id);
