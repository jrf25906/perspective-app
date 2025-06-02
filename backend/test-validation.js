const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = null;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testValidation() {
  console.log(`${colors.blue}🧪 Testing Validation Middleware${colors.reset}\n`);

  // Test 1: Auth registration validation
  console.log(`${colors.yellow}1. Testing Registration Validation${colors.reset}`);
  
  // Invalid email
  try {
    await axios.post(`${API_URL}/auth/register`, {
      email: 'invalid-email',
      username: 'testuser',
      password: 'Test123!'
    });
    console.log(`${colors.red}❌ Should have failed with invalid email${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected invalid email${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  // Weak password
  try {
    await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      username: 'testuser',
      password: 'weak'
    });
    console.log(`${colors.red}❌ Should have failed with weak password${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected weak password${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  // Missing required field
  try {
    await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'Test123!'
      // Missing username
    });
    console.log(`${colors.red}❌ Should have failed with missing username${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected missing username${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  // Test 2: Login validation
  console.log(`\n${colors.yellow}2. Testing Login Validation${colors.reset}`);
  
  // Valid login to get token
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'jamesfarmer21@gmail.com',
      password: 'Test123!'
    });
    console.log(`${colors.green}✅ Valid login accepted${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Login failed: ${error.response?.data?.error || error.message}${colors.reset}`);
  }

  // Test 3: Content search validation
  console.log(`\n${colors.yellow}3. Testing Content Search Validation${colors.reset}`);
  
  // Query too short
  try {
    await axios.get(`${API_URL}/content/search?q=a`);
    console.log(`${colors.red}❌ Should have failed with short query${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected short search query${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  // Valid search
  try {
    const response = await axios.get(`${API_URL}/content/search?q=climate`);
    console.log(`${colors.green}✅ Valid search accepted${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Valid search failed: ${error.response?.data?.error || error.message}${colors.reset}`);
  }

  // Test 4: Challenge validation
  console.log(`\n${colors.yellow}4. Testing Challenge Submit Validation${colors.reset}`);
  
  // Get auth token first
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'jamesfarmer21@gmail.com',
      password: 'Test123!'
    });
    authToken = loginRes.data.accessToken;
  } catch (error) {
    console.log(`${colors.red}❌ Could not get auth token${colors.reset}`);
    return;
  }

  // Invalid challenge ID
  try {
    await axios.post(`${API_URL}/challenge/abc/submit`, 
      {
        answer: 'test',
        timeSpentSeconds: 30
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`${colors.red}❌ Should have failed with invalid ID${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected invalid challenge ID${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  // Missing required field
  try {
    await axios.post(`${API_URL}/challenge/1/submit`, 
      {
        answer: 'test'
        // Missing timeSpentSeconds
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`${colors.red}❌ Should have failed with missing timeSpentSeconds${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`${colors.green}✅ Correctly rejected missing timeSpentSeconds${colors.reset}`);
      console.log('   Error:', error.response.data.error);
    }
  }

  console.log(`\n${colors.blue}✨ Validation testing complete!${colors.reset}`);
}

// Run the tests
testValidation().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error.message);
  process.exit(1);
}); 