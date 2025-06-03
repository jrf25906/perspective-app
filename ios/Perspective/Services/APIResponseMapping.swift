import Foundation

// MARK: - API Response Mapping

/// Centralized error response mapping following Single Responsibility Principle
/// This separates error mapping logic from response handling
public enum APIResponseMapper {
    
    /// Maps an error response to the appropriate APIError type
    /// - Parameters:
    ///   - errorResponse: The error response from the backend
    ///   - statusCode: The HTTP status code
    /// - Returns: The appropriate APIError
    public static func mapErrorResponse(_ errorResponse: ErrorResponse, statusCode: Int) -> APIError {
        let message = errorResponse.error.message
        let code = errorResponse.error.code ?? "UNKNOWN_ERROR"
        
        switch code {
        case "INVALID_CREDENTIALS":
            return .unauthorized
        case "USER_EXISTS":
            return .conflict(message)
        case "VALIDATION_ERROR":
            return .badRequest(message)
        case "INTERNAL_ERROR":
            return .serverError(message)
        case "TOO_MANY_AUTH_ATTEMPTS":
            return .forbidden(message)
        case "USER_NOT_FOUND":
            return .notFound(message)
        case "MAINTENANCE_MODE":
            return .serverError(message)
        default:
            return mapStatusCode(statusCode, message: message)
        }
    }
    
    /// Maps a status code to the appropriate APIError when no specific error code is available
    /// - Parameters:
    ///   - statusCode: The HTTP status code
    ///   - message: The error message
    /// - Returns: The appropriate APIError
    public static func mapStatusCode(_ statusCode: Int, message: String) -> APIError {
        switch statusCode {
        case 400:
            return .badRequest(message)
        case 401:
            return .unauthorized
        case 403:
            return .forbidden(message)
        case 404:
            return .notFound(message)
        case 409:
            return .conflict(message)
        case 500...599:
            return .serverError(message)
        default:
            return .unknownError(statusCode, message)
        }
    }
    
    /// Attempts to decode an error response from data
    /// - Parameter data: The response data
    /// - Returns: The decoded error response if successful, nil otherwise
    public static func decodeErrorResponse(from data: Data) -> ErrorResponse? {
        return try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data)
    }
    
    /// Extracts an error message from raw data
    /// - Parameter data: The response data
    /// - Returns: A string representation of the error, or a default message
    public static func extractErrorMessage(from data: Data) -> String {
        return String(data: data, encoding: .utf8) ?? "Unknown error"
    }
}