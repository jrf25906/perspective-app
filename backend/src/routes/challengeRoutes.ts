import { Router } from "express";
import { 
  getTodayChallenge, 
  submitChallenge,
  getChallengeStats,
  getLeaderboard
} from "../controllers/challengeController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protected routes (require authentication)
router.get("/today", authenticateToken, getTodayChallenge);
router.post("/:id/submit", authenticateToken, submitChallenge);
router.get("/stats", authenticateToken, getChallengeStats);

// Public routes
router.get("/leaderboard", getLeaderboard);

export default router;