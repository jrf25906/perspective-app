import dotenv from 'dotenv';
import logger from './utils/logger';
import path from 'path';

// Load environment variables once at the top of the application
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface DatabaseSettings {
  client: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface GeneralSettings {
  env: 'development' | 'production' | 'test';
  port: number;
}

export interface ServerSettings {
  port: number;
  environment: 'development' | 'production' | 'test';
  cors: {
    origin: string | string[] | RegExp | (string | RegExp)[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  bodyParser: {
    jsonLimit: string;
    urlencodedLimit: string;
  };
  version: string;
  maintenance: {
    enabled: boolean;
    endTime: string;
  };
}

export interface SecuritySettings {
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface Config {
  database: DatabaseSettings;
  general: GeneralSettings;
  server: ServerSettings;
  security: SecuritySettings;
}

// Validate required environment variables
const validateEnvironment = () => {
  const errors: string[] = [];
  
  // Check JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('JWT_SECRET is required in production');
    } else {
      logger.warn('WARNING: JWT_SECRET not set. Using insecure default for development only.');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};

// Run validation
validateEnvironment();

const config: Config = {
  database: {
    client: process.env.DB_CLIENT || 'pg',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'perspective_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },
  general: {
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    cors: {
      origin: (() => {
        // Support multiple origins for development
        if (process.env.NODE_ENV === 'development') {
          return [
            'http://localhost:3000',        // Web frontend
            'http://localhost:3001',        // Alternative web port
            'http://localhost:19006',       // Expo web
            'http://127.0.0.1:3000',       // Alternative localhost
            'capacitor://localhost',        // iOS Capacitor
            'ionic://localhost',            // iOS Ionic
            /^http:\/\/localhost:\d+$/,     // Any localhost port
            /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/ // Local network IPs
          ];
        }
        // Production should use specific allowed origins
        return process.env.CORS_ORIGIN?.split(',') || '*';
      })(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
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
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
      ? (() => { throw new Error('JWT_SECRET is required in production'); })() 
      : 'dev-only-secret-key'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  }
};

export default config;

// Export convenience helpers
export const isProduction = config.general.env === 'production';
export const isDevelopment = config.general.env === 'development';
export const isTest = config.general.env === 'test';
