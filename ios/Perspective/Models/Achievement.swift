import Foundation

// MARK: - Achievement Models

struct Achievement: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let category: AchievementCategory
    let rarity: AchievementRarity
    let requirement: AchievementRequirement
    let reward: AchievementReward?
    let isEarned: Bool
    let earnedDate: Date?
    let progress: Int
    let maxProgress: Int
    
    var progressPercentage: Double {
        guard maxProgress > 0 else { return 0 }
        return Double(progress) / Double(maxProgress)
    }
    
    var isCompleted: Bool {
        return progress >= maxProgress
    }
}

enum AchievementCategory: String, Codable, CaseIterable {
    case streak = "streak"
    case challenge = "challenge"
    case accuracy = "accuracy"
    case perspective = "perspective"
    case social = "social"
    case milestone = "milestone"
    
    var displayName: String {
        switch self {
        case .streak: return "Streak"
        case .challenge: return "Challenge"
        case .accuracy: return "Accuracy"
        case .perspective: return "Perspective"
        case .social: return "Social"
        case .milestone: return "Milestone"
        }
    }
    
    var color: String {
        switch self {
        case .streak: return "orange"
        case .challenge: return "blue"
        case .accuracy: return "green"
        case .perspective: return "purple"
        case .social: return "pink"
        case .milestone: return "yellow"
        }
    }
}

enum AchievementRarity: String, Codable, CaseIterable {
    case common = "common"
    case rare = "rare"
    case epic = "epic"
    case legendary = "legendary"
    
    var displayName: String {
        switch self {
        case .common: return "Common"
        case .rare: return "Rare"
        case .epic: return "Epic"
        case .legendary: return "Legendary"
        }
    }
    
    var color: String {
        switch self {
        case .common: return "gray"
        case .rare: return "blue"
        case .epic: return "purple"
        case .legendary: return "yellow"
        }
    }
}

struct AchievementRequirement: Codable {
    let type: RequirementType
    let value: Int
    let timeframe: Timeframe?
    
    enum RequirementType: String, Codable {
        case streakDays = "streak_days"
        case challengesCompleted = "challenges_completed"
        case accuracyPercentage = "accuracy_percentage"
        case consecutiveDays = "consecutive_days"
        case perspectivesExplored = "perspectives_explored"
        case echoScore = "echo_score"
    }
    
    enum Timeframe: String, Codable {
        case daily = "daily"
        case weekly = "weekly"
        case monthly = "monthly"
        case allTime = "all_time"
    }
}

struct AchievementReward: Codable {
    let type: RewardType
    let value: Int
    
    enum RewardType: String, Codable {
        case echoPoints = "echo_points"
        case badge = "badge"
        case title = "title"
    }
}

// MARK: - Achievement Manager

class AchievementManager: ObservableObject {
    static let shared = AchievementManager()
    
    @Published var achievements: [Achievement] = []
    @Published var earnedAchievements: [Achievement] = []
    @Published var recentlyEarned: [Achievement] = []
    
    private init() {
        loadAchievements()
    }
    
    private func loadAchievements() {
        achievements = defaultAchievements()
        // In a real app, load from API or local storage
    }
    
    func checkAchievements(for stats: UserStats) {
        var newlyEarned: [Achievement] = []
        
        for i in achievements.indices {
            if !achievements[i].isEarned && meetsRequirement(achievements[i], stats: stats) {
                achievements[i] = Achievement(
                    id: achievements[i].id,
                    title: achievements[i].title,
                    description: achievements[i].description,
                    icon: achievements[i].icon,
                    category: achievements[i].category,
                    rarity: achievements[i].rarity,
                    requirement: achievements[i].requirement,
                    reward: achievements[i].reward,
                    isEarned: true,
                    earnedDate: Date(),
                    progress: achievements[i].maxProgress,
                    maxProgress: achievements[i].maxProgress
                )
                
                newlyEarned.append(achievements[i])
                earnedAchievements.append(achievements[i])
            } else {
                // Update progress
                let progress = calculateProgress(for: achievements[i], stats: stats)
                achievements[i] = Achievement(
                    id: achievements[i].id,
                    title: achievements[i].title,
                    description: achievements[i].description,
                    icon: achievements[i].icon,
                    category: achievements[i].category,
                    rarity: achievements[i].rarity,
                    requirement: achievements[i].requirement,
                    reward: achievements[i].reward,
                    isEarned: achievements[i].isEarned,
                    earnedDate: achievements[i].earnedDate,
                    progress: progress,
                    maxProgress: achievements[i].maxProgress
                )
            }
        }
        
        if !newlyEarned.isEmpty {
            recentlyEarned.append(contentsOf: newlyEarned)
            // Trigger notification or celebration
        }
    }
    
    private func meetsRequirement(_ achievement: Achievement, stats: UserStats) -> Bool {
        let req = achievement.requirement
        
        switch req.type {
        case .streakDays:
            return stats.currentStreak >= req.value
        case .challengesCompleted:
            return stats.totalChallengesCompleted >= req.value
        case .accuracyPercentage:
            return stats.averageAccuracy >= Double(req.value)
        case .consecutiveDays:
            return stats.consecutiveDays >= req.value
        case .perspectivesExplored:
            return stats.perspectivesExplored >= req.value
        case .echoScore:
            return stats.echoScore >= Double(req.value)
        }
    }
    
    private func calculateProgress(for achievement: Achievement, stats: UserStats) -> Int {
        let req = achievement.requirement
        
        switch req.type {
        case .streakDays:
            return min(stats.currentStreak, req.value)
        case .challengesCompleted:
            return min(stats.totalChallengesCompleted, req.value)
        case .accuracyPercentage:
            return min(Int(stats.averageAccuracy), req.value)
        case .consecutiveDays:
            return min(stats.consecutiveDays, req.value)
        case .perspectivesExplored:
            return min(stats.perspectivesExplored, req.value)
        case .echoScore:
            return min(Int(stats.echoScore), req.value)
        }
    }
    
    func clearRecentlyEarned() {
        recentlyEarned.removeAll()
    }
}

// MARK: - User Stats (for achievement checking)

struct UserStats {
    let currentStreak: Int
    let totalChallengesCompleted: Int
    let averageAccuracy: Double
    let consecutiveDays: Int
    let perspectivesExplored: Int
    let echoScore: Double
}

// MARK: - Default Achievements

extension AchievementManager {
    private func defaultAchievements() -> [Achievement] {
        return [
            // Streak Achievements
            Achievement(
                id: "first_streak",
                title: "First Steps",
                description: "Complete your first daily challenge",
                icon: "foot.2",
                category: .streak,
                rarity: .common,
                requirement: AchievementRequirement(type: .streakDays, value: 1, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 10),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 1
            ),
            
            Achievement(
                id: "week_warrior",
                title: "Week Warrior",
                description: "Maintain a 7-day streak",
                icon: "flame",
                category: .streak,
                rarity: .rare,
                requirement: AchievementRequirement(type: .streakDays, value: 7, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 50),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 7
            ),
            
            Achievement(
                id: "month_master",
                title: "Month Master",
                description: "Achieve a 30-day streak",
                icon: "star.circle",
                category: .streak,
                rarity: .epic,
                requirement: AchievementRequirement(type: .streakDays, value: 30, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 200),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 30
            ),
            
            // Challenge Achievements
            Achievement(
                id: "challenge_novice",
                title: "Challenge Novice",
                description: "Complete 10 challenges",
                icon: "brain.head.profile",
                category: .challenge,
                rarity: .common,
                requirement: AchievementRequirement(type: .challengesCompleted, value: 10, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 25),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 10
            ),
            
            Achievement(
                id: "perspective_pro",
                title: "Perspective Pro",
                description: "Complete 50 challenges",
                icon: "eye.circle",
                category: .challenge,
                rarity: .rare,
                requirement: AchievementRequirement(type: .challengesCompleted, value: 50, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 100),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 50
            ),
            
            Achievement(
                id: "challenge_master",
                title: "Challenge Master",
                description: "Complete 100 challenges",
                icon: "crown",
                category: .challenge,
                rarity: .epic,
                requirement: AchievementRequirement(type: .challengesCompleted, value: 100, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 250),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 100
            ),
            
            // Accuracy Achievements
            Achievement(
                id: "sharp_shooter",
                title: "Sharp Shooter",
                description: "Achieve 80% average accuracy",
                icon: "target",
                category: .accuracy,
                rarity: .rare,
                requirement: AchievementRequirement(type: .accuracyPercentage, value: 80, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 75),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 80
            ),
            
            Achievement(
                id: "perfectionist",
                title: "Perfectionist",
                description: "Achieve 95% average accuracy",
                icon: "star.circle.fill",
                category: .accuracy,
                rarity: .legendary,
                requirement: AchievementRequirement(type: .accuracyPercentage, value: 95, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 300),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 95
            ),
            
            // Echo Score Achievements
            Achievement(
                id: "echo_explorer",
                title: "Echo Explorer",
                description: "Reach Echo Score of 100",
                icon: "waveform.path.ecg",
                category: .perspective,
                rarity: .rare,
                requirement: AchievementRequirement(type: .echoScore, value: 100, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 100),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 100
            ),
            
            Achievement(
                id: "perspective_sage",
                title: "Perspective Sage",
                description: "Reach Echo Score of 500",
                icon: "brain.head.profile.fill",
                category: .perspective,
                rarity: .legendary,
                requirement: AchievementRequirement(type: .echoScore, value: 500, timeframe: .allTime),
                reward: AchievementReward(type: .echoPoints, value: 500),
                isEarned: false,
                earnedDate: nil,
                progress: 0,
                maxProgress: 500
            )
        ]
    }
} 