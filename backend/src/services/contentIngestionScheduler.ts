import * as cron from 'node-cron';
import contentCurationService from './contentCurationService';
import Content from '../models/Content';
import db from '../db';

interface IngestionConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  topics: string[];
  maxArticlesPerRun: number;
  notifyOnError: boolean;
}

interface IngestionResult {
  timestamp: Date;
  ingested: number;
  failed: number;
  duplicates: number;
  duration: number; // in seconds
  error?: string;
}

class ContentIngestionScheduler {
  private scheduledTask: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastRunResult: IngestionResult | null = null;
  
  private config: IngestionConfig = {
    enabled: true,
    schedule: '0 */6 * * *', // Every 6 hours by default
    topics: ['politics', 'economy', 'technology', 'climate', 'healthcare', 'education'],
    maxArticlesPerRun: 100,
    notifyOnError: true,
  };

  /**
   * Initialize the scheduler with configuration
   */
  async initialize(customConfig?: Partial<IngestionConfig>): Promise<void> {
    // Merge custom config
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Load config from database if exists
    const savedConfig = await this.loadConfigFromDb();
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }

    console.log('Content Ingestion Scheduler initialized with config:', this.config);

    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start the scheduled ingestion
   */
  start(): void {
    if (this.scheduledTask) {
      console.log('Scheduler already running');
      return;
    }

    console.log(`Starting content ingestion scheduler with cron: ${this.config.schedule}`);
    
    this.scheduledTask = cron.schedule(this.config.schedule, async () => {
      await this.runIngestion();
    });

    console.log('Content ingestion scheduler started');
  }

  /**
   * Stop the scheduled ingestion
   */
  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      console.log('Content ingestion scheduler stopped');
    }
  }

  /**
   * Run ingestion manually
   */
  async runIngestion(topics?: string[]): Promise<IngestionResult> {
    if (this.isRunning) {
      console.log('Ingestion already in progress, skipping...');
      return {
        timestamp: new Date(),
        ingested: 0,
        failed: 0,
        duplicates: 0,
        duration: 0,
        error: 'Ingestion already in progress',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const topicsToIngest = topics || this.config.topics;

    console.log(`Starting content ingestion for topics: ${topicsToIngest.join(', ')}`);

    try {
      // Ensure we have active news sources
      const activeSources = await db('news_sources')
        .where('is_active', true)
        .count('* as count')
        .first();

      if (!activeSources || parseInt(activeSources.count as string) === 0) {
        throw new Error('No active news sources configured. Please add news sources first.');
      }

      // Run the batch ingestion
      const results = await contentCurationService.batchIngestFromSources(topicsToIngest);

      const duration = (Date.now() - startTime) / 1000;

      const result: IngestionResult = {
        timestamp: new Date(),
        ...results,
        duration,
      };

      // Log the result
      await this.logIngestionResult(result);
      this.lastRunResult = result;

      console.log(`Content ingestion completed: ${results.ingested} new articles, ${results.duplicates} duplicates, ${results.failed} failed`);

      // Run post-ingestion tasks
      await this.runPostIngestionTasks();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Content ingestion failed:', errorMessage);

      const result: IngestionResult = {
        timestamp: new Date(),
        ingested: 0,
        failed: 0,
        duplicates: 0,
        duration: (Date.now() - startTime) / 1000,
        error: errorMessage,
      };

      await this.logIngestionResult(result);
      this.lastRunResult = result;

      if (this.config.notifyOnError) {
        // In production, send notification (email, Slack, etc.)
        console.error('ALERT: Content ingestion failed!', errorMessage);
      }

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run tasks after successful ingestion
   */
  private async runPostIngestionTasks(): Promise<void> {
    try {
      // 1. Update trending topics cache
      await this.updateTrendingTopicsCache();

      // 2. Clean up old unverified content
      await this.cleanupOldContent();

      // 3. Update source credibility scores
      await this.updateSourceCredibility();

      // 4. Generate content statistics
      await this.generateContentStats();
    } catch (error) {
      console.error('Error in post-ingestion tasks:', error);
    }
  }

  /**
   * Update trending topics cache
   */
  private async updateTrendingTopicsCache(): Promise<void> {
    const trending = await Content.getTrendingTopics(1);
    // In production, cache this in Redis
    console.log('Updated trending topics:', trending.slice(0, 5).map(t => t.topic));
  }

  /**
   * Clean up old unverified content
   */
  private async cleanupOldContent(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await db('content')
      .where('is_verified', false)
      .where('created_at', '<', thirtyDaysAgo)
      .del();

    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old unverified articles`);
    }
  }

  /**
   * Update source credibility based on content performance
   */
  private async updateSourceCredibility(): Promise<void> {
    // Simple credibility update based on verification rate
    const sources = await db('news_sources')
      .select('news_sources.id', 'news_sources.name')
      .count('content.id as total_articles')
      .sum(db.raw('CASE WHEN content.is_verified THEN 1 ELSE 0 END') + ' as verified_articles')
      .leftJoin('content', 'news_sources.id', 'content.source_id')
      .where('news_sources.is_active', true)
      .groupBy('news_sources.id', 'news_sources.name');

    for (const source of sources) {
      const total = parseInt(source.total_articles as string) || 0;
      const verified = parseInt(source.verified_articles as string) || 0;
      
      if (total > 10) { // Only update if we have enough data
        const verificationRate = verified / total;
        const newCredibility = Math.round(verificationRate * 100);
        
        await db('news_sources')
          .where('id', source.id)
          .update({
            credibility_score: newCredibility,
            updated_at: new Date(),
          });
      }
    }
  }

  /**
   * Generate and store content statistics
   */
  private async generateContentStats(): Promise<void> {
    const stats = await contentCurationService.getContentStats();
    
    // Store stats in database for historical tracking
    await db('ingestion_stats').insert({
      timestamp: new Date(),
      total_articles: stats.total,
      articles_last_24h: stats.last24Hours,
      unverified_count: stats.unverified,
      stats_json: JSON.stringify(stats),
    });
  }

  /**
   * Log ingestion result to database
   */
  private async logIngestionResult(result: IngestionResult): Promise<void> {
    try {
      await db('ingestion_logs').insert({
        timestamp: result.timestamp,
        ingested: result.ingested,
        failed: result.failed,
        duplicates: result.duplicates,
        duration: result.duration,
        error: result.error,
        topics: JSON.stringify(this.config.topics),
      });
    } catch (error) {
      console.error('Failed to log ingestion result:', error);
    }
  }

  /**
   * Load configuration from database
   */
  private async loadConfigFromDb(): Promise<Partial<IngestionConfig> | null> {
    try {
      const config = await db('system_config')
        .where('key', 'ingestion_config')
        .first();
      
      return config ? JSON.parse(config.value) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save configuration to database
   */
  async saveConfig(config: Partial<IngestionConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    await db('system_config')
      .insert({
        key: 'ingestion_config',
        value: JSON.stringify(this.config),
        updated_at: new Date(),
      })
      .onConflict('key')
      .merge();

    // Restart scheduler if schedule changed
    if (config.schedule && this.scheduledTask) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get ingestion status and statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    isScheduled: boolean;
    config: IngestionConfig;
    lastRun: IngestionResult | null;
    nextRun: Date | null;
    recentRuns: IngestionResult[];
  }> {
    const recentRuns = await db('ingestion_logs')
      .orderBy('timestamp', 'desc')
      .limit(10);

    const nextRun = this.scheduledTask ? this.getNextRunTime() : null;

    return {
      isRunning: this.isRunning,
      isScheduled: !!this.scheduledTask,
      config: this.config,
      lastRun: this.lastRunResult,
      nextRun,
      recentRuns: recentRuns.map(run => ({
        timestamp: run.timestamp,
        ingested: run.ingested,
        failed: run.failed,
        duplicates: run.duplicates,
        duration: run.duration,
        error: run.error,
      })),
    };
  }

  /**
   * Calculate next run time based on cron expression
   */
  private getNextRunTime(): Date | null {
    // This is a simplified implementation
    // In production, use a cron parser library
    const now = new Date();
    const parts = this.config.schedule.split(' ');
    
    if (parts[1] === '*/6') { // Every 6 hours
      const nextRun = new Date(now);
      nextRun.setHours(Math.ceil(now.getHours() / 6) * 6, 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 6);
      }
      return nextRun;
    }
    
    return null;
  }
}

export default new ContentIngestionScheduler(); 