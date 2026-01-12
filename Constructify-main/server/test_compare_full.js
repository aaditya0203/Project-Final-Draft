import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3002/api';
const TEST_EMAIL = `test_ssim_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';

async function register() {
    console.log('Registering user...');
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'SSIM Tester', role: 'client' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    console.log('Registered:', data.user.email);
    return data.token;
}

async function createProject(token) {
    console.log('Creating project...');
    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'SSIM Test Project', stage: 'Planning', location: 'Test Lab', description: 'Testing SSIM' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Project creation failed');
    console.log('Project created:', data.project.id);
    return data.project.id;
}

async function uploadImage(token, projectId, filePath) {
    console.log('Uploading image:', filePath);
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    form.append('projectId', projectId);

    const res = await fetch(`${API_BASE}/images/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    console.log('Image uploaded:', data.image.id);
    return data.image.id;
}

async function compare(token, image1Id, image2Id) {
    console.log(`Comparing images ${image1Id} and ${image2Id}...`);
    const res = await fetch(`${API_BASE}/images/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image1Id, image2Id })
    });
    const data = await res.json();
    if (!res.ok) {
        console.error('Compare failed:', data);
        throw new Error(data.error || 'Compare failed');
    }
    console.log('Compare result:', data);
}

(async () => {
    try {
        const token = await register();
        const projectId = await createProject(token);

        // Create dummy images
        const img1Path = 'test_img1.jpg';
        const img2Path = 'test_img2.jpg';
        // We need real image files. I'll assume some exist or create dummy text files (which might fail sharp)
        // Better to use existing files if possible.
        // I'll try to find some images in the system or create simple ones.
        // Since I can't easily create valid images, I will look for existing ones.
        // But I don't know where they are.
        // I'll try to use the uploaded image mentioned in metadata: C:/Users/jaisw/.gemini/antigravity/brain/66841088-b8dc-4ae0-bed2-3384b6092178/uploaded_image_1764759115363.png

        const existingImg = 'C:/Users/jaisw/.gemini/antigravity/brain/66841088-b8dc-4ae0-bed2-3384b6092178/uploaded_image_1764759115363.png';

        if (!fs.existsSync(existingImg)) {
            console.error('Test image not found:', existingImg);
            return;
        }

        const id1 = await uploadImage(token, projectId, existingImg);
        const id2 = await uploadImage(token, projectId, existingImg); // Upload same image twice

        await compare(token, id1, id2);

    } catch (error) {
        console.error('Test failed:', error);
    }
})();
