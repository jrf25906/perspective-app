import SwiftUI
import Combine

class AppStateManager: ObservableObject {
    static let shared = AppStateManager()
    
    @Published var selectedTab: Int = 0
    @Published var isShowingOnboarding = false
    @Published var deepLinkDestination: DeepLinkDestination?
    @Published var appBadgeCount = 0
    
    private var cancellables = Set<AnyCancellable>()
    
    enum DeepLinkDestination {
        case dailyChallenge
        case echoScore
        case profile
        case challenge(id: Int)
    }
    
    private init() {
        setupNotificationObservers()
        setupAppStateObservers()
    }
    
    private func setupNotificationObservers() {
        // Handle deep link notifications
        NotificationCenter.default.publisher(for: .navigateToDailyChallenge)
            .sink { [weak self] _ in
                self?.navigateToTab(0) // Daily Challenge tab
            }
            .store(in: &cancellables)
        
        NotificationCenter.default.publisher(for: .navigateToEchoScore)
            .sink { [weak self] _ in
                self?.navigateToTab(1) // Echo Score tab
            }
            .store(in: &cancellables)
    }
    
    private func setupAppStateObservers() {
        // Monitor authentication state
        APIService.shared.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if !isAuthenticated {
                    self?.resetAppState()
                }
            }
            .store(in: &cancellables)
        
        // Monitor offline data sync
        OfflineDataManager().$pendingSyncCount
            .sink { [weak self] count in
                self?.updateBadgeCount(count)
            }
            .store(in: &cancellables)
    }
    
    func navigateToTab(_ tabIndex: Int) {
        DispatchQueue.main.async {
            self.selectedTab = tabIndex
        }
    }
    
    func handleDeepLink(_ destination: DeepLinkDestination) {
        DispatchQueue.main.async {
            self.deepLinkDestination = destination
            
            switch destination {
            case .dailyChallenge:
                self.selectedTab = 0
            case .echoScore:
                self.selectedTab = 1
            case .profile:
                self.selectedTab = 2
            case .challenge:
                self.selectedTab = 0
            }
        }
    }
    
    private func resetAppState() {
        selectedTab = 0
        deepLinkDestination = nil
        appBadgeCount = 0
    }
    
    private func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            self.appBadgeCount = count
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }
} 