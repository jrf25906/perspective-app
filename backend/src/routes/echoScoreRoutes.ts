import { Router } from 'express';
import { EchoScoreController } from '../controllers/echoScoreController';
import { authenticateToken } from '../middleware/auth';
import { authRequired } from '../middleware/authRequired';
import { validate, EchoScoreValidation } from '../validation';

const router = Router();

// All Echo Score routes require authentication
router.use(authenticateToken, authRequired);

// Calculate and update user's Echo Score
router.post('/calculate',
  validate({ body: EchoScoreValidation.calculateOptions }),
  EchoScoreController.calculateAndUpdate
);

// Get current Echo Score (quick calculation without saving)
router.get('/current', EchoScoreController.getCurrent);

// Get latest saved Echo Score with breakdown
router.get('/latest', EchoScoreController.getLatest);

// Get Echo Score history
router.get('/history',
  validate({ query: EchoScoreValidation.historyQuery }),
  EchoScoreController.getHistory
);

// Get Echo Score progress (daily/weekly)
router.get('/progress',
  validate({ query: EchoScoreValidation.progressQuery }),
  EchoScoreController.getProgress
);

export default router; 
