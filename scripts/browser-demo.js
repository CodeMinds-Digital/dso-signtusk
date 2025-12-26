/**
 * Browser Demo Script for DocuSign Alternative
 * 
 * Run this script in your browser's developer console to create demo users
 * and test the application functionality.
 * 
 * Instructions:
 * 1. Open http://localhost:3000 in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to the Console tab
 * 4. Copy and paste this script
 * 5. Run: createDemoUsers()
 */

// Demo user configurations
const DEMO_USERS = [
    {
        name: 'Demo Admin',
        email: 'admin@demo.local',
        password: 'admin123',
        role: 'admin'
    },
    {
        name: 'Demo User',
        email: 'user@demo.local',
        password: 'user123',
        role: 'user'
    },
    {
        name: 'John Doe',
        email: 'john.doe@demo.local',
        password: 'johndoe123',
        role: 'user'
    }
];

// Utility function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(endpoint, options);
        const result = await response.json();

        console.log(`${method} ${endpoint}:`, response.status, result);
        return { success: response.ok, data: result, status: response.status };
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        return { success: false, error: error.message };
    }
}

// Create a single demo user
async function createDemoUser(userConfig) {
    console.log(`🔄 Creating user: ${userConfig.name} (${userConfig.email})`);

    // Try different possible registration endpoints
    const possibleEndpoints = [
        '/api/auth/register',
        '/api/auth/signup',
        '/api/users/register',
        '/api/register',
        '/signup'
    ];

    for (const endpoint of possibleEndpoints) {
        const result = await apiCall(endpoint, 'POST', userConfig);

        if (result.success) {
            console.log(`✅ User created successfully via ${endpoint}`);
            return result;
        } else if (result.status === 404) {
            continue; // Try next endpoint
        } else {
            console.log(`⚠️  Registration attempt via ${endpoint} failed:`, result);
            break;
        }
    }

    console.log(`❌ Failed to create user ${userConfig.email}`);
    return null;
}

// Test user login
async function testLogin(email, password) {
    console.log(`🔐 Testing login for: ${email}`);

    const possibleEndpoints = [
        '/api/auth/signin',
        '/api/auth/login',
        '/api/login',
        '/signin'
    ];

    for (const endpoint of possibleEndpoints) {
        const result = await apiCall(endpoint, 'POST', { email, password });

        if (result.success) {
            console.log(`✅ Login successful via ${endpoint}`);
            return result;
        } else if (result.status === 404) {
            continue;
        } else {
            console.log(`⚠️  Login attempt via ${endpoint} failed:`, result);
            break;
        }
    }

    console.log(`❌ Login failed for ${email}`);
    return null;
}

// Main demo function
async function createDemoUsers() {
    console.log('🚀 Starting browser-based demo setup...\n');

    // Check if we're on the right page
    if (!window.location.href.includes('localhost:3000')) {
        console.error('❌ Please run this script on http://localhost:3000');
        return;
    }

    console.log('✅ Running on correct domain');

    // Test API connectivity
    console.log('\n🔍 Testing API connectivity...');
    const healthCheck = await apiCall('/api/health');
    if (!healthCheck.success) {
        console.log('⚠️  Health check failed, but continuing...');
    }

    // Create demo users
    console.log('\n👥 Creating demo users...');
    const createdUsers = [];

    for (const userConfig of DEMO_USERS) {
        const result = await createDemoUser(userConfig);
        if (result) {
            createdUsers.push({ ...userConfig, result });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test logins
    console.log('\n🔐 Testing user logins...');
    for (const user of createdUsers) {
        await testLogin(user.email, user.password);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('🎉 BROWSER DEMO SETUP COMPLETE!');
    console.log('='.repeat(50));

    if (createdUsers.length > 0) {
        console.log('\n📋 Created Users:');
        createdUsers.forEach(user => {
            console.log(`👤 ${user.name}: ${user.email} / ${user.password}`);
        });

        console.log('\n🎯 Next Steps:');
        console.log('1. Try signing in with the credentials above');
        console.log('2. Navigate to /signin or use the sign-in form');
        console.log('3. Explore the application features');
    } else {
        console.log('\n⚠️  No users were created successfully.');
        console.log('This might mean:');
        console.log('• The API endpoints are different than expected');
        console.log('• Authentication is required for user creation');
        console.log('• The server has different registration requirements');
        console.log('\n💡 Try creating users manually through the UI instead.');
    }
}

// Test current authentication status
async function checkAuthStatus() {
    console.log('🔍 Checking authentication status...');

    const possibleEndpoints = [
        '/api/auth/me',
        '/api/user/me',
        '/api/me',
        '/me'
    ];

    for (const endpoint of possibleEndpoints) {
        const result = await apiCall(endpoint);
        if (result.success) {
            console.log('✅ Current user:', result.data);
            return result.data;
        }
    }

    console.log('ℹ️  No authenticated user found');
    return null;
}

// Explore available API endpoints
async function exploreAPI() {
    console.log('🔍 Exploring API endpoints...');

    const commonEndpoints = [
        '/api',
        '/api/health',
        '/api/auth',
        '/api/users',
        '/api/documents',
        '/api/templates',
        '/health'
    ];

    for (const endpoint of commonEndpoints) {
        const result = await apiCall(endpoint);
        if (result.success) {
            console.log(`✅ ${endpoint} - Available`);
        } else if (result.status === 404) {
            console.log(`❌ ${endpoint} - Not found`);
        } else {
            console.log(`⚠️  ${endpoint} - ${result.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// Helper functions available in console
window.demoHelpers = {
    createDemoUsers,
    checkAuthStatus,
    exploreAPI,
    testLogin,
    apiCall
};

console.log('🎭 DocuSign Alternative Browser Demo Loaded!');
console.log('📋 Available functions:');
console.log('• createDemoUsers() - Create demo user accounts');
console.log('• checkAuthStatus() - Check if you\'re logged in');
console.log('• exploreAPI() - Discover available API endpoints');
console.log('• testLogin(email, password) - Test user login');
console.log('');
console.log('🚀 Quick start: Run createDemoUsers() to begin!');