import SwiftUI
import Combine

struct QuickLoginView: View {
    @EnvironmentObject var apiService: APIService
    @State private var status: String = "Ready to test"
    @State private var rawResponse: String = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Quick Login Test")
                .font(.title)
            
            Text("This will attempt to login with:")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Email: iostest@example.com")
                    .font(.system(.body, design: .monospaced))
                Text("Password: testpass123")
                    .font(.system(.body, design: .monospaced))
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
            
            Button("Login Now") {
                performQuickLogin()
            }
            .buttonStyle(.borderedProminent)
            
            Button("Test Raw Login") {
                testRawLogin()
            }
            .buttonStyle(.bordered)
            
            Text(status)
                .foregroundColor(status.contains("✅") ? .green : status.contains("❌") ? .red : .primary)
                .multilineTextAlignment(.center)
            
            if apiService.isAuthenticated {
                VStack {
                    Text("✅ Authenticated!")
                        .foregroundColor(.green)
                    if let user = apiService.currentUser {
                        Text("User: \(user.email)")
                    }
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }
            
            if !rawResponse.isEmpty {
                VStack {
                    HStack {
                        Text("Diagnostic Output")
                            .font(.headline)
                        Spacer()
                        Button("Copy to Clipboard") {
                            UIPasteboard.general.string = rawResponse
                        }
                        .buttonStyle(.bordered)
                        .font(.caption)
                    }
                    
                    ScrollView {
                        Text(rawResponse)
                            .font(.system(.caption, design: .monospaced))
                            .padding()
                            .textSelection(.enabled)
                    }
                    .frame(maxHeight: 300)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            
            Spacer()
        }
        .padding()
    }
    
    private func performQuickLogin() {
        status = "Logging in..."
        
        // Hardcode the exact credentials
        let email = "iostest@example.com"
        let password = "testpass123"
        
        print("🔑 QuickLogin attempting with exact credentials")
        
        apiService.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .finished:
                        status = "✅ Login successful!"
                    case .failure(let error):
                        status = "❌ Failed: \(error.localizedDescription)"
                        print("❌ Login error: \(error)")
                    }
                },
                receiveValue: { response in
                    print("✅ Got response: \(response.user.email)")
                }
            )
            .store(in: &cancellables)
    }
    
    private func testRawLogin() {
        status = "Testing raw login with enhanced diagnostics..."
        rawResponse = ""
        
        var request = URLRequest(url: URL(string: "http://localhost:3000/api/auth/login")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": "iostest@example.com", "password": "testpass123"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    status = "❌ Network error: \(error.localizedDescription)"
                    return
                }
                
                guard let data = data else {
                    status = "❌ No data received"
                    return
                }
                
                // Process with new JSONResponseProcessor
                let processor = JSONResponseProcessor()
                let processedResponse = processor.processResponse(data)
                
                // Build comprehensive diagnostic report
                var report = "🔍 ENHANCED DIAGNOSTICS\n\n"
                
                // Original response
                if let originalString = String(data: data, encoding: .utf8) {
                    report += "📥 ORIGINAL RESPONSE:\n\(originalString)\n\n"
                }
                
                // Processing results
                report += "⚙️ PROCESSING RESULTS:\n"
                report += "- Original size: \(processedResponse.diagnostics.originalSize) bytes\n"
                report += "- Cleaned size: \(processedResponse.diagnostics.cleanedSize) bytes\n"
                report += "- Valid JSON: \(processedResponse.isValid ? "✅" : "❌")\n"
                report += "- Issues found: \(processedResponse.diagnostics.issuesFound.count)\n\n"
                
                // Issues details
                if !processedResponse.diagnostics.issuesFound.isEmpty {
                    report += "🚨 ISSUES FOUND:\n"
                    for issue in processedResponse.diagnostics.issuesFound {
                        report += "- \(issue)\n"
                    }
                    report += "\n"
                }
                
                // Processing log
                if !processedResponse.diagnostics.processingLog.isEmpty {
                    report += "📋 PROCESSING LOG:\n"
                    for logEntry in processedResponse.diagnostics.processingLog {
                        report += "- \(logEntry)\n"
                    }
                    report += "\n"
                }
                
                // Cleaned response
                if let cleanedString = String(data: processedResponse.cleanedData, encoding: .utf8) {
                    report += "🔧 CLEANED RESPONSE:\n\(cleanedString)\n\n"
                }
                
                // First try with ORIGINAL unprocessed JSON
                report += "🎯 DECODING ATTEMPT WITH ORIGINAL JSON:\n"
                do {
                    let authResponse = try JSONDecoder.apiDecoder.decode(AuthResponse.self, from: data)
                    status = "✅ SUCCESS with original JSON! User: \(authResponse.user.email)"
                    report += "✅ SUCCESS! Original JSON decoded successfully\n"
                    report += "- User: \(authResponse.user.email)\n"
                    report += "- Token length: \(authResponse.token.count) chars\n"
                    report += "- Echo score: \(authResponse.user.echoScore)\n"
                } catch let originalError {
                    report += "❌ Original JSON failed: \(originalError)\n"
                    
                    // Now try with processed JSON
                    report += "\n🎯 DECODING ATTEMPT WITH PROCESSED JSON:\n"
                    do {
                        let authResponse = try JSONDecoder.apiDecoder.decode(AuthResponse.self, from: processedResponse.cleanedData)
                        status = "✅ SUCCESS with processed JSON! User: \(authResponse.user.email)"
                        report += "✅ SUCCESS! Processed JSON decoded successfully\n"
                        report += "- User: \(authResponse.user.email)\n"
                        report += "- Token length: \(authResponse.token.count) chars\n"
                        report += "- Echo score: \(authResponse.user.echoScore)\n"
                    } catch let processedError {
                        status = "❌ Both original and processed failed"
                        report += "❌ Processed JSON also failed: \(processedError)\n"
                        
                        // DEBUG: Try with different decoder configurations
                        report += "\n🔧 DEBUGGING DECODER CONFIGURATIONS:\n"
                        
                        // Try with basic decoder on original data
                        do {
                            let basicDecoder = JSONDecoder()
                            basicDecoder.dateDecodingStrategy = .iso8601
                            let basicResponse = try basicDecoder.decode(AuthResponse.self, from: data)
                            report += "✅ SUCCESS with basic decoder on original JSON!\n"
                            status = "✅ SUCCESS with basic decoder!"
                        } catch {
                            report += "❌ Basic decoder also failed: \(error)\n"
                        }
                    }
                }
                
                // Try to manually parse the user object for diagnostics
                if let jsonObject = try? JSONSerialization.jsonObject(with: processedResponse.cleanedData) as? [String: Any],
                   let userDict = jsonObject["user"] as? [String: Any] {
                    report += "\n🔍 USER OBJECT FIELDS:\n"
                    for (key, value) in userDict.sorted(by: { $0.key < $1.key }) {
                        report += "- \(key): \(type(of: value)) = \(value)\n"
                    }
                    
                    // Check if echo_score specifically exists
                    if let echoScore = userDict["echo_score"] {
                        report += "\n✅ echo_score found: \(echoScore) (type: \(type(of: echoScore)))\n"
                    } else {
                        report += "\n❌ echo_score NOT found in user object\n"
                    }
                }
                
                rawResponse = report
                
                // Print to console for easy copy from Xcode
                let separator = String(repeating: "=", count: 80)
                print("\n" + separator)
                print("🔍 LOGIN DIAGNOSTIC REPORT")
                print(separator)
                print(report)
                print(separator + "\n")
                
                // Also save to a file for easier access
                if let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
                    let fileURL = documentsPath.appendingPathComponent("login_diagnostic.txt")
                    try? report.write(to: fileURL, atomically: true, encoding: .utf8)
                    print("📄 Diagnostic saved to: \(fileURL.path)")
                }
            }
        }.resume()
    }
    
    @State private var cancellables = Set<AnyCancellable>()
}

struct QuickLoginView_Previews: PreviewProvider {
    static var previews: some View {
        QuickLoginView()
            .environmentObject(APIService.shared)
    }
}