import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleSignIn);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
// Add /me alias for iOS compatibility
router.get('/me', authenticateToken, AuthController.getProfile);

// Token refresh endpoint - commented out until implemented
// router.post('/refresh', AuthController.refreshToken);

export default router; 
