import Foundation
import Combine

/**
 * Refactored DailyChallengeViewModel using dependency injection
 * This demonstrates how to use protocols instead of concrete implementations
 */
class DailyChallengeViewModel: ObservableObject {
    @Published var currentChallenge: Challenge?
    @Published var isLoading = false
    @Published var isCompleted = false
    @Published var challengeResult: ChallengeResult?
    @Published var errorMessage: String?
    
    // Dependencies injected via initializer
    private let apiService: APIServiceProtocol
    private let offlineDataManager: OfflineDataManagerProtocol
    
    private var cancellables = Set<AnyCancellable>()
    private var startTime: Date?
    
    // Dependency injection through initializer
    init(apiService: APIServiceProtocol, 
         offlineDataManager: OfflineDataManagerProtocol) {
        self.apiService = apiService
        self.offlineDataManager = offlineDataManager
        loadTodayChallenge()
    }
    
    // Convenience initializer for production use
    convenience init() {
        self.init(
            apiService: DependencyContainer.shared.resolve(APIServiceProtocol.self),
            offlineDataManager: DependencyContainer.shared.resolve(OfflineDataManagerProtocol.self)
        )
    }
    
    func loadTodayChallenge() {
        isLoading = true
        errorMessage = nil
        
        // Check for offline cached challenge first
        if offlineDataManager.isOfflineModeEnabled() && !offlineDataManager.isOnline {
            if let cachedChallenge = offlineDataManager.getCachedChallenge() {
                self.currentChallenge = cachedChallenge
                self.startTime = Date()
                self.isCompleted = false
                self.challengeResult = nil
                self.isLoading = false
                return
            }
        }
        
        // Fetch from API
        apiService.getTodayChallenge()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        
                        // Try to use cached challenge on error
                        if let cachedChallenge = self?.offlineDataManager.getCachedChallenge() {
                            self?.currentChallenge = cachedChallenge
                            self?.startTime = Date()
                            self?.errorMessage = "Using cached challenge (offline)"
                        }
                    }
                },
                receiveValue: { [weak self] challenge in
                    self?.isLoading = false
                    self?.currentChallenge = challenge
                    self?.startTime = Date()
                    self?.isCompleted = false
                    self?.challengeResult = nil
                    
                    // Cache the challenge for offline use
                    self?.offlineDataManager.cacheChallenge(challenge)
                }
            )
            .store(in: &cancellables)
    }
    
    func submitChallenge(answer: Any) {
        guard let challenge = currentChallenge,
              let startTime = startTime else { return }
        
        let timeSpentSeconds = Int(Date().timeIntervalSince(startTime))
        
        isLoading = true
        
        // If offline, save locally
        if offlineDataManager.isOfflineModeEnabled() && !offlineDataManager.isOnline {
            // Save offline response
            offlineDataManager.saveChallengeResponse(
                challengeId: challenge.id,
                userAnswer: String(describing: answer),
                timeSpent: timeSpentSeconds,
                isCorrect: false // Will be validated on sync
            )
            
            // Show offline completion
            self.challengeResult = ChallengeResult(
                isCorrect: false,
                feedback: "Your answer has been saved and will be submitted when you're back online.",
                xpEarned: 0,
                streakInfo: StreakInfo(
                    current: 0,
                    longest: 0,
                    isActive: false
                )
            )
            self.isCompleted = true
            self.isLoading = false
            return
        }
        
        // Submit online
        apiService.submitChallenge(
            challengeId: challenge.id,
            userAnswer: answer,
            timeSpent: timeSpentSeconds
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                    
                    // Save offline if submission fails
                    self?.offlineDataManager.saveChallengeResponse(
                        challengeId: challenge.id,
                        userAnswer: String(describing: answer),
                        timeSpent: timeSpentSeconds,
                        isCorrect: false
                    )
                    
                    self?.errorMessage = "Submission failed. Saved for later sync."
                }
            },
            receiveValue: { [weak self] result in
                self?.isLoading = false
                self?.challengeResult = result
                self?.isCompleted = true
                
                // Update cached user data
                self?.apiService.fetchProfile()
            }
        )
        .store(in: &cancellables)
    }
}

// Example mock implementation for testing
#if DEBUG
class MockAPIService: APIServiceProtocol {
    var isAuthenticated: Bool = true
    var currentUser: User? = nil
    
    func register(email: String, username: String, password: String, firstName: String?, lastName: String?) -> AnyPublisher<AuthResponse, APIError> {
        // Mock implementation
        return Fail(error: APIError.unauthorized).eraseToAnyPublisher()
    }
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError> {
        // Mock implementation
        return Fail(error: APIError.unauthorized).eraseToAnyPublisher()
    }
    
    func googleSignIn(idToken: String) -> AnyPublisher<AuthResponse, APIError> {
        // Mock implementation
        return Fail(error: APIError.unauthorized).eraseToAnyPublisher()
    }
    
    func logout() {}
    func fetchProfile() {}
    
    func getTodayChallenge() -> AnyPublisher<Challenge, APIError> {
        // Return mock challenge for testing
        let mockContent = ChallengeContent(
            text: "This is a test challenge content",
            articles: nil,
            visualization: nil,
            questions: ["What do you think?"],
            additionalContext: nil,
            question: "Test question?",
            options: nil,
            prompt: "Test prompt",
            referenceMaterial: nil,
            scenario: nil,
            stakeholders: nil,
            considerations: nil
        )
        
        let mockOptions = [
            ChallengeOption(id: "A", text: "Option A", isCorrect: true, explanation: "This is correct"),
            ChallengeOption(id: "B", text: "Option B", isCorrect: false, explanation: nil),
            ChallengeOption(id: "C", text: "Option C", isCorrect: false, explanation: nil),
            ChallengeOption(id: "D", text: "Option D", isCorrect: false, explanation: nil)
        ]
        
        let mockChallenge = Challenge(
            id: 1,
            type: .biasSwap,
            title: "Test Challenge",
            prompt: "This is a test challenge prompt",
            content: mockContent,
            options: mockOptions,
            correctAnswer: "A",
            explanation: "Test explanation",
            difficultyLevel: 2,
            requiredArticles: nil,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date(),
            estimatedTimeMinutes: 5
        )
        return Just(mockChallenge)
            .setFailureType(to: APIError.self)
            .eraseToAnyPublisher()
    }
    
    func submitChallenge(challengeId: Int, userAnswer: Any, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError> {
        // Mock implementation
        let result = ChallengeResult(
            isCorrect: true,
            feedback: "Correct!",
            xpEarned: 100,
            streakInfo: StreakInfo(
                current: 1,
                longest: 1,
                isActive: true
            )
        )
        return Just(result)
            .setFailureType(to: APIError.self)
            .eraseToAnyPublisher()
    }
    
    func getChallengeStats() -> AnyPublisher<ChallengeStats, APIError> {
        // Mock implementation
        return Fail(error: APIError.notFound("Not implemented")).eraseToAnyPublisher()
    }
    
    func getLeaderboard(timeframe: String) -> AnyPublisher<[LeaderboardEntry], APIError> {
        // Mock implementation
        return Just([]).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
    
    func getEchoScore() -> AnyPublisher<EchoScore, APIError> {
        // Mock implementation
        return Fail(error: APIError.notFound("Not implemented")).eraseToAnyPublisher()
    }
    
    func getEchoScoreHistory(days: Int) -> AnyPublisher<[EchoScoreHistory], APIError> {
        // Mock implementation
        return Just([]).setFailureType(to: APIError.self).eraseToAnyPublisher()
    }
}
#endif 