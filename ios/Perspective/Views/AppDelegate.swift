import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize services
        _ = NetworkMonitor.shared
        _ = APIService.shared
        _ = OfflineDataManager.shared
        _ = BackgroundTaskManager.shared
        
        // Schedule background sync
        BackgroundTaskManager.shared.scheduleBackgroundSync()
        
        return true
    }
}