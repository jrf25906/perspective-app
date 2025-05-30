import Foundation

class UserPreferencesManager {
    private enum UserDefaultsKeys {
        static let userPreferences = "user_preferences"
        static let offlineMode = "offline_mode_enabled"
    }
    
    // MARK: - User Preferences Model
    struct UserPreferences: Codable {
        var notificationsEnabled: Bool = true
        var dailyChallengeReminder: Bool = true
        var reminderTime: String = "09:00"
        var preferredDifficulty: ChallengeDifficulty = .intermediate
        var autoSyncEnabled: Bool = true
        var offlineModeEnabled: Bool = false
        var dataUsageOptimization: Bool = false
        var biasAlertSensitivity: Double = 0.7
        var themePreference: String = "system"
        var language: String = "en"
    }
    
    // MARK: - Public Methods
    
    func saveUserPreferences(_ preferences: UserPreferences) {
        do {
            let data = try JSONEncoder().encode(preferences)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.userPreferences)
            print("User preferences saved successfully")
        } catch {
            print("Failed to save user preferences: \(error)")
        }
    }
    
    func getUserPreferences() -> UserPreferences {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.userPreferences) else {
            return UserPreferences() // Return default preferences
        }
        
        do {
            return try JSONDecoder().decode(UserPreferences.self, from: data)
        } catch {
            print("Failed to decode user preferences: \(error)")
            return UserPreferences() // Return default preferences on error
        }
    }
    
    func updatePreference<T: Codable>(_ keyPath: WritableKeyPath<UserPreferences, T>, value: T) {
        var preferences = getUserPreferences()
        preferences[keyPath: keyPath] = value
        saveUserPreferences(preferences)
    }
    
    // MARK: - Offline Mode
    
    func setOfflineModeEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: UserDefaultsKeys.offlineMode)
        updatePreference(\.offlineModeEnabled, value: enabled)
    }
    
    func isOfflineModeEnabled() -> Bool {
        return UserDefaults.standard.bool(forKey: UserDefaultsKeys.offlineMode)
    }
} 