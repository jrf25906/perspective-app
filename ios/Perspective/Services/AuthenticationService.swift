import Foundation
import Combine
import KeychainAccess

class AuthenticationService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let networkClient: NetworkClient
    private let requestBuilder: RequestBuilder
    private let keychain = Keychain(service: "com.perspective.app")
    private let tokenKey = "auth_token"
    private let refreshTokenKey = "refresh_token"
    private let userKey = "current_user"
    
    private var cancellables = Set<AnyCancellable>()
    
    init(baseURL: String) {
        self.networkClient = NetworkClient()
        self.requestBuilder = RequestBuilder(baseURL: baseURL)
        
        // Load cached user data
        loadCachedUser()
    }
    
    // MARK: - Token Management
    
    var authToken: String? {
        get {
            do {
                return try keychain.getString(tokenKey)
            } catch {
                print("Error reading auth token from keychain: \(error)")
                // Fallback to UserDefaults for migration
                return UserDefaults.standard.string(forKey: tokenKey)
            }
        }
        set {
            do {
                if let token = newValue {
                    try keychain.set(token, key: tokenKey)
                } else {
                    try keychain.remove(tokenKey)
                }
            } catch {
                print("Error storing auth token in keychain: \(error)")
                // Fallback to UserDefaults
                if let token = newValue {
                    UserDefaults.standard.set(token, forKey: tokenKey)
                } else {
                    UserDefaults.standard.removeObject(forKey: tokenKey)
                }
            }
        }
    }
    
    var refreshToken: String? {
        get {
            do {
                return try keychain.getString(refreshTokenKey)
            } catch {
                return nil
            }
        }
        set {
            do {
                if let token = newValue {
                    try keychain.set(token, key: refreshTokenKey)
                } else {
                    try keychain.remove(refreshTokenKey)
                }
            } catch {
                print("Error storing refresh token in keychain: \(error)")
            }
        }
    }
    
    func checkAuthentication() {
        if authToken != nil {
            // Validate token by fetching profile
            fetchProfile()
        } else {
            isAuthenticated = false
            currentUser = nil
        }
    }
    
    private func loadCachedUser() {
        if let userData = UserDefaults.standard.data(forKey: userKey),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
        }
    }
    
    private func cacheUser(_ user: User?) {
        if let user = user,
           let userData = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(userData, forKey: userKey)
        } else {
            UserDefaults.standard.removeObject(forKey: userKey)
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
                    self?.handleAuthResponse(response)
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
                    self?.handleAuthResponse(response)
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
                    self?.handleAuthResponse(response)
                })
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
    
    func refreshAccessToken() -> AnyPublisher<AuthResponse, APIError> {
        guard let refreshToken = refreshToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }
        
        let request = RefreshTokenRequest(refreshToken: refreshToken)
        
        do {
            let urlRequest = try requestBuilder.buildRequest(
                endpoint: "/auth/refresh",
                method: .POST,
                body: request
            )
            
            return networkClient.performRequest(urlRequest, responseType: AuthResponse.self)
                .handleEvents(receiveOutput: { [weak self] response in
                    self?.handleAuthResponse(response)
                })
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error as? APIError ?? APIError.encodingError)
                .eraseToAnyPublisher()
        }
    }
    
    func logout() {
        // Clear tokens
        authToken = nil
        refreshToken = nil
        
        // Clear user data
        currentUser = nil
        cacheUser(nil)
        
        // Update state
        isAuthenticated = false
        
        // Clear any other cached data
        UserDefaults.standard.synchronize()
    }
    
    func fetchProfile() {
        guard let token = authToken else {
            isAuthenticated = false
            return
        }
        
        do {
            let request = try requestBuilder.buildRequest(
                endpoint: "/auth/me",
                method: .GET,
                headers: ["Authorization": "Bearer \(token)"]
            )
            
            networkClient.performRequest(request, responseType: User.self)
                .sink(
                    receiveCompletion: { [weak self] completion in
                        if case .failure(let error) = completion {
                            print("Failed to fetch profile: \(error)")
                            if case APIError.unauthorized = error {
                                self?.logout()
                            }
                        }
                    },
                    receiveValue: { [weak self] user in
                        self?.currentUser = user
                        self?.cacheUser(user)
                        self?.isAuthenticated = true
                    }
                )
                .store(in: &cancellables)
        } catch {
            print("Failed to build profile request: \(error)")
            isAuthenticated = false
        }
    }
    
    // MARK: - Private Methods
    
    private func handleAuthResponse(_ response: AuthResponse) {
        authToken = response.token
        // TODO: Handle refresh token when backend adds it to response
        // refreshToken = response.refreshToken
        currentUser = response.user
        cacheUser(response.user)
        isAuthenticated = true
    }
}

// MARK: - Request Models
// Note: RegisterRequest, LoginRequest, and GoogleSignInRequest are defined in User.swift

private struct RefreshTokenRequest: Codable {
    let refreshToken: String
}