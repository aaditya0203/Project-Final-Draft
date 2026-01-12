import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';
const token = ''; // will be set after login

async function login() {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password', role: 'client' })
    });
    const data = await res.json();
    console.log('Login response', data);
    return data.token;
}

async function getImages(projectId, token) {
    const res = await fetch(`${API_BASE}/images/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Images', data);
    return data.images;
}

async function compare(image1Id, image2Id, token) {
    const res = await fetch(`${API_BASE}/images/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image1Id, image2Id })
    });
    const data = await res.json();
    console.log('Compare result', data);
}

(async () => {
    const token = await login();
    // replace with a real project ID
    const projectId = 1;
    const images = await getImages(projectId, token);
    if (images.length >= 2) {
        await compare(images[0].id, images[1].id, token);
    } else {
        console.log('Not enough images to compare');
    }
})();
