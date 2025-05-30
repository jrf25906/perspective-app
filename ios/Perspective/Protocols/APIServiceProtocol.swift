import Foundation
import Combine

/**
 * Protocol defining the API service interface
 * This allows for dependency injection and easier testing
 */
protocol APIServiceProtocol {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }
    
    // Authentication
    func register(email: String, username: String, password: String, firstName: String?, lastName: String?) -> AnyPublisher<AuthResponse, APIError>
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError>
    func googleSignIn(idToken: String) -> AnyPublisher<AuthResponse, APIError>
    func logout()
    func fetchProfile()
    
    // Challenges
    func getTodayChallenge() -> AnyPublisher<Challenge, APIError>
    func submitChallenge(challengeId: Int, userAnswer: Any, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError>
    func getChallengeStats() -> AnyPublisher<ChallengeStats, APIError>
    func getLeaderboard(timeframe: String) -> AnyPublisher<[LeaderboardEntry], APIError>
    
    // Echo Score
    func getEchoScore() -> AnyPublisher<EchoScore, APIError>
    func getEchoScoreHistory(days: Int) -> AnyPublisher<[EchoScoreHistory], APIError>
}

// Re-export types from APIModels for convenience
typealias User = AuthResponse.User
typealias AuthResponse = APIModels.AuthResponse
typealias APIError = APIModels.APIError
typealias Challenge = APIModels.Challenge
typealias ChallengeResult = APIModels.ChallengeResult
typealias ChallengeStats = APIModels.ChallengeStats
typealias LeaderboardEntry = APIModels.LeaderboardEntry
typealias EchoScore = APIModels.EchoScore
typealias EchoScoreHistory = APIModels.EchoScoreHistory 