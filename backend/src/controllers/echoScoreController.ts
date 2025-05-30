/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { IEchoScoreService } from '../services/echoScoreService';
import { getService } from '../di/serviceRegistration';
import { ServiceTokens } from '../di/container';
import { asyncHandler } from '../utils/asyncHandler';

// Get service from DI container
const getEchoScoreService = (): IEchoScoreService => getService(ServiceTokens.EchoScoreService);

export class EchoScoreController {
  /**
   * Calculate and update user's Echo Score
   */
  static calculateAndUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const echoScoreService = getEchoScoreService();
    const echoScore = await echoScoreService.calculateAndSaveEchoScore(userId);

    res.status(200).json({
      message: 'Echo Score calculated and updated successfully',
      data: echoScore
    });
  });

  /**
   * Get user's Echo Score history
   */
  static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { days } = req.query;
    
    const echoScoreService = getEchoScoreService();
    const history = await echoScoreService.getEchoScoreHistory(
      userId,
      days ? parseInt(days as string) : undefined
    );

    res.status(200).json({
      data: history
    });
  });

  /**
   * Get user's latest Echo Score with breakdown
   */
  static getLatest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const echoScoreService = getEchoScoreService();
    const latestScore = await echoScoreService.getLatestEchoScore(userId);

    if (!latestScore) {
      res.status(404).json({
        error: {
          code: 'NO_ECHO_SCORE',
          message: 'No Echo Score found for this user'
        }
      });
      return;
    }

    res.status(200).json({
      data: latestScore
    });
  });

  /**
   * Get user's Echo Score progress (daily/weekly)
   */
  static getProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { period } = req.query;
    
    // Validate period parameter
    if (period && period !== 'daily' && period !== 'weekly') {
      res.status(400).json({
        error: {
          code: 'INVALID_PERIOD',
          message: 'Period must be either "daily" or "weekly"'
        }
      });
      return;
    }

    const echoScoreService = getEchoScoreService();
    const progress = await echoScoreService.getScoreProgress(
      userId,
      (period as 'daily' | 'weekly') || 'daily'
    );

    res.status(200).json({
      data: progress
    });
  });

  /**
   * Get current Echo Score (quick calculation without saving)
   */
  static getCurrent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const echoScoreService = getEchoScoreService();
    const currentScore = await echoScoreService.calculateEchoScore(userId);

    res.status(200).json({
      data: currentScore
    });
  });
} 