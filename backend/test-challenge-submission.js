/**
 * Test script for challenge submission with various payload formats
 * Tests the enhanced RequestTransformService
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const TEST_TOKEN = 'test-token'; // Replace with actual token

// Test payloads representing different iOS submission formats
const testPayloads = [
  {
    name: 'Standard format with timeSpentSeconds',
    payload: {
      answer: 'b',
      timeSpentSeconds: 45
    }
  },
  {
    name: 'Missing timeSpentSeconds (main issue)',
    payload: {
      answer: 'b'
    }
  },
  {
    name: 'Alternative field name: timeSpent',
    payload: {
      answer: 'b',
      timeSpent: 60
    }
  },
  {
    name: 'Snake case: time_spent',
    payload: {
      answer: 'b',
      time_spent: 30
    }
  },
  {
    name: 'Wrapped in submission object',
    payload: {
      submission: {
        answer: 'b',
        timeSpentSeconds: 90
      }
    }
  },
  {
    name: 'AnyCodable wrapper from iOS',
    payload: {
      answer: { value: 'b' },
      timeSpent: 120
    }
  },
  {
    name: 'Alternative answer field: userAnswer',
    payload: {
      userAnswer: 'b',
      duration: 25
    }
  }
];

async function testSubmission(challengeId, testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Payload: ${JSON.stringify(testCase.payload)}`);
  
  try {
    const response = await axios.post(
      `${API_BASE}/challenge/${challengeId}/submit`,
      testCase.payload,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PerspectiveApp-iOS/1.0'
        }
      }
    );
    
    console.log(`   ✅ Success: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Challenge Submission Test Suite');
  console.log('==================================');
  
  const challengeId = 28; // From the logs
  let successCount = 0;
  let failureCount = 0;
  
  for (const testCase of testPayloads) {
    const success = await testSubmission(challengeId, testCase);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Success Rate: ${((successCount / testPayloads.length) * 100).toFixed(1)}%`);
}

// Check if server is running first
axios.get(`${API_BASE}/health`)
  .then(() => {
    console.log('✅ Server is running');
    return runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server first.');
    console.error('Run: npm run dev');
    process.exit(1);
  }); 