import { Router } from "express";
import { ProfileController } from "../controllers/profileController";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// Profile CRUD operations
router.get("/", asyncHandler(ProfileController.getProfile));
router.put("/", asyncHandler(ProfileController.updateProfile));

// Profile-specific endpoints
router.get("/echo-score", asyncHandler(ProfileController.getEchoScore));
router.get("/echo-score/history", ProfileController.getEchoScoreHistory);
router.get("/stats", asyncHandler(ProfileController.getProfileStats));
router.post("/avatar", asyncHandler(ProfileController.uploadAvatar));

export default router;
