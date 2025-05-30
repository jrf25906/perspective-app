import Foundation
import Combine

class OfflineDataManager: ObservableObject {
    static let shared = OfflineDataManager()
    
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isOnline = true
    @Published var pendingSyncCount = 0
    @Published var cachedChallengeCount = 0
    @Published var cachedArticleCount = 0
    @Published var cachedEchoScoreCount = 0
    
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
        setupNetworkMonitoring()
        updatePendingSyncCount()
        updateCacheCounts()
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        NetworkMonitor.shared.$isConnected
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isConnected in
                self?.isOnline = isConnected
                if isConnected {
                    self?.syncPendingData()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - User Preferences Storage
    
    func saveUserPreferences(_ preferences: UserPreferences) {
        do {
            let data = try JSONEncoder().encode(preferences)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.userPreferences)
            print("User preferences saved successfully")
        } catch {
            print("Failed to save user preferences: \(error)")
        }
    }
    
    func getUserPreferences() -> UserPreferences {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.userPreferences) else {
            return UserPreferences() // Return default preferences
        }
        
        do {
            return try JSONDecoder().decode(UserPreferences.self, from: data)
        } catch {
            print("Failed to decode user preferences: \(error)")
            return UserPreferences() // Return default preferences on error
        }
    }
    
    func updatePreference<T: Codable>(_ keyPath: WritableKeyPath<UserPreferences, T>, value: T) {
        var preferences = getUserPreferences()
        preferences[keyPath: keyPath] = value
        saveUserPreferences(preferences)
    }
    
    // MARK: - Challenge Response Management
    
    func saveChallengeResponse(challengeId: Int, userAnswer: String, timeSpent: Int, isCorrect: Bool) {
        let response = ChallengeResponse(
            challengeId: challengeId,
            userAnswer: userAnswer,
            timeSpent: timeSpent,
            isCorrect: isCorrect,
            submittedAt: Date(),
            syncStatus: isOnline ? .synced : .pending
        )
        
        var responses = getChallengeResponses()
        responses.append(response)
        saveChallengeResponses(responses)
        
        if !isOnline {
            updatePendingSyncCount()
        }
        
        print("Challenge response saved: \(challengeId), sync status: \(response.syncStatus)")
    }
    
    private func getChallengeResponses() -> [ChallengeResponse] {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.challengeResponses) else {
            return []
        }
        
        do {
            return try JSONDecoder().decode([ChallengeResponse].self, from: data)
        } catch {
            print("Failed to decode challenge responses: \(error)")
            return []
        }
    }
    
    private func saveChallengeResponses(_ responses: [ChallengeResponse]) {
        do {
            let data = try JSONEncoder().encode(responses)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.challengeResponses)
        } catch {
            print("Failed to save challenge responses: \(error)")
        }
    }
    
    // MARK: - Challenge Caching
    
    func getCachedChallenge() -> Challenge? {
        let challenges = getCachedChallenges()
        return challenges.randomElement()
    }
    
    func getCachedChallenges() -> [Challenge] {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedChallenges) else {
            return []
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([Challenge].self, from: data)
        } catch {
            print("Failed to decode cached challenges: \(error)")
            return []
        }
    }
    
    func cacheChallenge(_ challenge: Challenge) {
        var challenges = getCachedChallenges()
        
        // Remove existing challenge with same ID if it exists
        challenges.removeAll { $0.id == challenge.id }
        
        // Add the new/updated challenge
        challenges.append(challenge)
        
        // Keep only the most recent 50 challenges to manage storage
        if challenges.count > 50 {
            challenges = Array(challenges.suffix(50))
        }
        
        saveChallenges(challenges)
        print("Challenge cached: \(challenge.id)")
        updateCacheCounts()
    }
    
    func cacheChallenges(_ challenges: [Challenge]) {
        saveChallenges(challenges)
        print("Challenges cached: \(challenges.count)")
        updateCacheCounts()
    }
    
    private func saveChallenges(_ challenges: [Challenge]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(challenges)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.cachedChallenges)
        } catch {
            print("Failed to save cached challenges: \(error)")
        }
    }
    
    // MARK: - News Article Caching
    
    func cacheNewsArticles(_ articles: [NewsArticle]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(articles)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.cachedNewsArticles)
            print("Articles cached: \(articles.count)")
            updateCacheCounts()
        } catch {
            print("Failed to cache news articles: \(error)")
        }
    }
    
    func getCachedNewsArticles() -> [NewsArticle] {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedNewsArticles) else {
            return []
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([NewsArticle].self, from: data)
        } catch {
            print("Failed to decode cached news articles: \(error)")
            return []
        }
    }
    
    func getCachedNewsArticles(category: String? = nil, limit: Int? = nil) -> [NewsArticle] {
        var articles = getCachedNewsArticles()
        
        // Filter by category if specified
        if let category = category {
            articles = articles.filter { $0.category == category }
        }
        
        // Sort by publish date (most recent first)
        articles.sort { $0.publishedAt > $1.publishedAt }
        
        // Limit results if specified
        if let limit = limit {
            articles = Array(articles.prefix(limit))
        }
        
        return articles
    }
    
    // MARK: - Echo Score History Caching
    
    func cacheEchoScoreHistory(_ history: [EchoScoreHistory]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(history)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.cachedEchoScoreHistory)
            print("Echo score history cached: \(history.count)")
            updateCacheCounts()
        } catch {
            print("Failed to cache echo score history: \(error)")
        }
    }
    
    func getCachedEchoScoreHistory() -> [EchoScoreHistory] {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedEchoScoreHistory) else {
            return []
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([EchoScoreHistory].self, from: data)
        } catch {
            print("Failed to decode cached echo score history: \(error)")
            return []
        }
    }
    
    func getLatestEchoScore() -> EchoScoreHistory? {
        let history = getCachedEchoScoreHistory()
        return history.max(by: { $0.scoreDate < $1.scoreDate })
    }
    
    func getEchoScoreHistory(limit: Int? = nil) -> [EchoScoreHistory] {
        var history = getCachedEchoScoreHistory()
        
        // Sort by score date (most recent first)
        history.sort { $0.scoreDate > $1.scoreDate }
        
        // Limit results if specified
        if let limit = limit {
            history = Array(history.prefix(limit))
        }
        
        return history
    }

    // MARK: - Cache Metrics

    private func updateCacheCounts() {
        cachedChallengeCount = getCachedChallenges().count
        cachedArticleCount = getCachedNewsArticles().count
        cachedEchoScoreCount = getCachedEchoScoreHistory().count
    }

    // MARK: - Sync Management
    
    private func updatePendingSyncCount() {
        let responses = getChallengeResponses()
        let pendingCount = responses.filter { $0.syncStatus == .pending }.count
        
        DispatchQueue.main.async {
            self.pendingSyncCount = pendingCount
        }
    }
    
    private func syncPendingData() {
        guard isOnline else { return }
        
        syncPendingChallengeResponses()
        updateLastSyncDate()
        
        DispatchQueue.main.async {
            self.pendingSyncCount = 0
        }
    }
    
    private func syncPendingChallengeResponses() {
        var responses = getChallengeResponses()
        let pendingResponses = responses.filter { $0.syncStatus == .pending }
        
        // Mark pending responses as synced (in a real app, you'd send them to the server)
        for i in responses.indices {
            if responses[i].syncStatus == .pending {
                responses[i] = ChallengeResponse(
                    challengeId: responses[i].challengeId,
                    userAnswer: responses[i].userAnswer,
                    timeSpent: responses[i].timeSpent,
                    isCorrect: responses[i].isCorrect,
                    submittedAt: responses[i].submittedAt,
                    syncStatus: .synced
                )
            }
        }
        
        saveChallengeResponses(responses)
        print("Synced \(pendingResponses.count) pending challenge responses")
    }
    
    private func updateLastSyncDate() {
        UserDefaults.standard.set(Date(), forKey: UserDefaultsKeys.lastSyncDate)
    }
    
    func getLastSyncDate() -> Date? {
        return UserDefaults.standard.object(forKey: UserDefaultsKeys.lastSyncDate) as? Date
    }
    
    // MARK: - Cache Management
    
    func clearAllCache() {
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.cachedChallenges)
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.cachedNewsArticles)
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.cachedEchoScoreHistory)
        print("All cache cleared")
        updateCacheCounts()
    }
    
    func getCacheSize() -> Int {
        let challengesData = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedChallenges)
        let articlesData = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedNewsArticles)
        let echoData = UserDefaults.standard.data(forKey: UserDefaultsKeys.cachedEchoScoreHistory)
        let responsesData = UserDefaults.standard.data(forKey: UserDefaultsKeys.challengeResponses)
        
        return (challengesData?.count ?? 0) + 
               (articlesData?.count ?? 0) + 
               (echoData?.count ?? 0) + 
               (responsesData?.count ?? 0)
    }
    
    // MARK: - Offline Mode
    
    func setOfflineModeEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: UserDefaultsKeys.offlineMode)
        updatePreference(\.offlineModeEnabled, value: enabled)
    }
    
    func isOfflineModeEnabled() -> Bool {
        return UserDefaults.standard.bool(forKey: UserDefaultsKeys.offlineMode)
    }
}