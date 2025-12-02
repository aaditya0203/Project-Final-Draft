const API_BASE_URL = 'http://localhost:3002/api';

class ApiClient {
    private token: string | null = null;

    constructor() {
        const stored = localStorage.getItem('auth_token');
        this.token = stored ? stored : null;
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        } as any;
        if (this.token) {
            (headers as any)['Authorization'] = `Bearer ${this.token}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Request failed: ${response.status} ${errText}`);
        }
        return response.json();
    }

    // Auth endpoints
    async register(email: string, password: string, name?: string, role?: string) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, role }),
        });
        if (data.token) this.setToken(data.token);
        return data;
    }

    async login(email: string, password: string, role?: string) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
        });
        if (data.token) this.setToken(data.token);
        return data;
    }

    async forgotPassword(email: string) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, newPassword: string) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    }

    // Project endpoints
    async createProject(projectData: { name: string; stage?: string; location?: string; description?: string }) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    }

    async getProjects() {
        return this.request('/projects');
    }

    // Get a single project by ID
    async getProject(projectId: string) {
        return this.request(`/projects/${projectId}`);
    }

    // Get images for a project with analysis
    async getProjectImages(projectId: string) {
        return this.request(`/images/project/${projectId}`);
    }


    async updateProject(projectId: string, updates: any) {
        return this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    // Image upload and analysis
    async uploadImage(projectId: string, imageFile: File, onProgress?: (progress: number) => void) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('projectId', projectId);
        const xhr = new XMLHttpRequest();
        return new Promise<any>((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const prog = (e.loaded / e.total) * 100;
                    onProgress(prog);
                }
            });
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.open('POST', `${API_BASE_URL}/images/upload`);
            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            xhr.send(formData);
        });
    }



    async getImageAnalysis(imageId: string) {
        return this.request(`/images/${imageId}/analysis`);
    }

    // Get AI prediction
    async getPrediction(features: number[]) {
        return this.request('/predict', {
            method: 'POST',
            body: JSON.stringify({ features }),
        });
    }

    // Delete an image
    async deleteImage(imageId: string) {
        return this.request(`/images/${imageId}`, {
            method: 'DELETE',
        });
    }

    // Delete a project
    async deleteProject(projectId: string) {
        return this.request(`/projects/${projectId}`, {
            method: 'DELETE',
        });
    }

    // Sign out
    async signOut() {
        return this.request('/signout', {
            method: 'POST',
        });
    }

    getImageUrl(imageId: string) {
        return `${API_BASE_URL}/images/${imageId}/file?token=${this.token}`;
    }
}

export default new ApiClient();
