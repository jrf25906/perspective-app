import Foundation
import Combine

class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL: String
    private let networkClient: NetworkClient
    private let requestBuilder: RequestBuilder
    private let authService: AuthenticationService
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isOffline = false
    
    private init() {
        // Configure base URL based on environment
        #if targetEnvironment(simulator)
        // Use localhost for simulator - more reliable than 127.0.0.1
        self.baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api"
        #else
        // Use actual server URL for device
        self.baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api"
        #endif
        
        print("🔧 APIService initialized with base URL: \(self.baseURL)")
        
        self.networkClient = NetworkClient()
        self.requestBuilder = RequestBuilder(baseURL: baseURL)
        self.authService = AuthenticationService(baseURL: baseURL)
        
        // Bind authentication state
        authService.$isAuthenticated
            .assign(to: &$isAuthenticated)
        
        authService.$currentUser
            .assign(to: &$currentUser)
        
        // Monitor network status
        setupNetworkMonitoring()
        
        // Listen for token expiration
        NotificationCenter.default.publisher(for: .authTokenExpired)
            .sink { [weak self] _ in
                self?.handleTokenExpiration()
            }
            .store(in: &cancellables)
        
        // Check for stored token on init
        authService.checkAuthentication()
    }
    
    private func setupNetworkMonitoring() {
        NetworkMonitor.shared.$isConnected
            .map { !$0 }
            .assign(to: &$isOffline)
    }
    
    private func handleTokenExpiration() {
        // Clear current auth state
        authService.logout()
        
        // TODO: Implement token refresh logic here
        // For now, just notify the user they need to log in again
        NotificationCenter.default.post(
            name: .userNeedsToReauthenticate,
            object: nil
        )
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
        // Check offline cache first if offline
        if isOffline {
            if let cachedChallenge = OfflineDataManager.shared.getCachedDailyChallenge() {
                return Just(cachedChallenge)
                    .setFailureType(to: APIError.self)
                    .eraseToAnyPublisher()
            }
        }
        
        return makeAuthenticatedRequest(
            endpoint: "/challenge/today",
            method: .GET,
            body: Optional<String>.none,
            responseType: Challenge.self
        )
        .handleEvents(
            receiveOutput: { challenge in
                // Cache the challenge for offline use
                OfflineDataManager.shared.cacheDailyChallenge(challenge)
                print("✅ Successfully decoded challenge: \(challenge.title)")
            },
            receiveCompletion: { completion in
                if case .failure(let error) = completion {
                    print("❌ Challenge loading failed: \(error.localizedDescription)")
                    
                    // Additional logging for decoding errors
                    if case APIError.decodingError = error {
                        print("❌ This is a decoding error. Check console output for detailed error info.")
                        print("❌ Common causes:")
                        print("   - Backend sending different field names than expected")
                        print("   - Date format mismatch")
                        print("   - Missing required fields")
                        print("   - Type mismatches (e.g., string instead of int)")
                    }
                }
            }
        )
        .eraseToAnyPublisher()
    }
    
    func submitChallenge(challengeId: Int, userAnswer: Any, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError> {
        let submission = ChallengeSubmission(
            answer: AnyCodable(userAnswer),
            timeSpentSeconds: timeSpent
        )
        
        // Handle offline submission
        if isOffline {
            // Queue for later sync
            OfflineDataManager.shared.queueChallengeSubmission(
                challengeId: challengeId,
                submission: submission
            )
            
            // Return optimistic response
            let optimisticResult = ChallengeResult(
                isCorrect: false,
                feedback: "Your answer has been saved and will be submitted when you're back online.",
                xpEarned: 0,
                streakInfo: StreakInfo(current: 0, longest: 0, isActive: false)
            )
            
            return Just(optimisticResult)
                .setFailureType(to: APIError.self)
                .eraseToAnyPublisher()
        }
        
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
                .catch { [weak self] error -> AnyPublisher<U, APIError> in
                    // Handle specific errors
                    if case APIError.unauthorized = error {
                        self?.handleTokenExpiration()
                    }
                    return Fail(error: error).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
}

// MARK: - Notification Names Extension

extension Notification.Name {
    static let userNeedsToReauthenticate = Notification.Name("userNeedsToReauthenticate")
}

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
                title: "First Steps",
                description: "Complete your first challenge",
                icon: "foot.2",
                category: .milestone,
                rarity: .common,
                requirement: AchievementRequirement(
                    type: .challengesCompleted,
                    value: 1,
                    timeframe: .allTime
                ),
                reward: AchievementReward(
                    type: .echoPoints,
                    value: 50
                ),
                isEarned: true,
                earnedDate: Date(),
                progress: 1,
                maxProgress: 1
            )
        ]
    }
}