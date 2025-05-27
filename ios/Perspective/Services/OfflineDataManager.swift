import CoreData
import Foundation
import Combine

class OfflineDataManager: ObservableObject {
    private let persistenceController = PersistenceController.shared
    private let apiService = APIService.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isOnline = true
    @Published var pendingSyncCount = 0
    
    init() {
        setupNetworkMonitoring()
        setupAutoSync()
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        // Monitor network connectivity
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
    
    private func setupAutoSync() {
        // Auto-sync every 5 minutes when online
        Timer.publish(every: 300, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                if self?.isOnline == true {
                    self?.syncPendingData()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Challenge Management
    
    func saveChallengeResponse(challengeId: Int, userAnswer: String, timeSpent: Int, isCorrect: Bool) {
        persistenceController.performBackgroundTask { context in
            let challenge = ChallengeEntity(context: context)
            challenge.id = Int32(challengeId)
            challenge.userAnswer = userAnswer
            challenge.timeSpent = Int32(timeSpent)
            challenge.isCorrect = isCorrect
            challenge.isCompleted = true
            challenge.completedAt = Date()
            
            if !self.isOnline {
                // Mark for sync when online
                challenge.needsSync = true
                self.updatePendingSyncCount()
            }
        }
    }
    
    func getCachedChallenge() -> Challenge? {
        let context = persistenceController.viewContext
        let request: NSFetchRequest<ChallengeEntity> = ChallengeEntity.fetchRequest()
        request.predicate = NSPredicate(format: "isCompleted == NO")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \ChallengeEntity.createdAt, ascending: false)]
        request.fetchLimit = 1
        
        do {
            let challenges = try context.fetch(request)
            return challenges.first?.toChallenge()
        } catch {
            print("Failed to fetch cached challenge: \(error)")
            return nil
        }
    }
    
    func cacheChallenge(_ challenge: Challenge) {
        persistenceController.performBackgroundTask { context in
            let challengeEntity = ChallengeEntity(context: context)
            challengeEntity.updateFromChallenge(challenge)
        }
    }
    
    // MARK: - News Articles
    
    func cacheNewsArticles(_ articles: [NewsArticle]) {
        persistenceController.performBackgroundTask { context in
            for article in articles {
                let articleEntity = NewsArticleEntity(context: context)
                articleEntity.updateFromArticle(article)
            }
        }
    }
    
    func getCachedNewsArticles() -> [NewsArticle] {
        let context = persistenceController.viewContext
        let request: NSFetchRequest<NewsArticleEntity> = NewsArticleEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \NewsArticleEntity.publishedAt, ascending: false)]
        request.fetchLimit = 20
        
        do {
            let articles = try context.fetch(request)
            return articles.compactMap { $0.toNewsArticle() }
        } catch {
            print("Failed to fetch cached articles: \(error)")
            return []
        }
    }
    
    // MARK: - Echo Score History
    
    func cacheEchoScoreHistory(_ history: [EchoScoreHistory]) {
        persistenceController.performBackgroundTask { context in
            for score in history {
                let scoreEntity = EchoScoreHistoryEntity(context: context)
                scoreEntity.updateFromEchoScoreHistory(score)
            }
        }
    }
    
    func getCachedEchoScoreHistory() -> [EchoScoreHistory] {
        let context = persistenceController.viewContext
        let request: NSFetchRequest<EchoScoreHistoryEntity> = EchoScoreHistoryEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \EchoScoreHistoryEntity.scoreDate, ascending: true)]
        
        do {
            let scores = try context.fetch(request)
            return scores.compactMap { $0.toEchoScoreHistory() }
        } catch {
            print("Failed to fetch cached echo score history: \(error)")
            return []
        }
    }
    
    // MARK: - Sync Management
    
    private func syncPendingData() {
        guard isOnline else { return }
        
        syncPendingChallengeResponses()
        syncPendingUserData()
        updatePendingSyncCount()
    }
    
    private func syncPendingChallengeResponses() {
        let context = persistenceController.viewContext
        let request: NSFetchRequest<ChallengeEntity> = ChallengeEntity.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES AND isCompleted == YES")
        
        do {
            let pendingChallenges = try context.fetch(request)
            
            for challenge in pendingChallenges {
                guard let userAnswer = challenge.userAnswer else { continue }
                
                apiService.submitChallenge(
                    challengeId: Int(challenge.id),
                    userAnswer: userAnswer,
                    timeSpent: Int(challenge.timeSpent)
                )
                .sink(
                    receiveCompletion: { completion in
                        if case .finished = completion {
                            challenge.needsSync = false
                            self.persistenceController.save()
                        }
                    },
                    receiveValue: { _ in }
                )
                .store(in: &cancellables)
            }
        } catch {
            print("Failed to sync pending challenges: \(error)")
        }
    }
    
    private func syncPendingUserData() {
        // Sync any pending user profile changes
        // Implementation depends on specific user data that needs syncing
    }
    
    private func updatePendingSyncCount() {
        let context = persistenceController.viewContext
        let request: NSFetchRequest<ChallengeEntity> = ChallengeEntity.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES")
        
        do {
            let count = try context.count(for: request)
            DispatchQueue.main.async {
                self.pendingSyncCount = count
            }
        } catch {
            print("Failed to count pending sync items: \(error)")
        }
    }
}

// MARK: - Core Data Extensions

extension ChallengeEntity {
    func updateFromChallenge(_ challenge: Challenge) {
        self.id = Int32(challenge.id)
        self.type = challenge.type.rawValue
        self.title = challenge.title
        self.prompt = challenge.prompt
        self.difficultyLevel = Int32(challenge.difficultyLevel)
        self.createdAt = Date()
        
        // Encode content as JSON
        if let contentData = try? JSONEncoder().encode(challenge.content) {
            self.contentData = contentData
        }
    }
    
    func toChallenge() -> Challenge? {
        guard let type = ChallengeType(rawValue: self.type ?? ""),
              let contentData = self.contentData,
              let content = try? JSONDecoder().decode(ChallengeContent.self, from: contentData) else {
            return nil
        }
        
        return Challenge(
            id: Int(self.id),
            type: type,
            title: self.title ?? "",
            prompt: self.prompt ?? "",
            content: content,
            options: nil, // Would need to be stored separately or in content
            correctAnswer: nil,
            explanation: "",
            difficultyLevel: Int(self.difficultyLevel),
            requiredArticles: nil,
            isActive: true,
            createdAt: self.createdAt ?? Date(),
            updatedAt: self.createdAt ?? Date()
        )
    }
}

extension NewsArticleEntity {
    func updateFromArticle(_ article: NewsArticle) {
        self.id = Int32(article.id)
        self.title = article.title
        self.content = article.content
        self.source = article.source
        self.author = article.author
        self.url = article.url
        self.imageUrl = article.imageUrl
        self.biasRating = article.biasRating ?? 0
        self.category = article.category
        self.publishedAt = article.publishedAt
        self.createdAt = Date()
    }
    
    func toNewsArticle() -> NewsArticle? {
        return NewsArticle(
            id: Int(self.id),
            title: self.title ?? "",
            content: self.content ?? "",
            source: self.source ?? "",
            author: self.author,
            url: self.url ?? "",
            imageUrl: self.imageUrl,
            category: self.category,
            biasRating: self.biasRating,
            biasSource: nil,
            tags: nil,
            publishedAt: self.publishedAt ?? Date(),
            isActive: true,
            createdAt: self.createdAt ?? Date(),
            updatedAt: self.createdAt ?? Date()
        )
    }
}

extension EchoScoreHistoryEntity {
    func updateFromEchoScoreHistory(_ history: EchoScoreHistory) {
        self.id = Int32(history.id)
        self.totalScore = history.totalScore
        self.diversityScore = history.diversityScore
        self.accuracyScore = history.accuracyScore
        self.switchSpeedScore = history.switchSpeedScore
        self.consistencyScore = history.consistencyScore
        self.improvementScore = history.improvementScore
        self.scoreDate = history.scoreDate
        self.createdAt = Date()
        
        if let detailsData = try? JSONEncoder().encode(history.calculationDetails) {
            self.calculationDetailsData = detailsData
        }
    }
    
    func toEchoScoreHistory() -> EchoScoreHistory? {
        guard let calculationDetailsData = self.calculationDetailsData,
              let calculationDetails = try? JSONDecoder().decode(EchoScoreCalculationDetails.self, from: calculationDetailsData) else {
            return nil
        }
        
        return EchoScoreHistory(
            id: Int(self.id),
            userId: 0, // Would need to be stored
            totalScore: self.totalScore,
            diversityScore: self.diversityScore,
            accuracyScore: self.accuracyScore,
            switchSpeedScore: self.switchSpeedScore,
            consistencyScore: self.consistencyScore,
            improvementScore: self.improvementScore,
            calculationDetails: calculationDetails,
            scoreDate: self.scoreDate ?? Date(),
            createdAt: self.createdAt ?? Date(),
            updatedAt: self.createdAt ?? Date()
        )
    }
} 