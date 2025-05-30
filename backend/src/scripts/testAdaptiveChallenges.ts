import db from '../db';
import adaptiveChallengeService from '../services/adaptiveChallengeService';
import { ChallengeType, DifficultyLevel } from '../models/Challenge';

async function testAdaptiveSystem() {
  console.log('🧪 Testing Adaptive Challenge System\n');

  try {
    // Test with different user scenarios
    const testUsers = [
      { id: 1, name: 'New User', description: 'No challenge history' },
      { id: 2, name: 'High Performer', description: 'High success rate' },
      { id: 3, name: 'Struggling User', description: 'Low success rate' }
    ];

    for (const user of testUsers) {
      console.log(`\n📊 Testing for ${user.name} (${user.description})`);
      console.log('='.repeat(50));

      // Get adaptive challenge
      const challenge = await adaptiveChallengeService.getNextChallengeForUser(user.id);
      
      if (challenge) {
        console.log(`✅ Selected Challenge:`);
        console.log(`   - Title: ${challenge.title}`);
        console.log(`   - Type: ${challenge.type}`);
        console.log(`   - Difficulty: ${challenge.difficulty}`);
        console.log(`   - XP Reward: ${challenge.xp_reward}`);
        console.log(`   - Estimated Time: ${challenge.estimated_time_minutes} minutes`);
      } else {
        console.log('❌ No challenge available');
      }

      // Get recommendations
      console.log(`\n📚 Recommendations for ${user.name}:`);
      const recommendations = await adaptiveChallengeService.getAdaptiveChallengeRecommendations(user.id, 3);
      
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} (${rec.type}, ${rec.difficulty})`);
      });

      // Analyze progress
      console.log(`\n📈 Progress Analysis for ${user.name}:`);
      const progress = await adaptiveChallengeService.analyzeUserProgress(user.id);
      
      console.log(`   - Progress Trend: ${progress.progressTrend}`);
      console.log(`   - Ready for Advanced: ${progress.readyForAdvanced ? 'Yes' : 'No'}`);
      console.log(`   - Strengths: ${progress.strengths.join(', ') || 'None identified yet'}`);
      console.log(`   - Weaknesses: ${progress.weaknesses.join(', ') || 'None identified yet'}`);
      console.log(`   - Recommended Focus: ${progress.recommendedFocus.join(', ') || 'Continue exploring'}`);
    }

    // Show selection reasoning
    console.log('\n\n🔍 Selection Reasoning Example');
    console.log('='.repeat(50));
    
    // Check the most recent selection
    const recentSelection = await db('daily_challenge_selections')
      .orderBy('created_at', 'desc')
      .first();
    
    if (recentSelection) {
      console.log(`User ID: ${recentSelection.user_id}`);
      console.log(`Challenge ID: ${recentSelection.selected_challenge_id}`);
      console.log(`Reasons: ${recentSelection.selection_reason}`);
      console.log(`Date: ${new Date(recentSelection.selection_date).toLocaleDateString()}`);
    }

  } catch (error) {
    console.error('❌ Error testing adaptive system:', error);
  }
}

// Run the test
testAdaptiveSystem()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 