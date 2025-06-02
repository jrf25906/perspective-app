const axios = require('axios');

async function testChallengeOptions() {
  console.log('🧪 Testing Challenge Options Transformation...\n');
  
  try {
    // First login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Login successful\n');
    
    // Get today's challenge
    console.log('2️⃣ Getting today\'s challenge...');
    const challengeResponse = await axios.get('http://localhost:3000/api/challenge/today', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const challenge = challengeResponse.data;
    console.log('✅ Challenge retrieved\n');
    
    // Validate challenge structure
    console.log('📋 Challenge Details:');
    console.log(`- ID: ${challenge.id}`);
    console.log(`- Type: ${challenge.type}`);
    console.log(`- Title: ${challenge.title}`);
    console.log(`- Has options: ${challenge.options ? 'Yes' : 'No'}`);
    
    if (challenge.options && Array.isArray(challenge.options)) {
      console.log(`\n📝 Options (${challenge.options.length} total):`);
      
      let allOptionsValid = true;
      
      challenge.options.forEach((option, index) => {
        console.log(`\nOption ${index + 1}:`);
        console.log(`  - ID: ${option.id}`);
        console.log(`  - Text: ${option.text}`);
        console.log(`  - isCorrect type: ${typeof option.isCorrect}`);
        console.log(`  - isCorrect value: ${option.isCorrect}`);
        console.log(`  - Has explanation: ${option.explanation ? 'Yes' : 'No'}`);
        
        // Validate option structure
        const issues = [];
        
        if (!option.id) issues.push('Missing ID');
        if (!option.text) issues.push('Missing text');
        if (typeof option.isCorrect !== 'boolean') {
          issues.push(`isCorrect is ${typeof option.isCorrect}, not boolean`);
          allOptionsValid = false;
        }
        
        if (issues.length > 0) {
          console.log(`  ❌ Issues: ${issues.join(', ')}`);
        } else {
          console.log(`  ✅ Valid option`);
        }
      });
      
      console.log(`\n${allOptionsValid ? '✅' : '❌'} All options have boolean isCorrect: ${allOptionsValid}`);
    } else {
      console.log('\n⚠️ Challenge has no options to validate');
    }
    
    // Check field types
    console.log('\n📊 Field Type Validation:');
    const typeChecks = [
      { field: 'id', expected: 'number', actual: typeof challenge.id },
      { field: 'type', expected: 'string', actual: typeof challenge.type },
      { field: 'difficultyLevel', expected: 'number', actual: typeof challenge.difficultyLevel },
      { field: 'isActive', expected: 'boolean', actual: typeof challenge.isActive },
      { field: 'createdAt', expected: 'string', actual: typeof challenge.createdAt },
      { field: 'updatedAt', expected: 'string', actual: typeof challenge.updatedAt }
    ];
    
    typeChecks.forEach(check => {
      const status = check.expected === check.actual ? '✅' : '❌';
      console.log(`  ${status} ${check.field}: expected ${check.expected}, got ${check.actual}`);
    });
    
    // Full response for debugging
    console.log('\n📦 Full Challenge Response:');
    console.log(JSON.stringify(challenge, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.validationError) {
      console.error('📋 Validation error:', error.response.data.error.validationError);
    }
  }
}

// Wait for server to be ready
console.log('⏳ Waiting for server...');
setTimeout(testChallengeOptions, 2000); 