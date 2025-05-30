import SwiftUI
import Combine

struct ProfileStatisticsView: View {
    @EnvironmentObject var apiService: APIService
    @StateObject private var viewModel = ProfileStatisticsViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Statistics")
                .font(.headline)
                .fontWeight(.semibold)
            
            if let stats = viewModel.statistics {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    StatisticCardView(
                        title: "Challenges Completed",
                        value: "\(stats.totalChallengesCompleted)",
                        icon: "checkmark.circle.fill",
                        color: .green
                    )

                    StatisticCardView(
                        title: "Average Accuracy",
                        value: "\(Int(stats.averageAccuracy))%",
                        icon: "target",
                        color: .blue
                    )

                    StatisticCardView(
                        title: "Longest Streak",
                        value: "\(stats.longestStreak ?? 0) days",
                        icon: "flame.fill",
                        color: .orange
                    )

                    StatisticCardView(
                        title: "Time Invested",
                        value: "\(stats.totalTimeSpent / 60)h \(stats.totalTimeSpent % 60)m",
                        icon: "clock.fill",
                        color: .purple
                    )
                }

                // Member since
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.secondary)

                    Text("Member since \(stats.memberSince.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()
                }
            } else {
                ProgressView()
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

class ProfileStatisticsViewModel: ObservableObject {
    @Published var statistics: UserStatistics?

    private var cancellables = Set<AnyCancellable>()

    init(apiService: APIService = .shared) {
        apiService.getProfileStats()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] stats in
                    self?.statistics = stats
                }
            )
            .store(in: &cancellables)
    }
}
