import Foundation
import Combine

class NetworkClient {
    private let session: URLSession
    private let logger = Logger(category: "NetworkClient")
    private let jsonProcessor: JSONResponseProcessing
    
    init(jsonProcessor: JSONResponseProcessing = JSONResponseProcessor()) {
        // Configure URLSession with proper timeouts
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        
        // Add default headers
        configuration.httpAdditionalHeaders = [
            "User-Agent": "PerspectiveApp-iOS/1.0",
            "Accept": "application/json",
            "Content-Type": "application/json"
        ]
        
        self.session = URLSession(configuration: configuration)
        self.jsonProcessor = jsonProcessor
    }
    
    func performRequest<T: Decodable>(_ request: URLRequest, responseType: T.Type) -> AnyPublisher<T, APIError> {
        // Log request details
        logRequest(request)
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                self?.logResponse(response, data: data)
                
                // Check if JSON is already valid before processing
                if (try? JSONSerialization.jsonObject(with: data, options: [])) != nil {
                    // JSON is valid, use original data
                    try self?.validateResponse(data: data, response: response)
                    return data
                } else {
                    // Process potentially malformed JSON from backend
                    let processedResponse = self?.jsonProcessor.processResponse(data) ?? 
                        ProcessedJSONResponse(cleanedData: data, originalData: data, 
                                            diagnostics: JSONDiagnostics(originalSize: data.count, cleanedSize: data.count, issuesFound: [], processingLog: []), 
                                            isValid: true)
                    
                    // Log diagnostics if issues were found
                    if !processedResponse.diagnostics.issuesFound.isEmpty || !processedResponse.isValid {
                        processedResponse.logDiagnostics()
                    }
                    
                    // Use cleaned data for validation (error detection)
                    try self?.validateResponse(data: processedResponse.cleanedData, response: response)
                    
                    return processedResponse.cleanedData
                }
            }
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { [weak self] error -> APIError in
                // Enhanced error logging for decoding failures
                if let decodingError = error as? DecodingError {
                    print("❌ DECODING FAILED for type: \(responseType)")
                    
                    // Get the data from the previous response if available
                    // Note: This is a limitation - we can't access the raw data here directly
                    // But the logResponse method above already logged it
                    
                    // Log decoding error details
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        print("❌ Key not found: \(key.stringValue) at \(context.codingPath)")
                    case .typeMismatch(let type, let context):
                        print("❌ Type mismatch: Expected \(type) at \(context.codingPath)")
                        print("❌ Debug: \(context.debugDescription)")
                    case .valueNotFound(let type, let context):
                        print("❌ Value not found: \(type) at \(context.codingPath)")
                    case .dataCorrupted(let context):
                        print("❌ Data corrupted at \(context.codingPath): \(context.debugDescription)")
                    @unknown default:
                        print("❌ Unknown decoding error: \(String(describing: decodingError))")
                    }
                }
                
                return self?.mapError(error) ?? APIError.decodingError
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    func performRequest(_ request: URLRequest) -> AnyPublisher<Data, APIError> {
        // Log request details
        logRequest(request)
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                self?.logResponse(response, data: data)
                
                // Process potentially malformed JSON from backend first
                let processedResponse = self?.jsonProcessor.processResponse(data) ?? 
                    ProcessedJSONResponse(cleanedData: data, originalData: data, 
                                        diagnostics: JSONDiagnostics(originalSize: data.count, cleanedSize: data.count, issuesFound: [], processingLog: []), 
                                        isValid: true)
                
                // Use cleaned data for validation (error detection)
                try self?.validateResponse(data: processedResponse.cleanedData, response: response)
                
                return processedResponse.cleanedData
            }
            .mapError { [weak self] error in
                self?.mapError(error) ?? APIError.unknownError(0, "Network client deallocated")
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    private func validateResponse(data: Data, response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidURL
        }
        
        // First check if response contains an error structure regardless of status code
        // This handles cases where backend returns 200 with error content
        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
            // Handle specific error codes
            if let errorCode = errorResponse.error.code {
                switch errorCode {
                case "TOO_MANY_AUTH_ATTEMPTS":
                    throw APIError.forbidden("Too many authentication attempts. Please try again later.")
                case "INVALID_CREDENTIALS":
                    throw APIError.unauthorized
                default:
                    break // Fall through to general error handling
                }
            }
            
            // General error handling based on HTTP status
            switch httpResponse.statusCode {
            case 400...499:
                throw APIError.badRequest(errorResponse.error.message)
            case 500...599:
                throw APIError.serverError(errorResponse.error.message)
            default:
                throw APIError.unknownError(httpResponse.statusCode, errorResponse.error.message)
            }
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            // Success
            return
            
        case 400:
            throw APIError.badRequest("Invalid request")
            
        case 401:
            // Post notification for token refresh
            NotificationCenter.default.post(name: .authTokenExpired, object: nil)
            throw APIError.unauthorized
            
        case 403:
            throw APIError.forbidden("Access denied")
            
        case 404:
            throw APIError.notFound("Resource not found")
            
        case 409:
            throw APIError.conflict("Resource conflict")
            
        case 500...599:
            throw APIError.serverError("Internal server error")
            
        default:
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.unknownError(httpResponse.statusCode, message)
        }
    }
    
    private func mapError(_ error: Error) -> APIError {
        if let apiError = error as? APIError {
            return apiError
        } else if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return APIError.noInternetConnection
            case .timedOut:
                return APIError.requestTimeout
            case .cannotFindHost, .cannotConnectToHost:
                return APIError.hostUnreachable
            case .secureConnectionFailed:
                return APIError.sslError
            case .cancelled:
                return APIError.requestCancelled
            default:
                return APIError.networkError(urlError)
            }
        } else if let decodingError = error as? DecodingError {
            switch decodingError {
            case .keyNotFound(let key, let context):
                logger.error("Decoding Error - Key not found: \(key.stringValue) at \(context.codingPath)")
            case .typeMismatch(let type, let context):
                logger.error("Decoding Error - Type mismatch: Expected \(type) at \(context.codingPath). Debug: \(context.debugDescription)")
            case .valueNotFound(let type, let context):
                logger.error("Decoding Error - Value not found: \(type) at \(context.codingPath)")
            case .dataCorrupted(let context):
                logger.error("Decoding Error - Data corrupted at \(context.codingPath): \(context.debugDescription)")
            @unknown default:
                logger.error("Decoding Error - Unknown: \(String(describing: decodingError))")
            }
            return APIError.decodingError
        } else {
            return APIError.networkError(error)
        }
    }
    
    // MARK: - Logging
    
    private func logRequest(_ request: URLRequest) {
        #if DEBUG
        logger.debug("🌐 REQUEST: \(request.httpMethod ?? "GET") \(request.url?.absoluteString ?? "Unknown URL")")
        
        if let headers = request.allHTTPHeaderFields {
            logger.debug("Headers: \(headers)")
        }
        
        if let body = request.httpBody,
           let bodyString = String(data: body, encoding: .utf8) {
            logger.debug("Body: \(bodyString)")
        }
        #endif
    }
    
    private func logResponse(_ response: URLResponse, data: Data) {
        #if DEBUG
        if let httpResponse = response as? HTTPURLResponse {
            let statusEmoji = (200...299).contains(httpResponse.statusCode) ? "✅" : "❌"
            logger.debug("\(statusEmoji) RESPONSE: \(httpResponse.statusCode) \(response.url?.absoluteString ?? "Unknown URL")")
            
            // Always log raw response data for debugging
            if let responseString = String(data: data, encoding: .utf8) {
                logger.debug("Response Data: \(responseString)")
            }
            
            // Also try to pretty print JSON
            if let jsonObject = try? JSONSerialization.jsonObject(with: data, options: []),
               let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
               let prettyString = String(data: prettyData, encoding: .utf8) {
                logger.debug("Pretty JSON Response:\n\(prettyString)")
            }
        }
        #endif
    }
    
}

// MARK: - Logger Helper

private struct Logger {
    let category: String
    
    func debug(_ message: String) {
        print("[\(category)] \(message)")
    }
    
    func error(_ message: String) {
        print("[\(category)] ERROR: \(message)")
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let authTokenExpired = Notification.Name("authTokenExpired")
}

// MARK: - Enhanced API Error Cases

extension APIError {
    static let noInternetConnection = APIError.networkError(NSError(domain: "NetworkClient", code: -1009, userInfo: [NSLocalizedDescriptionKey: "No internet connection"]))
    static let requestTimeout = APIError.networkError(NSError(domain: "NetworkClient", code: -1001, userInfo: [NSLocalizedDescriptionKey: "Request timed out"]))
    static let hostUnreachable = APIError.networkError(NSError(domain: "NetworkClient", code: -1003, userInfo: [NSLocalizedDescriptionKey: "Cannot connect to server"]))
    static let sslError = APIError.networkError(NSError(domain: "NetworkClient", code: -1200, userInfo: [NSLocalizedDescriptionKey: "SSL connection failed"]))
    static let requestCancelled = APIError.networkError(NSError(domain: "NetworkClient", code: -999, userInfo: [NSLocalizedDescriptionKey: "Request was cancelled"]))
}