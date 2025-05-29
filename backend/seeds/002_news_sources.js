/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('news_sources').del();
  
  // Insert seed entries
  await knex('news_sources').insert([
    // Far Left
    {
      name: 'The Nation',
      domain: 'thenation.com',
      bias_rating: 'far_left',
      credibility_score: 75,
      description: 'Progressive American magazine covering politics and culture',
      is_active: true
    },
    {
      name: 'Jacobin',
      domain: 'jacobinmag.com',
      bias_rating: 'far_left',
      credibility_score: 70,
      description: 'Socialist quarterly magazine',
      is_active: true
    },
    
    // Left
    {
      name: 'CNN',
      domain: 'cnn.com',
      bias_rating: 'left',
      credibility_score: 80,
      description: 'Cable News Network - Major news organization',
      logo_url: 'https://example.com/cnn-logo.png',
      is_active: true
    },
    {
      name: 'MSNBC',
      domain: 'msnbc.com',
      bias_rating: 'left',
      credibility_score: 75,
      description: 'American news-based pay television cable channel',
      is_active: true
    },
    {
      name: 'The New York Times',
      domain: 'nytimes.com',
      bias_rating: 'left',
      credibility_score: 90,
      description: 'American daily newspaper based in New York City',
      is_active: true
    },
    
    // Left Center
    {
      name: 'NPR',
      domain: 'npr.org',
      bias_rating: 'left_center',
      credibility_score: 95,
      description: 'National Public Radio',
      is_active: true
    },
    {
      name: 'BBC',
      domain: 'bbc.com',
      bias_rating: 'left_center',
      credibility_score: 95,
      description: 'British Broadcasting Corporation',
      is_active: true
    },
    {
      name: 'The Guardian',
      domain: 'theguardian.com',
      bias_rating: 'left_center',
      credibility_score: 85,
      description: 'British daily newspaper',
      is_active: true
    },
    
    // Center
    {
      name: 'Associated Press',
      domain: 'apnews.com',
      bias_rating: 'center',
      credibility_score: 98,
      description: 'American not-for-profit news agency',
      is_active: true
    },
    {
      name: 'Reuters',
      domain: 'reuters.com',
      bias_rating: 'center',
      credibility_score: 98,
      description: 'International news organization',
      is_active: true
    },
    {
      name: 'PBS NewsHour',
      domain: 'pbs.org',
      bias_rating: 'center',
      credibility_score: 95,
      description: 'American evening television news program',
      is_active: true
    },
    {
      name: 'The Hill',
      domain: 'thehill.com',
      bias_rating: 'center',
      credibility_score: 85,
      description: 'American newspaper and digital media company',
      is_active: true
    },
    
    // Right Center
    {
      name: 'The Wall Street Journal',
      domain: 'wsj.com',
      bias_rating: 'right_center',
      credibility_score: 90,
      description: 'American business-focused daily newspaper',
      is_active: true
    },
    {
      name: 'The Economist',
      domain: 'economist.com',
      bias_rating: 'right_center',
      credibility_score: 90,
      description: 'International weekly newspaper',
      is_active: true
    },
    {
      name: 'Financial Times',
      domain: 'ft.com',
      bias_rating: 'right_center',
      credibility_score: 90,
      description: 'International daily newspaper',
      is_active: true
    },
    
    // Right
    {
      name: 'Fox News',
      domain: 'foxnews.com',
      bias_rating: 'right',
      credibility_score: 75,
      description: 'American multinational conservative cable news',
      is_active: true
    },
    {
      name: 'The New York Post',
      domain: 'nypost.com',
      bias_rating: 'right',
      credibility_score: 70,
      description: 'American conservative daily tabloid newspaper',
      is_active: true
    },
    {
      name: 'The Daily Wire',
      domain: 'dailywire.com',
      bias_rating: 'right',
      credibility_score: 65,
      description: 'American conservative news website',
      is_active: true
    },
    
    // Far Right
    {
      name: 'Breitbart',
      domain: 'breitbart.com',
      bias_rating: 'far_right',
      credibility_score: 60,
      description: 'American far-right news and opinion website',
      is_active: true
    },
    {
      name: 'The Gateway Pundit',
      domain: 'thegatewaypundit.com',
      bias_rating: 'far_right',
      credibility_score: 50,
      description: 'American far-right news and opinion website',
      is_active: true
    }
  ]);
}; 