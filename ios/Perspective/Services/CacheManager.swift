import Foundation

class CacheManager {
    private enum CacheKeys {
        static let challenges = "cached_challenges"
        static let newsArticles = "cached_news_articles"
        static let echoScoreHistory = "cached_echo_score_history"
    }
    
    // MARK: - Generic Cache Operations
    
    private func saveToCache<T: Encodable>(_ items: [T], key: String) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(items)
            UserDefaults.standard.set(data, forKey: key)
        } catch {
            print("Failed to save to cache (\(key)): \(error)")
        }
    }
    
    private func loadFromCache<T: Decodable>(_ type: T.Type, key: String) -> [T] {
        guard let data = UserDefaults.standard.data(forKey: key) else {
            return []
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([T].self, from: data)
        } catch {
            print("Failed to load from cache (\(key)): \(error)")
            return []
        }
    }
    
    // MARK: - Challenge Cache
    
    func getCachedChallenge() -> Challenge? {
        let challenges = getCachedChallenges()
        return challenges.randomElement()
    }
    
    func getCachedChallenges() -> [Challenge] {
        return loadFromCache(Challenge.self, key: CacheKeys.challenges)
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
        
        saveToCache(challenges, key: CacheKeys.challenges)
        print("Challenge cached: \(challenge.id)")
    }
    
    func cacheChallenges(_ challenges: [Challenge]) {
        saveToCache(challenges, key: CacheKeys.challenges)
        print("Challenges cached: \(challenges.count)")
    }
    
    // MARK: - News Article Cache
    
    func cacheNewsArticles(_ articles: [NewsArticle]) {
        saveToCache(articles, key: CacheKeys.newsArticles)
        print("Articles cached: \(articles.count)")
    }
    
    func getCachedNewsArticles() -> [NewsArticle] {
        return loadFromCache(NewsArticle.self, key: CacheKeys.newsArticles)
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
    
    // MARK: - Echo Score History Cache
    
    func cacheEchoScoreHistory(_ history: [EchoScoreHistory]) {
        saveToCache(history, key: CacheKeys.echoScoreHistory)
        print("Echo score history cached: \(history.count)")
    }
    
    func getCachedEchoScoreHistory() -> [EchoScoreHistory] {
        return loadFromCache(EchoScoreHistory.self, key: CacheKeys.echoScoreHistory)
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
    
    // MARK: - Cache Management
    
    func clearAllCache() {
        UserDefaults.standard.removeObject(forKey: CacheKeys.challenges)
        UserDefaults.standard.removeObject(forKey: CacheKeys.newsArticles)
        UserDefaults.standard.removeObject(forKey: CacheKeys.echoScoreHistory)
        print("All cache cleared")
    }
    
    func getCacheSize() -> Int {
        let challengesData = UserDefaults.standard.data(forKey: CacheKeys.challenges)
        let articlesData = UserDefaults.standard.data(forKey: CacheKeys.newsArticles)
        let echoData = UserDefaults.standard.data(forKey: CacheKeys.echoScoreHistory)
        
        return (challengesData?.count ?? 0) + 
               (articlesData?.count ?? 0) + 
               (echoData?.count ?? 0)
    }
} 