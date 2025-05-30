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
import { authRequired } from "../middleware/authRequired";

const router = Router();

// Protected routes (require authentication with automatic 401 response)
router.get("/today", authenticateToken, authRequired, getTodayChallenge);
router.get("/adaptive/next", authenticateToken, authRequired, getAdaptiveChallenge);
router.get("/adaptive/recommendations", authenticateToken, authRequired, getAdaptiveRecommendations);
router.get("/progress", authenticateToken, authRequired, getUserProgress);
router.get("/history", authenticateToken, authRequired, getChallengeHistory);
router.post("/:id/submit", authenticateToken, authRequired, submitChallenge);
router.get("/stats", authenticateToken, authRequired, getChallengeStats);

// Public routes
router.get("/leaderboard", getLeaderboard);

export default router;
