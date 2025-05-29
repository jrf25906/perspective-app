import Foundation
import Combine

extension APIService {
    // Enhanced methods with offline support
    
    func getTodayChallengeWithOfflineSupport() -> AnyPublisher<Challenge, APIError> {
        if NetworkMonitor.shared.isConnected {
            return getTodayChallenge()
                .handleEvents(receiveOutput: { challenge in
                    OfflineDataManager().cacheChallenge(challenge)
                })
                .eraseToAnyPublisher()
        } else {
            // Return cached challenge
            if let cachedChallenge = OfflineDataManager().getCachedChallenge() {
                return Just(cachedChallenge)
                    .setFailureType(to: APIError.self)
                    .eraseToAnyPublisher()
            } else {
                return Fail(error: APIError.networkError(NSError(domain: "Offline", code: 0, userInfo: [NSLocalizedDescriptionKey: "No cached challenge available"])))
                    .eraseToAnyPublisher()
            }
        }
    }
    
    func submitChallengeWithOfflineSupport(challengeId: Int, userAnswer: String, timeSpent: Int) -> AnyPublisher<ChallengeResult, APIError> {
        if NetworkMonitor.shared.isConnected {
            return submitChallenge(challengeId: challengeId, userAnswer: userAnswer, timeSpent: timeSpent)
                .eraseToAnyPublisher()
        } else {
            // Save for later sync
            OfflineDataManager().saveChallengeResponse(
                challengeId: challengeId,
                userAnswer: userAnswer,
                timeSpent: timeSpent,
                isCorrect: false // Will be determined when synced
            )
            
            // Return mock result for offline mode
            let result = ChallengeResult(
                isCorrect: true, // Optimistic response
                explanation: "Your response has been saved and will be processed when you're back online.",
                echoScoreChange: 0
            )
            
            return Just(result)
                .setFailureType(to: APIError.self)
                .eraseToAnyPublisher()
        }
    }
    
    func getEchoScoreWithOfflineSupport() -> AnyPublisher<EchoScore, APIError> {
        if NetworkMonitor.shared.isConnected {
            return getEchoScore()
                .eraseToAnyPublisher()
        } else {
            // Return cached score from user profile
            if let user = currentUser {
                let score = EchoScore(
                    totalScore: user.echoScore,
                    diversityScore: 0,
                    accuracyScore: 0,
                    switchSpeedScore: 0,
                    consistencyScore: 0,
                    improvementScore: 0
                )
                
                return Just(score)
                    .setFailureType(to: APIError.self)
                    .eraseToAnyPublisher()
            } else {
                return Fail(error: APIError.networkError(NSError(domain: "Offline", code: 0, userInfo: [NSLocalizedDescriptionKey: "No cached score available"])))
                    .eraseToAnyPublisher()
            }
        }
    }
} 