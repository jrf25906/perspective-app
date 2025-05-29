import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("dailyReminderEnabled") private var dailyReminderEnabled = true
    @AppStorage("weeklyReportEnabled") private var weeklyReportEnabled = true
    @AppStorage("dataUsageOptimized") private var dataUsageOptimized = false
    @AppStorage("analyticsEnabled") private var analyticsEnabled = true
    
    var body: some View {
        NavigationView {
            Form {
                Section("Notifications") {
                    Toggle("Enable Notifications", isOn: $notificationsEnabled)
                    
                    if notificationsEnabled {
                        Toggle("Daily Challenge Reminder", isOn: $dailyReminderEnabled)
                        Toggle("Weekly Progress Report", isOn: $weeklyReportEnabled)
                    }
                }
                
                Section("Data & Privacy") {
                    Toggle("Optimize Data Usage", isOn: $dataUsageOptimized)
                    Toggle("Analytics & Insights", isOn: $analyticsEnabled)
                    
                    Button("Clear Cache") {
                        clearCache()
                    }
                    .foregroundColor(.blue)
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Build")
                        Spacer()
                        Text("2024.1")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section {
                    Button("Reset All Settings") {
                        resetAllSettings()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func clearCache() {
        // Implement cache clearing
        print("Cache cleared")
    }
    
    private func resetAllSettings() {
        notificationsEnabled = true
        dailyReminderEnabled = true
        weeklyReportEnabled = true
        dataUsageOptimized = false
        analyticsEnabled = true
    }
} 