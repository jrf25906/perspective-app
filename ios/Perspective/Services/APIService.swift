import Foundation
import Combine

class APIService: ObservableObject, APIServiceProtocol {
    static let shared = APIService()
    
    private let baseURL = "http://127.0.0.1:3000/api"
    private let networkClient: NetworkClient
    private let requestBuilder: RequestBuilder
    private let authService: AuthenticationService
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private init() {
        self.networkClient = NetworkClient()
        self.requestBuilder = RequestBuilder(baseURL: baseURL)
        self.authService = AuthenticationService(baseURL: baseURL)
        
        // Bind authentication state
        authService.$isAuthenticated
            .assign(to: &$isAuthenticated)
        
        authService.$currentUser
            .assign(to: &$currentUser)
        
        // Check for stored token on init
        authService.checkAuthentication()
    }
    
    // MARK: - Authentication (Delegated to AuthService)
    
    func register(email: String, username: String, password: String, firstName: String? = nil, lastName: String? = nil) -> AnyPublisher<AuthResponse, APIError> {
        return authService.register(
            email: email,
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
    }
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError> {
        return authService.login(email: email, password: password)
    }
    
    func googleSignIn(idToken: String) -> AnyPublisher<AuthResponse, APIError> {
        return authService.googleSignIn(idToken: idToken)
    }
    
    func logout() {
        authService.logout()
    }
    
    func fetchProfile() {
        authService.fetchProfile()
    }
    
    // MARK: - Challenges
    
    func getTodayChallenge() -> AnyPublisher<Challenge, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/today",
            method: .GET,
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
            method: .POST,
            body: submission,
            responseType: ChallengeResult.self
        )
    }
    
    func getChallengeStats() -> AnyPublisher<ChallengeStats, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/stats",
            method: .GET,
            body: Optional<String>.none,
            responseType: ChallengeStats.self
        )
    }
    
    func getLeaderboard(timeframe: String = "weekly") -> AnyPublisher<[LeaderboardEntry], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/challenge/leaderboard?timeframe=\(timeframe)",
            method: .GET,
            body: Optional<String>.none,
            responseType: [LeaderboardEntry].self
        )
    }
    
    // MARK: - Echo Score
    
    func getEchoScore() -> AnyPublisher<EchoScore, APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score",
            method: .GET,
            body: Optional<String>.none,
            responseType: EchoScore.self
        )
    }
    
    func getEchoScoreHistory(days: Int = 30) -> AnyPublisher<[EchoScoreHistory], APIError> {
        return makeAuthenticatedRequest(
            endpoint: "/profile/echo-score/history?days=\(days)",
            method: .GET,
            body: Optional<String>.none,
            responseType: [EchoScoreHistory].self
        )
    }
    
    // MARK: - Private Methods
    
    private func makeAuthenticatedRequest<T: Codable, U: Codable>(
        endpoint: String,
        method: HTTPMethod,
        body: T? = nil,
        responseType: U.Type
    ) -> AnyPublisher<U, APIError> {
        guard let token = authService.authToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }
        
        do {
            let request: URLRequest
            if let body = body {
                request = try requestBuilder.buildRequest(
                    endpoint: endpoint,
                    method: method,
                    body: body,
                    headers: ["Authorization": "Bearer \(token)"]
                )
            } else {
                request = try requestBuilder.buildRequest(
                    endpoint: endpoint,
                    method: method,
                    headers: ["Authorization": "Bearer \(token)"]
                )
            }
            
            return networkClient.performRequest(request, responseType: responseType)
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
}

// The following types and extensions have been moved to APIModels.swift
// Remove them from here to avoid duplication

// MARK: - Async/Await Extensions

extension APIService {
    
    // MARK: - Challenge Methods
    
    func getTodayChallenge() async throws -> Challenge {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = getTodayChallenge()
                .sink(
                    receiveCompletion: { completion in
                        switch completion {
                        case .finished:
                            break
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { challenge in
                        continuation.resume(returning: challenge)
                        cancellable?.cancel()
                    }
                )
        }
    }
    
    func getChallengeStats() async throws -> ChallengeStats? {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = getChallengeStats()
                .sink(
                    receiveCompletion: { completion in
                        switch completion {
                        case .finished:
                            break
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { stats in
                        continuation.resume(returning: stats)
                        cancellable?.cancel()
                    }
                )
        }
    }
    
    func submitChallenge(challengeId: Int, userAnswer: Any, timeSpent: Int) async throws -> ChallengeResult {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = submitChallenge(challengeId: challengeId, userAnswer: userAnswer, timeSpent: timeSpent)
                .sink(
                    receiveCompletion: { completion in
                        switch completion {
                        case .finished:
                            break
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { result in
                        continuation.resume(returning: result)
                        cancellable?.cancel()
                    }
                )
        }
    }
    
    // MARK: - Achievement Methods
    
    func getUserAchievements() async throws -> [Achievement]? {
        // For now, return mock data until the backend endpoint is ready
        return [
            Achievement(
                id: "first_challenge",
                name: "First Steps",
                description: "Complete your first challenge",
                icon: "foot.2",
                pointValue: 50,
                isEarned: true,
                earnedAt: Date(),
                category: .milestone,
                requirements: [],
                rewards: []
            )
        ]
    }
} 