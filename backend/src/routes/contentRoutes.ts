import { Router, Request, Response } from 'express';
import Content from '../models/Content';
import biasRatingService from '../services/biasRatingService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    
    const topics = await Content.getTrendingTopics(Number(days));
    
    res.json(topics.slice(0, Number(limit)));
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Content.findArticleById(Number(id));
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, bias, dateFrom, dateTo, sources } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const filters: any = {};
    
    if (bias) {
      filters.bias = Array.isArray(bias) ? bias : [bias];
    }
    
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }
    
    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }
    
    if (sources) {
      filters.sources = Array.isArray(sources) 
        ? sources.map(s => Number(s))
        : [Number(sources)];
    }
    
    const articles = await Content.searchArticles(q as string, filters);
    
    res.json(articles);
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

router.get('/topic/:topic', async (req: Request, res: Response) => {
  try {
    const { topic } = req.params;
    const { count = 3 } = req.query;
    
    const articles = await Content.getBalancedArticles(topic, Number(count));
    
    res.json({
      topic,
      articles,
      biasDistribution: biasRatingService.getBiasDistribution(articles),
    });
  } catch (error) {
    console.error('Error fetching articles by topic:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Authenticated routes
router.use(authenticateToken);

router.get('/feed', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date } = req.query;
    
    const feedDate = date ? new Date(date as string) : new Date();
    const feed = await Content.getDailyFeed(userId, feedDate);
    
    res.json(feed);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

router.get('/recommendations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topic, count = 6 } = req.query;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const recommendations = await biasRatingService.getBalancedRecommendations(
      userId,
      topic as string,
      Number(count)
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

router.post('/articles/:id/view', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    await Content.logContentView(userId, Number(id));
    
    res.json({ message: 'View logged successfully' });
  } catch (error) {
    console.error('Error logging view:', error);
    res.status(500).json({ error: 'Failed to log view' });
  }
});

router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { days = 30 } = req.query;
    
    const history = await Content.getUserContentHistory(userId, Number(days));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/bias-analysis', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { days = 30 } = req.query;
    
    const analysis = await biasRatingService.analyzeUserBias(userId, Number(days));
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing bias:', error);
    res.status(500).json({ error: 'Failed to analyze bias' });
  }
});

export default router; 