import { Router, Request, Response, NextFunction } from 'express';
import Content, { BiasRating, ContentType, INewsSource } from '../models/Content';
import contentCurationService from '../services/contentCurationService';
import biasRatingService from '../services/biasRatingService';
import newsIntegrationService from '../services/newsIntegrationService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import db from '../db';

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
router.get('/sources', async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

router.post('/sources', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, domain, bias_rating, credibility_score, description, logo_url } = req.body;
    
    // Validate required fields
    if (!name || !domain || !bias_rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
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
    console.error('Error creating source:', error);
    res.status(500).json({ error: 'Failed to create source' });
  }
});

router.put('/sources/:id', async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error updating source:', error);
    res.status(500).json({ error: 'Failed to update source' });
  }
});

router.delete('/sources/:id', async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error deleting source:', error);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

// Content Management
router.get('/content', async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.post('/content/ingest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topics } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics array is required' });
    }
    
    const results = await contentCurationService.batchIngestFromSources(topics);
    
    res.json({
      message: 'Content ingestion completed',
      results,
    });
  } catch (error) {
    console.error('Error ingesting content:', error);
    res.status(500).json({ error: 'Failed to ingest content' });
  }
});

router.put('/content/:id/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;
    
    await contentCurationService.verifyContent(Number(id), verified);
    
    res.json({ message: 'Content verification status updated' });
  } catch (error) {
    console.error('Error verifying content:', error);
    res.status(500).json({ error: 'Failed to verify content' });
  }
});

router.post('/content/:id/moderate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    
    if (!action || !reason) {
      return res.status(400).json({ error: 'Action and reason are required' });
    }
    
    await Content.moderateContent(id, action, reason);
    
    res.json({ message: 'Content moderated successfully' });
  } catch (error) {
    console.error('Error moderating content:', error);
    res.status(500).json({ error: 'Failed to moderate content' });
  }
});

// Bias Analysis
router.get('/bias/ratings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ratings = biasRatingService.getAllBiasRatings();
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching bias ratings:', error);
    res.status(500).json({ error: 'Failed to fetch bias ratings' });
  }
});

router.get('/bias/analysis/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query as any;
    
    const analysis = await biasRatingService.analyzeUserBias(
      Number(userId), 
      Number(days)
    );
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing user bias:', error);
    res.status(500).json({ error: 'Failed to analyze user bias' });
  }
});

router.post('/bias/source-credibility/:sourceId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceId } = req.params;
    
    const credibilityScore = await biasRatingService.rateSourceCredibility(
      Number(sourceId)
    );
    
    res.json({ 
      sourceId: Number(sourceId), 
      credibilityScore 
    });
  } catch (error) {
    console.error('Error rating source credibility:', error);
    res.status(500).json({ error: 'Failed to rate source credibility' });
  }
});

// Statistics and Analytics
router.get('/stats/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      contentStats,
      sourcesCount,
      flaggedContent,
      trendingTopics,
    ] = await Promise.all([
      contentCurationService.getContentStats(),
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
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/stats/content-by-timeframe', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeframe = 'week' } = req.query as any;
    
    const count = await Content.getArticlesCountByTimeframe(timeframe as string);
    
    res.json({ 
      timeframe, 
      count 
    });
  } catch (error) {
    console.error('Error fetching content by timeframe:', error);
    res.status(500).json({ error: 'Failed to fetch content statistics' });
  }
});

// Content Curation
router.post('/curate/topic', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, minBiasVariety, maxAge, minArticles } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const curatedContent = await contentCurationService.curateContentForTopic(
      topic,
      { minBiasVariety, maxAge, minArticles }
    );
    
    res.json({
      topic,
      articles: curatedContent,
      biasDistribution: biasRatingService.getBiasDistribution(curatedContent),
      isBalanced: biasRatingService.isContentSetBalanced(curatedContent),
    });
  } catch (error) {
    console.error('Error curating content:', error);
    res.status(500).json({ error: 'Failed to curate content' });
  }
});

export default router; 