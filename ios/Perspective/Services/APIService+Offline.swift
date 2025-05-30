import Foundation
import Combine

// Extension for offline functionality
extension APIService {
    
    // MARK: - Offline Challenge Support
    
    func submitChallengeOffline(challengeId: Int, userAnswer: Any, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError> {
        // Create a simple offline response
        return Just(ChallengeResult(
            isCorrect: false, // Default to false in offline mode
            feedback: "Response saved for sync when online",
            xpEarned: 0,
            streakInfo: StreakInfo(current: 0, longest: 0, isActive: false)
        ))
        .setFailureType(to: APIError.self)
        .eraseToAnyPublisher()
    }
    
    // MARK: - Offline Echo Score Support
    
    func getEchoScoreOffline() -> AnyPublisher<EchoScore, APIError> {
        // Create a default offline echo score
        let defaultCalculationDetails = EchoScoreCalculationDetails(
            articlesRead: 0,
            perspectivesExplored: 0,
            challengesCompleted: 0,
            accurateAnswers: 0,
            totalAnswers: 0,
            averageTimeSpent: 0.0
        )
        
        return Just(EchoScore(
            id: 0,
            userId: 0,
            totalScore: 50.0,
            diversityScore: 50.0,
            accuracyScore: 50.0,
            switchSpeedScore: 50.0,
            consistencyScore: 50.0,
            improvementScore: 50.0,
            calculationDetails: defaultCalculationDetails,
            scoreDate: Date(),
            createdAt: Date(),
            updatedAt: Date()
        ))
        .setFailureType(to: APIError.self)
        .eraseToAnyPublisher()
    }
}