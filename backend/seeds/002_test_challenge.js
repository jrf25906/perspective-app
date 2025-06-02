/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Delete existing challenges
  await knex('challenges').del();
  
  // Insert a simple test challenge
  await knex('challenges').insert({
    type: 'bias_swap',
    difficulty: 'beginner',
    title: 'Test Challenge',
    description: 'A simple test challenge',
    instructions: 'Test instructions',
    content: JSON.stringify({ test: 'data' }),
    correct_answer: JSON.stringify(['answer']),
    explanation: 'Test explanation',
    skills_tested: JSON.stringify(['test']),
    estimated_time_minutes: 5,
    xp_reward: 50,
    is_active: true
  });
  
  console.log('Test challenge inserted successfully');
};