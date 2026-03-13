import mongoose from 'mongoose';

// User Schema
const schemaOptions = { bufferCommands: false };

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    name: { type: String },
    role: { type: String, default: 'user' },
    reset_token: { type: String },
    reset_token_expiry: { type: Date },
    created_at: { type: Date, default: Date.now }
}, schemaOptions);

// Project Schema
const projectSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    stage: { type: String },
    location: { type: String },
    description: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, schemaOptions);

// Image Schema
const imageSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    file_path: { type: String, required: true },
    file_name: { type: String, required: true },
    file_size: { type: Number },
    upload_date: { type: Date, default: Date.now }
}, schemaOptions);

// Analysis Result Schema
const analysisSchema = new mongoose.Schema({
    image_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
    progress_percentage: { type: Number },
    elements_detected: { type: String }, // JSON string
    time_estimate_days: { type: Number },
    confidence_score: { type: Number },
    structural_elements: { type: String }, // JSON string
    safety_issues: { type: String }, // JSON string
    weather_conditions: { type: String },
    analyzed_at: { type: Date, default: Date.now }
}, schemaOptions);

// Progress History Schema
const progressHistorySchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: String, required: true },
    progress_percentage: { type: Number },
    notes: { type: String }
}, schemaOptions);

export const User = mongoose.model('User', userSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Image = mongoose.model('Image', imageSchema);
export const Analysis = mongoose.model('Analysis', analysisSchema);
export const ProgressHistory = mongoose.model('ProgressHistory', progressHistorySchema);
