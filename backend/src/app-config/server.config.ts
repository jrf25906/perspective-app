import config, { isProduction, isDevelopment, isTest } from '../config';

// Re-export from centralized config for backward compatibility
export const serverConfig = config.server;
export { isProduction, isDevelopment, isTest }; 