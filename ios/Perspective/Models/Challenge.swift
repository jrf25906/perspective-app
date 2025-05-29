import Foundation

// MARK: - Challenge Type
enum ChallengeType: String, Codable, CaseIterable {
    case biasSwap = "bias_swap"
    case logicPuzzle = "logic_puzzle"
    case dataLiteracy = "data_literacy"
    case counterArgument = "counter_argument"
    case synthesis = "synthesis"
    case ethicalDilemma = "ethical_dilemma"
    
    var displayName: String {
        switch self {
        case .biasSwap: return "Bias Swap"
        case .logicPuzzle: return "Logic Puzzle"
        case .dataLiteracy: return "Data Literacy"
        case .counterArgument: return "Counter-Argument"
        case .synthesis: return "Synthesis"
        case .ethicalDilemma: return "Ethical Dilemma"
        }
    }
    
    var icon: String {
        switch self {
        case .biasSwap: return "arrow.left.arrow.right"
        case .logicPuzzle: return "puzzlepiece"
        case .dataLiteracy: return "chart.bar"
        case .counterArgument: return "bubble.left.and.bubble.right"
        case .synthesis: return "link"
        case .ethicalDilemma: return "scalemass"
        }
    }
}

// MARK: - Difficulty Level
enum DifficultyLevel: String, Codable, CaseIterable {
    case beginner = "beginner"
    case intermediate = "intermediate"
    case advanced = "advanced"
    
    var displayName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }
    
    var level: Int {
        switch self {
        case .beginner: return 1
        case .intermediate: return 3
        case .advanced: return 5
        }
    }
}

// MARK: - Challenge Model
struct Challenge: Codable, Identifiable {
    let id: Int
    let type: ChallengeType
    let difficulty: DifficultyLevel
    let title: String
    let description: String
    let instructions: String
    let content: ChallengeContent
    let skillsTested: [String]
    let estimatedTimeMinutes: Int
    let xpReward: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    private enum CodingKeys: String, CodingKey {
        case id, type, difficulty, title, description, instructions, content
        case skillsTested = "skills_tested"
        case estimatedTimeMinutes = "estimated_time_minutes"
        case xpReward = "xp_reward"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Challenge Content
struct ChallengeContent: Codable {
    // For bias swap challenges
    let articles: [BiasArticle]?
    
    // For logic puzzles and multiple choice
    let question: String?
    let options: [ChallengeOption]?
    
    // For data literacy
    let data: DataVisualization?
    
    // For counter-argument and synthesis
    let prompt: String?
    let referenceMaterial: [String]?
    
    // For ethical dilemmas
    let scenario: String?
    let stakeholders: [String]?
    let considerations: [String]?
    
    // Additional fields
    let dataVisualization: String?
    let additionalContext: AnyCodable?
    
    private enum CodingKeys: String, CodingKey {
        case articles, question, options, data, prompt, scenario, stakeholders, considerations
        case referenceMaterial = "reference_material"
        case dataVisualization = "data_visualization"
        case additionalContext = "additional_context"
    }
}

// MARK: - Supporting Types
struct BiasArticle: Codable, Identifiable {
    let id: String
    let title: String
    let content: String
    let source: String
    let biasIndicators: [String]?
    
    private enum CodingKeys: String, CodingKey {
        case id, title, content, source
        case biasIndicators = "bias_indicators"
    }
}

struct ChallengeOption: Codable, Identifiable {
    let id: String
    let text: String
}

struct DataVisualization: Codable {
    let chartType: String?
    let dataPoints: [AnyCodable]?
    let misleadingElements: [String]?
    
    private enum CodingKeys: String, CodingKey {
        case chartType = "chart_type"
        case dataPoints = "data_points"
        case misleadingElements = "misleading_elements"
    }
}

// MARK: - Challenge Submission
struct ChallengeSubmission: Codable {
    let answer: AnyCodable
    let timeSpentSeconds: Int
    
    private enum CodingKeys: String, CodingKey {
        case answer
        case timeSpentSeconds = "timeSpentSeconds"
    }
}

// MARK: - Challenge Result
struct ChallengeResult: Codable {
    let isCorrect: Bool
    let feedback: String
    let xpEarned: Int
    let streakInfo: StreakInfo
    
    private enum CodingKeys: String, CodingKey {
        case isCorrect
        case feedback
        case xpEarned
        case streakInfo
    }
}

struct StreakInfo: Codable {
    let currentStreak: Int
    let streakMaintained: Bool
    let isNewRecord: Bool
}

// MARK: - Challenge Stats
struct ChallengeStats: Codable {
    let userId: Int
    let totalCompleted: Int
    let totalCorrect: Int
    let currentStreak: Int
    let longestStreak: Int
    let lastChallengeDate: Date?
    let difficultyPerformance: [String: PerformanceMetrics]
    let typePerformance: [String: PerformanceMetrics]
    
    private enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case totalCompleted = "total_completed"
        case totalCorrect = "total_correct"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case lastChallengeDate = "last_challenge_date"
        case difficultyPerformance = "difficulty_performance"
        case typePerformance = "type_performance"
    }
}

struct PerformanceMetrics: Codable {
    let completed: Int
    let correct: Int
    let averageTimeSeconds: Int
    
    private enum CodingKeys: String, CodingKey {
        case completed
        case correct
        case averageTimeSeconds = "average_time_seconds"
    }
}

// MARK: - AnyCodable Helper
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}

// MARK: - Leaderboard Entry
struct LeaderboardEntry: Codable, Identifiable {
    let id: Int
    let username: String
    let avatarUrl: String?
    let challengesCompleted: Int
    let totalXp: Int
    let correctAnswers: Int
    
    var successRate: Double {
        guard challengesCompleted > 0 else { return 0 }
        return Double(correctAnswers) / Double(challengesCompleted)
    }
    
    private enum CodingKeys: String, CodingKey {
        case id
        case username
        case avatarUrl = "avatar_url"
        case challengesCompleted = "challenges_completed"
        case totalXp = "total_xp"
        case correctAnswers = "correct_answers"
    }
} 