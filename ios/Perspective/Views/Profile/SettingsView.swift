import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var offlineManager = OfflineDataManager.shared
    @State private var preferences: OfflineDataManager.UserPreferences
    @State private var showingClearCacheAlert = false
    @State private var showingResetAlert = false
    @State private var cacheSize: String = "Calculating..."
    
    init() {
        _preferences = State(initialValue: OfflineDataManager.shared.getUserPreferences())
    }
    
    var body: some View {
        NavigationView {
            Form {
                // MARK: - Network & Offline Section
                Section {
                    // Offline Mode Toggle
                    HStack {
                        Image(systemName: "wifi.slash")
                            .foregroundColor(preferences.offlineModeEnabled ? Material3.Colors.primary : Material3.Colors.onSurfaceVariant)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Offline Mode")
                                .font(Material3.Typography.bodyLarge)
                            Text("Use app without internet connection")
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                        
                        Spacer()
                        
                        Toggle("", isOn: $preferences.offlineModeEnabled)
                            .onChange(of: preferences.offlineModeEnabled) { newValue in
                                offlineManager.setOfflineModeEnabled(newValue)
                                savePreferences()
                            }
                    }
                    
                    // Auto Sync Toggle
                    HStack {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(preferences.autoSyncEnabled ? Material3.Colors.primary : Material3.Colors.onSurfaceVariant)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Auto Sync")
                                .font(Material3.Typography.bodyLarge)
                            Text("Automatically sync when online")
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                        
                        Spacer()
                        
                        Toggle("", isOn: $preferences.autoSyncEnabled)
                            .onChange(of: preferences.autoSyncEnabled) { _ in
                                savePreferences()
                            }
                    }
                    
                    // Data Usage Optimization
                    HStack {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .foregroundColor(preferences.dataUsageOptimization ? Material3.Colors.primary : Material3.Colors.onSurfaceVariant)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Optimize Data Usage")
                                .font(Material3.Typography.bodyLarge)
                            Text("Reduce bandwidth consumption")
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                        
                        Spacer()
                        
                        Toggle("", isOn: $preferences.dataUsageOptimization)
                            .onChange(of: preferences.dataUsageOptimization) { _ in
                                savePreferences()
                            }
                    }
                    
                } header: {
                    Text("Network & Offline")
                }
                
                // MARK: - Notifications Section
                Section {
                    HStack {
                        Image(systemName: "bell")
                            .foregroundColor(preferences.notificationsEnabled ? Material3.Colors.primary : Material3.Colors.onSurfaceVariant)
                            .frame(width: 24)
                        
                        Text("Enable Notifications")
                            .font(Material3.Typography.bodyLarge)
                        
                        Spacer()
                        
                        Toggle("", isOn: $preferences.notificationsEnabled)
                            .onChange(of: preferences.notificationsEnabled) { _ in
                                savePreferences()
                            }
                    }
                    
                    if preferences.notificationsEnabled {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(preferences.dailyChallengeReminder ? Material3.Colors.primary : Material3.Colors.onSurfaceVariant)
                                .frame(width: 24)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Daily Challenge Reminder")
                                    .font(Material3.Typography.bodyLarge)
                                Text("Get reminded to complete daily challenges")
                                    .font(Material3.Typography.bodySmall)
                                    .foregroundColor(Material3.Colors.onSurfaceVariant)
                            }
                            
                            Spacer()
                            
                            Toggle("", isOn: $preferences.dailyChallengeReminder)
                                .onChange(of: preferences.dailyChallengeReminder) { _ in
                                    savePreferences()
                                }
                        }
                        
                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(Material3.Colors.primary)
                                .frame(width: 24)
                            
                            Text("Reminder Time")
                                .font(Material3.Typography.bodyLarge)
                            
                            Spacer()
                            
                            Text(preferences.reminderTime)
                                .font(Material3.Typography.bodyMedium)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                    }
                    
                } header: {
                    Text("Notifications")
                }
                
                // MARK: - App Preferences Section
                Section {
                    // Preferred Difficulty
                    HStack {
                        Image(systemName: "gauge.medium")
                            .foregroundColor(Material3.Colors.primary)
                            .frame(width: 24)
                        
                        Text("Preferred Difficulty")
                            .font(Material3.Typography.bodyLarge)
                        
                        Spacer()
                        
                        Picker("Difficulty", selection: $preferences.preferredDifficulty) {
                            Text("Beginner").tag(ChallengeDifficulty.beginner)
                            Text("Intermediate").tag(ChallengeDifficulty.intermediate)
                            Text("Advanced").tag(ChallengeDifficulty.advanced)
                            Text("Expert").tag(ChallengeDifficulty.expert)
                        }
                        .pickerStyle(MenuPickerStyle())
                        .onChange(of: preferences.preferredDifficulty) { _ in
                            savePreferences()
                        }
                    }
                    
                    // Bias Alert Sensitivity
                    VStack(alignment: .leading, spacing: Material3.Spacing.small) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(Material3.Colors.primary)
                                .frame(width: 24)
                            
                            Text("Bias Alert Sensitivity")
                                .font(Material3.Typography.bodyLarge)
                        }
                        
                        HStack {
                            Text("Low")
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                            
                            Slider(value: $preferences.biasAlertSensitivity, in: 0.1...1.0, step: 0.1)
                                .onChange(of: preferences.biasAlertSensitivity) { _ in
                                    savePreferences()
                                }
                            
                            Text("High")
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                        
                        Text("Current: \(Int(preferences.biasAlertSensitivity * 100))%")
                            .font(Material3.Typography.labelSmall)
                            .foregroundColor(Material3.Colors.onSurfaceVariant)
                            .padding(.leading, 32)
                    }
                    
                    // Theme Preference
                    HStack {
                        Image(systemName: "paintbrush")
                            .foregroundColor(Material3.Colors.primary)
                            .frame(width: 24)
                        
                        Text("Theme")
                            .font(Material3.Typography.bodyLarge)
                        
                        Spacer()
                        
                        Picker("Theme", selection: $preferences.themePreference) {
                            Text("System").tag("system")
                            Text("Light").tag("light")
                            Text("Dark").tag("dark")
                        }
                        .pickerStyle(MenuPickerStyle())
                        .onChange(of: preferences.themePreference) { _ in
                            savePreferences()
                        }
                    }
                    
                } header: {
                    Text("App Preferences")
                }
                
                // MARK: - Cache & Storage Section
                Section {
                    HStack {
                        Image(systemName: "internaldrive")
                            .foregroundColor(Material3.Colors.primary)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Cache Size")
                                .font(Material3.Typography.bodyLarge)
                            Text(cacheSize)
                                .font(Material3.Typography.bodySmall)
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                        }
                        
                        Spacer()
                        
                        Button("Refresh") {
                            updateCacheSize()
                        }
                        .font(Material3.Typography.labelMedium)
                        .material3Button(.text)
                    }
                    
                    Button(action: {
                        showingClearCacheAlert = true
                    }) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(Material3.Colors.error)
                                .frame(width: 24)
                            
                            Text("Clear All Cache")
                                .font(Material3.Typography.bodyLarge)
                                .foregroundColor(Material3.Colors.error)
                            
                            Spacer()
                        }
                    }
                    
                    if let lastSync = offlineManager.getLastSyncDate() {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(Material3.Colors.onSurfaceVariant)
                                .frame(width: 24)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Last Sync")
                                    .font(Material3.Typography.bodyLarge)
                                Text(lastSync, style: .relative)
                                    .font(Material3.Typography.bodySmall)
                                    .foregroundColor(Material3.Colors.onSurfaceVariant)
                            }
                            
                            Spacer()
                        }
                    }
                    
                } header: {
                    Text("Cache & Storage")
                }
                
                // MARK: - About Section
                Section {
                    HStack {
                        Text("Version")
                            .font(Material3.Typography.bodyLarge)
                        Spacer()
                        Text("1.0.0")
                            .font(Material3.Typography.bodyMedium)
                            .foregroundColor(Material3.Colors.onSurfaceVariant)
                    }
                    
                    HStack {
                        Text("Build")
                            .font(Material3.Typography.bodyLarge)
                        Spacer()
                        Text("2024.1")
                            .font(Material3.Typography.bodyMedium)
                            .foregroundColor(Material3.Colors.onSurfaceVariant)
                    }
                    
                } header: {
                    Text("About")
                }
                
                // MARK: - Reset Section
                Section {
                    Button(action: {
                        showingResetAlert = true
                    }) {
                        HStack {
                            Image(systemName: "arrow.counterclockwise")
                                .foregroundColor(Material3.Colors.error)
                                .frame(width: 24)
                            
                            Text("Reset All Settings")
                                .font(Material3.Typography.bodyLarge)
                                .foregroundColor(Material3.Colors.error)
                            
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .material3Button(.text)
                }
            }
        }
        .onAppear {
            updateCacheSize()
        }
        .alert("Clear Cache", isPresented: $showingClearCacheAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Clear", role: .destructive) {
                clearCache()
            }
        } message: {
            Text("This will remove all cached challenges, news articles, and echo scores. This action cannot be undone.")
        }
        .alert("Reset Settings", isPresented: $showingResetAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Reset", role: .destructive) {
                resetAllSettings()
            }
        } message: {
            Text("This will reset all settings to their default values. This action cannot be undone.")
        }
    }
    
    // MARK: - Helper Methods
    
    private func savePreferences() {
        offlineManager.saveUserPreferences(preferences)
    }
    
    private func updateCacheSize() {
        let sizeInBytes = offlineManager.getCacheSize()
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        cacheSize = formatter.string(fromByteCount: Int64(sizeInBytes))
    }
    
    private func clearCache() {
        offlineManager.clearAllCache()
        updateCacheSize()
    }
    
    private func resetAllSettings() {
        preferences = OfflineDataManager.UserPreferences()
        savePreferences()
    }
}

// MARK: - Preview

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
} 