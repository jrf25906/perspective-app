import SwiftUI

struct EchoScoreBreakdownView: View {
    let score: EchoScore
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Score Breakdown")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                ScoreComponentView(
                    title: "Diversity",
                    score: score.diversityScore,
                    icon: "globe",
                    color: .blue,
                    description: "Range of perspectives you engage with"
                )
                
                ScoreComponentView(
                    title: "Accuracy",
                    score: score.accuracyScore,
                    icon: "target",
                    color: .green,
                    description: "Correctness of your reasoning"
                )
                
                ScoreComponentView(
                    title: "Switch Speed",
                    score: score.switchSpeedScore,
                    icon: "arrow.left.arrow.right",
                    color: .orange,
                    description: "How quickly you adapt perspectives"
                )
                
                ScoreComponentView(
                    title: "Consistency",
                    score: score.consistencyScore,
                    icon: "calendar",
                    color: .purple,
                    description: "Regular engagement with challenges"
                )
                
                ScoreComponentView(
                    title: "Improvement",
                    score: score.improvementScore,
                    icon: "chart.line.uptrend.xyaxis",
                    color: .pink,
                    description: "Your growth over time"
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct ScoreComponentView: View {
    let title: String
    let score: Double
    let icon: String
    let color: Color
    let description: String
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 24)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    Text("\(Int(score))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(color)
                }
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 4)
                            .cornerRadius(2)
                        
                        Rectangle()
                            .fill(color)
                            .frame(width: max(0, geometry.size.width * (score / 100)), height: 4)
                            .cornerRadius(2)
                    }
                }
                .frame(height: 4)
            }
        }
        .padding(.vertical, 8)
    }
} 