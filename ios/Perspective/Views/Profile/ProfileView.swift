import SwiftUI
import Combine

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
                    
                    // Echo Score Summary
                    if let user = apiService.currentUser {
                        ProfileEchoScoreSummaryView(user: user)
                    }
                    
                    // Bias Profile Section
                    BiasProfileSectionView(
                        biasProfile: apiService.currentUser?.biasProfile,
                        onTakeAssessment: { showingBiasAssessment = true }
                    )
                    
                    // Statistics Section
                    ProfileStatisticsView()
                    
                    // Quick Actions
                    ProfileQuickActionsView()
                    
                    // Settings and Account
                    ProfileSettingsSectionView(
                        onShowSettings: { showingSettings = true },
                        onLogout: { apiService.logout() }
                    )
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSettings = true }) {
                        Image(systemName: "gearshape")
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
            viewModel.setup(apiService: apiService)
        }
    }
}

class ProfileViewModel: ObservableObject {
    @Published var userStats: UserStatistics?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var apiService: APIService?
    private var cancellables = Set<AnyCancellable>()
    
    func setup(apiService: APIService) {
        self.apiService = apiService
        loadUserStatistics()
    }
    
    private func loadUserStatistics() {
        // This would load user statistics from the API
        // For now, we'll use mock data
        userStats = UserStatistics(
            totalChallengesCompleted: 45,
            currentStreak: 7,
            longestStreak: 12,
            averageAccuracy: 78.5,
            totalTimeSpent: 1250, // minutes
            joinDate: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        )
    }
}

struct UserStatistics {
    let totalChallengesCompleted: Int
    let currentStreak: Int
    let longestStreak: Int
    let averageAccuracy: Double
    let totalTimeSpent: Int // in minutes
    let joinDate: Date
} 