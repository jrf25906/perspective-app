import SwiftUI

struct ProfileSettingsSectionView: View {
    let onShowSettings: () -> Void
    let onLogout: () -> Void
    
    @State private var showingLogoutConfirmation = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Account")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                SettingsRowView(
                    title: "Settings",
                    subtitle: "Notifications, privacy, and more",
                    icon: "gearshape",
                    color: .gray,
                    action: onShowSettings
                )
                
                SettingsRowView(
                    title: "Privacy Policy",
                    subtitle: "How we protect your data",
                    icon: "hand.raised",
                    color: .blue,
                    action: { openPrivacyPolicy() }
                )
                
                SettingsRowView(
                    title: "Terms of Service",
                    subtitle: "App usage terms and conditions",
                    icon: "doc.text",
                    color: .green,
                    action: { openTermsOfService() }
                )
                
                SettingsRowView(
                    title: "Help & Support",
                    subtitle: "Get help or contact support",
                    icon: "questionmark.circle",
                    color: .orange,
                    action: { openSupport() }
                )
                
                Divider()
                    .padding(.vertical, 4)
                
                Button(action: {
                    showingLogoutConfirmation = true
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.title3)
                            .foregroundColor(.red)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Sign Out")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.red)
                            
                            Text("Sign out of your account")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
                .buttonStyle(PlainButtonStyle())
                .confirmationDialog(
                    "Sign Out",
                    isPresented: $showingLogoutConfirmation,
                    titleVisibility: .visible
                ) {
                    Button("Sign Out", role: .destructive) {
                        onLogout()
                    }
                    Button("Cancel", role: .cancel) { }
                } message: {
                    Text("Are you sure you want to sign out?")
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func openPrivacyPolicy() {
        if let url = URL(string: "https://perspective-app.com/privacy") {
            UIApplication.shared.open(url)
        }
    }
    
    private func openTermsOfService() {
        if let url = URL(string: "https://perspective-app.com/terms") {
            UIApplication.shared.open(url)
        }
    }
    
    private func openSupport() {
        if let url = URL(string: "https://perspective-app.com/support") {
            UIApplication.shared.open(url)
        }
    }
}

struct SettingsRowView: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                    .frame(width: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
} 