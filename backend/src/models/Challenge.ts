export interface Challenge {
  id: number;
  type: ChallengeType;
  title: string;
  prompt: string;
  content: ChallengeContent;
  options?: ChallengeOption[];
  correct_answer?: string;
  explanation: string;
  difficulty_level: number;
  required_articles?: number[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ChallengeType = 
  | 'bias_swap' 
  | 'logic_puzzle' 
  | 'synthesis' 
  | 'data_literacy' 
  | 'moral_reasoning' 
  | 'fallacy_detection';

export interface ChallengeOption {
  id: string;
  text: string;
  explanation?: string;
}

import { NewsArticle } from './NewsArticle';

export interface ChallengeContent {
  articles?: NewsArticle[];
  scenario?: string;
  data_visualization?: string;
  additional_context?: any;
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