import SwiftUI

struct EchoScoreInsightsView: View {
    let score: EchoScore
    
    private var insights: [Insight] {
        var insights: [Insight] = []
        
        // Analyze each component and provide insights
        if score.diversityScore < 50 {
            insights.append(Insight(
                type: .improvement,
                title: "Expand Your Perspective Range",
                description: "Try reading sources from different political viewpoints to increase your diversity score.",
                icon: "globe",
                color: .blue
            ))
        }
        
        if score.accuracyScore < 60 {
            insights.append(Insight(
                type: .improvement,
                title: "Focus on Reasoning Skills",
                description: "Take time to carefully analyze each challenge before answering.",
                icon: "target",
                color: .green
            ))
        }
        
        if score.consistencyScore < 70 {
            insights.append(Insight(
                type: .improvement,
                title: "Build a Daily Habit",
                description: "Try to complete challenges daily to improve your consistency score.",
                icon: "calendar",
                color: .purple
            ))
        }
        
        // Add positive reinforcement
        let strongestComponent = getStrongestComponent()
        insights.append(Insight(
            type: .strength,
            title: "Your Strength: \(strongestComponent.name)",
            description: strongestComponent.description,
            icon: strongestComponent.icon,
            color: strongestComponent.color
        ))
        
        return insights
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Insights & Recommendations")
                .font(.headline)
                .fontWeight(.semibold)
            
            ForEach(insights) { insight in
                InsightCardView(insight: insight)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func getStrongestComponent() -> (name: String, description: String, icon: String, color: Color) {
        let components = [
            ("Diversity", score.diversityScore, "You excel at engaging with varied perspectives.", "globe", Color.blue),
            ("Accuracy", score.accuracyScore, "Your reasoning skills are particularly strong.", "target", Color.green),
            ("Switch Speed", score.switchSpeedScore, "You adapt quickly to new viewpoints.", "arrow.left.arrow.right", Color.orange),
            ("Consistency", score.consistencyScore, "You maintain excellent daily engagement.", "calendar", Color.purple),
            ("Improvement", score.improvementScore, "You show remarkable growth over time.", "chart.line.uptrend.xyaxis", Color.pink)
        ]
        
        let strongest = components.max { $0.1 < $1.1 } ?? components[0]
        return (strongest.0, strongest.2, strongest.3, strongest.4)
    }
}

struct Insight: Identifiable {
    let id = UUID()
    let type: InsightType
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    enum InsightType {
        case improvement
        case strength
        case warning
    }
}

struct InsightCardView: View {
    let insight: Insight
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: insight.icon)
                .font(.title3)
                .foregroundColor(insight.color)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(insight.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            Spacer()
            
            if insight.type == .strength {
                Image(systemName: "star.fill")
                    .font(.caption)
                    .foregroundColor(.yellow)
            }
        }
        .padding()
        .background(insight.color.opacity(0.1))
        .cornerRadius(12)
    }
} 