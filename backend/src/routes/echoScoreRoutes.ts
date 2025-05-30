import { Router } from 'express';
import { EchoScoreController } from '../controllers/echoScoreController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All Echo Score routes require authentication
router.use(authenticateToken);

// Calculate and update user's Echo Score
router.post('/calculate', EchoScoreController.calculateAndUpdate);

// Get current Echo Score (quick calculation without saving)
router.get('/current', EchoScoreController.getCurrent);

// Get latest saved Echo Score with breakdown
router.get('/latest', EchoScoreController.getLatest);

// Get Echo Score history
router.get('/history', EchoScoreController.getHistory);

// Get Echo Score progress (daily/weekly)
router.get('/progress', EchoScoreController.getProgress);

export default router; 
