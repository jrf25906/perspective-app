import Foundation
import Combine
import KeychainAccess

class APIService: ObservableObject {
    static let shared = APIService()

    private let baseURL: String
    private let session = URLSession.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let keychain = Keychain(service: Bundle.main.bundleIdentifier ?? "com.perspective.app")

    private init() {
        // Read API base URL from Info.plist, fallback to example HTTPS endpoint
        if let url = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String {
            self.baseURL = url
        } else {
            self.baseURL = "https://example.com/api"
        }

        // Check for stored token on init
        if let token = try? keychain.get("auth_token"), token != nil {
            // Validate token by fetching profile
            fetchProfile()
        }
    }
    
    // MARK: - Authentication
    
    func register(email: String, username: String, password: String, firstName: String? = nil, lastName: String? = nil) -> AnyPublisher<AuthResponse, APIError> {
        let request = RegisterRequest(
            email: email,
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        
        return makeRequest(
            endpoint: "/auth/register",
            method: "POST",
            body: request,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.handleAuthSuccess(response)
        })
        .eraseToAnyPublisher()
    }
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError> {
        let request = LoginRequest(email: email, password: password)
        
        return makeRequest(
            endpoint: "/auth/login",
            method: "POST",
            body: request,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.handleAuthSuccess(response)
        })
        .eraseToAnyPublisher()
    }
    
    func googleSignIn(idToken: String) -> AnyPublisher<AuthResponse, APIError> {
        let request = GoogleSignInRequest(idToken: idToken)
        
        return makeRequest(
            endpoint: "/auth/google",
            method: "POST",
            body: request,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.handleAuthSuccess(response)
        })
        .eraseToAnyPublisher()
    }
    
    func logout() {
        do {
            try keychain.remove("auth_token")
        } catch {
            print("Keychain remove error: \(error)")
        }
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
    
    func fetchProfile() {
        makeAuthenticatedRequest(
            endpoint: "/auth/profile",
            method: "GET",
            body: Optional<String>.none,
            responseType: User.self
        )
        .sink(
            receiveCompletion: { completion in
                if case .failure = completion {
                    DispatchQueue.main.async {
                        self.isAuthenticated = false
                        self.currentUser = nil
                    }
                }
            },
            receiveValue: { user in
                DispatchQueue.main.async {
                    self.currentUser = user
                    self.isAuthenticated = true
                }
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Challenges
    
    func getTodayChallenge() -> AnyPublisher<Challenge, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/today",
            method: "GET",
            body: Optional<String>.none,
            responseType: Challenge.self
        )
    }
    
    func submitChallenge(challengeId: Int, userAnswer: Any, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError> {
        let submission = ChallengeSubmission(
            answer: AnyCodable(userAnswer),
            timeSpentSeconds: timeSpent
        )
        
        return makeAuthenticatedRequest(
            endpoint: "/challenge/\(challengeId)/submit",
            method: "POST",
            body: submission,
            responseType: ChallengeResult.self
        )
    }
    
    func getChallengeStats() -> AnyPublisher<ChallengeStats, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/stats",
            method: "GET",
            body: Optional<String>.none,
            responseType: ChallengeStats.self
        )
    }
    
    func getLeaderboard(timeframe: String = "weekly") -> AnyPublisher<[LeaderboardEntry], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/leaderboard?timeframe=\(timeframe)",
            method: "GET",
            body: Optional<String>.none,
            responseType: [LeaderboardEntry].self
        )
    }
    
    // MARK: - Echo Score
    
    func getEchoScore() -> AnyPublisher<EchoScore, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score",
            method: "GET",
            body: Optional<String>.none,
            responseType: EchoScore.self
        )
    }
    
    func getEchoScoreHistory(days: Int = 30) -> AnyPublisher<[EchoScoreHistory], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score/history?days=\(days)",
            method: "GET",
            body: Optional<String>.none,
            responseType: [EchoScoreHistory].self
        )
    }
    
    // MARK: - Private Methods
    
    private func handleAuthSuccess(_ response: AuthResponse) {
        do {
            try keychain.set(response.token, key: "auth_token")
        } catch {
            print("Keychain set error: \(error)")
        }
        DispatchQueue.main.async {
            self.currentUser = response.user
            self.isAuthenticated = true
        }
    }
    
    private func makeRequest<T: Codable, U: Codable>(
        endpoint: String,
        method: String,
        body: T? = nil,
        responseType: U.Type
    ) -> AnyPublisher<U, APIError> {
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            do {
                let encoder = JSONEncoder()
                request.httpBody = try encoder.encode(body)
                // Log the request body for debugging
                if let requestString = String(data: request.httpBody!, encoding: .utf8) {
                    print("Request Body: \(requestString)")
                }
            } catch {
                print("Encoding Error: \(error)")
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                // Log the raw response for debugging
                if let httpResponse = response as? HTTPURLResponse {
                    print("HTTP Status: \(httpResponse.statusCode)")
                    print("Response Headers: \(httpResponse.allHeaderFields)")
                    
                    // Check HTTP status code
                    switch httpResponse.statusCode {
                    case 200...299:
                        // Success - continue with normal flow
                        break
                    case 400:
                        // Bad Request
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.badRequest(errorResponse.error.message)
                        } else {
                            throw APIError.badRequest("Invalid request")
                        }
                    case 401:
                        // Unauthorized
                        throw APIError.unauthorized
                    case 403:
                        // Forbidden
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.forbidden(errorResponse.error.message)
                        } else {
                            throw APIError.forbidden("Access denied")
                        }
                    case 404:
                        // Not Found
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.notFound(errorResponse.error.message)
                        } else {
                            throw APIError.notFound("Resource not found")
                        }
                    case 409:
                        // Conflict
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.conflict(errorResponse.error.message)
                        } else {
                            throw APIError.conflict("Resource conflict")
                        }
                    case 500...599:
                        // Server Error
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.serverError(errorResponse.error.message)
                        } else {
                            throw APIError.serverError("Internal server error")
                        }
                    default:
                        // Unknown error
                        let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                        throw APIError.unknownError(httpResponse.statusCode, message)
                    }
                }
                
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Raw Response: \(responseString)")
                }
                return data
            }
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let decodingError = error as? DecodingError {
                    print("Decoding Error Details: \(decodingError)")
                    return APIError.decodingError
                } else {
                    return APIError.networkError(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    private func makeAuthenticatedRequest<T: Codable, U: Codable>(
        endpoint: String,
        method: String,
        body: T? = nil,
        responseType: U.Type
    ) -> AnyPublisher<U, APIError> {
        guard let token = try? keychain.get("auth_token"), let token = token else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }
        
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        if let body = body {
            do {
                let encoder = JSONEncoder()
                request.httpBody = try encoder.encode(body)
                // Log the request body for debugging
                if let requestString = String(data: request.httpBody!, encoding: .utf8) {
                    print("Request Body: \(requestString)")
                }
            } catch {
                print("Encoding Error: \(error)")
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                // Log the raw response for debugging
                if let httpResponse = response as? HTTPURLResponse {
                    print("HTTP Status: \(httpResponse.statusCode)")
                    print("Response Headers: \(httpResponse.allHeaderFields)")
                    
                    // Check HTTP status code
                    switch httpResponse.statusCode {
                    case 200...299:
                        // Success - continue with normal flow
                        break
                    case 400:
                        // Bad Request
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.badRequest(errorResponse.error.message)
                        } else {
                            throw APIError.badRequest("Invalid request")
                        }
                    case 401:
                        // Unauthorized
                        throw APIError.unauthorized
                    case 403:
                        // Forbidden
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.forbidden(errorResponse.error.message)
                        } else {
                            throw APIError.forbidden("Access denied")
                        }
                    case 404:
                        // Not Found
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.notFound(errorResponse.error.message)
                        } else {
                            throw APIError.notFound("Resource not found")
                        }
                    case 409:
                        // Conflict
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.conflict(errorResponse.error.message)
                        } else {
                            throw APIError.conflict("Resource conflict")
                        }
                    case 500...599:
                        // Server Error
                        if let errorResponse = try? JSONDecoder.apiDecoder.decode(ErrorResponse.self, from: data) {
                            throw APIError.serverError(errorResponse.error.message)
                        } else {
                            throw APIError.serverError("Internal server error")
                        }
                    default:
                        // Unknown error
                        let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                        throw APIError.unknownError(httpResponse.statusCode, message)
                    }
                }
                
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Raw Response: \(responseString)")
                }
                return data
            }
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let decodingError = error as? DecodingError {
                    print("Decoding Error Details: \(decodingError)")
                    return APIError.decodingError
                } else {
                    return APIError.networkError(error)
                }
            }
            .eraseToAnyPublisher()
    }
}

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