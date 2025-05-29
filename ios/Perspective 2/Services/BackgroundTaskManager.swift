import UIKit
import BackgroundTasks
import Combine

class BackgroundTaskManager: ObservableObject {
    static let shared = BackgroundTaskManager()
    
    private let backgroundAppRefreshTaskIdentifier = "com.perspective.app.refresh"
    private let backgroundProcessingTaskIdentifier = "com.perspective.app.processing"
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        registerBackgroundTasks()
    }
    
    // MARK: - Registration
    
    private func registerBackgroundTasks() {
        // Register background app refresh
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundAppRefreshTaskIdentifier,
            using: nil
        ) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
        
        // Register background processing
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundProcessingTaskIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundProcessing(task: task as! BGProcessingTask)
        }
    }
    
    // MARK: - Scheduling
    
    func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: backgroundAppRefreshTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background app refresh scheduled")
        } catch {
            print("Could not schedule app refresh: \(error)")
        }
    }
    
    func scheduleBackgroundProcessing() {
        let request = BGProcessingTaskRequest(identifier: backgroundProcessingTaskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60) // 1 hour
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background processing scheduled")
        } catch {
            print("Could not schedule background processing: \(error)")
        }
    }
    
    // MARK: - Task Handlers
    
    private func handleAppRefresh(task: BGAppRefreshTask) {
        // Schedule the next background app refresh
        scheduleAppRefresh()
        
        // Create an operation to fetch new content
        let operation = AppRefreshOperation()
        
        task.expirationHandler = {
            operation.cancel()
        }
        
        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
        }
        
        // Execute the operation
        OperationQueue().addOperation(operation)
    }
    
    private func handleBackgroundProcessing(task: BGProcessingTask) {
        // Schedule the next background processing
        scheduleBackgroundProcessing()
        
        // Create an operation for heavy processing
        let operation = BackgroundProcessingOperation()
        
        task.expirationHandler = {
            operation.cancel()
        }
        
        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
        }
        
        // Execute the operation
        OperationQueue().addOperation(operation)
    }
}

// MARK: - Background Operations

class AppRefreshOperation: Operation {
    override func main() {
        guard !isCancelled else { return }
        
        // Fetch new challenge
        fetchTodayChallenge()
        
        guard !isCancelled else { return }
        
        // Sync pending data
        syncPendingData()
        
        guard !isCancelled else { return }
        
        // Update Echo Score
        updateEchoScore()
    }
    
    private func fetchTodayChallenge() {
        let semaphore = DispatchSemaphore(value: 0)
        
        APIService.shared.getTodayChallenge()
            .sink(
                receiveCompletion: { _ in
                    semaphore.signal()
                },
                receiveValue: { challenge in
                    OfflineDataManager().cacheChallenge(challenge)
                    semaphore.signal()
                }
            )
            .store(in: &Set<AnyCancellable>())
        
        semaphore.wait()
    }
    
    private func syncPendingData() {
        // Sync any pending offline data
        // Implementation would depend on OfflineDataManager
    }
    
    private func updateEchoScore() {
        let semaphore = DispatchSemaphore(value: 0)
        
        APIService.shared.getEchoScore()
            .sink(
                receiveCompletion: { _ in
                    semaphore.signal()
                },
                receiveValue: { score in
                    // Update local cache and potentially send notification
                    semaphore.signal()
                }
            )
            .store(in: &Set<AnyCancellable>())
        
        semaphore.wait()
    }
}

class BackgroundProcessingOperation: Operation {
    override func main() {
        guard !isCancelled else { return }
        
        // Perform heavy data processing
        processEchoScoreHistory()
        
        guard !isCancelled else { return }
        
        // Clean up old cached data
        cleanupOldData()
        
        guard !isCancelled else { return }
        
        // Pre-fetch content for tomorrow
        prefetchContent()
    }
    
    private func processEchoScoreHistory() {
        // Process and analyze Echo Score trends
        // Generate insights for the user
    }
    
    private func cleanupOldData() {
        // Remove old cached articles, completed challenges, etc.
        let context = PersistenceController.shared.container.newBackgroundContext()
        
        // Delete articles older than 30 days
        let articleRequest: NSFetchRequest<NewsArticleEntity> = NewsArticleEntity.fetchRequest()
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        articleRequest.predicate = NSPredicate(format: "createdAt < %@", thirtyDaysAgo as NSDate)
        
        do {
            let oldArticles = try context.fetch(articleRequest)
            for article in oldArticles {
                context.delete(article)
            }
            
            try context.save()
        } catch {
            print("Failed to cleanup old data: \(error)")
        }
    }
    
    private func prefetchContent() {
        // Pre-fetch tomorrow's challenge and related content
        // This improves user experience when they open the app
    }
} 