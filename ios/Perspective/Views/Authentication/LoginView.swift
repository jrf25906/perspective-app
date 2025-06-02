import SwiftUI
import Combine
import GoogleSignIn

struct LoginView: View {
    @EnvironmentObject var apiService: APIService
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack(spacing: 16) {
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.password)
            
            if !errorMessage.isEmpty {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: login) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("Sign In")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isLoading || email.isEmpty || password.isEmpty)
            
            // OR divider
            HStack {
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.gray.opacity(0.3))
                Text("OR")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.gray.opacity(0.3))
            }
            .padding(.vertical, 8)
            
            // Google Sign-In Button
            Button(action: googleSignIn) {
                HStack {
                    Image(systemName: "globe")
                        .foregroundColor(.black)
                    Text("Continue with Google")
                        .fontWeight(.semibold)
                        .foregroundColor(.black)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
                .cornerRadius(10)
            }
            .disabled(isLoading)
        }
    }
    
    private func login() {
        isLoading = true
        errorMessage = ""
        
        // Debug: Log what we're sending
        print("🔐 Attempting login with:")
        print("   Email: '\(email)'")
        print("   Password: '\(password)' (length: \(password.count))")
        
        apiService.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), 
                        password: password.trimmingCharacters(in: .whitespacesAndNewlines))
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { _ in
                    isLoading = false
                    // Navigation handled by ContentView observing apiService.isAuthenticated
                }
            )
            .store(in: &cancellables)
    }
    
    private func googleSignIn() {
        guard let presentingViewController = UIApplication.shared.windows.first?.rootViewController else {
            errorMessage = "Unable to present Google Sign-In"
            return
        }
        
        isLoading = true
        errorMessage = ""
        
        GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { [self] result, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                    return
                }
                
                guard let user = result?.user,
                      let idToken = user.idToken?.tokenString else {
                    self.isLoading = false
                    self.errorMessage = "Failed to get Google ID token"
                    return
                }
                
                // Send ID token to backend
                apiService.googleSignIn(idToken: idToken)
                    .receive(on: DispatchQueue.main)
                    .sink(
                        receiveCompletion: { completion in
                            self.isLoading = false
                            if case .failure(let error) = completion {
                                self.errorMessage = error.localizedDescription
                            }
                        },
                        receiveValue: { _ in
                            self.isLoading = false
                            // Navigation handled by ContentView observing apiService.isAuthenticated
                        }
                    )
                    .store(in: &self.cancellables)
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(APIService.shared)
            .padding()
    }
} 