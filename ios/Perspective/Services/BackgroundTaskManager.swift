import Foundation
#if canImport(BackgroundTasks)
import BackgroundTasks
#endif
import Combine

class BackgroundTaskManager: ObservableObject {
    static let shared = BackgroundTaskManager()
    
    @Published var isProcessingBackgroundTasks = false
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        #if canImport(BackgroundTasks)
        registerBackgroundTasks()
        #endif
    }
    
    #if canImport(BackgroundTasks)
    private func registerBackgroundTasks() {
        // Register background task identifiers
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.perspective.background-sync",
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }
    #endif
    
    func scheduleBackgroundSync() {
        #if canImport(BackgroundTasks)
        let request = BGAppRefreshTaskRequest(identifier: "com.perspective.background-sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background sync scheduled successfully")
        } catch {
            print("Failed to schedule background sync: \(error)")
        }
        #else
        print("Background tasks not supported on this platform")
        #endif
    }
    
    #if canImport(BackgroundTasks)
    private func handleBackgroundSync(task: BGAppRefreshTask) {
        scheduleBackgroundSync() // Schedule the next background task
        
        let operation = BackgroundSyncOperation()
        
        task.expirationHandler = {
            operation.cancel()
        }
        
        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
        }
        
        OperationQueue().addOperation(operation)
    }
    #endif
}

class BackgroundSyncOperation: Operation, @unchecked Sendable {
    override func main() {
        guard !isCancelled else { return }
        
        print("Starting background sync...")
        
        // Sync pending challenge responses
        syncPendingChallengeResponses()
        
        // Update echo scores
        updateEchoScores()
        
        // Fetch new challenges
        fetchNewChallenges()
        
        // Update user stats
        updateUserStats()
        
        print("Background sync completed")
    }
    
    private func syncPendingChallengeResponses() {
        guard !isCancelled else { return }
        
        // Get offline data manager
        let offlineManager = OfflineDataManager.shared
        
        // TODO: Implement submission syncing when backend supports it
        // The OfflineDataManager currently stores submissions but doesn't expose
        // a method to retrieve pending ones. This will be implemented when
        // the backend adds support for offline submission syncing.
    }
    
    private func updateEchoScores() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        var cancellable: AnyCancellable?
        
        cancellable = APIService.shared.getEchoScore()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to update echo score: \(error)")
                    }
                    semaphore.signal()
                    cancellable?.cancel()
                },
                receiveValue: { echoScore in
                    // TODO: Cache the updated score when echo score caching is implemented
                    // OfflineDataManager.shared.cacheEchoScore(echoScore)
                    print("Echo score updated successfully")
                    semaphore.signal()
                    cancellable?.cancel()
                }
            )
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
    
    private func fetchNewChallenges() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        var cancellable: AnyCancellable?
        
        cancellable = APIService.shared.getTodayChallenge()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to fetch new challenges: \(error)")
                    }
                    semaphore.signal()
                    cancellable?.cancel()
                },
                receiveValue: { challenge in
                    // Cache the challenge for offline use
                    OfflineDataManager.shared.cacheChallenge(challenge)
                    print("New challenge cached successfully")
                    semaphore.signal()
                    cancellable?.cancel()
                }
            )
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
    
    private func updateUserStats() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        var cancellable: AnyCancellable?
        
        cancellable = APIService.shared.getChallengeStats()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to update user stats: \(error)")
                    }
                    semaphore.signal()
                    cancellable?.cancel()
                },
                receiveValue: { stats in
                    // Cache the stats
                    print("User stats updated: \(stats.totalCompleted) challenges completed")
                    semaphore.signal()
                    cancellable?.cancel()
                }
            )
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
}