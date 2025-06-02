const { ChallengeTransformService } = require('./dist/services/ChallengeTransformService');

console.log('🧪 Testing ChallengeTransformService with various option formats...\n');

// Test cases with different isCorrect formats
const testChallenges = [
  {
    name: 'Boolean isCorrect',
    challenge: {
      id: 1,
      type: 'logic_puzzle',
      title: 'Test Challenge 1',
      description: 'Test with boolean isCorrect',
      content: {
        text: 'Which is correct?',
        options: [
          { id: 'A', text: 'Option A', isCorrect: true },
          { id: 'B', text: 'Option B', isCorrect: false },
          { id: 'C', text: 'Option C', isCorrect: false },
          { id: 'D', text: 'Option D', isCorrect: false }
        ]
      },
      difficulty: 'beginner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  },
  {
    name: 'Number isCorrect (0/1)',
    challenge: {
      id: 2,
      type: 'bias_swap',
      title: 'Test Challenge 2',
      description: 'Test with number isCorrect',
      content: {
        text: 'Which is correct?',
        options: [
          { id: 'A', text: 'Option A', isCorrect: 0 },
          { id: 'B', text: 'Option B', isCorrect: 1 },
          { id: 'C', text: 'Option C', isCorrect: 0 },
          { id: 'D', text: 'Option D', isCorrect: 0 }
        ]
      },
      difficulty: 'intermediate',
      is_active: 1,
      created_at: '2025-06-02T01:00:00Z',
      updated_at: '2025-06-02T01:00:00Z'
    }
  },
  {
    name: 'String isCorrect ("true"/"false")',
    challenge: {
      id: 3,
      type: 'data_literacy',
      title: 'Test Challenge 3',
      description: 'Test with string isCorrect',
      content: JSON.stringify({
        text: 'Which is correct?',
        options: [
          { id: 'A', text: 'Option A', isCorrect: 'false' },
          { id: 'B', text: 'Option B', isCorrect: 'false' },
          { id: 'C', text: 'Option C', isCorrect: 'true' },
          { id: 'D', text: 'Option D', isCorrect: 'false' }
        ]
      }),
      difficulty: 'advanced',
      is_active: 'true',
      created_at: '2025-06-02',
      updated_at: '2025-06-02'
    }
  },
  {
    name: 'Mixed formats with snake_case',
    challenge: {
      id: 4,
      type: 'synthesis',
      title: 'Test Challenge 4',
      description: 'Test with snake_case is_correct',
      content: {
        text: 'Which is correct?',
        options: [
          { id: 'A', text: 'Option A', is_correct: '0' },
          { id: 'B', text: 'Option B', is_correct: '0' },
          { id: 'C', text: 'Option C', is_correct: '0' },
          { id: 'D', text: 'Option D', is_correct: '1' }
        ]
      },
      difficulty: 'expert',
      is_active: false,
      created_at: Date.now(),
      updated_at: Date.now()
    }
  }
];

// Test each challenge
testChallenges.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('━'.repeat(50));
  
  try {
    const transformed = ChallengeTransformService.transformChallengeForAPI(testCase.challenge);
    
    if (!transformed) {
      console.log('❌ Transformation returned null');
      return;
    }
    
    console.log(`✅ Transformation successful`);
    console.log(`📋 Challenge: ${transformed.title} (${transformed.type})`);
    console.log(`📊 Difficulty: ${transformed.difficultyLevel} (from "${testCase.challenge.difficulty}")`);
    console.log(`🔄 isActive: ${transformed.isActive} (from ${JSON.stringify(testCase.challenge.is_active)})`);
    
    if (transformed.options && Array.isArray(transformed.options)) {
      console.log(`\n📝 Options (${transformed.options.length}):`);
      transformed.options.forEach((opt, i) => {
        const original = testCase.challenge.content.options?.[i] || 
                        (typeof testCase.challenge.content === 'string' ? 
                          JSON.parse(testCase.challenge.content).options[i] : {});
        const originalIsCorrect = original.isCorrect || original.is_correct;
        
        console.log(`   ${opt.id}: "${opt.text}"`);
        console.log(`      isCorrect: ${opt.isCorrect} (${typeof opt.isCorrect})`);
        console.log(`      Original: ${JSON.stringify(originalIsCorrect)} (${typeof originalIsCorrect})`);
        
        if (typeof opt.isCorrect !== 'boolean') {
          console.log(`      ❌ NOT A BOOLEAN!`);
        } else {
          console.log(`      ✅ Properly converted to boolean`);
        }
      });
    } else {
      console.log('⚠️ No options in transformed challenge');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.error(error);
  }
});

console.log('\n\n✨ Test Summary:');
console.log('The ChallengeTransformService should convert all isCorrect values to booleans');
console.log('regardless of their original format (boolean, number, string, snake_case).\n'); 