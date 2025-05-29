import Foundation
import Combine

class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL = "http://localhost:3000/api"
    private let session = URLSession.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private init() {
        // Check for stored token on init
        if let token = UserDefaults.standard.string(forKey: "auth_token") {
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
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: "auth_token")
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
    
    func fetchProfile() {
        makeAuthenticatedRequest(
            endpoint: "/auth/profile",
            method: "GET",
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
            responseType: Challenge.self
        )
    }
    
    func submitChallenge(challengeId: Int, answer: Any, timeSpentSeconds: Int) -> AnyPublisher<ChallengeResult, APIError> {
        let submission = ChallengeSubmission(
            answer: AnyCodable(answer),
            timeSpentSeconds: timeSpentSeconds
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
            responseType: ChallengeStats.self
        )
    }
    
    func getLeaderboard(timeframe: String = "weekly") -> AnyPublisher<[LeaderboardEntry], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/leaderboard?timeframe=\(timeframe)",
            method: "GET",
            responseType: [LeaderboardEntry].self
        )
    }
    
    // MARK: - Echo Score
    
    func getEchoScore() -> AnyPublisher<EchoScore, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score",
            method: "GET",
            responseType: EchoScore.self
        )
    }
    
    func getEchoScoreHistory(days: Int = 30) -> AnyPublisher<[EchoScoreHistory], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score/history?days=\(days)",
            method: "GET",
            responseType: [EchoScoreHistory].self
        )
    }
    
    // MARK: - Private Methods
    
    private func handleAuthSuccess(_ response: AuthResponse) {
        UserDefaults.standard.set(response.token, forKey: "auth_token")
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
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                if error is DecodingError {
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
        guard let token = UserDefaults.standard.string(forKey: "auth_token") else {
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
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                if error is DecodingError {
                    return APIError.decodingError
                } else {
                    return APIError.networkError(error)
                }
            }
            .eraseToAnyPublisher()
    }
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case unauthorized
    case encodingError
    case decodingError
    case networkError(Error)
    
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
        }
    }
}

extension JSONDecoder {
    static let apiDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
} 