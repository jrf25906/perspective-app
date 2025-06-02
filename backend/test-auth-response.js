const axios = require('axios');

async function testAuthResponse() {
  console.log('🧪 Testing Auth Response Transformation...\n');
  
  try {
    // First, try to login with test credentials
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('✅ Login successful!\n');
    console.log('📦 Response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    const { user, token } = response.data;
    
    console.log('\n🔍 Validation Results:');
    console.log(`✓ Has token: ${!!token}`);
    console.log(`✓ Has user: ${!!user}`);
    
    // Check user fields
    if (user) {
      console.log(`\n👤 User Fields:`);
      console.log(`  id: ${typeof user.id} (${user.id})`);
      console.log(`  email: ${typeof user.email} (${user.email})`);
      console.log(`  username: ${typeof user.username} (${user.username})`);
      console.log(`  echoScore: ${typeof user.echoScore} (${user.echoScore})`);
      console.log(`  currentStreak: ${typeof user.currentStreak} (${user.currentStreak})`);
      console.log(`  createdAt: ${typeof user.createdAt} (${user.createdAt})`);
      console.log(`  updatedAt: ${typeof user.updatedAt} (${user.updatedAt})`);
      
      // Check for snake_case fields
      console.log(`\n🐍 Snake case check:`);
      const snakeCaseFields = ['echo_score', 'current_streak', 'created_at', 'updated_at'];
      const foundSnakeCase = snakeCaseFields.filter(field => field in user);
      
      if (foundSnakeCase.length > 0) {
        console.log(`  ❌ Found snake_case fields: ${foundSnakeCase.join(', ')}`);
      } else {
        console.log(`  ✅ No snake_case fields found`);
      }
      
      // Validate data types
      console.log(`\n📊 Type validation:`);
      const typeChecks = [
        { field: 'echoScore', expected: 'number', actual: typeof user.echoScore },
        { field: 'currentStreak', expected: 'number', actual: typeof user.currentStreak },
        { field: 'createdAt', expected: 'string', actual: typeof user.createdAt },
        { field: 'updatedAt', expected: 'string', actual: typeof user.updatedAt }
      ];
      
      typeChecks.forEach(check => {
        const status = check.expected === check.actual ? '✅' : '❌';
        console.log(`  ${status} ${check.field}: expected ${check.expected}, got ${check.actual}`);
      });
      
      // Check date format
      console.log(`\n📅 Date format check:`);
      const dateFields = ['createdAt', 'updatedAt', 'lastActivityDate'];
      dateFields.forEach(field => {
        if (user[field]) {
          const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(user[field]);
          console.log(`  ${isISO ? '✅' : '❌'} ${field}: ${user[field]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Test user might not exist. Create one with:');
      console.log('   POST /api/auth/register');
      console.log('   { email: "test@example.com", username: "testuser", password: "test123" }');
    }
  }
}

// Wait a bit for server to start
console.log('⏳ Waiting for server to start...');
setTimeout(testAuthResponse, 3000); 