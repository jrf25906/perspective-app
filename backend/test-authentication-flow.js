const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  username: `testuser${Math.floor(Date.now() / 1000)}`, // Shorter username
  password: 'SuperSecure2024!WithRandomness#' + Math.random().toString(36).substr(2, 9),
  firstName: 'Test',
  lastName: 'User'
};

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to log requests
api.interceptors.request.use(request => {
  console.log(chalk.blue('\n📤 Request:'), request.method.toUpperCase(), request.url);
  if (request.data) {
    console.log(chalk.gray('Body:'), JSON.stringify(request.data, null, 2));
  }
  if (request.headers.Authorization) {
    console.log(chalk.gray('Auth:'), request.headers.Authorization.substring(0, 20) + '...');
  }
  return request;
});

// Response interceptor to log responses
api.interceptors.response.use(
  response => {
    console.log(chalk.green('✅ Response:'), response.status, response.statusText);
    console.log(chalk.gray('Headers:'), {
      'x-correlation-id': response.headers['x-correlation-id'],
      'content-type': response.headers['content-type']
    });
    console.log(chalk.gray('Data:'), JSON.stringify(response.data, null, 2));
    return response;
  },
  error => {
    if (error.response) {
      console.log(chalk.red('❌ Error Response:'), error.response.status, error.response.statusText);
      console.log(chalk.gray('Headers:'), {
        'x-correlation-id': error.response.headers['x-correlation-id'],
        'retry-after': error.response.headers['retry-after']
      });
      console.log(chalk.gray('Data:'), JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(chalk.red('❌ Network Error:'), error.message);
    }
    return Promise.reject(error);
  }
);

// Test functions
async function testHealthCheck() {
  console.log(chalk.yellow('\n🏥 Testing Health Check...'));
  try {
    const response = await api.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testRegistration() {
  console.log(chalk.yellow('\n📝 Testing User Registration...'));
  try {
    const response = await api.post('/auth/register', {
      email: TEST_USER.email,
      username: TEST_USER.username,
      password: TEST_USER.password
      // Omit firstName and lastName for now as they are optional
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testLogin(email, password) {
  console.log(chalk.yellow('\n🔐 Testing User Login...'));
  try {
    const response = await api.post('/auth/login', { email, password });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testInvalidLogin() {
  console.log(chalk.yellow('\n🚫 Testing Invalid Login...'));
  try {
    const response = await api.post('/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    return { success: false, error: 'Expected login to fail but it succeeded' };
  } catch (error) {
    // This is expected to fail
    return { success: true, error: error.response?.data };
  }
}

async function testProfile(token) {
  console.log(chalk.yellow('\n👤 Testing Get Profile...'));
  try {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testMissingToken() {
  console.log(chalk.yellow('\n🔒 Testing Missing Token...'));
  try {
    const response = await api.get('/auth/me');
    return { success: false, error: 'Expected request to fail but it succeeded' };
  } catch (error) {
    // This is expected to fail
    return { success: true, error: error.response?.data };
  }
}

// Main test runner
async function runTests() {
  console.log(chalk.bold.cyan('\n🧪 Running Authentication Tests\n'));
  console.log(chalk.gray(`Base URL: ${BASE_URL}`));
  console.log(chalk.gray(`Test User: ${TEST_USER.email}`));
  
  const results = [];
  
  // Test 1: Health Check
  const healthResult = await testHealthCheck();
  results.push({ name: 'Health Check', ...healthResult });
  
  // Test 2: Registration
  const registerResult = await testRegistration();
  results.push({ name: 'User Registration', ...registerResult });
  
  let authToken = null;
  if (registerResult.success && registerResult.data.token) {
    authToken = registerResult.data.token;
  }
  
  // Test 3: Login with correct credentials
  const loginResult = await testLogin(TEST_USER.email, TEST_USER.password);
  results.push({ name: 'Valid Login', ...loginResult });
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
  }
  
  // Test 4: Login with invalid credentials
  const invalidLoginResult = await testInvalidLogin();
  results.push({ name: 'Invalid Login Error Handling', ...invalidLoginResult });
  
  // Test 5: Get profile with token
  if (authToken) {
    const profileResult = await testProfile(authToken);
    results.push({ name: 'Get Profile', ...profileResult });
  }
  
  // Test 6: Get profile without token
  const missingTokenResult = await testMissingToken();
  results.push({ name: 'Missing Token Error Handling', ...missingTokenResult });
  
  // Summary
  console.log(chalk.bold.cyan('\n📊 Test Summary\n'));
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? chalk.green : chalk.red;
    console.log(`${icon} ${color(result.name)}`);
    if (!result.success && result.error) {
      console.log(chalk.gray(`   Error: ${JSON.stringify(result.error)}`));
    }
  });
  
  console.log(chalk.bold(`\nTotal: ${passed} passed, ${failed} failed`));
  
  // Check for proper error response format
  console.log(chalk.bold.cyan('\n🔍 Error Response Format Check\n'));
  const errorResponses = results.filter(r => !r.success || r.name.includes('Error Handling'));
  errorResponses.forEach(result => {
    if (result.error && result.error.error) {
      const hasCode = !!result.error.error.code;
      const hasMessage = !!result.error.error.message;
      const hasCorrelationId = !!result.error.error.correlationId;
      
      console.log(`${result.name}:`);
      console.log(`  ${hasCode ? '✅' : '❌'} Has error code: ${result.error.error.code || 'missing'}`);
      console.log(`  ${hasMessage ? '✅' : '❌'} Has error message: ${result.error.error.message || 'missing'}`);
      console.log(`  ${hasCorrelationId ? '✅' : '❌'} Has correlation ID: ${result.error.error.correlationId || 'missing'}`);
    }
  });
  
  return passed === results.length;
}

// Run tests
runTests()
  .then(allPassed => {
    if (allPassed) {
      console.log(chalk.bold.green('\n🎉 All tests passed!'));
      process.exit(0);
    } else {
      console.log(chalk.bold.red('\n❌ Some tests failed!'));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.bold.red('\n💥 Test runner error:'), error);
    process.exit(1);
  });