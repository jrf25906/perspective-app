import { Router } from "express";
import { getTodayChallenge, submitChallenge } from "../controllers/challengeController";
const router = Router();

router.get("/today", getTodayChallenge);
router.post("/:id/submit", submitChallenge);

export default router;