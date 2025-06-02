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
    
    var description: String {
        switch self {
        case .biasSwap:
            return "Challenge your assumptions by exploring opposing viewpoints"
        case .logicPuzzle:
            return "Test your logical reasoning skills"
        case .dataLiteracy:
            return "Analyze data and statistics critically"
        case .counterArgument:
            return "Develop arguments against your initial position"
        case .synthesis:
            return "Combine different perspectives into a cohesive understanding"
        case .ethicalDilemma:
            return "Navigate complex moral scenarios"
        }
    }
}

// MARK: - Challenge Difficulty
enum ChallengeDifficulty: Int, Codable, CaseIterable {
    case beginner = 1
    case intermediate = 2
    case advanced = 3
    case expert = 4
    
    var displayName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        case .expert: return "Expert"
        }
    }
    
    var color: String {
        switch self {
        case .beginner: return "green"
        case .intermediate: return "yellow"
        case .advanced: return "orange"
        case .expert: return "red"
        }
    }
}

// MARK: - Challenge
struct Challenge: Codable, Identifiable {
    let id: Int
    let type: ChallengeType
    let title: String
    let prompt: String
    let content: ChallengeContent
    let options: [ChallengeOption]?
    let correctAnswer: String?
    let explanation: String
    let difficultyLevel: Int
    let requiredArticles: [String]?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    let estimatedTimeMinutes: Int
    
    var difficulty: ChallengeDifficulty {
        return ChallengeDifficulty(rawValue: difficultyLevel) ?? .beginner
    }
    
    private enum CodingKeys: String, CodingKey {
        case id, type, title, prompt, content, options, explanation
        case correctAnswer = "correct_answer"
        case difficultyLevel = "difficulty_level"
        case requiredArticles = "required_articles"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case estimatedTimeMinutes = "estimated_time_minutes"
    }
}

// MARK: - Challenge Content
struct ChallengeContent: Codable {
    let text: String?
    let articles: [NewsReference]?
    let visualization: DataVisualization?
    let questions: [String]?
    let additionalContext: AnyCodable?
    let question: String?
    let options: [ChallengeOption]?
    let prompt: String?
    let referenceMaterial: [String]?
    let scenario: String?
    let stakeholders: [String]?
    let considerations: [String]?
    
    private enum CodingKeys: String, CodingKey {
        case text, articles, visualization, questions
        case additionalContext = "additional_context"
        case question, options, prompt
        case referenceMaterial = "reference_material"
        case scenario, stakeholders, considerations
    }
}

// MARK: - News Reference
struct NewsReference: Codable, Identifiable {
    let title: String
    let source: String
    let url: String
    let summary: String
    let biasRating: Double
    let publishedAt: Date
    let biasIndicators: [String]?
    
    var id: String { url }
    
    private enum CodingKeys: String, CodingKey {
        case title, source, url, summary
        case biasRating = "bias_rating"
        case publishedAt = "published_at"
        case biasIndicators = "bias_indicators"
    }
}

// MARK: - Challenge Option
struct ChallengeOption: Codable, Identifiable {
    let id: String
    let text: String
    let isCorrect: Bool
    let explanation: String?
    
    private enum CodingKeys: String, CodingKey {
        case id, text, explanation
        case isCorrect = "is_correct"
    }
}

// MARK: - Data Visualization
struct DataVisualization: Codable {
    let chartType: String
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
        case timeSpentSeconds = "time_spent_seconds"
    }
}

// MARK: - Streak Info
struct StreakInfo: Codable {
    let current: Int
    let longest: Int
    let isActive: Bool
    
    private enum CodingKeys: String, CodingKey {
        case current, longest
        case isActive = "is_active"
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
        case xpEarned = "xp_earned"
        case streakInfo = "streak_info"
    }
}

// MARK: - Challenge Stats
struct ChallengeStats: Codable {
    let totalCompleted: Int
    let currentStreak: Int
    let longestStreak: Int
    let averageAccuracy: Double
    let totalXpEarned: Int
    let challengesByType: [String: Int]
    let recentActivity: [ChallengeActivity]
    
    private enum CodingKeys: String, CodingKey {
        case totalCompleted = "total_completed"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case averageAccuracy = "average_accuracy"
        case totalXpEarned = "total_xp_earned"
        case challengesByType = "challenges_by_type"
        case recentActivity = "recent_activity"
    }
}

// MARK: - Challenge Activity
struct ChallengeActivity: Codable {
    let challengeId: Int
    let type: ChallengeType
    let isCorrect: Bool
    let completedAt: Date
    
    private enum CodingKeys: String, CodingKey {
        case challengeId = "challenge_id"
        case type
        case isCorrect = "is_correct"
        case completedAt = "completed_at"
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
        
        // Try decoding in order of likelihood
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let date = try? container.decode(Date.self) {
            // Handle Date type
            value = date
        } else if let array = try? container.decode([AnyCodable].self) {
            // Handle arrays recursively
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            // Handle dictionaries recursively
            var result: [String: Any] = [:]
            for (key, val) in dict {
                result[key] = val.value
            }
            value = result
        } else if container.decodeNil() {
            // Handle explicit null
            value = NSNull()
        } else {
            // Fallback
            throw DecodingError.typeMismatch(
                AnyCodable.self,
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Unable to decode AnyCodable"
                )
            )
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
        case let date as Date:
            try container.encode(date)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            var encodedDict: [String: AnyCodable] = [:]
            for (key, val) in dict {
                encodedDict[key] = AnyCodable(val)
            }
            try container.encode(encodedDict)
        case is NSNull:
            try container.encodeNil()
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