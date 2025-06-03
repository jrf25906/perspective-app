import Foundation

// MARK: - Error Response

public struct ErrorResponse: Codable {
    public let error: ErrorDetail
    
    public init(error: ErrorDetail) {
        self.error = error
    }
}

public struct ErrorDetail: Codable {
    public let code: String?
    public let message: String
    
    public init(code: String? = nil, message: String) {
        self.code = code
        self.message = message
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        code = try container.decodeIfPresent(String.self, forKey: .code)
        message = try container.decode(String.self, forKey: .message)
    }
}

// MARK: - API Error

public enum APIError: Error, LocalizedError {
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
    
    public var errorDescription: String? {
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
    public static let apiDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        // Don't use convertFromSnakeCase when we have custom CodingKeys
        decoder.keyDecodingStrategy = .useDefaultKeys
        decoder.dateDecodingStrategy = .custom(flexibleDateDecoder)
        return decoder
    }()
    
    /// Flexible date decoder that handles multiple date formats
    private static func flexibleDateDecoder(decoder: Decoder) throws -> Date {
        let container = try decoder.singleValueContainer()
        
        // Try decoding as Double (Unix timestamp)
        if let timestamp = try? container.decode(Double.self) {
            return Date(timeIntervalSince1970: timestamp)
        }
        
        // Try decoding as Int (Unix timestamp)
        if let timestamp = try? container.decode(Int.self) {
            return Date(timeIntervalSince1970: Double(timestamp))
        }
        
        // Try decoding as String with various formats
        var dateString = try container.decode(String.self)
        
        // Fix lowercase 'z' timezone indicator
        if dateString.hasSuffix("z") {
            dateString = String(dateString.dropLast()) + "Z"
        }
        
        // Date formatters to try in order
        let formatters: [DateFormatter] = [
            // ISO8601 with milliseconds and timezone
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSZ"),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timeZone: TimeZone(secondsFromGMT: 0)),
            
            // ISO8601 without milliseconds
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ssZ"),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss'Z'", timeZone: TimeZone(secondsFromGMT: 0)),
            
            // Backend custom format
            createDateFormatter("yyyy-MM-dd HH:mm:ss", timeZone: TimeZone(secondsFromGMT: 0)),
            createDateFormatter("yyyy-MM-dd HH:mm:ss.SSS", timeZone: TimeZone(secondsFromGMT: 0)),
            
            // Date only
            createDateFormatter("yyyy-MM-dd")
        ]
        
        for formatter in formatters {
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        // Try ISO8601DateFormatter as fallback
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        
        // Try without fractional seconds
        isoFormatter.formatOptions = [.withInternetDateTime]
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        
        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Cannot decode date from '\(dateString)'"
        )
    }
    
    private static func createDateFormatter(_ format: String, timeZone: TimeZone? = nil) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = format
        formatter.locale = Locale(identifier: "en_US_POSIX")
        if let timeZone = timeZone {
            formatter.timeZone = timeZone
        }
        return formatter
    }
}

// MARK: - JSON Encoder Extension

extension JSONEncoder {
    public static let apiEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()
}