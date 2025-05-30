import SwiftUI

struct BiasProfileSectionView: View {
    let biasProfile: BiasProfile?
    let onTakeAssessment: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Bias Profile")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button(action: onTakeAssessment) {
                    Text(biasProfile == nil ? "Take Assessment" : "Retake")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                }
            }
            
            if let profile = biasProfile {
                BiasProfileContentView(profile: profile)
            } else {
                BiasProfileEmptyStateView(onTakeAssessment: onTakeAssessment)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct BiasProfileContentView: View {
    let profile: BiasProfile
    
    var politicalLeanLabel: String {
        switch profile.politicalLean {
        case -3.0..<(-1.5): return "Left"
        case -1.5..<(-0.5): return "Lean Left"
        case -0.5...0.5: return "Center"
        case 0.5..<1.5: return "Lean Right"
        case 1.5...3.0: return "Right"
        default: return "Unknown"
        }
    }
    
    var politicalLeanColor: Color {
        switch profile.politicalLean {
        case -3.0..<(-1.5): return .blue
        case -1.5..<(-0.5): return .cyan
        case -0.5...0.5: return .green
        case 0.5..<1.5: return .orange
        case 1.5...3.0: return .red
        default: return .gray
        }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Political lean indicator
            HStack {
                Text("Political Lean")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text(politicalLeanLabel)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(politicalLeanColor.opacity(0.2))
                    .foregroundColor(politicalLeanColor)
                    .cornerRadius(12)
            }
            
            // Bias scale visualization
            BiasScaleView(value: profile.politicalLean)
            
            // Preferred sources
            if !profile.preferredSources.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Preferred Sources")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 8) {
                        ForEach(profile.preferredSources.prefix(4), id: \.self) { source in
                            Text(source)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                        }
                    }
                }
            }
            
            // Assessment date
            HStack {
                Text("Last Assessment")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(profile.assessmentDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct BiasScaleView: View {
    let value: Double // -3 to +3
    
    var body: some View {
        VStack(spacing: 8) {
            // Scale labels
            HStack {
                Text("Left")
                    .font(.caption2)
                    .foregroundColor(.blue)
                
                Spacer()
                
                Text("Center")
                    .font(.caption2)
                    .foregroundColor(.green)
                
                Spacer()
                
                Text("Right")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
            
            // Scale visualization
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background scale
                    LinearGradient(
                        colors: [.blue, .cyan, .green, .orange, .red],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(height: 8)
                    .cornerRadius(4)
                    
                    // Position indicator
                    let position = (value + 3) / 6 // Convert -3...3 to 0...1
                    Circle()
                        .fill(Color.white)
                        .frame(width: 16, height: 16)
                        .overlay(
                            Circle()
                                .stroke(Color.black, lineWidth: 2)
                        )
                        .offset(x: max(0, geometry.size.width) * position - 8)
                }
            }
            .frame(height: 16)
        }
    }
}

struct BiasProfileEmptyStateView: View {
    let onTakeAssessment: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "questionmark.circle")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            
            Text("Discover Your Bias Profile")
                .font(.subheadline)
                .fontWeight(.medium)
            
            Text("Take a quick assessment to understand your perspective tendencies and get personalized content.")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: onTakeAssessment) {
                Text("Take Assessment")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .cornerRadius(20)
            }
        }
        .padding(.vertical, 8)
    }
} 