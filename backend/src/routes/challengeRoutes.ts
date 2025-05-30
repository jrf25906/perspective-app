import { Router } from "express";
import { 
  getTodayChallenge, 
  submitChallenge,
  getChallengeStats,
  getLeaderboard,
  getAdaptiveChallenge,
  getAdaptiveRecommendations,
  getUserProgress,
  getChallengeHistory
} from "../controllers/challengeController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protected routes (require authentication)
router.get("/today", authenticateToken, getTodayChallenge);
router.get("/adaptive/next", authenticateToken, getAdaptiveChallenge);
router.get("/adaptive/recommendations", authenticateToken, getAdaptiveRecommendations);
router.get("/progress", authenticateToken, getUserProgress);
router.get("/history", authenticateToken, getChallengeHistory);
router.post("/:id/submit", authenticateToken, submitChallenge);
router.get("/stats", authenticateToken, getChallengeStats);

// Public routes
router.get("/leaderboard", getLeaderboard);

export default router;
