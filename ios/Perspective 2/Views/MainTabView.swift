import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DailyChallengeView()
                .tabItem {
                    Image(systemName: "brain.head.profile")
                    Text("Challenge")
                }
            
            EchoScoreDashboardView()
                .tabItem {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                    Text("Echo Score")
                }
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Profile")
                }
        }
        .accentColor(.blue)
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(APIService.shared)
    }
} 