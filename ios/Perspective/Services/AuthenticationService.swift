import Foundation
import Combine

class AuthenticationService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let networkClient: NetworkClient
    private let requestBuilder: RequestBuilder
    private let tokenKey = "auth_token"
    
    init(baseURL: String) {
        self.networkClient = NetworkClient()
        self.requestBuilder = RequestBuilder(baseURL: baseURL)
    }
    
    // MARK: - Token Management
    
    var authToken: String? {
        get { UserDefaults.standard.string(forKey: tokenKey) }
        set { 
            if let token = newValue {
                UserDefaults.standard.set(token, forKey: tokenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: tokenKey)
            }
        }
    }
    
    func checkAuthentication() {
        if authToken != nil {
            // Validate token by fetching profile
            fetchProfile()
        }
    }
    
    // MARK: - Authentication Methods
    
    func register(
        email: String,
        username: String,
        password: String,
        firstName: String? = nil,
        lastName: String? = nil
    ) -> AnyPublisher<AuthResponse, APIError> {
        let request = RegisterRequest(
            email: email,
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        
        do {
            let urlRequest = try requestBuilder.buildRequest(
                endpoint: "/auth/register",
                method: .POST,
                body: request
            )
            
            return networkClient.performRequest(urlRequest, responseType: AuthResponse.self)
                .handleEvents(receiveOutput: { [weak self] response in
                    self?.handleAuthSuccess(response)
                })
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError> {
        let request = LoginRequest(email: email, password: password)
        
        do {
            let urlRequest = try requestBuilder.buildRequest(
                endpoint: "/auth/login",
                method: .POST,
                body: request
            )
            
            return networkClient.performRequest(urlRequest, responseType: AuthResponse.self)
                .handleEvents(receiveOutput: { [weak self] response in
                    self?.handleAuthSuccess(response)
                })
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
    
    func googleSignIn(idToken: String) -> AnyPublisher<AuthResponse, APIError> {
        let request = GoogleSignInRequest(idToken: idToken)
        
        do {
            let urlRequest = try requestBuilder.buildRequest(
                endpoint: "/auth/google",
                method: .POST,
                body: request
            )
            
            return networkClient.performRequest(urlRequest, responseType: AuthResponse.self)
                .handleEvents(receiveOutput: { [weak self] response in
                    self?.handleAuthSuccess(response)
                })
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
    
    func logout() {
        authToken = nil
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
    
    func fetchProfile() {
        guard let token = authToken else {
            logout()
            return
        }
        
        do {
            let urlRequest = try requestBuilder.buildRequest(
                endpoint: "/auth/profile",
                method: .GET,
                headers: ["Authorization": "Bearer \(token)"]
            )
            
            _ = networkClient.performRequest(urlRequest, responseType: User.self)
                .sink(
                    receiveCompletion: { [weak self] completion in
                        if case .failure = completion {
                            DispatchQueue.main.async {
                                self?.logout()
                            }
                        }
                    },
                    receiveValue: { [weak self] user in
                        DispatchQueue.main.async {
                            self?.currentUser = user
                            self?.isAuthenticated = true
                        }
                    }
                )
        } catch {
            logout()
        }
    }
    
    // MARK: - Private Methods
    
    private func handleAuthSuccess(_ response: AuthResponse) {
        authToken = response.token
        DispatchQueue.main.async {
            self.currentUser = response.user
            self.isAuthenticated = true
        }
    }
} 