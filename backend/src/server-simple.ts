/**
 * @deprecated This file is deprecated. Use `npm run dev:simple` or set SIMPLE_MODE=true to run server in simple mode.
 * This functionality has been consolidated into server.ts for better maintainability.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

console.log('Loading environment variables...');
dotenv.config();

console.log('Creating Express app...');
const app: Application = express();
const PORT = process.env.PORT || 3000; // Changed to 3000 to match iOS app

console.log('Setting up middleware...');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('Setting up routes...');

// Simple health check WITHOUT database
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple test endpoint
app.get('/test', (req: Request, res: Response) => {
  console.log('Test endpoint requested');
  res.json({ message: 'TypeScript server working!', timestamp: new Date().toISOString() });
});

// Auth endpoints for iOS app
app.post('/api/auth/register', (req: Request, res: Response): void => {
  console.log('Registration requested:', req.body);
  
  const { email, password, username, firstName, lastName } = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  // Mock successful registration
  const mockUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    username: username || email.split('@')[0],
    firstName: firstName || null,
    lastName: lastName || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockToken = 'mock-jwt-token-' + Math.random().toString(36);

  res.status(201).json({
    token: mockToken,
    user: mockUser,
    message: 'User registered successfully'
  });
});

app.post('/api/auth/login', (req: Request, res: Response): void => {
  console.log('Login requested:', req.body);
  
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Mock successful login
  const mockUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    username: email.split('@')[0],
    firstName: null,
    lastName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockToken = 'mock-jwt-token-' + Math.random().toString(36);

  res.json({
    token: mockToken,
    user: mockUser,
    message: 'Login successful'
  });
});

app.get('/api/auth/profile', (req: Request, res: Response): void => {
  console.log('Profile requested');
  
  // Mock profile data
  const mockUser = {
    id: 'mock-user-id',
    email: 'user@example.com',
    username: 'user',
    firstName: null,
    lastName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.json(mockUser);
});

console.log('Starting server...');

// Start server
app.listen(PORT, () => {
  console.log(`Simple TypeScript server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth/`);
});

console.log('Server setup complete');

export default app; 