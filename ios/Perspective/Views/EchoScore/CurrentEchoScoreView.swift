import SwiftUI

struct CurrentEchoScoreView: View {
    let score: EchoScore?
    
    var body: some View {
        VStack(spacing: 20) {
            // Main score display
            VStack(spacing: 8) {
                Text("Your Echo Score")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                if let score = score {
                    Text("\(Int(score.totalScore))")
                        .font(.system(size: 60, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("out of 100")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                } else {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(height: 80)
                }
            }
            
            // Score interpretation
            if let score = score {
                ScoreInterpretationView(totalScore: score.totalScore)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
    }
}

struct ScoreInterpretationView: View {
    let totalScore: Double
    
    var interpretation: (title: String, description: String, color: Color) {
        switch totalScore {
        case 80...100:
            return ("Exceptional", "You demonstrate outstanding cognitive flexibility and open-mindedness.", .green)
        case 60..<80:
            return ("Strong", "You show good perspective-taking abilities with room for growth.", .blue)
        case 40..<60:
            return ("Developing", "You're building valuable cognitive flexibility skills.", .orange)
        case 20..<40:
            return ("Emerging", "You're beginning to develop perspective-taking abilities.", .yellow)
        default:
            return ("Starting", "Every expert was once a beginner. Keep practicing!", .red)
        }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Circle()
                    .fill(interpretation.color)
                    .frame(width: 12, height: 12)
                
                Text(interpretation.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(interpretation.color)
                
                Spacer()
            }
            
            Text(interpretation.description)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
        }
        .padding()
        .background(interpretation.color.opacity(0.1))
        .cornerRadius(12)
    }
} 