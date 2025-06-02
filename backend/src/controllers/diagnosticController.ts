import { Request, Response } from 'express';
import { DiagnosticService } from '../services/DiagnosticService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Get system diagnostic report
 * Only available in development environment for security
 */
export const getDiagnosticReport = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Diagnostics not available in production' });
    return;
  }
  
  const report = DiagnosticService.getReport();
  res.json(report);
});

/**
 * Get problematic endpoints
 */
export const getProblematicEndpoints = asyncHandler(async (req: Request, res: Response) => {
  const report = DiagnosticService.getReport();
  res.json({
    healthScore: report.healthScore,
    problematicEndpoints: report.problematicEndpoints,
    errorRate: report.errorRate
  });
});

/**
 * Reset diagnostic data
 */
export const resetDiagnostics = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Reset not allowed in production' });
    return;
  }
  
  DiagnosticService.reset();
  res.json({ message: 'Diagnostics reset successfully' });
}); 