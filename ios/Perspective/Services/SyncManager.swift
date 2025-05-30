import Foundation
import Combine

class SyncManager: ObservableObject {
    @Published var pendingSyncCount = 0
    
    private let cacheManager: CacheManager
    private let apiService: APIService
    private var cancellables = Set<AnyCancellable>()
    
    private enum SyncKeys {
        static let challengeResponses = "challenge_responses"
        static let lastSyncDate = "last_sync_date"
    }
    
    // MARK: - Challenge Response Model
    
    struct ChallengeResponse: Codable {
        let challengeId: Int
        let userAnswer: String
        let timeSpent: Int
        let isCorrect: Bool
        let submittedAt: Date
        var syncStatus: SyncStatus
    }
    
    enum SyncStatus: String, Codable {
        case pending
        case synced
        case failed
    }
    
    init(cacheManager: CacheManager, apiService: APIService) {
        self.cacheManager = cacheManager
        self.apiService = apiService
        updatePendingSyncCount()
    }
    
    // MARK: - Challenge Response Management
    
    func saveChallengeResponse(
        challengeId: Int,
        userAnswer: String,
        timeSpent: Int,
        isCorrect: Bool,
        isOnline: Bool
    ) {
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
        guard let data = UserDefaults.standard.data(forKey: SyncKeys.challengeResponses) else {
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
            UserDefaults.standard.set(data, forKey: SyncKeys.challengeResponses)
        } catch {
            print("Failed to save challenge responses: \(error)")
        }
    }
    
    // MARK: - Sync Operations
    
    func syncPendingData() {
        syncPendingChallengeResponses()
        updateLastSyncDate()
        
        DispatchQueue.main.async {
            self.pendingSyncCount = 0
        }
    }
    
    private func syncPendingChallengeResponses() {
        var responses = getChallengeResponses()
        let pendingResponses = responses.filter { $0.syncStatus == .pending }
        
        guard !pendingResponses.isEmpty else { return }
        
        // In a real implementation, you would send these to the server
        // For now, we'll just mark them as synced
        for i in responses.indices {
            if responses[i].syncStatus == .pending {
                responses[i].syncStatus = .synced
            }
        }
        
        saveChallengeResponses(responses)
        print("Synced \(pendingResponses.count) pending challenge responses")
    }
    
    private func updatePendingSyncCount() {
        let responses = getChallengeResponses()
        let pendingCount = responses.filter { $0.syncStatus == .pending }.count
        
        DispatchQueue.main.async {
            self.pendingSyncCount = pendingCount
        }
    }
    
    // MARK: - Sync Date Management
    
    func updateLastSyncDate() {
        UserDefaults.standard.set(Date(), forKey: SyncKeys.lastSyncDate)
    }
    
    func getLastSyncDate() -> Date? {
        return UserDefaults.standard.object(forKey: SyncKeys.lastSyncDate) as? Date
    }
    
    // MARK: - Cleanup
    
    func clearPendingData() {
        UserDefaults.standard.removeObject(forKey: SyncKeys.challengeResponses)
        updatePendingSyncCount()
    }
} 