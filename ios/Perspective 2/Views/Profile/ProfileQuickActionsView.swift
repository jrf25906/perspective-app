import SwiftUI

struct ProfileQuickActionsView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                QuickActionRowView(
                    title: "Share Progress",
                    subtitle: "Share your Echo Score achievements",
                    icon: "square.and.arrow.up",
                    color: .blue
                ) {
                    shareProgress()
                }
                
                QuickActionRowView(
                    title: "Export Data",
                    subtitle: "Download your activity data",
                    icon: "square.and.arrow.down",
                    color: .green
                ) {
                    exportData()
                }
                
                QuickActionRowView(
                    title: "Feedback",
                    subtitle: "Help us improve Perspective",
                    icon: "message",
                    color: .orange
                ) {
                    provideFeedback()
                }
                
                QuickActionRowView(
                    title: "Invite Friends",
                    subtitle: "Challenge friends to join",
                    icon: "person.2",
                    color: .purple
                ) {
                    inviteFriends()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func shareProgress() {
        // Implement share functionality
        print("Share progress tapped")
    }
    
    private func exportData() {
        // Implement data export
        print("Export data tapped")
    }
    
    private func provideFeedback() {
        // Open feedback form or email
        print("Feedback tapped")
    }
    
    private func inviteFriends() {
        // Implement friend invitation
        print("Invite friends tapped")
    }
}

struct QuickActionRowView: View {
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