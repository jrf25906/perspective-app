import Foundation

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
    let requiredArticles: [Int]?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, type, title, prompt, content, options, explanation
        case correctAnswer = "correct_answer"
        case difficultyLevel = "difficulty_level"
        case requiredArticles = "required_articles"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum ChallengeType: String, Codable, CaseIterable {
    case biasSwap = "bias_swap"
    case logicPuzzle = "logic_puzzle"
    case synthesis = "synthesis"
    case dataLiteracy = "data_literacy"
    case moralReasoning = "moral_reasoning"
    case fallacyDetection = "fallacy_detection"
    
    var displayName: String {
        switch self {
        case .biasSwap: return "Bias Swap"
        case .logicPuzzle: return "Logic Puzzle"
        case .synthesis: return "Synthesis"
        case .dataLiteracy: return "Data Literacy"
        case .moralReasoning: return "Moral Reasoning"
        case .fallacyDetection: return "Fallacy Detection"
        }
    }
    
    var icon: String {
        switch self {
        case .biasSwap: return "arrow.left.arrow.right"
        case .logicPuzzle: return "puzzlepiece"
        case .synthesis: return "link"
        case .dataLiteracy: return "chart.bar"
        case .moralReasoning: return "scale.3d"
        case .fallacyDetection: return "exclamationmark.triangle"
        }
    }
}

struct ChallengeOption: Codable, Identifiable {
    let id: String
    let text: String
    let explanation: String?
}

struct ChallengeContent: Codable {
    let articles: [NewsArticle]?
    let scenario: String?
    let dataVisualization: String?
    let additionalContext: [String: String]?
    
    enum CodingKeys: String, CodingKey {
        case articles, scenario
        case dataVisualization = "data_visualization"
        case additionalContext = "additional_context"
    }
}

struct UserResponse: Codable {
    let challengeId: Int
    let userAnswer: String
    let timeSpentSeconds: Int
    
    enum CodingKeys: String, CodingKey {
        case challengeId = "challenge_id"
        case userAnswer = "user_answer"
        case timeSpentSeconds = "time_spent_seconds"
    }
}

struct ChallengeResult: Codable {
    let isCorrect: Bool
    let explanation: String
    let echoScoreChange: Double?
    
    enum CodingKeys: String, CodingKey {
        case isCorrect = "is_correct"
        case explanation
        case echoScoreChange = "echo_score_change"
    }
} 