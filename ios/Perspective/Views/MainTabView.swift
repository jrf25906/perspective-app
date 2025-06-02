import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DailyChallengeView()
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "brain.head.profile.fill" : "brain.head.profile")
                    Text("Challenge")
                }
                .tag(0)
            
            EchoScoreDashboardView()
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "chart.line.uptrend.xyaxis.circle.fill" : "chart.line.uptrend.xyaxis")
                    Text("Echo Score")
                }
                .tag(1)
            
            ProfileView()
                .tabItem {
                    Image(systemName: selectedTab == 2 ? "person.crop.circle.fill" : "person.crop.circle")
                    Text("Profile")
                }
                .tag(2)
            
            // Always show debug tab for testing
            APITestView()
                .tabItem {
                    Image(systemName: selectedTab == 3 ? "wrench.and.screwdriver.fill" : "wrench.and.screwdriver")
                    Text("Debug")
                }
                .tag(3)
        }
        .accentColor(.blue)
        .preferredColorScheme(.light)
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(APIService.shared)
    }
} 