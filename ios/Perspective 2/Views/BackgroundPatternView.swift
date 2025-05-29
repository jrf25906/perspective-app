import SwiftUI
import UIKit

struct BackgroundPatternView: View {
    let opacity: Double
    
    init(opacity: Double = 0.15) {
        self.opacity = opacity
    }
    
    var body: some View {
        // Background pattern implementation
        // Note: This assumes you have a BackgroundPattern image asset
        // If you don't have this asset, you can create a geometric pattern using SwiftUI shapes
        ZStack {
            if let backgroundImage = UIImage(named: "BackgroundPattern") {
                Image("BackgroundPattern")
                    .resizable(resizingMode: .tile)
                    .opacity(opacity)
                    .ignoresSafeArea()
            } else {
                // Fallback geometric pattern if image doesn't exist
                GeometricPatternView()
                    .opacity(opacity)
                    .ignoresSafeArea()
            }
        }
    }
}

struct GeometricPatternView: View {
    var body: some View {
        Canvas { context, size in
            let spacing: CGFloat = 40
            let rows = Int(size.height / spacing) + 1
            let cols = Int(size.width / spacing) + 1
            
            for row in 0..<rows {
                for col in 0..<cols {
                    let x = CGFloat(col) * spacing
                    let y = CGFloat(row) * spacing
                    
                    // Draw a subtle geometric pattern
                    let rect = CGRect(x: x, y: y, width: 20, height: 20)
                    context.stroke(
                        Path(roundedRect: rect, cornerRadius: 4),
                        with: .color(.blue.opacity(0.3)),
                        lineWidth: 1
                    )
                }
            }
        }
    }
}

struct CardView<Content: View>: View {
    let content: Content
    let cornerRadius: CGFloat
    let shadowRadius: CGFloat
    
    init(
        cornerRadius: CGFloat = 16,
        shadowRadius: CGFloat = 12,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.cornerRadius = cornerRadius
        self.shadowRadius = shadowRadius
    }
    
    var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(Color.white)
                    .shadow(
                        color: Color.blue.opacity(0.15),
                        radius: shadowRadius,
                        x: 0,
                        y: 4
                    )
            )
    }
}

#Preview {
    ZStack {
        BackgroundPatternView()
        
        VStack(spacing: 20) {
            CardView {
                VStack {
                    Text("Sample Card")
                        .font(.headline)
                    Text("This shows the background pattern effect")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding()
            }
            
            CardView(cornerRadius: 12, shadowRadius: 8) {
                Text("Another Card")
                    .font(.body)
                    .padding()
            }
        }
        .padding()
    }
} 