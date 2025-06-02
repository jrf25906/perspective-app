import SwiftUI
import Combine

struct APITestView: View {
    @State private var testResults: [TestResult] = []
    @State private var isRunning = false
    @State private var selectedTab = 0
    private let apiService = APIService.shared
    
    var body: some View {
        NavigationView {
            TabView(selection: $selectedTab) {
                // API Tests Tab
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Connection Info
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Connection Details")
                                .font(.headline)
                            
                            #if targetEnvironment(simulator)
                            Label("Running in Simulator", systemImage: "iphone")
                                .foregroundColor(.blue)
                            #else
                            Label("Running on Device", systemImage: "iphone")
                                .foregroundColor(.green)
                            #endif
                            
                            Text("Base URL: \(ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api")")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        
                        // Test Button
                        Button(action: runTests) {
                            HStack {
                                if isRunning {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle())
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "play.fill")
                                }
                                Text(isRunning ? "Running Tests..." : "Run API Tests")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isRunning ? Color.gray : Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                        }
                        .disabled(isRunning)
                        
                        // Test Results
                        if !testResults.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Test Results")
                                    .font(.headline)
                                
                                ForEach(testResults) { result in
                                    HStack {
                                        Image(systemName: result.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                                            .foregroundColor(result.success ? .green : .red)
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(result.name)
                                                .font(.subheadline)
                                                .fontWeight(.medium)
                                            
                                            Text(result.message)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                                .lineLimit(2)
                                            
                                            if let details = result.details {
                                                Text(details)
                                                    .font(.caption2)
                                                    .foregroundColor(.secondary)
                                                    .lineLimit(3)
                                            }
                                        }
                                        
                                        Spacer()
                                    }
                                    .padding(.vertical, 8)
                                    
                                    Divider()
                                }
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                    .padding()
                }
                .tabItem {
                    Image(systemName: "network")
                    Text("API Tests")
                }
                .tag(0)
                
                // Login Test Tab
                LoginTestView()
                    .tabItem {
                        Image(systemName: "person.fill.checkmark")
                        Text("Login Test")
                    }
                    .tag(1)
            }
            .navigationTitle("API Diagnostics")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func runTests() {
        isRunning = true
        testResults = []
        
        Task {
            // Test 1: Network Connectivity
            await testNetworkConnectivity()
            
            // Test 2: Backend Reachability
            await testBackendReachability()
            
            // Test 3: Authentication Endpoint
            await testAuthEndpoint()
            
            // Add delay between tests
            try? await Task.sleep(nanoseconds: 500_000_000)
            
            await MainActor.run {
                isRunning = false
            }
        }
    }
    
    private func testNetworkConnectivity() async {
        let result = TestResult(
            name: "Network Connectivity",
            success: NetworkMonitor.shared.isConnected,
            message: NetworkMonitor.shared.isConnected ? "Device is connected to network" : "No network connection detected"
        )
        
        await MainActor.run {
            testResults.append(result)
        }
    }
    
    private func testBackendReachability() async {
        let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api"
        let healthCheckURL = baseURL.replacingOccurrences(of: "/api", with: "/health")
        
        do {
            guard let url = URL(string: healthCheckURL) else {
                throw APIError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.timeoutInterval = 5.0
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                let success = (200...299).contains(httpResponse.statusCode)
                let message = success ? "Backend server is reachable" : "Backend returned status \(httpResponse.statusCode)"
                
                var details: String?
                if let responseData = String(data: data, encoding: .utf8) {
                    details = "Response: \(responseData)"
                }
                
                let result = TestResult(
                    name: "Backend Reachability",
                    success: success,
                    message: message,
                    details: details
                )
                
                await MainActor.run {
                    testResults.append(result)
                }
            }
        } catch {
            let result = TestResult(
                name: "Backend Reachability",
                success: false,
                message: "Failed to reach backend",
                details: error.localizedDescription
            )
            
            await MainActor.run {
                testResults.append(result)
            }
        }
    }
    
    private func testAuthEndpoint() async {
        let testEmail = "test@example.com"
        let testPassword = "testpassword"
        
        do {
            // Create a simple test request
            let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api"
            guard let url = URL(string: "\(baseURL)/auth/login") else {
                throw APIError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 10.0
            
            let body = ["email": testEmail, "password": testPassword]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                // We expect 401 for invalid credentials, which still means the endpoint is working
                let endpointWorking = [401, 400, 200].contains(httpResponse.statusCode)
                let message = endpointWorking ? "Auth endpoint is responding" : "Unexpected status: \(httpResponse.statusCode)"
                
                var details: String?
                if let responseData = String(data: data, encoding: .utf8) {
                    details = "Status: \(httpResponse.statusCode), Response: \(responseData)"
                }
                
                let result = TestResult(
                    name: "Authentication Endpoint",
                    success: endpointWorking,
                    message: message,
                    details: details
                )
                
                await MainActor.run {
                    testResults.append(result)
                }
            }
        } catch {
            let result = TestResult(
                name: "Authentication Endpoint",
                success: false,
                message: "Failed to test auth endpoint",
                details: error.localizedDescription
            )
            
            await MainActor.run {
                testResults.append(result)
            }
        }
    }
}

struct TestResult: Identifiable {
    let id = UUID()
    let name: String
    let success: Bool
    let message: String
    let details: String?
    
    init(name: String, success: Bool, message: String, details: String? = nil) {
        self.name = name
        self.success = success
        self.message = message
        self.details = details
    }
}

// MARK: - Preview

struct APITestView_Previews: PreviewProvider {
    static var previews: some View {
        APITestView()
    }
}