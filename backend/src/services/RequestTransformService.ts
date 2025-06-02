/**
 * Service responsible for transforming requests between iOS and backend formats
 * Follows Single Responsibility Principle - only handles request transformation
 */
export class RequestTransformService {
  /**
   * Transform iOS challenge submission to backend format
   * iOS may send the data wrapped in different structures
   */
  static transformChallengeSubmission(body: any): any {
    // Handle various iOS submission formats
    if (body.submission) {
      // iOS might wrap in a submission object
      return {
        answer: body.submission.answer,
        timeSpentSeconds: body.submission.timeSpentSeconds || body.submission.timeSpent
      };
    }
    
    // Handle direct fields with different naming
    if (body.userAnswer !== undefined || body.timeSpent !== undefined) {
      return {
        answer: body.userAnswer || body.answer,
        timeSpentSeconds: body.timeSpent || body.timeSpentSeconds
      };
    }
    
    // Handle AnyCodable wrapper from iOS
    if (body.answer && typeof body.answer === 'object' && body.answer.value !== undefined) {
      return {
        answer: body.answer.value,
        timeSpentSeconds: body.timeSpentSeconds
      };
    }
    
    // Return as-is if already in correct format
    return {
      answer: body.answer,
      timeSpentSeconds: body.timeSpentSeconds
    };
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