import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import challengeRoutes from './routes/challengeRoutes';
import profileRoutes from './routes/profileRoutes';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/challenges', challengeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);

// TODO: Add these routes when implemented
// app.use('/api/perspectives', perspectiveRoutes);
// app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error interface
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

// Error handling middleware
app.use((error: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error(error.stack);
  
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message
    }
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

export default app; 