import Foundation
import BackgroundTasks
import Combine

class BackgroundTaskManager: ObservableObject {
    static let shared = BackgroundTaskManager()
    
    @Published var isProcessingBackgroundTasks = false
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        registerBackgroundTasks()
    }
    
    private func registerBackgroundTasks() {
        // Register background task identifiers
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.perspective.background-sync",
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: "com.perspective.background-sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background sync scheduled successfully")
        } catch {
            print("Failed to schedule background sync: \(error)")
        }
    }
    
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
}

class BackgroundSyncOperation: Operation, @unchecked Sendable {
    private var cancellables = Set<AnyCancellable>()

    override func main() {
        guard !isCancelled else { return }

        let api = APIService.shared
        let offline = OfflineDataManager.shared
        let pending = offline.getPendingChallengeResponses()
        let group = DispatchGroup()

        for response in pending {
            if isCancelled { break }

            group.enter()
            api.submitChallenge(challengeId: response.challengeId,
                                userAnswer: response.userAnswer,
                                timeSpent: response.timeSpent)
                .sink(receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        print("Sync failed for challenge \(response.challengeId): \(err)")
                    } else {
                        offline.markChallengeResponsesSynced([response])
                    }
                    group.leave()
                }, receiveValue: { _ in })
                .store(in: &cancellables)
        }

        group.wait()

        guard !isCancelled else { return }

        group.enter()
        api.getEchoScore()
            .sink(receiveCompletion: { _ in
                group.leave()
            }, receiveValue: { score in
                print("Updated echo score: \(score.totalScore)")
            })
            .store(in: &cancellables)

        group.wait()

        guard !isCancelled else { return }

        group.enter()
        api.getTodayChallenge()
            .sink(receiveCompletion: { _ in
                group.leave()
            }, receiveValue: { challenge in
                offline.cacheChallenge(challenge)
            })
            .store(in: &cancellables)
        group.wait()

        guard !isCancelled else { return }

        group.enter()
        api.getAdaptiveChallenge()
            .sink(receiveCompletion: { _ in
                group.leave()
            }, receiveValue: { challenge in
                offline.cacheChallenge(challenge)
            })
            .store(in: &cancellables)

        group.wait()
        print("Background sync completed")
    }
}