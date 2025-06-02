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

// Note: Types are defined in their respective model files:
// - User, AuthResponse: User.swift
// - APIError: APIModels.swift
// - Challenge, ChallengeResult, ChallengeStats, LeaderboardEntry: Challenge.swift
// - EchoScore, EchoScoreHistory: EchoScore.swift 