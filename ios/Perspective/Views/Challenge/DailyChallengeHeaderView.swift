import SwiftUI

struct DailyChallengeHeaderView: View {
    @EnvironmentObject var apiService: APIService
    @State private var showStreakCelebration = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Header with greeting and streak
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(greetingMessage)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(Date().formatted(.dateTime.weekday(.wide).month(.wide).day()))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Enhanced streak display
                StreakDisplayView()
            }
            
            // Challenge progress and motivation
            ChallengeProgressCard()
            
            // Echo Score preview with better design
            EchoScorePreviewCard()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 12, x: 0, y: 4)
        )
    }
    
    private var greetingMessage: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if let user = apiService.currentUser {
            let name = user.firstName ?? user.username
            switch hour {
            case 0..<12:
                return "Good morning, \(name)!"
            case 12..<17:
                return "Good afternoon, \(name)!"
            default:
                return "Good evening, \(name)!"
            }
        }
        return "Welcome back!"
    }
}

struct StreakDisplayView: View {
    @EnvironmentObject var apiService: APIService
    
    var body: some View {
        VStack(spacing: 8) {
            // Main streak counter
            HStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.orange, .red],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 36, height: 36)
                    
                    Image(systemName: "flame.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(apiService.currentUser?.currentStreak ?? 0)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("day streak")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Streak milestone indicator
            if let streak = apiService.currentUser?.currentStreak, streak > 0 {
                StreakMilestoneIndicator(currentStreak: streak)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(16)
    }
}

struct StreakMilestoneIndicator: View {
    let currentStreak: Int
    
    private var nextMilestone: Int {
        let milestones = [3, 7, 14, 21, 30, 50, 100]
        return milestones.first { $0 > currentStreak } ?? 100
    }
    
    private var progress: Float {
        let previousMilestone = [0, 3, 7, 14, 21, 30, 50].last { $0 <= currentStreak } ?? 0
        return Float(currentStreak - previousMilestone) / Float(nextMilestone - previousMilestone)
    }
    
    var body: some View {
        VStack(spacing: 4) {
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: .orange))
                .scaleEffect(x: 1, y: 0.6)
            
            Text("\(nextMilestone - currentStreak) more for \(nextMilestone)-day milestone!")
                .font(.caption2)
                .foregroundColor(.orange)
                .fontWeight(.medium)
        }
    }
}

struct ChallengeProgressCard: View {
    @EnvironmentObject var apiService: APIService
    
    var body: some View {
        HStack(spacing: 16) {
            // Challenge icon
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: "brain.head.profile")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Today's Challenge")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(motivationalMessage)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
            
            // Challenge status indicator
            ChallengeStatusBadge()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.blue.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.blue.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private var motivationalMessage: String {
        if let streak = apiService.currentUser?.currentStreak {
            switch streak {
            case 0:
                return "Start your journey to cognitive flexibility!"
            case 1...2:
                return "Great start! Keep building that streak 🚀"
            case 3...6:
                return "You're on fire! Momentum is building 🔥"
            case 7...13:
                return "Week streak! You're developing a habit 💪"
            case 14...20:
                return "Two weeks strong! Incredible dedication 🎯"
            case 21...29:
                return "Three weeks! You're unstoppable 🌟"
            default:
                return "Streak master! Your perspective is evolving ✨"
            }
        }
        return "Ready to challenge your perspective?"
    }
}

struct ChallengeStatusBadge: View {
    var body: some View {
        VStack(spacing: 4) {
            Circle()
                .fill(Color.green)
                .frame(width: 12, height: 12)
            
            Text("Ready")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.green)
        }
    }
}

struct EchoScorePreviewCard: View {
    @EnvironmentObject var apiService: APIService
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Echo Score")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                NavigationLink(destination: EchoScoreDashboardView()) {
                    HStack(spacing: 4) {
                        Text("View Details")
                            .font(.subheadline)
                        Image(systemName: "arrow.up.right")
                            .font(.caption)
                    }
                    .foregroundColor(.blue)
                    .fontWeight(.medium)
                }
            }
            
            HStack(spacing: 20) {
                // Current score
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(Int(apiService.currentUser?.echoScore ?? 0))")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                }
                
                Spacer()
                
                // Score trend indicator
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.right")
                            .font(.caption)
                            .foregroundColor(.green)
                        Text("+5")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                    
                    Text("This week")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Quick score breakdown
            HStack(spacing: 16) {
                ScoreMetric(title: "Diversity", value: "85", color: .blue)
                ScoreMetric(title: "Accuracy", value: "92", color: .green)
                ScoreMetric(title: "Speed", value: "78", color: .orange)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
        )
    }
}

struct ScoreMetric: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct DailyChallengeHeaderView_Previews: PreviewProvider {
    static var previews: some View {
        DailyChallengeHeaderView()
            .environmentObject(APIService.shared)
            .padding()
    }
} 