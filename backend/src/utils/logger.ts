import winston from 'winston';
import { LoggerFactory, EnhancedLogger, LogContext } from './logger/index';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Enhanced format that includes metadata
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, module, ...metadata }) => {
    // For console output, create a readable format
    const contextStr = context ? `[${context}]` : '';
    const moduleStr = module ? `[${module}]` : '';
    const metadataStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    
    return `${timestamp} ${level}: ${contextStr}${moduleStr} ${message}${metadataStr}`;
  })
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, module, ...metadata }) => {
    const contextStr = context ? `[${context}]` : '';
    const moduleStr = module ? `[${module}]` : '';
    const metadataStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    
    return `${timestamp} ${level}: ${contextStr}${moduleStr} ${message}${metadataStr}`;
  })
);

// Define transports
const transports = [
  // Console transport with colored output
  new winston.transports.Console({
    format: consoleFormat
  }),
  // File transport for errors with JSON format
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.json()
  }),
  // File transport for all logs with JSON format
  new winston.transports.File({ 
    filename: 'logs/all.log',
    format: winston.format.json()
  }),
];

// Create the winston logger
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Initialize the logger factory
LoggerFactory.initialize(winstonLogger);

// Create a default enhanced logger
const logger = LoggerFactory.create(LogContext.SERVER, 'App');

// Export both the enhanced logger and factory for maximum flexibility
export default logger;
export { LoggerFactory, LogContext, EnhancedLogger };

// For backward compatibility, also export common logging methods
export const info = (message: string, metadata?: any) => logger.info(message, metadata);
export const warn = (message: string, metadata?: any) => logger.warn(message, metadata);
export const error = (message: string, error?: Error | any, metadata?: any) => logger.error(message, error, metadata);
export const debug = (message: string, metadata?: any) => logger.debug(message, metadata);
export const http = (message: string, metadata?: any) => logger.http(message, metadata);