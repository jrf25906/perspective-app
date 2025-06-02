/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Delete existing challenges
  await knex('challenges').del();
  
  try {
    // Insert just the first challenge
    await knex('challenges').insert({
      type: 'bias_swap',
      difficulty: 'beginner',
      title: 'Climate Change Coverage',
      description: 'Compare how different news sources cover climate change policy',
      instructions: 'Read the two articles below and identify bias indicators in each. Select all phrases or techniques that show bias.',
      content: JSON.stringify({
        articles: [
          {
            id: 'article1',
            title: 'New Climate Regulations Threaten Economic Growth',
            content: 'The administration\'s latest climate proposals could cost millions of jobs and burden families with higher energy costs. Critics warn that these rushed policies ignore economic realities...',
            source: 'Conservative Daily',
            bias_indicators: ['threaten', 'burden families', 'rushed policies', 'ignore economic realities']
          },
          {
            id: 'article2',
            title: 'Historic Climate Action Promises Green Jobs Boom',
            content: 'In a landmark move for environmental justice, new climate policies are set to create thousands of sustainable jobs while protecting vulnerable communities from pollution...',
            source: 'Progressive Tribune',
            bias_indicators: ['historic', 'landmark move', 'environmental justice', 'protecting vulnerable communities']
          }
        ]
      }),
      correct_answer: JSON.stringify(['threaten', 'burden families', 'rushed policies', 'historic', 'landmark move', 'environmental justice']),
      explanation: 'Both articles use loaded language to frame the climate policy. The first uses fear-based language (threaten, burden), while the second uses aspirational language (historic, landmark).',
      skills_tested: JSON.stringify(['bias detection', 'media literacy', 'critical reading']),
      estimated_time_minutes: 5,
      xp_reward: 50,
      is_active: true
    });
    
    console.log('First challenge inserted successfully');
  } catch (error) {
    console.error('Error inserting challenge:', error.message);
    throw error;
  }
};