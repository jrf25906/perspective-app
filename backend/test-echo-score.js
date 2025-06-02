const axios = require('axios');

async function testEchoScoreEndpoints() {
  console.log('🧪 Testing Echo Score Endpoints...\n');
  
  try {
    // First login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Login successful\n');
    
    // Test echo score endpoint
    console.log('2️⃣ Testing /api/profile/echo-score...');
    const echoScoreResponse = await axios.get('http://localhost:3000/api/profile/echo-score', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const echoScore = echoScoreResponse.data;
    console.log('✅ Echo score retrieved\n');
    
    // Validate echo score structure
    console.log('📋 Echo Score Details:');
    console.log(`- ID: ${echoScore.id} (type: ${typeof echoScore.id})`);
    console.log(`- User ID: ${echoScore.userId} (type: ${typeof echoScore.userId})`);
    console.log(`- Total Score: ${echoScore.totalScore} (type: ${typeof echoScore.totalScore})`);
    console.log(`- Diversity Score: ${echoScore.diversityScore} (type: ${typeof echoScore.diversityScore})`);
    console.log(`- Accuracy Score: ${echoScore.accuracyScore} (type: ${typeof echoScore.accuracyScore})`);
    
    // Type validation
    console.log('\n📊 Type Validation:');
    const typeChecks = [
      { field: 'id', expected: 'number', actual: typeof echoScore.id },
      { field: 'userId', expected: 'number', actual: typeof echoScore.userId },
      { field: 'totalScore', expected: 'number', actual: typeof echoScore.totalScore },
      { field: 'diversityScore', expected: 'number', actual: typeof echoScore.diversityScore },
      { field: 'accuracyScore', expected: 'number', actual: typeof echoScore.accuracyScore },
      { field: 'switchSpeedScore', expected: 'number', actual: typeof echoScore.switchSpeedScore },
      { field: 'consistencyScore', expected: 'number', actual: typeof echoScore.consistencyScore },
      { field: 'improvementScore', expected: 'number', actual: typeof echoScore.improvementScore },
      { field: 'scoreDate', expected: 'string', actual: typeof echoScore.scoreDate },
      { field: 'createdAt', expected: 'string', actual: typeof echoScore.createdAt },
      { field: 'updatedAt', expected: 'string', actual: typeof echoScore.updatedAt },
    ];
    
    let allTypesCorrect = true;
    typeChecks.forEach(check => {
      const status = check.expected === check.actual ? '✅' : '❌';
      if (check.expected !== check.actual) allTypesCorrect = false;
      console.log(`  ${status} ${check.field}: expected ${check.expected}, got ${check.actual}`);
    });
    
    // Validate calculation details
    if (echoScore.calculationDetails) {
      console.log('\n📈 Calculation Details Validation:');
      const calcDetails = echoScore.calculationDetails;
      const calcChecks = [
        { field: 'articlesRead', value: calcDetails.articlesRead, type: typeof calcDetails.articlesRead },
        { field: 'perspectivesExplored', value: calcDetails.perspectivesExplored, type: typeof calcDetails.perspectivesExplored },
        { field: 'challengesCompleted', value: calcDetails.challengesCompleted, type: typeof calcDetails.challengesCompleted },
        { field: 'accurateAnswers', value: calcDetails.accurateAnswers, type: typeof calcDetails.accurateAnswers },
        { field: 'totalAnswers', value: calcDetails.totalAnswers, type: typeof calcDetails.totalAnswers },
        { field: 'averageTimeSpent', value: calcDetails.averageTimeSpent, type: typeof calcDetails.averageTimeSpent },
      ];
      
      calcChecks.forEach(check => {
        const status = check.type === 'number' ? '✅' : '❌';
        if (check.type !== 'number') allTypesCorrect = false;
        console.log(`  ${status} ${check.field}: ${check.value} (${check.type})`);
      });
    }
    
    // Test echo score history endpoint
    console.log('\n3️⃣ Testing /api/profile/echo-score/history...');
    const historyResponse = await axios.get('http://localhost:3000/api/profile/echo-score/history?days=30', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const history = historyResponse.data;
    console.log(`✅ History retrieved (${Array.isArray(history) ? history.length : 'NOT ARRAY'} records)\n`);
    
    // Validate history is array
    if (!Array.isArray(history)) {
      console.log('❌ History is not an array!');
      allTypesCorrect = false;
    } else {
      console.log('✅ History is an array');
      if (history.length > 0) {
        console.log('\n📋 First History Record:');
        const firstRecord = history[0];
        console.log(JSON.stringify(firstRecord, null, 2));
      }
    }
    
    console.log(`\n${allTypesCorrect ? '✅' : '❌'} All type validations ${allTypesCorrect ? 'passed' : 'failed'}`);
    
    // Full responses for debugging
    console.log('\n📦 Full Echo Score Response:');
    console.log(JSON.stringify(echoScore, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.validationError) {
      console.error('📋 Validation error:', error.response.data.error.validationError);
    }
  }
}

// Wait for server to be ready
console.log('⏳ Waiting for server...');
setTimeout(testEchoScoreEndpoints, 2000); 