import Foundation
import UIKit

class RequestBuilder {
    private let baseURL: String
    private let jsonEncoder: JSONEncoder
    
    init(baseURL: String) {
        // Ensure base URL doesn't end with a slash
        self.baseURL = baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        
        // Configure JSON encoder
        self.jsonEncoder = JSONEncoder()
        self.jsonEncoder.dateEncodingStrategy = .iso8601
    }
    
    func buildRequest<T: Encodable>(
        endpoint: String,
        method: HTTPMethod,
        body: T? = nil,
        headers: [String: String] = [:],
        queryParameters: [String: String]? = nil
    ) throws -> URLRequest {
        let request = try buildBaseRequest(
            endpoint: endpoint,
            method: method,
            headers: headers,
            queryParameters: queryParameters
        )
        
        var mutableRequest = request
        
        // Add body if present
        if let body = body {
            do {
                mutableRequest.httpBody = try jsonEncoder.encode(body)
                
                // Log request for debugging
                #if DEBUG
                if let requestString = String(data: mutableRequest.httpBody!, encoding: .utf8) {
                    print("📤 Request Body: \(requestString)")
                }
                #endif
            } catch {
                print("❌ Encoding Error: \(error)")
                throw APIError.encodingError
            }
        }
        
        return mutableRequest
    }
    
    func buildRequest(
        endpoint: String,
        method: HTTPMethod,
        headers: [String: String] = [:],
        queryParameters: [String: String]? = nil
    ) throws -> URLRequest {
        return try buildBaseRequest(
            endpoint: endpoint,
            method: method,
            headers: headers,
            queryParameters: queryParameters
        )
    }
    
    private func buildBaseRequest(
        endpoint: String,
        method: HTTPMethod,
        headers: [String: String],
        queryParameters: [String: String]?
    ) throws -> URLRequest {
        // Ensure endpoint starts with a slash
        let normalizedEndpoint = endpoint.hasPrefix("/") ? endpoint : "/\(endpoint)"
        let urlString = baseURL + normalizedEndpoint
        
        guard var urlComponents = URLComponents(string: urlString) else {
            throw APIError.invalidURL
        }
        
        // Add query parameters
        if let queryParameters = queryParameters, !queryParameters.isEmpty {
            urlComponents.queryItems = queryParameters.map { key, value in
                URLQueryItem(name: key, value: value)
            }
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // Set default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(Locale.current.identifier, forHTTPHeaderField: "Accept-Language")
        
        // Device info header
        let deviceInfo = "\(UIDevice.current.model)/\(UIDevice.current.systemVersion)"
        request.setValue(deviceInfo, forHTTPHeaderField: "X-Device-Info")
        
        // App version header
        if let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
           let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
            request.setValue("iOS/\(appVersion) (\(buildNumber))", forHTTPHeaderField: "X-App-Version")
        }
        
        // Add custom headers (these override defaults if keys match)
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Log request details in debug mode
        #if DEBUG
        print("🌐 Request: \(method.rawValue) \(url.absoluteString)")
        if !headers.isEmpty {
            print("📋 Custom Headers: \(headers)")
        }
        #endif
        
        return request
    }
}

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

// MARK: - URL Construction Helpers

extension RequestBuilder {
    /// Builds a URL with path parameters replaced
    /// Example: "/users/:id" with ["id": "123"] becomes "/users/123"
    func buildRequest(
        endpoint: String,
        method: HTTPMethod,
        pathParameters: [String: String]? = nil,
        queryParameters: [String: String]? = nil,
        headers: [String: String] = [:]
    ) throws -> URLRequest {
        var processedEndpoint = endpoint
        
        // Replace path parameters
        if let pathParameters = pathParameters {
            for (key, value) in pathParameters {
                processedEndpoint = processedEndpoint.replacingOccurrences(
                    of: ":\(key)",
                    with: value
                )
            }
        }
        
        return try buildRequest(
            endpoint: processedEndpoint,
            method: method,
            headers: headers,
            queryParameters: queryParameters
        )
    }
}