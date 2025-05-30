import Foundation

struct EchoScore: Codable, Identifiable {
    let id: Int
    let userId: Int
    let totalScore: Double
    let diversityScore: Double
    let accuracyScore: Double
    let switchSpeedScore: Double
    let consistencyScore: Double
    let improvementScore: Double
    let calculationDetails: EchoScoreCalculationDetails
    let scoreDate: Date
    let createdAt: Date
    let updatedAt: Date
}

struct EchoScoreHistory: Codable, Identifiable {
    let id: Int
    let userId: Int
    let totalScore: Double
    let diversityScore: Double
    let accuracyScore: Double
    let switchSpeedScore: Double
    let consistencyScore: Double
    let improvementScore: Double
    let calculationDetails: EchoScoreCalculationDetails
    let scoreDate: Date
    let createdAt: Date
    let updatedAt: Date
}

struct EchoScoreCalculationDetails: Codable {
    let articlesRead: Int
    let perspectivesExplored: Int
    let challengesCompleted: Int
    let accurateAnswers: Int
    let totalAnswers: Int
    let averageTimeSpent: Double
}