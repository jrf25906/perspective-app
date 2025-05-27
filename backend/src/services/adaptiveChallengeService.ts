import { DailyChallenge } from "../models/dailyChallenge";

/**
 * Returns a challenge adapted to the user's profile.
 * Future: Fetch from DB, bias profile, challenge history, etc.
 */
export async function getNextChallengeForUser(userId: string): Promise<DailyChallenge> {
  // TODO: Implement adaptive challenge routing
  return {} as DailyChallenge;
}
