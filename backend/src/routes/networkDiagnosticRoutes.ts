import { Router } from 'express';
import {
  getClientDiagnostics,
  getCorsViolations,
  getIOSClients,
  testIOSConnectivity,
  clearDiagnostics
} from '../controllers/networkDiagnosticController';
import { authenticateToken } from '../middleware/auth';
import { authRequired } from '../middleware/authRequired';

const router = Router();

// Public diagnostic endpoints (no auth required for debugging)
router.get('/test-connectivity', testIOSConnectivity);
router.get('/cors-violations', getCorsViolations);
router.get('/ios-clients', getIOSClients);
router.get('/client/:identifier', getClientDiagnostics);

// Protected endpoints
router.use(authenticateToken);
router.use(authRequired);
router.delete('/clear', clearDiagnostics);

export default router; 