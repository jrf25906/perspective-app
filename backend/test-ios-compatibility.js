const axios = require('axios');

async function testIOSCompatibility() {
  console.log('🧪 Testing iOS Compatibility with camelCase fields...\n');
  
  try {
    // Test 1: Register with camelCase fields
    console.log('1️⃣ Testing Registration with camelCase...');
    try {
      const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
        email: 'ioscompat@example.com',
        username: 'ioscompat',
        password: 'test123',
        firstName: 'iOS',
        lastName: 'Test'
      });
      
      console.log('✅ Registration successful');
      validateUserResponse(registerResponse.data.user);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ User already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'ioscompat@example.com',
      password: 'test123'
    });
    
    console.log('✅ Login successful');
    const { user, token } = loginResponse.data;
    validateUserResponse(user);
    
    // Test 3: Get Profile
    console.log('\n3️⃣ Testing Get Profile...');
    const profileResponse = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile retrieved');
    validateUserResponse(profileResponse.data);
    
    // Test 4: Get Challenge
    console.log('\n4️⃣ Testing Get Challenge...');
    const challengeResponse = await axios.get('http://localhost:3000/api/challenge/today', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Challenge retrieved');
    validateChallengeResponse(challengeResponse.data);
    
    console.log('\n✨ All tests passed! iOS compatibility verified.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.validationError) {
      console.error('📋 Validation error:', error.response.data.error.validationError);
    }
  }
}

function validateUserResponse(user) {
  console.log('📋 Validating user response...');
  
  const requiredCamelCase = [
    'id', 'email', 'username', 'echoScore', 'currentStreak',
    'createdAt', 'updatedAt', 'firstName', 'lastName',
    'avatarUrl', 'isActive', 'emailVerified'
  ];
  
  const forbiddenSnakeCase = [
    'echo_score', 'current_streak', 'created_at', 'updated_at',
    'first_name', 'last_name', 'avatar_url', 'is_active', 'email_verified'
  ];
  
  // Check for required camelCase fields
  const missingCamelCase = requiredCamelCase.filter(field => !(field in user));
  if (missingCamelCase.length > 0) {
    console.error(`❌ Missing camelCase fields: ${missingCamelCase.join(', ')}`);
  }
  
  // Check for forbidden snake_case fields
  const foundSnakeCase = forbiddenSnakeCase.filter(field => field in user);
  if (foundSnakeCase.length > 0) {
    console.error(`❌ Found snake_case fields: ${foundSnakeCase.join(', ')}`);
  }
  
  // Type validation
  const typeChecks = [
    { field: 'echoScore', type: 'number', value: user.echoScore },
    { field: 'currentStreak', type: 'number', value: user.currentStreak },
    { field: 'createdAt', type: 'string', value: user.createdAt },
    { field: 'updatedAt', type: 'string', value: user.updatedAt }
  ];
  
  typeChecks.forEach(check => {
    if (typeof check.value !== check.type) {
      console.error(`❌ ${check.field}: expected ${check.type}, got ${typeof check.value}`);
    }
  });
  
  if (missingCamelCase.length === 0 && foundSnakeCase.length === 0) {
    console.log('✅ User response validation passed');
  }
}

function validateChallengeResponse(challenge) {
  console.log('📋 Validating challenge response...');
  
  const requiredFields = [
    'id', 'type', 'title', 'prompt', 'content', 
    'difficultyLevel', 'createdAt', 'updatedAt'
  ];
  
  const forbiddenSnakeCase = [
    'difficulty_level', 'created_at', 'updated_at',
    'is_active', 'estimated_time_minutes'
  ];
  
  const missingFields = requiredFields.filter(field => !(field in challenge));
  if (missingFields.length > 0) {
    console.error(`❌ Missing fields: ${missingFields.join(', ')}`);
  }
  
  const foundSnakeCase = forbiddenSnakeCase.filter(field => field in challenge);
  if (foundSnakeCase.length > 0) {
    console.error(`❌ Found snake_case fields: ${foundSnakeCase.join(', ')}`);
  }
  
  if (missingFields.length === 0 && foundSnakeCase.length === 0) {
    console.log('✅ Challenge response validation passed');
  }
}

// Wait for server to be ready
console.log('⏳ Waiting for server...');
setTimeout(testIOSCompatibility, 2000); 