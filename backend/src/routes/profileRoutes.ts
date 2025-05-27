import { Router } from "express";
import { getProfile, getEchoScore } from "../controllers/profileController";
const router = Router();

router.get("/", getProfile);
router.get("/echo-score", getEchoScore); // stub

export default router;