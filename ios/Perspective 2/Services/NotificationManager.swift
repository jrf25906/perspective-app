import UserNotifications
import UIKit
import Combine

class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()
    
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var deviceToken: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        checkAuthorizationStatus()
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { [weak self] granted, error in
            DispatchQueue.main.async {
                if granted {
                    self?.authorizationStatus = .authorized
                    self?.registerForRemoteNotifications()
                } else {
                    self?.authorizationStatus = .denied
                }
            }
        }
    }
    
    private func checkAuthorizationStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.authorizationStatus = settings.authorizationStatus
            }
        }
    }
    
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    func setDeviceToken(_ deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString
        
        // Send token to backend
        sendTokenToBackend(tokenString)
    }
    
    private func sendTokenToBackend(_ token: String) {
        // Implementation to send device token to your backend
        print("Device token: \(token)")
    }
    
    // MARK: - Local Notifications
    
    func scheduleDailyChallengeReminder(at time: DateComponents) {
        let content = UNMutableNotificationContent()
        content.title = "Daily Challenge Ready!"
        content.body = "Your perspective challenge is waiting. Take 5 minutes to expand your thinking."
        content.sound = .default
        content.badge = 1
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: time, repeats: true)
        let request = UNNotificationRequest(
            identifier: "daily-challenge",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            }
        }
    }
    
    func scheduleStreakReminder() {
        let content = UNMutableNotificationContent()
        content.title = "Don't Break Your Streak!"
        content.body = "You haven't completed today's challenge yet. Keep your streak alive!"
        content.sound = .default
        
        // Schedule for 8 PM if user hasn't completed challenge
        var dateComponents = DateComponents()
        dateComponents.hour = 20
        dateComponents.minute = 0
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        let request = UNNotificationRequest(
            identifier: "streak-reminder",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule streak reminder: \(error)")
            }
        }
    }
    
    func scheduleEchoScoreUpdate(newScore: Double, change: Double) {
        let content = UNMutableNotificationContent()
        content.title = "Echo Score Updated!"
        content.body = "Your Echo Score is now \(Int(newScore)) (\(change > 0 ? "+" : "")\(String(format: "%.1f", change)))"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "echo-score-update",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule echo score notification: \(error)")
            }
        }
    }
    
    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
    
    func cancelNotification(withIdentifier identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let identifier = response.notification.request.identifier
        
        switch identifier {
        case "daily-challenge":
            // Navigate to daily challenge
            NotificationCenter.default.post(name: .navigateToDailyChallenge, object: nil)
        case "streak-reminder":
            // Navigate to daily challenge
            NotificationCenter.default.post(name: .navigateToDailyChallenge, object: nil)
        case "echo-score-update":
            // Navigate to echo score dashboard
            NotificationCenter.default.post(name: .navigateToEchoScore, object: nil)
        default:
            break
        }
        
        completionHandler()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let navigateToDailyChallenge = Notification.Name("navigateToDailyChallenge")
    static let navigateToEchoScore = Notification.Name("navigateToEchoScore")
} 