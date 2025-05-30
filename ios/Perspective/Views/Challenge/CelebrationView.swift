import SwiftUI

struct CelebrationView: View {
    let type: CelebrationType
    let onDismiss: () -> Void
    
    @State private var showContent = false
    @State private var showConfetti = false
    @State private var scale: CGFloat = 0.5
    @State private var opacity: Double = 0
    
    var body: some View {
        ZStack {
            // Background overlay
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture {
                    dismiss()
                }
            
            // Celebration content
            VStack(spacing: 24) {
                // Icon and animation
                ZStack {
                    Circle()
                        .fill(type.backgroundColor)
                        .frame(width: 120, height: 120)
                        .scaleEffect(scale)
                        .opacity(opacity)
                    
                    Image(systemName: type.icon)
                        .font(.system(size: 50))
                        .foregroundColor(.white)
                        .scaleEffect(scale)
                        .opacity(opacity)
                }
                
                // Title and message
                VStack(spacing: 12) {
                    Text(type.title)
                        .font(.title)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                        .opacity(opacity)
                    
                    Text(type.message)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .opacity(opacity)
                }
                
                // Dismiss button
                Button(action: dismiss) {
                    Text("Continue")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(type.buttonColor)
                        .cornerRadius(16)
                }
                .opacity(opacity)
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.regularMaterial)
                    .shadow(radius: 20)
            )
            .padding(.horizontal, 32)
            .scaleEffect(scale)
            .opacity(opacity)
            
            // Confetti effect
            if showConfetti {
                ConfettiView()
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                scale = 1.0
                opacity = 1.0
                showContent = true
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                showConfetti = true
            }
        }
    }
    
    private func dismiss() {
        withAnimation(.easeInOut(duration: 0.3)) {
            scale = 0.8
            opacity = 0
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onDismiss()
        }
    }
}

enum CelebrationType {
    case challengeCompleted(score: Int)
    case streakAchieved(days: Int)
    case milestoneReached(milestone: String)
    case achievementUnlocked(achievement: String)
    
    var icon: String {
        switch self {
        case .challengeCompleted:
            return "checkmark.circle.fill"
        case .streakAchieved:
            return "flame.fill"
        case .milestoneReached:
            return "star.fill"
        case .achievementUnlocked:
            return "trophy.fill"
        }
    }
    
    var title: String {
        switch self {
        case .challengeCompleted(let score):
            return "Challenge Complete!"
        case .streakAchieved(let days):
            return "\(days)-Day Streak!"
        case .milestoneReached(let milestone):
            return "Milestone Reached!"
        case .achievementUnlocked(let achievement):
            return "Achievement Unlocked!"
        }
    }
    
    var message: String {
        switch self {
        case .challengeCompleted(let score):
            if score >= 90 {
                return "Outstanding work! You nailed that challenge with \(score)% accuracy. Your perspective is expanding! 🎯"
            } else if score >= 70 {
                return "Great job! You scored \(score)%. Each challenge makes you more cognitively flexible. 🧠"
            } else {
                return "Good effort! You scored \(score)%. Every attempt is progress toward better thinking. 💪"
            }
        case .streakAchieved(let days):
            switch days {
            case 3:
                return "You're building momentum! Three days of consistent growth. 🚀"
            case 7:
                return "A full week of perspective challenges! You're forming a powerful habit. 🔥"
            case 14:
                return "Two weeks strong! Your cognitive flexibility is improving daily. 🌟"
            case 21:
                return "Three weeks! You've officially built a habit. Your mind is more open than ever. ✨"
            case 30:
                return "A full month! You're a perspective master. Your growth is incredible! 🏆"
            default:
                return "Incredible dedication! \(days) days of challenging your perspective. 🎉"
            }
        case .milestoneReached(let milestone):
            return "You've reached \(milestone)! Your journey of cognitive growth continues to inspire. 🌟"
        case .achievementUnlocked(let achievement):
            return "You've unlocked: \(achievement). Your dedication to growth is paying off! 🏅"
        }
    }
    
    var backgroundColor: LinearGradient {
        switch self {
        case .challengeCompleted:
            return LinearGradient(colors: [.green, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .streakAchieved:
            return LinearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .milestoneReached:
            return LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .achievementUnlocked:
            return LinearGradient(colors: [.yellow, .orange], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    var buttonColor: Color {
        switch self {
        case .challengeCompleted:
            return .green
        case .streakAchieved:
            return .orange
        case .milestoneReached:
            return .purple
        case .achievementUnlocked:
            return .yellow
        }
    }
}

struct ConfettiView: View {
    @State private var confettiPieces: [ConfettiPiece] = []
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                ForEach(confettiPieces, id: \.id) { piece in
                    Rectangle()
                        .fill(piece.color)
                        .frame(width: piece.size, height: piece.size)
                        .rotationEffect(.degrees(piece.rotation))
                        .position(x: piece.x, y: piece.y)
                        .opacity(piece.opacity)
                }
            }
            .onAppear {
                generateConfetti(in: geometry.size)
                animateConfetti(in: geometry.size)
            }
        }
    }
    
    private func generateConfetti(in size: CGSize) {
        let colors: [Color] = [.red, .blue, .green, .yellow, .purple, .orange, .pink]
        
        for _ in 0..<30 {
            let piece = ConfettiPiece(
                id: UUID(),
                x: CGFloat.random(in: 0...size.width),
                y: -20,
                size: CGFloat.random(in: 8...16),
                color: colors.randomElement() ?? .blue,
                rotation: Double.random(in: 0...360),
                opacity: 1.0
            )
            confettiPieces.append(piece)
        }
    }
    
    private func animateConfetti(in size: CGSize) {
        withAnimation(.easeIn(duration: 3.0)) {
            for i in confettiPieces.indices {
                confettiPieces[i].y = size.height + 100
                confettiPieces[i].rotation += Double.random(in: 180...540)
                confettiPieces[i].opacity = 0.0
            }
        }
    }
}

struct ConfettiPiece {
    let id: UUID
    var x: CGFloat
    var y: CGFloat
    let size: CGFloat
    let color: Color
    var rotation: Double
    var opacity: Double
}

// MARK: - Usage Examples and Modifiers

extension View {
    func celebration(_ type: CelebrationType?, onDismiss: @escaping () -> Void) -> some View {
        ZStack {
            self
            
            if let celebrationType = type {
                CelebrationView(type: celebrationType, onDismiss: onDismiss)
                    .transition(.asymmetric(
                        insertion: .scale.combined(with: .opacity),
                        removal: .scale.combined(with: .opacity)
                    ))
                    .zIndex(1000)
            }
        }
    }
}

// MARK: - Preview

struct CelebrationView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            CelebrationView(type: .challengeCompleted(score: 85)) {}
                .previewDisplayName("Challenge Completed")
            
            CelebrationView(type: .streakAchieved(days: 7)) {}
                .previewDisplayName("Streak Achieved")
            
            CelebrationView(type: .milestoneReached(milestone: "100 Challenges")) {}
                .previewDisplayName("Milestone Reached")
            
            CelebrationView(type: .achievementUnlocked(achievement: "Logic Master")) {}
                .previewDisplayName("Achievement Unlocked")
        }
    }
} 