/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { EchoScoreService } from '../services/echoScoreService';

export class EchoScoreController {
  /**
   * Calculate and update user's Echo Score
   */
  static async calculateAndUpdate(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const echoScore = await EchoScoreService.calculateAndSaveEchoScore(userId);

      res.status(200).json({
        message: 'Echo Score calculated and updated successfully',
        data: echoScore
      });
    } catch (error) {
      console.error('Error calculating Echo Score:', error);
      res.status(500).json({
        error: {
          code: 'ECHO_SCORE_CALCULATION_ERROR',
          message: 'Failed to calculate Echo Score',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get user's Echo Score history
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { days } = req.query;
      
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const history = await EchoScoreService.getEchoScoreHistory(
        userId,
        days ? parseInt(days as string) : undefined
      );

      res.status(200).json({
        data: history
      });
    } catch (error) {
      console.error('Error fetching Echo Score history:', error);
      res.status(500).json({
        error: {
          code: 'ECHO_SCORE_HISTORY_ERROR',
          message: 'Failed to fetch Echo Score history',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get user's latest Echo Score with breakdown
   */
  static async getLatest(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const latestScore = await EchoScoreService.getLatestEchoScore(userId);

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
    } catch (error) {
      console.error('Error fetching latest Echo Score:', error);
      res.status(500).json({
        error: {
          code: 'ECHO_SCORE_FETCH_ERROR',
          message: 'Failed to fetch latest Echo Score',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get user's Echo Score progress (daily/weekly)
   */
  static async getProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period } = req.query;
      
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

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

      const progress = await EchoScoreService.getScoreProgress(
        userId,
        (period as 'daily' | 'weekly') || 'daily'
      );

      res.status(200).json({
        data: progress
      });
    } catch (error) {
      console.error('Error fetching Echo Score progress:', error);
      res.status(500).json({
        error: {
          code: 'ECHO_SCORE_PROGRESS_ERROR',
          message: 'Failed to fetch Echo Score progress',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get current Echo Score (quick calculation without saving)
   */
  static async getCurrent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const currentScore = await EchoScoreService.calculateEchoScore(userId);

      res.status(200).json({
        data: currentScore
      });
    } catch (error) {
      console.error('Error calculating current Echo Score:', error);
      res.status(500).json({
        error: {
          code: 'ECHO_SCORE_CURRENT_ERROR',
          message: 'Failed to calculate current Echo Score',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
} 