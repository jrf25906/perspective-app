import Foundation

struct EchoScore: Codable {
    let totalScore: Double
    let diversityScore: Double
    let accuracyScore: Double
    let switchSpeedScore: Double
    let consistencyScore: Double
    let improvementScore: Double
    
    enum CodingKeys: String, CodingKey {
        case totalScore = "total_score"
        case diversityScore = "diversity_score"
        case accuracyScore = "accuracy_score"
        case switchSpeedScore = "switch_speed_score"
        case consistencyScore = "consistency_score"
        case improvementScore = "improvement_score"
    }
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
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case totalScore = "total_score"
        case diversityScore = "diversity_score"
        case accuracyScore = "accuracy_score"
        case switchSpeedScore = "switch_speed_score"
        case consistencyScore = "consistency_score"
        case improvementScore = "improvement_score"
        case calculationDetails = "calculation_details"
        case scoreDate = "score_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct EchoScoreCalculationDetails: Codable {
    let diversityMetrics: DiversityMetrics
    let accuracyMetrics: AccuracyMetrics
    let speedMetrics: SpeedMetrics
    let consistencyMetrics: ConsistencyMetrics
    let improvementMetrics: ImprovementMetrics
    
    enum CodingKeys: String, CodingKey {
        case diversityMetrics = "diversity_metrics"
        case accuracyMetrics = "accuracy_metrics"
        case speedMetrics = "speed_metrics"
        case consistencyMetrics = "consistency_metrics"
        case improvementMetrics = "improvement_metrics"
    }
}

struct DiversityMetrics: Codable {
    let giniIndex: Double
    let sourcesRead: [String]
    let biasRange: Double
    
    enum CodingKeys: String, CodingKey {
        case giniIndex = "gini_index"
        case sourcesRead = "sources_read"
        case biasRange = "bias_range"
    }
}

struct AccuracyMetrics: Codable {
    let correctAnswers: Int
    let totalAnswers: Int
    let recentAccuracy: Double
    
    enum CodingKeys: String, CodingKey {
        case correctAnswers = "correct_answers"
        case totalAnswers = "total_answers"
        case recentAccuracy = "recent_accuracy"
    }
}

struct SpeedMetrics: Codable {
    let medianResponseTime: Double
    let improvementTrend: Double
    
    enum CodingKeys: String, CodingKey {
        case medianResponseTime = "median_response_time"
        case improvementTrend = "improvement_trend"
    }
}

struct ConsistencyMetrics: Codable {
    let activeDays: Int
    let totalDays: Int
    let streakLength: Int
    
    enum CodingKeys: String, CodingKey {
        case activeDays = "active_days"
        case totalDays = "total_days"
        case streakLength = "streak_length"
    }
}

struct ImprovementMetrics: Codable {
    let accuracySlope: Double
    let speedSlope: Double
    let diversitySlope: Double
    
    enum CodingKeys: String, CodingKey {
        case accuracySlope = "accuracy_slope"
        case speedSlope = "speed_slope"
        case diversitySlope = "diversity_slope"
    }
} 