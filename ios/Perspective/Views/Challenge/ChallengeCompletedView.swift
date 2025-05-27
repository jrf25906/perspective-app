import SwiftUI

struct ChallengeCompletedView: View {
    let challenge: Challenge
    let result: ChallengeResult?
    
    var body: some View {
        VStack(spacing: 24) {
            // Success animation and feedback
            VStack(spacing: 16) {
                Image(systemName: result?.isCorrect == true ? "checkmark.circle.fill" : "x.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(result?.isCorrect == true ? .green : .orange)
                
                Text(result?.isCorrect == true ? "Excellent!" : "Good Effort!")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(result?.isCorrect == true ? 
                     "You got it right!" : 
                     "Every challenge helps you grow.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
            
            // Explanation
            if let explanation = result?.explanation {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Explanation")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(explanation)
                        .font(.body)
                        .lineSpacing(4)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
            }
            
            // Echo Score change
            if let scoreChange = result?.echoScoreChange, scoreChange != 0 {
                HStack {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .foregroundColor(.blue)
                    
                    Text("Echo Score")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    Text("\(scoreChange > 0 ? "+" : "")\(String(format: "%.1f", scoreChange))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(scoreChange > 0 ? .green : .red)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            }
            
            // Action buttons
            VStack(spacing: 12) {
                NavigationLink(destination: EchoScoreDashboardView()) {
                    Text("View Echo Score Details")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                
                Text("Come back tomorrow for your next challenge!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
} 