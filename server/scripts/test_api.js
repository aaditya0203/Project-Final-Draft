
async function testApi() {
    const baseUrl = 'http://localhost:3001/api';
    console.log(`🧪 Testing API at: ${baseUrl}`);

    try {
        // 1. Health Check
        console.log('\n🏥 Testing Health Check...');
        const healthRes = await fetch(`${baseUrl}/health`);
        const healthData = await healthRes.json();
        console.log('Status:', healthRes.status);
        console.log('Response:', healthData);

        if (healthRes.status !== 200) throw new Error('Health check failed');

        // 2. Register
        const testUser = {
            email: `api_test_${Date.now()}@example.com`,
            password: 'password123',
            name: 'API Test User'
        };
        console.log('\n📝 Testing Registration...');
        console.log('Registering user:', testUser.email);

        const registerRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const registerData = await registerRes.json();
        console.log('Status:', registerRes.status);
        console.log('Response:', registerData);

        if (registerRes.status !== 201) throw new Error('Registration failed');

        // 3. Login
        console.log('\n🔑 Testing Login...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();
        console.log('Status:', loginRes.status);
        console.log('Response:', loginData);

        if (loginRes.status !== 200) throw new Error('Login failed');
        if (!loginData.token) throw new Error('No token received');

        console.log('\n✅ All API tests passed!');

    } catch (error) {
        console.error('\n❌ API Test failed:', error.message);
    }
}

testApi();
