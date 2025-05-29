export enum ChallengeType {
  BIAS_SWAP = 'bias_swap',
  LOGIC_PUZZLE = 'logic_puzzle',
  DATA_LITERACY = 'data_literacy',
  COUNTER_ARGUMENT = 'counter_argument',
  SYNTHESIS = 'synthesis',
  ETHICAL_DILEMMA = 'ethical_dilemma'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface Challenge {
  id: number;
  type: ChallengeType;
  difficulty: DifficultyLevel;
  title: string;
  description: string;
  instructions: string;
  content: ChallengeContent;
  correct_answer?: any;
  explanation?: string;
  skills_tested: string[];
  estimated_time_minutes: number;
  xp_reward: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChallengeContent {
  // For bias swap challenges
  articles?: Array<{
    id: string;
    title: string;
    content: string;
    source: string;
    bias_indicators?: string[];
  }>;
  
  // For logic puzzles and multiple choice
  question?: string;
  options?: Array<{
    id: string;
    text: string;
  }>;
  
  // For data literacy
  data?: {
    chart_type?: string;
    data_points?: any[];
    misleading_elements?: string[];
  };
  
  // For counter-argument and synthesis
  prompt?: string;
  reference_material?: string[];
  
  // For ethical dilemmas
  scenario?: string;
  stakeholders?: string[];
  considerations?: string[];
  
  // Additional fields from the original interface
  data_visualization?: string;
  additional_context?: any;
}

export interface ChallengeSubmission {
  id: number;
  user_id: number;
  challenge_id: number;
  started_at: Date;
  completed_at?: Date;
  answer: any;
  is_correct?: boolean;
  time_spent_seconds: number;
  xp_earned: number;
  feedback?: string;
  created_at: Date;
}

export interface UserChallengeStats {
  user_id: number;
  total_completed: number;
  total_correct: number;
  current_streak: number;
  longest_streak: number;
  last_challenge_date?: Date;
  difficulty_performance: {
    [key in DifficultyLevel]: {
      completed: number;
      correct: number;
      average_time_seconds: number;
    };
  };
  type_performance: {
    [key in ChallengeType]: {
      completed: number;
      correct: number;
      average_time_seconds: number;
    };
  };
}

export interface DailyChallengeSelection {
  user_id: number;
  selected_challenge_id: number;
  selection_date: Date;
  selection_reason: string; // e.g., "adaptive difficulty", "weak skill area", "random"
  difficulty_adjustment: number; // -1, 0, or 1 for adjustment from base difficulty
}

export interface ChallengeOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface UserResponse {
  id: number;
  user_id: number;
  challenge_id: number;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  attempts: number;
  interaction_data?: any;
  created_at: Date;
  updated_at: Date;
} 