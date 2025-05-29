import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database
import db from './db';

// Import services (without auth for now)
import Content from './models/Content';
import Challenge from './models/Challenge';

// Import routes
import authRoutes from './routes/authRoutes';
import challengeRoutes from './routes/challengeRoutes';
import profileRoutes from './routes/profileRoutes';
import contentRoutes from './routes/contentRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Import enhanced middleware
import { authenticateApiKey, logActivity, userRateLimit } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Enhanced rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit for auth endpoints
  message: {
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Higher limit for API key authenticated requests
  message: {
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/password-reset', authLimiter);

// API key protected routes with higher rate limits
app.use('/api/external', apiKeyLimiter, authenticateApiKey);

// Logging with enhanced format
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // Only log errors in production
  }));
  
  // Access log for all requests in development
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
}

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and timing middleware
app.use((req: any, res: any, next: any) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check with enhanced information
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await db.raw('SELECT 1');
    
    res.status(200).json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Database test endpoint with enhanced information
app.get('/api/test/db', async (req, res) => {
  try {
    const result = await db.raw('SELECT COUNT(*) as count FROM news_sources');
    const usersCount = await db.raw('SELECT COUNT(*) as count FROM users');
    const articlesCount = await db.raw('SELECT COUNT(*) as count FROM content');
    
    res.json({
      message: 'Database connected successfully',
      statistics: {
        news_sources: result.rows[0].count,
        users: usersCount.rows[0].count,
        articles: articlesCount.rows[0].count,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced public content routes with activity logging
app.get('/api/content/trending', 
  logActivity('content.trending.view'),
  async (req: any, res: any) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const topics = await Content.getTrendingTopics(days);
      res.json({ 
        data: topics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: { 
          code: 'TRENDING_FETCH_FAILED', 
          message: 'Failed to fetch trending topics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

app.get('/api/content/balanced/:topic',
  logActivity('content.balanced.view'),
  async (req: any, res: any) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 3;
      const articles = await Content.getBalancedArticles(req.params.topic, count);
      res.json({ 
        data: articles,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: { 
          code: 'ARTICLES_FETCH_FAILED', 
          message: 'Failed to fetch balanced articles',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

app.get('/api/content/search',
  logActivity('content.search'),
  async (req: any, res: any) => {
    try {
      if (!req.query.q) {
        return res.status(400).json({
          error: { 
            code: 'MISSING_QUERY', 
            message: 'Search query is required',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      const articles = await Content.searchArticles(req.query.q as string);
      res.json({ 
        data: articles,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: { 
          code: 'SEARCH_FAILED', 
          message: 'Failed to search articles',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Sample challenges endpoint with enhanced data
app.get('/api/challenges/sample',
  logActivity('challenges.sample.view'),
  async (req: any, res: any) => {
    try {
      const challenges = await db('challenges')
        .where({ is_active: true })
        .limit(3)
        .select('id', 'type', 'difficulty', 'title', 'description', 'estimated_time_minutes', 'xp_reward');
      
      res.json({ 
        data: challenges,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: { 
          code: 'CHALLENGES_FETCH_FAILED', 
          message: 'Failed to fetch challenges',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// External API routes for third-party integrations
app.use('/api/external', (req: any, res: any, next: any) => {
  // Additional logging for external API usage
  console.log(`External API access: ${req.method} ${req.path} - API Key: ${req.apiKey}`);
  next();
});

// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRoutes);

// Maintenance mode middleware (can be enabled via environment variable)
app.use((req: any, res: any, next: any) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      error: {
        code: 'MAINTENANCE_MODE',
        message: 'The application is currently under maintenance. Please try again later.',
        estimatedResolution: process.env.MAINTENANCE_END_TIME || 'Unknown'
      }
    });
  }
  next();
});

// 404 handler with enhanced information
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
});

// Enhanced error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error(`[${req.headers['x-request-id']}] Error:`, error.stack);
  
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  // Don't expose sensitive error details in production
  const errorResponse: any = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }
  
  (res as any).status(status).json(errorResponse);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔒 Security: Enhanced middleware enabled`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📰 Content API: http://localhost:${PORT}/api/content/trending`);
    console.log(`🧩 Challenges: http://localhost:${PORT}/api/challenges/sample`);
    console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
    console.log(`⚡ Rate limiting: Enabled`);
    console.log(`📝 Activity logging: Enabled`);
  });
}

export default app;
