import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle camelCase requests from iOS
 * Converts camelCase fields to snake_case for backend processing
 */
export function camelCaseRequestParser(req: Request, res: Response, next: NextFunction) {
  // Only process JSON requests
  if (!req.is('application/json') || !req.body || typeof req.body !== 'object') {
    return next();
  }

  // Convert camelCase to snake_case
  req.body = convertCamelToSnake(req.body);
  next();
}

/**
 * Recursively convert camelCase keys to snake_case
 */
function convertCamelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => convertCamelToSnake(item));
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const converted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = convertCamelToSnake(value);
    }
    
    return converted;
  }
  
  return obj;
}

/**
 * Convert a camelCase string to snake_case
 */
function camelToSnake(str: string): string {
  // Handle special cases that iOS sends
  const specialCases: { [key: string]: string } = {
    'firstName': 'first_name',
    'lastName': 'last_name',
    'idToken': 'id_token',
    'timeSpentSeconds': 'time_spent_seconds'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
} 