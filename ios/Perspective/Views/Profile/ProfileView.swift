import SwiftUI
import Combine
import Charts

struct ProfileView: View {
    @EnvironmentObject var apiService: APIService
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showingEditProfile = false
    @State private var showingBiasAssessment = false
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    ProfileHeaderView(
                        user: apiService.currentUser,
                        onEditProfile: { showingEditProfile = true }
                    )
                    
                    // Stats Grid
                    ProfileStatsGridView()
                    
                    // Streak Card
                    StreakCardView()
                    
                    // Achievements Section
                    AchievementsSection()
                    
                    // Settings Section
                    SettingsSection()
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        apiService.logout()
                    }) {
                        Image(systemName: "gear")
                            .foregroundColor(.primary)
                    }
                }
            }
            .sheet(isPresented: $showingEditProfile) {
                EditProfileView()
            }
            .sheet(isPresented: $showingBiasAssessment) {
                BiasAssessmentView()
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
        }
        .onAppear {
            viewModel.loadProfileData()
        }
    }
}

struct ProfileStatsGridView: View {
    @EnvironmentObject var apiService: APIService
    @StateObject private var statsViewModel = ProfileStatsViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your Stats")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 16) {
                StatCard(
                    title: "Echo Score",
                    value: String(format: "%.0f", apiService.currentUser?.echoScore ?? 0),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .blue
                )
                
                StatCard(
                    title: "Current Streak",
                    value: "\(apiService.currentUser?.currentStreak ?? 0)",
                    icon: "flame.fill",
                    color: .orange
                )
                
                StatCard(
                    title: "Challenges",
                    value: "\(statsViewModel.totalChallenges)",
                    icon: "brain.head.profile",
                    color: .purple
                )
                
                StatCard(
                    title: "Accuracy",
                    value: String(format: "%.1f%%", statsViewModel.accuracy),
                    icon: "target",
                    color: .green
                )
            }
        }
        .onAppear {
            statsViewModel.loadStats(apiService: apiService)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct StreakCardView: View {
    @EnvironmentObject var apiService: APIService
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Streak Progress")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 16) {
                HStack {
                    Image(systemName: "flame.fill")
                        .font(.title)
                        .foregroundColor(.orange)
                    
                    VStack(alignment: .leading) {
                        Text("\(apiService.currentUser?.currentStreak ?? 0) day streak")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("Keep it up! Complete today's challenge.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                
                // Streak visualization
                StreakVisualization(currentStreak: apiService.currentUser?.currentStreak ?? 0)
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [Color.orange.opacity(0.1), Color.red.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)
        }
    }
}

struct StreakVisualization: View {
    let currentStreak: Int
    let maxDisplay = 7
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(1...maxDisplay, id: \.self) { day in
                Circle()
                    .fill(day <= currentStreak ? Color.orange : Color.gray.opacity(0.3))
                    .frame(width: 32, height: 32)
                    .overlay(
                        Text("\(day)")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(day <= currentStreak ? .white : .gray)
                    )
            }
            
            if currentStreak > maxDisplay {
                Text("+\(currentStreak - maxDisplay)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .cornerRadius(12)
            }
        }
    }
}

struct AchievementsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Achievements")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                AchievementBadge(
                    title: "First Steps",
                    icon: "foot.2",
                    isEarned: true,
                    description: "Complete your first challenge"
                )
                
                AchievementBadge(
                    title: "Streak Master",
                    icon: "flame",
                    isEarned: false,
                    description: "Maintain a 7-day streak"
                )
                
                AchievementBadge(
                    title: "Echo Hunter",
                    icon: "target",
                    isEarned: false,
                    description: "Reach Echo Score of 100"
                )
                
                AchievementBadge(
                    title: "Perspective Pro",
                    icon: "eye.circle",
                    isEarned: false,
                    description: "Complete 50 challenges"
                )
                
                AchievementBadge(
                    title: "Logic Master",
                    icon: "puzzlepiece",
                    isEarned: false,
                    description: "Complete 10 logic puzzles"
                )
                
                AchievementBadge(
                    title: "Bias Buster",
                    icon: "arrow.left.arrow.right",
                    isEarned: false,
                    description: "Complete 10 bias swap challenges"
                )
            }
        }
    }
}

struct AchievementBadge: View {
    let title: String
    let icon: String
    let isEarned: Bool
    let description: String
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(isEarned ? Color.blue : Color.gray.opacity(0.3))
                    .frame(width: 60, height: 60)
                
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(isEarned ? .white : .gray)
            }
            
            Text(title)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(isEarned ? .primary : .secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 8)
    }
}

struct SettingsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Settings")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 0) {
                SettingsRow(icon: "bell", title: "Notifications", hasChevron: true)
                Divider().padding(.leading, 44)
                SettingsRow(icon: "clock", title: "Challenge Time", hasChevron: true)
                Divider().padding(.leading, 44)
                SettingsRow(icon: "chart.bar", title: "Data & Privacy", hasChevron: true)
                Divider().padding(.leading, 44)
                SettingsRow(icon: "questionmark.circle", title: "Help & Support", hasChevron: true)
            }
            .background(Color(.systemGray6))
            .cornerRadius(16)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let hasChevron: Bool
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text(title)
                .font(.body)
            
            Spacer()
            
            if hasChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

// MARK: - View Model

class ProfileViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var challengeStats: ChallengeStats?
    @Published var achievements: [Achievement] = []
    
    func loadProfileData() {
        isLoading = true
        
        Task {
            do {
                // Load challenge stats
                if let stats = try await APIService.shared.getChallengeStats() {
                    await MainActor.run {
                        self.challengeStats = stats
                    }
                }
                
                // Load achievements
                if let achievements = try await APIService.shared.getUserAchievements() {
                    await MainActor.run {
                        self.achievements = achievements
                    }
                }
            } catch {
                print("Error loading profile data: \(error)")
            }
            
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
}

// MARK: - Stats View Model

class ProfileStatsViewModel: ObservableObject {
    @Published var totalChallenges: Int = 0
    @Published var accuracy: Double = 0.0
    
    func loadStats(apiService: APIService) {
        Task {
            do {
                if let stats = try await apiService.getChallengeStats() {
                    await MainActor.run {
                        self.totalChallenges = stats.totalCompleted
                        self.accuracy = stats.averageAccuracy * 100.0
                    }
                }
            } catch {
                print("Error loading challenge stats: \(error)")
            }
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(APIService.shared)
    }
} 