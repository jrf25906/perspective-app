import { Router } from "express";
import { ProfileController } from "../controllers/profileController";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadSingleAvatar } from "../config/multerConfig";
import { validate, ProfileValidation, BaseSchemas } from "../validation";

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// Profile CRUD operations
router.get("/", asyncHandler(ProfileController.getProfile));

router.put("/",
  validate({ body: ProfileValidation.updateProfile }),
  asyncHandler(ProfileController.updateProfile)
);

// Profile-specific endpoints
router.get("/echo-score", asyncHandler(ProfileController.getEchoScore));

router.get("/echo-score/history",
  validate({ query: ProfileValidation.echoScoreHistory }),
  ProfileController.getEchoScoreHistory
);

router.get("/stats",
  validate({ query: ProfileValidation.profileStats }),
  asyncHandler(ProfileController.getProfileStats)
);

// Avatar endpoints
router.post("/avatar",
  uploadSingleAvatar,
  validate({ body: ProfileValidation.avatarMetadata }),
  asyncHandler(ProfileController.uploadAvatar)
);

router.delete("/avatar", asyncHandler(ProfileController.deleteAvatar));

export default router;
