import SwiftUI

struct ProfileStatisticsView: View {
    @EnvironmentObject var apiService: APIService
    
    // Mock data - in real app, this would come from API
    private let mockStats = UserStatistics(
        totalChallengesCompleted: 45,
        currentStreak: 7,
        longestStreak: 12,
        averageAccuracy: 78.5,
        totalTimeSpent: 1250,
        joinDate: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
    )
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Statistics")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatisticCardView(
                    title: "Challenges Completed",
                    value: "\(mockStats.totalChallengesCompleted)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )
                
                StatisticCardView(
                    title: "Average Accuracy",
                    value: "\(Int(mockStats.averageAccuracy))%",
                    icon: "target",
                    color: .blue
                )
                
                StatisticCardView(
                    title: "Longest Streak",
                    value: "\(mockStats.longestStreak) days",
                    icon: "flame.fill",
                    color: .orange
                )
                
                StatisticCardView(
                    title: "Time Invested",
                    value: "\(mockStats.totalTimeSpent / 60)h \(mockStats.totalTimeSpent % 60)m",
                    icon: "clock.fill",
                    color: .purple
                )
            }
            
            // Member since
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(.secondary)
                
                Text("Member since \(mockStats.joinDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct StatisticCardView: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
} 