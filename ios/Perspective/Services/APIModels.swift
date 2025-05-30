import Foundation

// MARK: - Error Response

struct ErrorResponse: Codable {
    let error: ErrorDetail
}

struct ErrorDetail: Codable {
    let code: String?
    let message: String
}

// MARK: - API Error

enum APIError: Error, LocalizedError {
    case invalidURL
    case unauthorized
    case encodingError
    case decodingError
    case networkError(Error)
    case badRequest(String)
    case forbidden(String)
    case notFound(String)
    case conflict(String)
    case serverError(String)
    case unknownError(Int, String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .unauthorized:
            return "Unauthorized access"
        case .encodingError:
            return "Failed to encode request"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .badRequest(let message):
            return "Bad request: \(message)"
        case .forbidden(let message):
            return "Forbidden: \(message)"
        case .notFound(let message):
            return "Not found: \(message)"
        case .conflict(let message):
            return "Conflict: \(message)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .unknownError(let code, let message):
            return "Error (\(code)): \(message)"
        }
    }
}

// MARK: - JSON Decoder Extension

extension JSONDecoder {
    static let apiDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        
        // Custom date formatter to handle backend date format
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try the backend format first
            if let date = dateFormatter.date(from: dateString) {
                return date
            }
            
            // Fall back to ISO8601 if that fails
            let isoFormatter = ISO8601DateFormatter()
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date from \(dateString)")
        }
        
        return decoder
    }()
} 