import SwiftUI
import BackgroundTasks

@main
struct PerspectiveApp: App {
    @StateObject private var apiService = APIService.shared
    @StateObject private var appStateManager = AppStateManager.shared
    @StateObject private var notificationManager = NotificationManager.shared
    @StateObject private var offlineDataManager = OfflineDataManager()
    @StateObject private var networkMonitor = NetworkMonitor.shared
    
    let persistenceController = PersistenceController.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(apiService)
                .environmentObject(appStateManager)
                .environmentObject(notificationManager)
                .environmentObject(offlineDataManager)
                .environmentObject(networkMonitor)
                .environment(\.managedObjectContext, persistenceController.viewContext)
                .onAppear {
                    setupApp()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
                    scheduleBackgroundTasks()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
                    handleAppForeground()
                }
        }
    }
    
    private func setupApp() {
        // Request notification permissions
        if notificationManager.authorizationStatus == .notDetermined {
            notificationManager.requestAuthorization()
        }
        
        // Setup daily challenge reminder
        setupDailyChallengeReminder()
        
        // Check for pending sync
        if networkMonitor.isConnected {
            offlineDataManager.syncPendingData()
        }
    }
    
    private func setupDailyChallengeReminder() {
        // Schedule daily reminder based on user preference
        var dateComponents = DateComponents()
        dateComponents.hour = 9 // Default to 9 AM
        dateComponents.minute = 0
        
        notificationManager.scheduleDailyChallengeReminder(at: dateComponents)
    }
    
    private func scheduleBackgroundTasks() {
        BackgroundTaskManager.shared.scheduleAppRefresh()
        BackgroundTaskManager.shared.scheduleBackgroundProcessing()
        persistenceController.save()
    }
    
    private func handleAppForeground() {
        // Refresh data when app comes to foreground
        if networkMonitor.isConnected {
            apiService.fetchProfile()
        }
        
        // Clear badge count
        UIApplication.shared.applicationIconBadgeNumber = 0
    }
}

// MARK: - App Delegate for Push Notifications

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        return true
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationManager.shared.setDeviceToken(deviceToken)
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
}
