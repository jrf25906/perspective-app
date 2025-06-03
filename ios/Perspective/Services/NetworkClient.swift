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
    
    // MARK: - CRITICAL FIX: Error-First Response Processing
    
    func performRequest<T: Decodable>(_ request: URLRequest, responseType: T.Type) -> AnyPublisher<T, APIError> {
        // Log request details
        logRequest(request)
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                self?.logResponse(response, data: data)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidURL
                }
                
                // ARCHITECTURAL FIX: Check for errors BEFORE attempting to decode success response
                
                // 1. Check HTTP status code first for error conditions
                if httpResponse.statusCode >= 400 {
                    // Try to decode structured error response
                    if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                        throw self?.mapErrorResponse(errorResponse, statusCode: httpResponse.statusCode) ?? APIError.unknownError(httpResponse.statusCode, "Unknown error")
                    } else {
                        // Fallback for non-standard error responses
                        let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                        throw APIError.unknownError(httpResponse.statusCode, message)
                    }
                }
                
                // 2. Even for 2xx responses, check if it contains an error structure
                // This handles cases where backend returns 200 with error content
                if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                    throw self?.mapErrorResponse(errorResponse, statusCode: httpResponse.statusCode) ?? APIError.unknownError(httpResponse.statusCode, "Unknown error")
                }
                
                // 3. Process JSON if needed (existing logic)
                let processedData: Data
                if (try? JSONSerialization.jsonObject(with: data, options: [])) != nil {
                    // JSON is valid, use original data
                    processedData = data
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
                    
                    processedData = processedResponse.cleanedData
                }
                
                // 4. Now safe to return data for success decoding
                return processedData
            }
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { [weak self] error -> APIError in
                // Enhanced error logging for decoding failures
                if let decodingError = error as? DecodingError {
                    print("❌ DECODING FAILED for type: \(responseType)")
                    
                    // Log the request URL for context
                    print("❌ Request URL: \(request.url?.absoluteString ?? "Unknown")")
                    
                    // Special handling for Authentication decoding errors
                    if String(describing: responseType).contains("AuthResponse") {
                        print("❌ Authentication response decoding error detected")
                        print("❌ This indicates the backend returned an error response that was classified as success")
                        print("❌ Error-first processing should have caught this earlier")
                    }
                    
                    // Log decoding error details
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        print("❌ Key not found: \(key.stringValue) at \(context.codingPath)")
                        print("❌ CodingPath: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
                    case .typeMismatch(let type, let context):
                        print("❌ Type mismatch: Expected \(type) at \(context.codingPath)")
                        print("❌ Debug: \(context.debugDescription)")
                        print("❌ CodingPath: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
                    case .valueNotFound(let type, let context):
                        print("❌ Value not found: \(type) at \(context.codingPath)")
                        print("❌ CodingPath: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
                    case .dataCorrupted(let context):
                        print("❌ Data corrupted at \(context.codingPath): \(context.debugDescription)")
                        print("❌ CodingPath: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
                    @unknown default:
                        print("❌ Unknown decoding error: \(String(describing: decodingError))")
                    }
                }
                
                return self?.mapError(error) ?? APIError.decodingError
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    // Enhanced authentication-specific request method
    func performAuthRequest<T: Decodable>(_ request: URLRequest, responseType: T.Type) -> AnyPublisher<T, APIError> {
        // Add authentication-specific headers
        var enhancedRequest = request
        enhancedRequest.setValue("auth-request", forHTTPHeaderField: "X-Request-Type")
        
        return performRequest(enhancedRequest, responseType: responseType)
            .catch { error -> AnyPublisher<T, APIError> in
                // Authentication-specific error enhancement
                let enhancedError = self.enhanceAuthenticationError(error)
                return Fail(error: enhancedError).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Enhanced Error Mapping

    private func mapErrorResponse(_ errorResponse: ErrorResponse, statusCode: Int) -> APIError {
        let message = errorResponse.error.message
        let code = errorResponse.error.code ?? "UNKNOWN_ERROR"
        
        // Map specific error codes with enhanced authentication handling
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
        case "TOKEN_EXPIRED":
            // Post notification for token refresh
            NotificationCenter.default.post(name: .authTokenExpired, object: nil)
            return .unauthorized
        case "MAINTENANCE_MODE":
            return .serverError(message)
        default:
            switch statusCode {
            case 400: return .badRequest(message)
            case 401: return .unauthorized
            case 403: return .forbidden(message)
            case 404: return .notFound(message)
            case 409: return .conflict(message)
            case 500...599: return .serverError(message)
            default: return .unknownError(statusCode, message)
            }
        }
    }
    
    private func enhanceAuthenticationError(_ error: APIError) -> APIError {
        switch error {
        case .unauthorized:
            // Add authentication-specific context
            NotificationCenter.default.post(name: .authTokenExpired, object: nil)
            return error
        case .badRequest(let message):
            // Enhanced validation error messages for auth
            if message.contains("email") {
                return .badRequest("Please check your email format")
            } else if message.contains("password") {
                return .badRequest("Password requirements not met")
            }
            return error
        default:
            return error
        }
    }
    
    // MARK: - Existing Methods (preserved for compatibility)
    
    func performRequest(_ request: URLRequest) -> AnyPublisher<Data, APIError> {
        // Log request details
        logRequest(request)
        
        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                self?.logResponse(response, data: data)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidURL
                }
                
                // Apply same error-first processing for raw data requests
                if httpResponse.statusCode >= 400 {
                    if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                        throw self?.mapErrorResponse(errorResponse, statusCode: httpResponse.statusCode) ?? APIError.unknownError(httpResponse.statusCode, "Unknown error")
                    } else {
                        let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                        throw APIError.unknownError(httpResponse.statusCode, message)
                    }
                }
                
                // Even for 200 responses, check if it contains an error structure
                if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                    throw self?.mapErrorResponse(errorResponse, statusCode: httpResponse.statusCode) ?? APIError.unknownError(httpResponse.statusCode, "Unknown error")
                }
                
                // Process potentially malformed JSON from backend
                let processedResponse = self?.jsonProcessor.processResponse(data) ?? 
                    ProcessedJSONResponse(cleanedData: data, originalData: data, 
                                        diagnostics: JSONDiagnostics(originalSize: data.count, cleanedSize: data.count, issuesFound: [], processingLog: []), 
                                        isValid: true)
                
                return processedResponse.cleanedData
            }
            .mapError { [weak self] error in
                self?.mapError(error) ?? APIError.unknownError(0, "Network client deallocated")
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Original validation and error mapping methods (preserved)
    
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