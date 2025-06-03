#!/usr/bin/env node

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testScenario(name, config) {
  console.log(`\n${colors.bright}${colors.blue}Testing: ${name}${colors.reset}`);
  console.log('─'.repeat(50));
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${API_BASE}/auth/login`,
      data: config.data,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Verify expectations
    if (config.expectedStatus && response.status !== config.expectedStatus) {
      console.log(`${colors.red}❌ Expected status ${config.expectedStatus}, got ${response.status}${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Status code correct${colors.reset}`);
    }
    
    if (config.expectedError && response.data.error) {
      if (response.data.error.code === config.expectedError) {
        console.log(`${colors.green}✅ Error code correct: ${config.expectedError}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Expected error ${config.expectedError}, got ${response.data.error.code}${colors.reset}`);
      }
    }
    
    if (config.expectedSuccess && response.data.user) {
      console.log(`${colors.green}✅ Login successful, received user object${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}Network error: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log(`${colors.bright}Login Endpoint Test Suite${colors.reset}`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Invalid credentials',
      data: { email: 'test@example.com', password: 'wrongpassword' },
      expectedStatus: 401,
      expectedError: 'INVALID_CREDENTIALS'
    },
    {
      name: 'Missing password',
      data: { email: 'test@example.com' },
      expectedStatus: 400,
      expectedError: 'VALIDATION_ERROR'
    },
    {
      name: 'Missing email',
      data: { password: 'password123' },
      expectedStatus: 400,
      expectedError: 'VALIDATION_ERROR'
    },
    {
      name: 'Empty request body',
      data: {},
      expectedStatus: 400,
      expectedError: 'VALIDATION_ERROR'
    },
    {
      name: 'Invalid email format',
      data: { email: 'notanemail', password: 'password123' },
      expectedStatus: 400,
      expectedError: 'VALIDATION_ERROR'
    }
  ];
  
  // Check if rate limited first
  console.log(`\n${colors.yellow}Checking rate limit status...${colors.reset}`);
  const checkResponse = await axios({
    method: 'POST',
    url: `${API_BASE}/auth/login`,
    data: { email: 'ratelimit@check.com', password: 'check' },
    validateStatus: () => true
  });
  
  if (checkResponse.status === 429) {
    console.log(`${colors.red}⚠️  Currently rate limited!${colors.reset}`);
    console.log(`Retry-After: ${checkResponse.headers['retry-after'] || 'unknown'} seconds`);
    console.log('\nPlease wait for the rate limit to reset or adjust backend config:');
    console.log('- Edit backend/src/app-config/security.config.ts');
    console.log('- Change auth.max from 5 to 50 for testing');
    console.log('- Restart the backend');
    return;
  }
  
  // Run test scenarios
  for (const scenario of scenarios) {
    await testScenario(scenario.name, scenario);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${colors.bright}Test Summary${colors.reset}`);
  console.log('─'.repeat(50));
  console.log('All scenarios tested. Check the outputs above for results.');
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});