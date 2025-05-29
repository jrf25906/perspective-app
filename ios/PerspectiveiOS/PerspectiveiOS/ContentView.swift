import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                
                Text("Perspective")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Cognitive Flexibility Training")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                VStack(spacing: 16) {
                    NavigationLink("Daily Challenge") {
                        Text("Daily Challenge Coming Soon")
                            .navigationTitle("Challenge")
                    }
                    .buttonStyle(.borderedProminent)
                    
                    NavigationLink("Echo Score") {
                        Text("Echo Score Dashboard Coming Soon")
                            .navigationTitle("Echo Score")
                    }
                    .buttonStyle(.bordered)
                    
                    NavigationLink("Profile") {
                        Text("Profile Coming Soon")
                            .navigationTitle("Profile")
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
                
                Spacer()
            }
            .padding()
            .navigationTitle("Perspective")
        }
    }
}

#Preview {
    ContentView()
} 