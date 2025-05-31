import db from '../db';
import { container, ServiceTokens } from '../di/container';
import { registerServices } from '../di/serviceRegistration';
import logger from '../utils/logger';
import { ChallengeType, DifficultyLevel } from '../models/Challenge';

// Initialize DI container
registerServices();
const adaptiveChallengeService = container.get(ServiceTokens.AdaptiveChallengeService);

async function testAdaptiveSystem() {
  logger.info('🧪 Testing Adaptive Challenge System\n');

  try {
    // Test with different user scenarios
    const testUsers = [
      { id: 1, name: 'New User', description: 'No challenge history' },
      { id: 2, name: 'High Performer', description: 'High success rate' },
      { id: 3, name: 'Struggling User', description: 'Low success rate' }
    ];

    for (const user of testUsers) {
      logger.info(`\n📊 Testing for ${user.name} (${user.description})`);
      logger.info('='.repeat(50));

      // Get adaptive challenge
      const challenge = await adaptiveChallengeService.getNextChallengeForUser(user.id);
      
      if (challenge) {
        logger.info(`✅ Selected Challenge:`);
        logger.info(`   - Title: ${challenge.title}`);
        logger.info(`   - Type: ${challenge.type}`);
        logger.info(`   - Difficulty: ${challenge.difficulty}`);
        logger.info(`   - XP Reward: ${challenge.xp_reward}`);
        logger.info(`   - Estimated Time: ${challenge.estimated_time_minutes} minutes`);
      } else {
        logger.info('❌ No challenge available');
      }

      // Get recommendations
      logger.info(`\n📚 Recommendations for ${user.name}:`);
      const recommendations = await adaptiveChallengeService.getAdaptiveChallengeRecommendations(user.id, 3);
      
      recommendations.forEach((rec, index) => {
        logger.info(`   ${index + 1}. ${rec.title} (${rec.type}, ${rec.difficulty})`);
      });

      // Analyze progress
      logger.info(`\n📈 Progress Analysis for ${user.name}:`);
      const progress = await adaptiveChallengeService.analyzeUserProgress(user.id);
      
      logger.info(`   - Progress Trend: ${progress.progressTrend}`);
      logger.info(`   - Strengths: ${progress.strengths.join(', ') || 'None identified yet'}`);
      logger.info(`   - Weaknesses: ${progress.weaknesses.join(', ') || 'None identified yet'}`);
      logger.info(`   - Recommended Focus: ${progress.recommendedFocus.join(', ') || 'Continue exploring'}`);
    }

    // Show selection reasoning
    logger.info('\n\n🔍 Selection Reasoning Example');
    logger.info('='.repeat(50));
    
    // Check the most recent selection
    const recentSelection = await db('daily_challenge_selections')
      .orderBy('created_at', 'desc')
      .first();
    
    if (recentSelection) {
      logger.info(`User ID: ${recentSelection.user_id}`);
      logger.info(`Challenge ID: ${recentSelection.selected_challenge_id}`);
      logger.info(`Reasons: ${recentSelection.selection_reason}`);
      logger.info(`Date: ${new Date(recentSelection.selection_date).toLocaleDateString()}`);
    }

  } catch (error) {
    logger.error('❌ Error testing adaptive system:', error);
  }
}

// Run the test
testAdaptiveSystem()
  .then(() => {
    logger.info('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }); 