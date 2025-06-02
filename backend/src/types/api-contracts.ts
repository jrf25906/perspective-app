/**
 * API Contract Types
 * These interfaces MUST match the iOS models exactly to prevent runtime errors
 * Any changes here should be reflected in iOS models and vice versa
 */

// MARK: - Challenge Types

export interface ChallengeResponse {
  id: number;
  type: 'bias_swap' | 'logic_puzzle' | 'data_literacy' | 'counter_argument' | 'synthesis' | 'ethical_dilemma';
  title: string;
  prompt: string; // NOT description
  content: ChallengeContent;
  options: ChallengeOption[] | null;
  correctAnswer: string | null; // Always null for security
  explanation: string;
  difficultyLevel: number; // 1-4, NOT string
  requiredArticles: string[] | null;
  isActive: boolean;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  estimatedTimeMinutes: number;
}

export interface ChallengeContent {
  text: string | null;
  articles: NewsReference[] | null;
  visualization: DataVisualization | null;
  questions: string[] | null;
  additionalContext: any | null;
  question: string | null;
  prompt: string | null;
  referenceMaterial: string[] | null;
  scenario: string | null;
  stakeholders: string[] | null;
  considerations: string[] | null;
}

export interface NewsReference {
  title: string;
  source: string;
  url: string;
  summary: string;
  biasRating: number;
  publishedAt: string; // ISO8601
  biasIndicators?: string[] | null;
}

export interface ChallengeOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface DataVisualization {
  chartType: string;
  dataPoints: any[] | null;
  misleadingElements: string[] | null;
}

export interface ChallengeResultResponse {
  isCorrect: boolean;
  feedback: string;
  xpEarned: number;
  streakInfo: StreakInfo;
}

export interface StreakInfo {
  current: number;  // NOT currentStreak
  longest: number;  // NOT longestStreak
  isActive: boolean; // NOT streakMaintained
}

export interface ChallengeStatsResponse {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number; // Double/Float
  totalXpEarned: number;
  challengesByType: Record<string, number>;
  recentActivity: ChallengeActivity[]; // MUST NOT be empty
}

export interface ChallengeActivity {
  challengeId: number;
  type: string;
  isCorrect: boolean;
  completedAt: string; // ISO8601
}

export interface LeaderboardEntryResponse {
  id: number;
  username: string;
  avatarUrl: string | null; // TODO: Implement
  challengesCompleted: number;
  totalXp: number;
  correctAnswers: number;
}

// MARK: - User Types

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isActive: boolean | null;
  emailVerified: boolean | null;
  echoScore: number; // NOT string
  biasProfile: BiasProfile | null;
  preferredChallengeTime: string | null;
  currentStreak: number;
  lastActivityDate: string | null; // ISO8601
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  lastLoginAt: string | null; // ISO8601
  role: string | null;
  deletedAt: string | null; // ISO8601
  googleId: string | null;
}

export interface BiasProfile {
  initialAssessmentScore: number;
  politicalLean: number; // -3 to +3
  preferredSources: string[];
  blindSpots: string[];
  assessmentDate: string; // ISO8601
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// MARK: - Echo Score Types

export interface EchoScoreResponse {
  id: number;
  userId: number;
  totalScore: number;
  diversityScore: number;
  accuracyScore: number;
  switchSpeedScore: number;
  consistencyScore: number;
  improvementScore: number;
  calculationDetails: EchoScoreCalculationDetails;
  scoreDate: string; // ISO8601
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface EchoScoreCalculationDetails {
  articlesRead: number;
  perspectivesExplored: number;
  challengesCompleted: number;
  accurateAnswers: number;
  totalAnswers: number;
  averageTimeSpent: number;
}

// MARK: - Validation Helpers

export function validateChallengeResponse(data: any): data is ChallengeResponse {
  return (
    typeof data.id === 'number' &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.prompt === 'string' &&
    typeof data.content === 'object' &&
    typeof data.difficultyLevel === 'number' &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  );
}

export function validateAuthResponse(data: any): data is AuthResponse {
  return (
    typeof data.token === 'string' &&
    typeof data.user === 'object' &&
    typeof data.user.id === 'number' &&
    typeof data.user.email === 'string'
  );
}

// MARK: - Type Guards

export const isValidChallengeType = (type: string): type is ChallengeResponse['type'] => {
  return ['bias_swap', 'logic_puzzle', 'data_literacy', 'counter_argument', 'synthesis', 'ethical_dilemma'].includes(type);
};

export const isValidDifficultyLevel = (level: number): boolean => {
  return level >= 1 && level <= 4;
}; 