import Foundation
import Combine

class NetworkClient {
    private let session = URLSession.shared
    
    func performRequest<T: Decodable>(_ request: URLRequest, responseType: T.Type) -> AnyPublisher<T, APIError> {
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                try self.validateResponse(data: data, response: response)
                return data
            }
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                self.mapError(error)
            }
            .eraseToAnyPublisher()
    }
    
    func performRequest(_ request: URLRequest) -> AnyPublisher<Data, APIError> {
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                try self.validateResponse(data: data, response: response)
                return data
            }
            .mapError { error in
                self.mapError(error)
            }
            .eraseToAnyPublisher()
    }
    
    private func validateResponse(data: Data, response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidURL
        }
        
        // Log response for debugging
        print("HTTP Status: \(httpResponse.statusCode)")
        if let responseString = String(data: data, encoding: .utf8) {
            print("Raw Response: \(responseString)")
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            // Success
            return
            
        case 400:
            if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                throw APIError.badRequest(errorResponse.error.message)
            } else {
                throw APIError.badRequest("Invalid request")
            }
            
        case 401:
            throw APIError.unauthorized
            
        case 403:
            if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                throw APIError.forbidden(errorResponse.error.message)
            } else {
                throw APIError.forbidden("Access denied")
            }
            
        case 404:
            if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                throw APIError.notFound(errorResponse.error.message)
            } else {
                throw APIError.notFound("Resource not found")
            }
            
        case 409:
            if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                throw APIError.conflict(errorResponse.error.message)
            } else {
                throw APIError.conflict("Resource conflict")
            }
            
        case 500...599:
            if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                throw APIError.serverError(errorResponse.error.message)
            } else {
                throw APIError.serverError("Internal server error")
            }
            
        default:
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.unknownError(httpResponse.statusCode, message)
        }
    }
    
    private func mapError(_ error: Error) -> APIError {
        if let apiError = error as? APIError {
            return apiError
        } else if let decodingError = error as? DecodingError {
            print("Decoding Error Details: \(decodingError)")
            return APIError.decodingError
        } else {
            return APIError.networkError(error)
        }
    }
} 