import { Router, Request, Response, NextFunction } from 'express';
import { container, ServiceTokens } from '../di/container';
import logger from '../utils/logger';
import Content, { BiasRating, ContentType, INewsSource } from '../models/Content';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import db from '../db';
import { validate, AdminValidation } from '../validation';


// Get services from DI container
const getBiasRatingService = () => container.get(ServiceTokens.BiasRatingService);
const getContentCurationService = () => container.get(ServiceTokens.ContentCurationService);
const getNewsIntegrationService = () => container.get(ServiceTokens.NewsIntegrationService);
const getContentIngestionScheduler = () => container.get(ServiceTokens.ContentIngestionScheduler);

const router = Router();

// Create admin authorization middleware
const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // For now, we'll check if user has a specific role or ID
  // In production, you'd check against a user roles table
  if (!req.user || req.user.id !== 1) { // Assuming user ID 1 is admin
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeAdmin);

// News Sources Management
router.get('/sources',
  validate({ query: AdminValidation.getSourcesQuery }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bias, active, page = 1, limit = 20 } = req.query as any;
      
      let query = db('news_sources');
      
      if (bias) {
        query = query.where('bias_rating', bias);
      }
      
      if (active !== undefined) {
        query = query.where('is_active', active === 'true');
      }
      
      const offset = (Number(page) - 1) * Number(limit);
      const sources = await query
        .orderBy('name')
        .limit(Number(limit))
        .offset(offset);
      
      const total = await db('news_sources').count('* as count').first();
      
      res.json({
        sources,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(total?.count as string) || 0,
          pages: Math.ceil((parseInt(total?.count as string) || 0) / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching sources:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  }
);

router.post('/sources',
  validate({ body: AdminValidation.createSource }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, domain, bias_rating, credibility_score, description, logo_url } = req.body;
      
      // Check if source already exists
      const existing = await db('news_sources')
        .where('domain', domain)
        .first();
      
      if (existing) {
        return res.status(409).json({ error: 'Source with this domain already exists' });
      }
      
      const source = await Content.createSource({
        name,
        domain,
        bias_rating,
        credibility_score: credibility_score || 50,
        description,
        logo_url,
        is_active: true,
      });
      
      res.status(201).json(source);
    } catch (error) {
      logger.error('Error creating source:', error);
      res.status(500).json({ error: 'Failed to create source' });
    }
  }
);

router.put('/sources/:id',
  validate({ 
    params: AdminValidation.idParam,
    body: AdminValidation.updateSource
  }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [updated] = await db('news_sources')
        .where('id', id)
        .update({
          ...updates,
          updated_at: new Date(),
        })
        .returning('*');
      
      if (!updated) {
        return res.status(404).json({ error: 'Source not found' });
      }
      
      res.json(updated);
    } catch (error) {
      logger.error('Error updating source:', error);
      res.status(500).json({ error: 'Failed to update source' });
    }
  }
);

router.delete('/sources/:id',
  validate({ params: AdminValidation.idParam }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Soft delete by setting is_active to false
      const [updated] = await db('news_sources')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .returning('*');
      
      if (!updated) {
        return res.status(404).json({ error: 'Source not found' });
      }
      
      res.json({ message: 'Source deactivated successfully' });
    } catch (error) {
      logger.error('Error deleting source:', error);
      res.status(500).json({ error: 'Failed to delete source' });
    }
  }
);

// Content Management
router.get('/content',
  validate({ query: AdminValidation.getContentQuery }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        bias, 
        source_id, 
        verified, 
        active,
        topic,
        date_from,
        date_to,
        page = 1, 
        limit = 20 
      } = req.query as any;
      
      let query = db('content as c')
        .join('news_sources as ns', 'c.source_id', 'ns.id')
        .select('c.*', 'ns.name as source_name', 'ns.domain as source_domain');
      
      if (bias) {
        query = query.where('c.bias_rating', bias);
      }
      
      if (source_id) {
        query = query.where('c.source_id', source_id);
      }
      
      if (verified !== undefined) {
        query = query.where('c.is_verified', verified === 'true');
      }
      
      if (active !== undefined) {
        query = query.where('c.is_active', active === 'true');
      }
      
      if (topic) {
        query = query.whereRaw('? = ANY(c.topics)', [topic]);
      }
      
      if (date_from) {
        query = query.where('c.published_at', '>=', new Date(date_from as string));
      }
      
      if (date_to) {
        query = query.where('c.published_at', '<=', new Date(date_to as string));
      }
      
      const offset = (Number(page) - 1) * Number(limit);
      const content = await query
        .orderBy('c.published_at', 'desc')
        .limit(Number(limit))
        .offset(offset);
      
      const totalQuery = db('content').count('* as count');
      // Apply same filters for count
      if (bias) totalQuery.where('bias_rating', bias);
      if (source_id) totalQuery.where('source_id', source_id);
      if (verified !== undefined) totalQuery.where('is_verified', verified === 'true');
      if (active !== undefined) totalQuery.where('is_active', active === 'true');
      
      const total = await totalQuery.first();
      
      res.json({
        content,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(total?.count as string) || 0,
          pages: Math.ceil((parseInt(total?.count as string) || 0) / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  }
);

router.post('/content/ingest',
  validate({ body: AdminValidation.ingestContent }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topics } = req.body;
      
      const results = await getContentCurationService().batchIngestFromSources(topics);
      
      res.json({
        message: 'Content ingestion completed',
        results,
      });
    } catch (error) {
      logger.error('Error ingesting content:', error);
      res.status(500).json({ error: 'Failed to ingest content' });
    }
  }
);

router.put('/content/:id/verify',
  validate({ 
    params: AdminValidation.idParam,
    body: AdminValidation.verifyContent
  }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { verified = true } = req.body;
      
      await getContentCurationService().verifyContent(Number(id), verified);
      
      res.json({ message: 'Content verification status updated' });
    } catch (error) {
      logger.error('Error verifying content:', error);
      res.status(500).json({ error: 'Failed to verify content' });
    }
  }
);

router.post('/content/:id/moderate',
  validate({ 
    params: AdminValidation.idParam,
    body: AdminValidation.moderateContent
  }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      
      await Content.moderateContent(id, action, reason);
      
      res.json({ message: 'Content moderated successfully' });
    } catch (error) {
      logger.error('Error moderating content:', error);
      res.status(500).json({ error: 'Failed to moderate content' });
    }
  }
);

// Bias Analysis
router.get('/bias/ratings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ratings = getBiasRatingService().getAllBiasRatings();
    res.json(ratings);
  } catch (error) {
    logger.error('Error fetching bias ratings:', error);
    res.status(500).json({ error: 'Failed to fetch bias ratings' });
  }
});

router.get('/bias/analysis/:userId',
  validate({ 
    params: AdminValidation.userIdParam,
    query: AdminValidation.biasAnalysisQuery
  }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query as any;
      
      const analysis = await getBiasRatingService().analyzeUserBias(
        Number(userId), 
        Number(days)
      );
      
      res.json(analysis);
    } catch (error) {
      logger.error('Error analyzing user bias:', error);
      res.status(500).json({ error: 'Failed to analyze user bias' });
    }
  }
);

router.post('/bias/source-credibility/:sourceId',
  validate({ params: AdminValidation.sourceIdParam }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sourceId } = req.params;
      
      const credibilityScore = await getBiasRatingService().rateSourceCredibility(
        Number(sourceId)
      );
      
      res.json({ 
        sourceId: Number(sourceId), 
        credibilityScore 
      });
    } catch (error) {
      logger.error('Error rating source credibility:', error);
      res.status(500).json({ error: 'Failed to rate source credibility' });
    }
  }
);

// Statistics and Analytics
router.get('/stats/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      contentStats,
      sourcesCount,
      flaggedContent,
      trendingTopics,
    ] = await Promise.all([
      getContentCurationService().getContentStats(),
      Content.getTotalSourcesCount(),
      Content.getFlaggedContent(5),
      Content.getTrendingTopics(7),
    ]);
    
    res.json({
      content: contentStats,
      sources: {
        total: sourcesCount,
      },
      flaggedContent: flaggedContent.length,
      trendingTopics: trendingTopics.slice(0, 10),
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/stats/content-by-timeframe',
  validate({ query: AdminValidation.statsQuery }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = 'week' } = req.query as any;
      
      const count = await Content.getArticlesCountByTimeframe(timeframe as string);
      
      res.json({ 
        timeframe, 
        count 
      });
    } catch (error) {
      logger.error('Error fetching content by timeframe:', error);
      res.status(500).json({ error: 'Failed to fetch content statistics' });
    }
  }
);

// Content Curation
router.post('/curate/topic',
  validate({ body: AdminValidation.curateTopic }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topic, minBiasVariety, maxAge, minArticles } = req.body;
      
      const curatedContent = await getContentCurationService().curateContentForTopic(
        topic,
        { minBiasVariety, maxAge, minArticles }
      );
      
      res.json({
        topic,
        articles: curatedContent,
        biasDistribution: getBiasRatingService().getBiasDistribution(curatedContent),
        isBalanced: getBiasRatingService().isContentSetBalanced(curatedContent),
      });
    } catch (error) {
      logger.error('Error curating content:', error);
      res.status(500).json({ error: 'Failed to curate content' });
    }
  }
);

// Ingestion Scheduler Endpoints
router.get('/ingestion/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await getContentIngestionScheduler().getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting ingestion status:', error);
    res.status(500).json({ error: 'Failed to get ingestion status' });
  }
});

router.post('/ingestion/run',
  validate({ body: AdminValidation.runIngestion }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topics } = req.body;
      
      const result = await getContentIngestionScheduler().runIngestion(topics);
      
      res.json({
        message: 'Ingestion completed',
        result,
      });
    } catch (error) {
      logger.error('Error running ingestion:', error);
      res.status(500).json({ error: 'Failed to run ingestion' });
    }
  }
);

router.post('/ingestion/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    getContentIngestionScheduler().start();
    res.json({ message: 'Ingestion scheduler started' });
  } catch (error) {
    logger.error('Error starting scheduler:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

router.post('/ingestion/stop', async (req: AuthenticatedRequest, res: Response) => {
  try {
    getContentIngestionScheduler().stop();
    res.json({ message: 'Ingestion scheduler stopped' });
  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

router.put('/ingestion/config',
  validate({ body: AdminValidation.schedulerConfig }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = req.body;
      
      await getContentIngestionScheduler().saveConfig(config);
      
      res.json({ 
        message: 'Ingestion configuration updated',
        config: (await getContentIngestionScheduler().getStatus()).config,
      });
    } catch (error) {
      logger.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }
);

export default router; 
