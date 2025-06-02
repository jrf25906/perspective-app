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
import { validate, NetworkDiagnosticValidation } from '../validation';

const router = Router();

// Public diagnostic endpoints (no auth required for debugging)
router.get('/test-connectivity',
  validate({ query: NetworkDiagnosticValidation.testConnectivityQuery }),
  testIOSConnectivity
);

router.get('/cors-violations',
  validate({ query: NetworkDiagnosticValidation.corsViolationsQuery }),
  getCorsViolations
);

router.get('/ios-clients',
  validate({ query: NetworkDiagnosticValidation.iosClientsQuery }),
  getIOSClients
);

router.get('/client/:identifier',
  validate({ params: NetworkDiagnosticValidation.clientIdentifierParam }),
  getClientDiagnostics
);

// Protected endpoints
router.use(authenticateToken);
router.use(authRequired);

router.delete('/clear',
  validate({ body: NetworkDiagnosticValidation.clearDiagnosticsBody }),
  clearDiagnostics
);

export default router; 