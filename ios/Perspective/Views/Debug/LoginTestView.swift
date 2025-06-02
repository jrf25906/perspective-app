import SwiftUI
import Combine

struct LoginTestView: View {
    @State private var email = "iostest@example.com"
    @State private var password = "testpass123"
    @State private var isLoading = false
    @State private var result: String = ""
    @State private var showResult = false
    
    private let apiService = APIService.shared
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Test Login")
                        .font(.headline)
                    
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                
                Button(action: testLogin) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "person.fill.checkmark")
                        }
                        Text(isLoading ? "Logging in..." : "Test Login")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isLoading ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .disabled(isLoading)
                
                if showResult {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Result:")
                                .font(.headline)
                            
                            Text(result)
                                .font(.caption)
                                .foregroundColor(result.contains("SUCCESS") ? .green : .red)
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                    .frame(maxHeight: 300)
                }
                
                // Auth Status
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current Auth Status")
                        .font(.headline)
                    
                    HStack {
                        Text("Authenticated:")
                        Text(apiService.isAuthenticated ? "✅ Yes" : "❌ No")
                            .foregroundColor(apiService.isAuthenticated ? .green : .red)
                    }
                    
                    if let user = apiService.currentUser {
                        Text("User: \(user.email)")
                            .font(.caption)
                        Text("ID: \(user.id)")
                            .font(.caption)
                        Text("Echo Score: \(user.echoScore)")
                            .font(.caption)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                
                // Test Users Info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Test Credentials")
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Email: iostest@example.com")
                            .font(.caption)
                            .font(.system(.caption, design: .monospaced))
                        Text("Password: testpass123")
                            .font(.caption)
                            .font(.system(.caption, design: .monospaced))
                    }
                    .padding(.vertical, 4)
                    
                    Text("Other test users:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("• testuser@test.com")
                        Text("• tester123@google.com")
                        Text("• test@testing.com")
                    }
                    .font(.caption2)
                    .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Login Test")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func testLogin() {
        isLoading = true
        result = ""
        showResult = false
        
        print("🔐 Starting login test with email: \(email)")
        
        apiService.login(email: email, password: password)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    showResult = true
                    
                    switch completion {
                    case .finished:
                        result = "✅ SUCCESS: Login completed successfully!"
                        print("✅ Login test completed successfully")
                    case .failure(let error):
                        result = "❌ FAILED: \(error.localizedDescription)\n\nDetails: \(String(describing: error))"
                        print("❌ Login test failed: \(error)")
                    }
                },
                receiveValue: { authResponse in
                    print("✅ Received auth response: token=\(authResponse.token.prefix(20))..., user=\(authResponse.user.email)")
                }
            )
            .store(in: &cancellables)
    }
    
    @State private var cancellables = Set<AnyCancellable>()
}

// MARK: - Preview

struct LoginTestView_Previews: PreviewProvider {
    static var previews: some View {
        LoginTestView()
    }
}