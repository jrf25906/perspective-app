import logger from '../utils/logger';

/**
 * Service responsible for transforming requests between iOS and backend formats
 * Follows Single Responsibility Principle - only handles request transformation
 */
export class RequestTransformService {
  private static readonly DEFAULT_TIME_SPENT = 30; // 30 seconds default
  
  /**
   * Transform iOS challenge submission to backend format
   * iOS may send the data wrapped in different structures
   */
  static transformChallengeSubmission(body: any): any {
    // Extract answer using multiple strategies
    const answer = this.extractAnswer(body);
    
    // Extract time spent using multiple strategies
    const timeSpentSeconds = this.extractTimeSpent(body);
    
    return {
      answer,
      timeSpentSeconds
    };
  }
  
  /**
   * Extract answer from various possible formats
   */
  private static extractAnswer(body: any): any {
    // Handle AnyCodable wrapper from iOS
    if (body.answer && typeof body.answer === 'object' && body.answer.value !== undefined) {
      return body.answer.value;
    }
    
    // Handle submission wrapper
    if (body.submission?.answer !== undefined) {
      return body.submission.answer;
    }
    
    // Handle various field names
    return body.answer || body.userAnswer || body.selectedOption || body.response;
  }
  
  /**
   * Extract time spent from various possible formats
   * Returns default value if not found
   */
  private static extractTimeSpent(body: any): number {
    // Try various field names and locations
    const possibleValues = [
      body.timeSpentSeconds,
      body.timeSpent,
      body.time_spent,
      body.submission?.timeSpentSeconds,
      body.submission?.timeSpent,
      body.submission?.time_spent,
      body.duration,
      body.elapsedTime,
      body.elapsed_time
    ];
    
    // Find first valid numeric value
    for (const value of possibleValues) {
      if (value !== undefined && value !== null) {
        const parsed = parseInt(value);
        if (!isNaN(parsed) && parsed >= 0) {
          return Math.min(parsed, 3600); // Cap at 1 hour
        }
      }
    }
    
    // Log when using default value for monitoring
    logger.warn(`Challenge submission missing time data, using default: ${this.DEFAULT_TIME_SPENT}s`);
    
    // Return default if no valid time found
    return this.DEFAULT_TIME_SPENT;
  }
  
  /**
   * Transform profile update requests
   */
  static transformProfileUpdate(body: any): any {
    // Handle snake_case to camelCase conversion if needed
    const transformed: any = {};
    
    // Map common fields that might come in different formats
    if (body.first_name !== undefined) transformed.firstName = body.first_name;
    if (body.last_name !== undefined) transformed.lastName = body.last_name;
    if (body.firstName !== undefined) transformed.firstName = body.firstName;
    if (body.lastName !== undefined) transformed.lastName = body.lastName;
    if (body.email !== undefined) transformed.email = body.email;
    if (body.username !== undefined) transformed.username = body.username;
    
    return transformed;
  }
} 