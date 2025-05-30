import Foundation
import Combine

class OfflineDataManager: ObservableObject {
    static let shared = OfflineDataManager()
    
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isOnline = true
    @Published var pendingSyncCount = 0
    
    private let userPreferencesManager: UserPreferencesManager
    private let cacheManager: CacheManager
    private let syncManager: SyncManager
    
    // Re-export UserPreferences for backward compatibility
    typealias UserPreferences = UserPreferencesManager.UserPreferences
    
    // MARK: - UserDefaults Keys
    private enum UserDefaultsKeys {
        static let cachedChallenges = "cached_challenges"
        static let cachedNewsArticles = "cached_news_articles"
        static let cachedEchoScoreHistory = "cached_echo_score_history"
        static let challengeResponses = "challenge_responses"
        static let userPreferences = "user_preferences"
        static let lastSyncDate = "last_sync_date"
        static let offlineMode = "offline_mode_enabled"
    }
    
    // MARK: - User Preferences
    struct UserPreferences: Codable {
        var notificationsEnabled: Bool = true
        var dailyChallengeReminder: Bool = true
        var reminderTime: String = "09:00"
        var preferredDifficulty: ChallengeDifficulty = .intermediate
        var autoSyncEnabled: Bool = true
        var offlineModeEnabled: Bool = false
        var dataUsageOptimization: Bool = false
        var biasAlertSensitivity: Double = 0.7
        var themePreference: String = "system"
        var language: String = "en"
    }
    
    // MARK: - Challenge Response Storage
    struct ChallengeResponse: Codable {
        let challengeId: Int
        let userAnswer: String
        let timeSpent: Int
        let isCorrect: Bool
        let submittedAt: Date
        let syncStatus: SyncStatus
    }
    
    enum SyncStatus: String, Codable {
        case pending
        case synced
        case failed
    }
    
    init() {
        self.userPreferencesManager = UserPreferencesManager()
        self.cacheManager = CacheManager()
        self.syncManager = SyncManager(cacheManager: cacheManager, apiService: APIService.shared)
        
        // Bind sync manager's pending count
        syncManager.$pendingSyncCount
            .assign(to: &$pendingSyncCount)
        
        setupNetworkMonitoring()
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        NetworkMonitor.shared.$isConnected
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isConnected in
                self?.isOnline = isConnected
                if isConnected {
                    self?.syncManager.syncPendingData()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - User Preferences (Delegated)
    
    func saveUserPreferences(_ preferences: UserPreferences) {
        userPreferencesManager.saveUserPreferences(preferences)
    }
    
    func getUserPreferences() -> UserPreferences {
        return userPreferencesManager.getUserPreferences()
    }
    
    func updatePreference<T: Codable>(_ keyPath: WritableKeyPath<UserPreferences, T>, value: T) {
        userPreferencesManager.updatePreference(keyPath, value: value)
    }
    
    func setOfflineModeEnabled(_ enabled: Bool) {
        userPreferencesManager.setOfflineModeEnabled(enabled)
    }
    
    func isOfflineModeEnabled() -> Bool {
        return userPreferencesManager.isOfflineModeEnabled()
    }
    
    // MARK: - Challenge Response Management (Delegated)
    
    func saveChallengeResponse(challengeId: Int, userAnswer: String, timeSpent: Int, isCorrect: Bool) {
        syncManager.saveChallengeResponse(
            challengeId: challengeId,
            userAnswer: userAnswer,
            timeSpent: timeSpent,
            isCorrect: isCorrect,
            isOnline: isOnline
        )
    }
    
    // MARK: - Challenge Caching (Delegated)
    
    func getCachedChallenge() -> Challenge? {
        return cacheManager.getCachedChallenge()
    }
    
    func getCachedChallenges() -> [Challenge] {
        return cacheManager.getCachedChallenges()
    }
    
    func cacheChallenge(_ challenge: Challenge) {
        cacheManager.cacheChallenge(challenge)
    }
    
    func cacheChallenges(_ challenges: [Challenge]) {
        cacheManager.cacheChallenges(challenges)
    }
    
    // MARK: - News Article Caching (Delegated)
    
    func cacheNewsArticles(_ articles: [NewsArticle]) {
        cacheManager.cacheNewsArticles(articles)
    }
    
    func getCachedNewsArticles() -> [NewsArticle] {
        return cacheManager.getCachedNewsArticles()
    }
    
    func getCachedNewsArticles(category: String? = nil, limit: Int? = nil) -> [NewsArticle] {
        return cacheManager.getCachedNewsArticles(category: category, limit: limit)
    }
    
    // MARK: - Echo Score History Caching (Delegated)
    
    func cacheEchoScoreHistory(_ history: [EchoScoreHistory]) {
        cacheManager.cacheEchoScoreHistory(history)
    }
    
    func getCachedEchoScoreHistory() -> [EchoScoreHistory] {
        return cacheManager.getCachedEchoScoreHistory()
    }
    
    func getLatestEchoScore() -> EchoScoreHistory? {
        return cacheManager.getLatestEchoScore()
    }
    
    func getEchoScoreHistory(limit: Int? = nil) -> [EchoScoreHistory] {
        return cacheManager.getEchoScoreHistory(limit: limit)
    }
    
    // MARK: - Sync Management (Delegated)
    
    func getLastSyncDate() -> Date? {
        return syncManager.getLastSyncDate()
    }
    
    // MARK: - Cache Management (Delegated)
    
    func clearAllCache() {
        cacheManager.clearAllCache()
        syncManager.clearPendingData()
    }
    
    func getCacheSize() -> Int {
        return cacheManager.getCacheSize()
    }
}