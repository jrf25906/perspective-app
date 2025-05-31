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
        
        // Get pending submissions
        if let pendingSubmissions = offlineManager.getPendingSubmissions() {
            for submission in pendingSubmissions {
                guard !isCancelled else { return }
                
                // Submit to server
                let semaphore = DispatchSemaphore(value: 0)
                
                APIService.shared.submitChallenge(
                    challengeId: submission.challengeId,
                    userAnswer: submission.answer,
                    timeSpent: submission.timeSpentSeconds
                )
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            print("Failed to sync submission: \(error)")
                        }
                        semaphore.signal()
                    },
                    receiveValue: { result in
                        // Mark submission as synced
                        offlineManager.markSubmissionAsSynced(submission.id)
                        print("Successfully synced submission for challenge \(submission.challengeId)")
                        semaphore.signal()
                    }
                )
                .store(in: &OfflineDataManager.shared.cancellables)
                
                _ = semaphore.wait(timeout: .now() + 10)
            }
        }
    }
    
    private func updateEchoScores() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        
        APIService.shared.getEchoScore()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to update echo score: \(error)")
                    }
                    semaphore.signal()
                },
                receiveValue: { echoScore in
                    // Cache the updated score
                    OfflineDataManager.shared.cacheEchoScore(echoScore)
                    print("Echo score updated successfully")
                    semaphore.signal()
                }
            )
            .store(in: &OfflineDataManager.shared.cancellables)
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
    
    private func fetchNewChallenges() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        
        APIService.shared.getTodayChallenge()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to fetch new challenges: \(error)")
                    }
                    semaphore.signal()
                },
                receiveValue: { challenge in
                    // Cache the challenge for offline use
                    OfflineDataManager.shared.cacheChallenge(challenge)
                    print("New challenge cached successfully")
                    semaphore.signal()
                }
            )
            .store(in: &OfflineDataManager.shared.cancellables)
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
    
    private func updateUserStats() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        
        APIService.shared.getChallengeStats()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to update user stats: \(error)")
                    }
                    semaphore.signal()
                },
                receiveValue: { stats in
                    // Cache the stats
                    print("User stats updated: \(stats.totalCompleted) challenges completed")
                    semaphore.signal()
                }
            )
            .store(in: &OfflineDataManager.shared.cancellables)
        
        _ = semaphore.wait(timeout: .now() + 10)
    }
}