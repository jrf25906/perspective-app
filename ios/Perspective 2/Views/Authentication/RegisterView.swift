import SwiftUI
import Combine

struct RegisterView: View {
    @EnvironmentObject var apiService: APIService
    @State private var email = ""
    @State private var username = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                TextField("First Name", text: $firstName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .textContentType(.givenName)
                
                TextField("Last Name", text: $lastName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .textContentType(.familyName)
            }
            
            TextField("Username", text: $username)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.username)
                .autocapitalization(.none)
            
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.newPassword)
            
            SecureField("Confirm Password", text: $confirmPassword)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .textContentType(.newPassword)
            
            if !errorMessage.isEmpty {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: register) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("Create Account")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isLoading || !isFormValid)
        }
    }
    
    private var isFormValid: Bool {
        !email.isEmpty && 
        !username.isEmpty && 
        !password.isEmpty && 
        password == confirmPassword &&
        password.count >= 6
    }
    
    private func register() {
        isLoading = true
        errorMessage = ""
        
        apiService.register(
            email: email,
            username: username,
            password: password,
            firstName: firstName.isEmpty ? nil : firstName,
            lastName: lastName.isEmpty ? nil : lastName
        )
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
}

struct RegisterView_Previews: PreviewProvider {
    static var previews: some View {
        RegisterView()
            .environmentObject(APIService.shared)
            .padding()
    }
} 