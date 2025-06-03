import Foundation
import Combine

// MARK: - API Response Protocol

/// Protocol for handling API responses with proper error detection
protocol APIResponseHandler {
    associatedtype SuccessType: Decodable
    static func decode(from data: Data, statusCode: Int) throws -> Result<SuccessType, APIError>
}

// MARK: - Standard API Response

/// Generic response handler for standard API responses
struct StandardAPIResponse<T: Decodable>: APIResponseHandler {
    typealias SuccessType = T
    
    static func decode(from data: Data, statusCode: Int) throws -> Result<T, APIError> {
        // First check for error response structure
        if let errorResponse = APIResponseMapper.decodeErrorResponse(from: data) {
            return .failure(APIResponseMapper.mapErrorResponse(errorResponse, statusCode: statusCode))
        }
        
        // Then try to decode success response
        do {
            let successResponse = try JSONDecoder.apiDecoder.decode(T.self, from: data)
            return .success(successResponse)
        } catch {
            // If decoding fails, check if it's actually an error response we couldn't decode
            if statusCode >= 400 {
                let message = APIResponseMapper.extractErrorMessage(from: data)
                return .failure(APIError.unknownError(statusCode, message))
            }
            // Otherwise, it's a genuine decoding error
            throw error
        }
    }
    
}

// MARK: - Paginated Response

/// Response wrapper for paginated API responses
struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let pagination: Pagination
    
    struct Pagination: Decodable {
        let page: Int
        let limit: Int
        let total: Int
        let totalPages: Int
        
        enum CodingKeys: String, CodingKey {
            case page
            case limit
            case total
            case totalPages
        }
    }
}

// MARK: - Empty Response

/// Response handler for endpoints that return no content
struct EmptyAPIResponse: APIResponseHandler {
    typealias SuccessType = EmptyResponse
    
    struct EmptyResponse: Decodable {}
    
    static func decode(from data: Data, statusCode: Int) throws -> Result<EmptyResponse, APIError> {
        // Check for error response even if we expect empty
        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
            return .failure(APIResponseMapper.mapErrorResponse(errorResponse, statusCode: statusCode))
        }
        
        // For 204 No Content or empty 200 responses
        if statusCode == 204 || data.isEmpty {
            return .success(EmptyResponse())
        }
        
        // Try to decode as empty response
        do {
            let response = try JSONDecoder.apiDecoder.decode(EmptyResponse.self, from: data)
            return .success(response)
        } catch {
            if statusCode >= 400 {
                let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                return .failure(APIError.unknownError(statusCode, message))
            }
            throw error
        }
    }
}

// MARK: - Response Type Aliases

typealias UserAPIResponse = StandardAPIResponse<User>
typealias AuthAPIResponse = StandardAPIResponse<AuthResponse>
typealias ChallengeAPIResponse = StandardAPIResponse<Challenge>
typealias ChallengeListAPIResponse = StandardAPIResponse<[Challenge]>
typealias EchoScoreAPIResponse = StandardAPIResponse<EchoScore>

// MARK: - Response Extensions

extension Result where Success: Decodable, Failure == APIError {
    /// Maps the success value to a different type
    func mapSuccess<T>(_ transform: (Success) throws -> T) -> Result<T, APIError> {
        switch self {
        case .success(let value):
            do {
                return .success(try transform(value))
            } catch {
                return .failure(.decodingError)
            }
        case .failure(let error):
            return .failure(error)
        }
    }
    
    /// Extracts the success value or nil
    var value: Success? {
        switch self {
        case .success(let value):
            return value
        case .failure:
            return nil
        }
    }
    
    /// Extracts the error or nil
    var error: APIError? {
        switch self {
        case .success:
            return nil
        case .failure(let error):
            return error
        }
    }
}

// MARK: - Network Client Extension

extension NetworkClient {
    /// Performs a request with proper response handling
    func performRequestWithResponseHandler<T: APIResponseHandler>(
        _ request: URLRequest,
        responseHandler: T.Type
    ) -> AnyPublisher<T.SuccessType, APIError> {
        performRequest(request)
            .tryMap { data in
                let result = try T.decode(from: data, statusCode: 200) // Status code should be passed from response
                switch result {
                case .success(let value):
                    return value
                case .failure(let error):
                    throw error
                }
            }
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else {
                    return .networkError(error)
                }
            }
            .eraseToAnyPublisher()
    }
}