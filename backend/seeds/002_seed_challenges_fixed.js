/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('challenges').del();
  
  // Insert challenges one by one to avoid batch insert issues
  const challenges = [
    // Bias Swap Challenges
    {
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
    },
    
    // Logic Puzzle Challenges
    {
      type: 'logic_puzzle',
      difficulty: 'beginner',
      title: 'Identify the Logical Fallacy',
      description: 'Can you spot the flaw in this argument?',
      instructions: 'Read the argument below and identify which logical fallacy is being used.',
      content: JSON.stringify({
        question: 'Senator Smith says we should increase funding for education. But how can we trust someone who was caught speeding last year? Clearly, their education proposal is flawed.',
        options: [
          { id: 'a', text: 'Straw man argument' },
          { id: 'b', text: 'Ad hominem attack' },
          { id: 'c', text: 'False dilemma' },
          { id: 'd', text: 'Slippery slope' }
        ]
      }),
      correct_answer: JSON.stringify('b'),
      explanation: 'This is an ad hominem attack - attacking the person making the argument rather than addressing the argument itself. The senator\'s traffic violation has no bearing on the validity of their education proposal.',
      skills_tested: JSON.stringify(['logical reasoning', 'fallacy detection', 'critical thinking']),
      estimated_time_minutes: 3,
      xp_reward: 30,
      is_active: true
    },
    
    {
      type: 'logic_puzzle',
      difficulty: 'intermediate',
      title: 'The Island of Truth and Lies',
      description: 'Classic logic puzzle about truth-tellers and liars',
      instructions: 'Use logical deduction to solve this puzzle.',
      content: JSON.stringify({
        scenario: 'You meet two islanders, A and B. A says: "We are both liars." What can you conclude?',
        options: [
          { id: 'a', text: 'A is the truth-teller and B is the liar' },
          { id: 'b', text: 'A is the liar and B is the truth-teller' },
          { id: 'c', text: 'Both are liars' },
          { id: 'd', text: 'Both are truth-tellers' }
        ]
      }),
      correct_answer: JSON.stringify('b'),
      explanation: 'If A were telling the truth, then both would be liars - but that would make A\'s statement false, creating a contradiction. Therefore, A must be lying, which means they are NOT both liars. Since A is a liar, B must be the truth-teller.',
      skills_tested: JSON.stringify(['logical reasoning', 'deductive reasoning', 'paradox resolution']),
      estimated_time_minutes: 5,
      xp_reward: 60,
      is_active: true
    },
    
    // Data Literacy Challenges
    {
      type: 'data_literacy',
      difficulty: 'beginner',
      title: 'Misleading Graphs',
      description: 'Identify how this graph might be misleading',
      instructions: 'Look at the bar graph below and identify what makes it potentially misleading.',
      content: JSON.stringify({
        question: 'A news article shows a bar graph comparing Company A ($100M profit) and Company B ($110M profit). The Y-axis starts at $95M instead of $0. What effect does this have?',
        graph_description: 'Bar graph with truncated Y-axis making 10% difference appear much larger',
        options: [
          { id: 'a', text: 'It makes the companies look equally profitable' },
          { id: 'b', text: 'It exaggerates the difference between the companies' },
          { id: 'c', text: 'It minimizes the difference between the companies' },
          { id: 'd', text: 'It has no effect on interpretation' }
        ],
        data: {
          chart_type: 'bar',
          misleading_elements: ['truncated_y_axis']
        }
      }),
      correct_answer: JSON.stringify('b'),
      explanation: 'By starting the Y-axis at $95M instead of $0, the graph makes a 10% difference look like Company B has more than double the profit of Company A. This is a common technique to exaggerate small differences.',
      skills_tested: JSON.stringify(['data visualization', 'statistical literacy', 'critical analysis']),
      estimated_time_minutes: 3,
      xp_reward: 40,
      is_active: true
    },
    
    // Counter-Argument Challenges
    {
      type: 'counter_argument',
      difficulty: 'intermediate',
      title: 'Social Media and Society',
      description: 'Construct a thoughtful counter-argument',
      instructions: 'Read the argument and provide a well-reasoned counter-argument that addresses the main points.',
      content: JSON.stringify({
        original_argument: 'Social media is destroying our society. It spreads misinformation, creates echo chambers, damages mental health, and reduces real human connection. We would be better off without it.',
        task: 'Write a counter-argument defending the value of social media. Address at least 3 of the points raised.',
        hints: [
          'Consider: global connectivity, democratization of information, small business opportunities, crisis communication, marginalized voices'
        ]
      }),
      correct_answer: JSON.stringify({
        keywords: ['connectivity', 'democratization', 'business', 'communication', 'voices', 'community', 'awareness', 'organizing', 'education'],
        minKeywords: 3
      }),
      explanation: 'Strong counter-arguments might include: enabling global connections, democratizing information access, providing platforms for marginalized voices, facilitating social movements, creating economic opportunities, and enabling rapid crisis communication.',
      skills_tested: JSON.stringify(['perspective-taking', 'argumentation', 'intellectual humility']),
      estimated_time_minutes: 10,
      xp_reward: 80,
      is_active: true
    },
    
    // Synthesis Challenges
    {
      type: 'synthesis',
      difficulty: 'advanced',
      title: 'Universal Basic Income Debate',
      description: 'Synthesize opposing viewpoints into a nuanced position',
      instructions: 'Read both arguments about UBI and create a synthesis that acknowledges valid points from both sides.',
      content: JSON.stringify({
        title: 'Should governments implement Universal Basic Income?',
        viewpoints: [
          'PRO-UBI: "UBI would eliminate poverty, provide economic security, enable innovation and entrepreneurship, and prepare society for automation-driven job losses."',
          'ANTI-UBI: "UBI discourages work, is too expensive, could fuel inflation, and doesn\'t address root causes of poverty like lack of education or healthcare."'
        ]
      }),
      correct_answer: JSON.stringify({
        keywords: ['pilot', 'testing', 'targeted', 'gradual', 'evidence', 'both sides', 'compromise', 'phased', 'evaluation'],
        minKeywords: 4
      }),
      explanation: 'A good synthesis might propose pilot programs to test UBI\'s effects, targeted implementation for specific groups, or a phased approach that addresses concerns from both sides while gathering evidence.',
      skills_tested: JSON.stringify(['synthesis', 'nuanced thinking', 'compromise', 'analytical writing']),
      estimated_time_minutes: 15,
      xp_reward: 100,
      is_active: true
    },
    
    // Ethical Dilemma Challenges
    {
      type: 'ethical_dilemma',
      difficulty: 'advanced',
      title: 'The Whistleblower\'s Dilemma',
      description: 'Navigate a complex ethical situation with no clear right answer',
      instructions: 'Consider all stakeholders and potential consequences in your response.',
      content: JSON.stringify({
        scenario: 'You work for a tech company and discover your team\'s AI product, which is about to launch, has a bias that disadvantages certain ethnic groups in loan applications. Your manager says fixing it would delay the launch by 6 months and could result in layoffs, possibly including yours. You have a family to support. What do you do?',
        stakeholders: ['You and your family', 'Affected ethnic groups', 'Your manager', 'Company shareholders', 'Future users', 'Your colleagues'],
        considerations: ['Personal integrity', 'Family security', 'Harm prevention', 'Loyalty', 'Legal obligations', 'Professional ethics']
      }),
      correct_answer: JSON.stringify({
        keywords: ['stakeholders', 'ethics', 'consequences', 'alternatives', 'documentation', 'escalation', 'protection', 'responsibility'],
        minKeywords: 3
      }),
      explanation: 'This dilemma involves weighing personal security against preventing harm to others. Good responses consider multiple stakeholders, explore alternatives (like anonymous reporting), and acknowledge the complexity of the situation.',
      skills_tested: JSON.stringify(['ethical reasoning', 'stakeholder analysis', 'moral complexity', 'decision-making']),
      estimated_time_minutes: 10,
      xp_reward: 90,
      is_active: true
    }
  ];
  
  // Insert challenges one by one
  for (const challenge of challenges) {
    try {
      await knex('challenges').insert(challenge);
      console.log(`✅ Inserted challenge: ${challenge.title}`);
    } catch (error) {
      console.error(`❌ Failed to insert challenge: ${challenge.title}`, error.message);
    }
  }
  
  console.log('Challenge seeding completed!');
};