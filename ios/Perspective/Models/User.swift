import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let username: String
    let firstName: String?
    let lastName: String?
    let avatarUrl: String?
    let isActive: Bool
    let emailVerified: Bool
    let echoScore: Double
    let biasProfile: BiasProfile?
    let preferredChallengeTime: String?
    let currentStreak: Int
    let lastActivityDate: Date?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, email, username
        case firstName = "first_name"
        case lastName = "last_name"
        case avatarUrl = "avatar_url"
        case isActive = "is_active"
        case emailVerified = "email_verified"
        case echoScore = "echo_score"
        case biasProfile = "bias_profile"
        case preferredChallengeTime = "preferred_challenge_time"
        case currentStreak = "current_streak"
        case lastActivityDate = "last_activity_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(Int.self, forKey: .id)
        email = try container.decode(String.self, forKey: .email)
        username = try container.decode(String.self, forKey: .username)
        firstName = try container.decodeIfPresent(String.self, forKey: .firstName)
        lastName = try container.decodeIfPresent(String.self, forKey: .lastName)
        avatarUrl = try container.decodeIfPresent(String.self, forKey: .avatarUrl)
        
        // Handle integer to boolean conversion
        if let isActiveInt = try? container.decode(Int.self, forKey: .isActive) {
            isActive = isActiveInt != 0
        } else {
            isActive = try container.decode(Bool.self, forKey: .isActive)
        }
        
        if let emailVerifiedInt = try? container.decode(Int.self, forKey: .emailVerified) {
            emailVerified = emailVerifiedInt != 0
        } else {
            emailVerified = try container.decode(Bool.self, forKey: .emailVerified)
        }
        
        echoScore = try container.decode(Double.self, forKey: .echoScore)
        biasProfile = try container.decodeIfPresent(BiasProfile.self, forKey: .biasProfile)
        preferredChallengeTime = try container.decodeIfPresent(String.self, forKey: .preferredChallengeTime)
        currentStreak = try container.decode(Int.self, forKey: .currentStreak)
        lastActivityDate = try container.decodeIfPresent(Date.self, forKey: .lastActivityDate)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)
    }
}

struct BiasProfile: Codable {
    let initialAssessmentScore: Double
    let politicalLean: Double // -3 to +3 scale
    let preferredSources: [String]
    let blindSpots: [String]
    let assessmentDate: Date
    
    enum CodingKeys: String, CodingKey {
        case initialAssessmentScore = "initial_assessment_score"
        case politicalLean = "political_lean"
        case preferredSources = "preferred_sources"
        case blindSpots = "blind_spots"
        case assessmentDate = "assessment_date"
    }
}

struct AuthResponse: Codable {
    let user: User
    let token: String
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let username: String
    let password: String
    let firstName: String?
    let lastName: String?
    
    enum CodingKeys: String, CodingKey {
        case email, username, password
        case firstName = "first_name"
        case lastName = "last_name"
    }
}

struct GoogleSignInRequest: Codable {
    let idToken: String
    
    enum CodingKeys: String, CodingKey {
        case idToken = "id_token"
    }
}

struct UserStatistics {
    let totalChallengesCompleted: Int
    let currentStreak: Int
    let longestStreak: Int
    let averageAccuracy: Double
    let totalTimeSpent: Int // in minutes
    let joinDate: Date
}
