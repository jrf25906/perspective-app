import dotenv from 'dotenv';

dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  },
  bodyParser: {
    jsonLimit: '10mb',
    urlencodedLimit: '10mb'
  },
  version: process.env.npm_package_version || '1.0.0',
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    endTime: process.env.MAINTENANCE_END_TIME || 'Unknown'
  }
};

export const isProduction = serverConfig.environment === 'production';
export const isDevelopment = serverConfig.environment === 'development';
export const isTest = serverConfig.environment === 'test'; 