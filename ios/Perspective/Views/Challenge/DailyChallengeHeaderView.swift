import SwiftUI

struct DailyChallengeHeaderView: View {
    @EnvironmentObject var apiService: APIService
    
    var body: some View {
        VStack(spacing: 16) {
            // Date and challenge type
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(Date().formatted(date: .complete, time: .omitted))
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Today's Challenge")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Streak indicator
                if let user = apiService.currentUser {
                    VStack(spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "flame.fill")
                                .foregroundColor(.orange)
                            Text("\(user.currentStreak)")
                                .fontWeight(.bold)
                        }
                        .font(.title2)
                        
                        Text("day streak")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Echo Score preview
            if let user = apiService.currentUser {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Echo Score")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Text("\(Int(user.echoScore))")
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
                    
                    NavigationLink(destination: EchoScoreDashboardView()) {
                        HStack(spacing: 4) {
                            Text("View Details")
                                .font(.caption)
                            Image(systemName: "chevron.right")
                                .font(.caption2)
                        }
                        .foregroundColor(.blue)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
} 