export type ChallengeOption = {
  id: string;
  text: string;
};

export type DailyChallenge = {
  id: string;
  prompt: string;
  options: ChallengeOption[];
  correctOptionId: string;
  explanation?: string;
};
