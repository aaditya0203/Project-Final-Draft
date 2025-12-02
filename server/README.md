# ConstructAI Server

Backend API for ConstructAI - AI-powered construction monitoring system.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Project Management**: Create and manage construction projects
- **Image Upload**: Upload construction site images
- **AI Analysis**: Automatic image analysis using TensorFlow.js
  - Object detection (workers, vehicles, equipment)
  - Progress percentage calculation
  - Time estimation
  - Safety issue detection
- **Progress Tracking**: Historical progress data
- **SQLite Database**: Lightweight, file-based database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run init-db
```

4. Start server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### Images
- `POST /api/images/upload` - Upload and analyze image
- `GET /api/images/project/:projectId` - Get all images for project
- `GET /api/images/:imageId/analysis` - Get analysis for image
- `GET /api/images/:imageId/file` - Get image file

### Health
- `GET /api/health` - Server health check

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: SQLite3
- **AI/ML**: TensorFlow.js + COCO-SSD
- **Image Processing**: Sharp
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── schema.sql       # Database schema
│   │   ├── init.js          # DB initialization
│   │   └── database.js      # DB wrapper class
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # File upload config
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── projects.js      # Project endpoints
│   │   └── images.js        # Image endpoints
│   ├── services/
│   │   └── imageAnalysis.js # AI analysis service
│   └── index.js             # Main server file
├── data/                    # SQLite database (auto-created)
├── uploads/                 # Uploaded images (auto-created)
├── package.json
└── .env
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_PATH` - Path to SQLite database file
- `UPLOAD_DIR` - Directory for uploaded images
- `NODE_ENV` - Environment (development/production)

## Development

The server uses ES modules (`"type": "module"` in package.json). All imports must use `.js` extensions.

### Adding New Features

1. Create route file in `src/routes/`
2. Import and use in `src/index.js`
3. Add database methods in `src/db/database.js` if needed
4. Update schema in `src/db/schema.sql` if needed

## Notes

- The AI model (COCO-SSD) is pre-trained for general object detection
- For production, consider training a custom model on construction-specific images
- Current progress calculation is heuristic-based; improve with historical data
- File storage is local; consider cloud storage (S3) for production
