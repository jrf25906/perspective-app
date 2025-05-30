import { Router } from "express";
import { ProfileController } from "../controllers/profileController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// Profile CRUD operations
router.get("/", ProfileController.getProfile);
router.put("/", ProfileController.updateProfile);

// Profile-specific endpoints
router.get("/echo-score", ProfileController.getEchoScore);
router.get("/stats", ProfileController.getProfileStats);
router.post("/avatar", ProfileController.uploadAvatar);

export default router;
