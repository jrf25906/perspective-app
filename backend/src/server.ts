import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import requestLogger from './middleware/requestLogger';
import errorHandler from './middleware/errorHandler';

// Import routes that actually exist
import authRoutes from './routes/authRoutes';
import challengeRoutes from './routes/challengeRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import contentRoutes from './routes/contentRoutes';
import echoScoreRoutes from './routes/echoScoreRoutes';
import contentIngestionScheduler from './services/contentIngestionScheduler';

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

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/password-reset', authLimiter);

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
app.use(requestLogger);

// Health check with basic information
app.get('/health', async (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Initialize content ingestion scheduler
contentIngestionScheduler.initialize({
  enabled: process.env.ENABLE_AUTO_INGESTION === 'true',
  schedule: process.env.INGESTION_SCHEDULE || '0 */6 * * *', // Default: every 6 hours
}).then(() => {
  console.log('Content ingestion scheduler initialized');
}).catch(error => {
  console.error('Failed to initialize content ingestion scheduler:', error);
});

// Main API routes
app.use('/api/auth', authRoutes);
// Expose challenge routes without the /api prefix for simplicity
app.use('/challenge', challengeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/echo-score', echoScoreRoutes);

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
app.use(errorHandler);

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
    console.log(`⚡ Rate limiting: Enabled`);
  });
}

export default app;
