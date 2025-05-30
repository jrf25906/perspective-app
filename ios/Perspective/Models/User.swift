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
        case idToken = "idToken"
    }
}
