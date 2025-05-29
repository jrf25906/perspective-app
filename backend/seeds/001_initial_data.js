/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('content_views').del();
  await knex('challenge_submissions').del();
  await knex('content').del();
  await knex('news_sources').del();
  await knex('challenges').del();
  await knex('echo_scores').del();
  await knex('bias_profiles').del();
  await knex('email_verification_tokens').del();
  await knex('password_reset_tokens').del();
  await knex('users').del();

  // Insert news sources
  const newsSourceResults = await knex('news_sources').insert([
    {
      name: 'The New York Times',
      domain: 'nytimes.com',
      bias_rating: 'left_center',
      credibility_score: 85,
      description: 'American daily newspaper based in New York City',
      is_active: true
    },
    {
      name: 'The Wall Street Journal',
      domain: 'wsj.com',
      bias_rating: 'right_center',
      credibility_score: 85,
      description: 'American business-focused daily newspaper',
      is_active: true
    },
    {
      name: 'BBC News',
      domain: 'bbc.com',
      bias_rating: 'center',
      credibility_score: 90,
      description: 'British public service broadcaster',
      is_active: true
    },
    {
      name: 'Fox News',
      domain: 'foxnews.com',
      bias_rating: 'right',
      credibility_score: 65,
      description: 'American cable news channel',
      is_active: true
    },
    {
      name: 'CNN',
      domain: 'cnn.com',
      bias_rating: 'left',
      credibility_score: 70,
      description: 'American news channel',
      is_active: true
    },
    {
      name: 'Reuters',
      domain: 'reuters.com',
      bias_rating: 'center',
      credibility_score: 95,
      description: 'International news organization',
      is_active: true
    }
  ]).returning('id');

  // Extract IDs from returned objects
  const newsSourceIds = newsSourceResults.map(result => result.id);

  // Insert sample challenges
  await knex('challenges').insert([
    {
      type: 'bias_swap',
      difficulty: 'beginner',
      title: 'Climate Change Coverage Comparison',
      description: 'Compare how different news sources cover climate change policy',
      instructions: 'Read these three articles about the same climate policy announcement. Identify the key differences in framing, emphasis, and tone.',
      content: JSON.stringify({
        articles: [
          {
            id: '1',
            headline: 'Bold Climate Action: New Policy Sets Ambitious Goals',
            source: 'Progressive Daily',
            bias_rating: 'left',
            excerpt: 'The administration unveiled sweeping climate reforms today...',
            url: 'https://example.com/article1'
          },
          {
            id: '2',
            headline: 'Climate Policy Balances Environment and Economy',
            source: 'Centrist News',
            bias_rating: 'center',
            excerpt: 'New climate regulations announced today aim to reduce emissions...',
            url: 'https://example.com/article2'
          },
          {
            id: '3',
            headline: 'Costly Climate Rules Threaten Jobs, Growth',
            source: 'Conservative Tribune',
            bias_rating: 'right',
            excerpt: 'Critics warn that new environmental regulations could harm...',
            url: 'https://example.com/article3'
          }
        ],
        question: 'What are the main differences in how these sources frame the climate policy?'
      }),
      skills_tested: JSON.stringify(['bias recognition', 'framing analysis', 'perspective taking']),
      estimated_time_minutes: 10,
      xp_reward: 50,
      is_active: true
    },
    {
      type: 'logic_puzzle',
      difficulty: 'intermediate',
      title: 'Identify the Logical Fallacy',
      description: 'Spot the logical fallacy in political arguments',
      instructions: 'Read the following argument and identify which logical fallacy is being used.',
      content: JSON.stringify({
        scenario: 'A politician argues: "My opponent wants to increase funding for social programs. This is exactly what led to the fall of the Soviet Union. Do we really want to turn our country into a communist state?"',
        options: [
          'Slippery Slope',
          'Ad Hominem',
          'False Dilemma',
          'Straw Man'
        ]
      }),
      correct_answer: JSON.stringify('Slippery Slope'),
      explanation: 'This is a slippery slope fallacy because it suggests that increasing social program funding will inevitably lead to communism, without establishing a logical connection between these outcomes.',
      skills_tested: JSON.stringify(['logical reasoning', 'fallacy identification', 'critical thinking']),
      estimated_time_minutes: 5,
      xp_reward: 30,
      is_active: true
    },
    {
      type: 'synthesis',
      difficulty: 'advanced',
      title: 'Healthcare Policy Synthesis',
      description: 'Synthesize multiple perspectives on healthcare reform',
      instructions: 'After reading perspectives from across the political spectrum, write a brief synthesis that acknowledges the valid concerns from each side.',
      content: JSON.stringify({
        articles: [
          {
            id: '1',
            headline: 'Universal Healthcare: A Human Right',
            source: 'Progressive Voice',
            bias_rating: 'left',
            excerpt: 'Every citizen deserves access to quality healthcare regardless of income...',
            url: 'https://example.com/health1'
          },
          {
            id: '2',
            headline: 'Market-Based Solutions for Healthcare',
            source: 'Free Market Journal',
            bias_rating: 'right',
            excerpt: 'Competition and choice drive down costs and improve quality...',
            url: 'https://example.com/health2'
          }
        ],
        question: 'Write a 2-3 sentence synthesis that acknowledges valid points from both perspectives.'
      }),
      skills_tested: JSON.stringify(['synthesis', 'perspective integration', 'balanced analysis']),
      estimated_time_minutes: 15,
      xp_reward: 75,
      is_active: true
    }
  ]);

  // Insert sample content
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await knex('content').insert([
    {
      source_id: newsSourceIds[0], // NYT
      type: 'news_article',
      headline: 'Tech Giants Face New Privacy Regulations',
      excerpt: 'Congress considers sweeping new privacy laws that would limit data collection...',
      url: 'https://example.com/nyt-privacy',
      published_at: today,
      bias_rating: 'left_center',
      topics: ['technology', 'privacy', 'regulation'],
      keywords: ['privacy', 'tech', 'congress', 'data'],
      is_verified: true,
      is_active: true
    },
    {
      source_id: newsSourceIds[1], // WSJ
      type: 'news_article',
      headline: 'Privacy Rules Could Stifle Innovation, Industry Warns',
      excerpt: 'Business leaders express concern that proposed regulations may harm competitiveness...',
      url: 'https://example.com/wsj-privacy',
      published_at: today,
      bias_rating: 'right_center',
      topics: ['technology', 'privacy', 'business'],
      keywords: ['privacy', 'innovation', 'regulation', 'business'],
      is_verified: true,
      is_active: true
    },
    {
      source_id: newsSourceIds[2], // BBC
      type: 'news_article',
      headline: 'US Debates Balance Between Privacy and Innovation',
      excerpt: 'Lawmakers seek middle ground on data protection as tech industry voices concerns...',
      url: 'https://example.com/bbc-privacy',
      published_at: today,
      bias_rating: 'center',
      topics: ['technology', 'privacy', 'regulation'],
      keywords: ['privacy', 'technology', 'lawmakers', 'balance'],
      is_verified: true,
      is_active: true
    },
    {
      source_id: newsSourceIds[3], // Fox
      type: 'opinion',
      headline: 'Government Overreach: Privacy Laws Threaten Free Market',
      excerpt: 'New regulations represent dangerous expansion of government control over business...',
      url: 'https://example.com/fox-privacy',
      published_at: yesterday,
      bias_rating: 'right',
      topics: ['technology', 'privacy', 'government'],
      keywords: ['regulation', 'free market', 'government', 'overreach'],
      is_verified: true,
      is_active: true
    },
    {
      source_id: newsSourceIds[4], // CNN
      type: 'analysis',
      headline: 'Why Privacy Protection Is Essential in the Digital Age',
      excerpt: 'Experts argue that strong privacy laws are necessary to protect citizens...',
      url: 'https://example.com/cnn-privacy',
      published_at: yesterday,
      bias_rating: 'left',
      topics: ['technology', 'privacy', 'digital rights'],
      keywords: ['privacy', 'protection', 'digital', 'rights'],
      is_verified: true,
      is_active: true
    }
  ]);

  console.log('✅ Seed data inserted successfully');
}; 