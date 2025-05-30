import SwiftUI

struct AuthenticationView: View {
    @State private var isLoginMode = true
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Logo and branding
                VStack(spacing: 16) {
                    Image(systemName: "eye.circle.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Perspective")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Escape echo chambers.\nBuild cognitive flexibility.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // Authentication forms
                if isLoginMode {
                    LoginView()
                } else {
                    RegisterView()
                }
                
                // Toggle between login and register
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isLoginMode.toggle()
                    }
                }) {
                    Text(isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in")
                        .font(.footnote)
                        .foregroundColor(.blue)
                }
                .padding(.bottom, 40)
            }
            .padding(.horizontal, 24)
            .navigationBarHidden(true)
        }
    }
}

struct AuthenticationView_Previews: PreviewProvider {
    static var previews: some View {
        AuthenticationView()
            .environmentObject(APIService.shared)
    }
} 