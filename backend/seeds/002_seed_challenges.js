/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('challenges').del();
  
  // Insert challenge data
  await knex('challenges').insert([
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
      correct_answer: 'b',
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
      description: 'A classic logic puzzle about truth-tellers and liars',
      instructions: 'You meet two islanders. One always tells the truth, one always lies. Islander A says: "We are both liars." What can you conclude?',
      content: JSON.stringify({
        question: 'Based on Islander A\'s statement, which of the following must be true?',
        options: [
          { id: 'a', text: 'A is the truth-teller and B is the liar' },
          { id: 'b', text: 'A is the liar and B is the truth-teller' },
          { id: 'c', text: 'Both are liars' },
          { id: 'd', text: 'Both are truth-tellers' }
        ]
      }),
      correct_answer: 'b',
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
      title: 'Misleading Graph Detection',
      description: 'Can you spot what\'s wrong with this data visualization?',
      instructions: 'Examine the graph showing company profits. What makes this visualization misleading?',
      content: JSON.stringify({
        question: 'A bar chart shows Company A with $100M profit and Company B with $110M profit. The Y-axis starts at $95M instead of $0. What\'s the problem?',
        options: [
          { id: 'a', text: 'The colors are too similar' },
          { id: 'b', text: 'The truncated Y-axis exaggerates the difference between companies' },
          { id: 'c', text: 'The data is from different time periods' },
          { id: 'd', text: 'There\'s nothing wrong with the graph' }
        ],
        data: {
          chart_type: 'bar',
          misleading_elements: ['truncated_y_axis']
        }
      }),
      correct_answer: 'b',
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
      title: 'Steel Man the Opposition',
      description: 'Practice arguing the strongest version of an opposing view',
      instructions: 'You believe social media has been harmful to society. Now write the STRONGEST possible argument for why social media has been beneficial. Aim for at least 100 words.',
      content: JSON.stringify({
        prompt: 'Make the strongest case you can for why social media has been a net positive for society.',
        reference_material: [
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
      title: 'Bridging the Divide',
      description: 'Find common ground between opposing viewpoints',
      instructions: 'Read these two opposing views on universal basic income (UBI). Write a synthesis that acknowledges valid points from both sides and proposes a middle ground. Aim for 150+ words.',
      content: JSON.stringify({
        prompt: 'Synthesize these opposing views on Universal Basic Income',
        reference_material: [
          'PRO-UBI: "UBI provides economic security, enables innovation by allowing risk-taking, simplifies welfare systems, and prepares for automation-driven job losses."',
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
      difficulty: 'intermediate',
      title: 'The Whistleblower\'s Dilemma',
      description: 'Navigate a complex ethical situation with no clear right answer',
      instructions: 'Consider all stakeholders and ethical principles. What would you do and why? Explain your reasoning in 100+ words.',
      content: JSON.stringify({
        scenario: 'You work at a tech company and discover your team\'s AI product has a bias that discriminates against certain ethnic groups. Your manager knows but says fixing it would delay the launch and hurt quarterly earnings. The board doesn\'t know. You have a family to support and jobs in your field are scarce.',
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
  ]);
}; 