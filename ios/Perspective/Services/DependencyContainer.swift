import Foundation
import Combine
import SwiftUI

/**
 * Dependency Container for iOS app
 * Manages service instances and their dependencies
 */
class DependencyContainer {
    static let shared = DependencyContainer()
    
    // Services registry
    private var services: [String: Any] = [:]
    
    private init() {
        registerServices()
    }
    
    /**
     * Register all services
     */
    private func registerServices() {
        // Register default implementations
        register(APIService.self, service: APIService.shared)
        register(OfflineDataManager.self, service: OfflineDataManager.shared)
        register(BackgroundTaskManager.self, service: BackgroundTaskManager.shared)
        register(NotificationManager.self, service: NotificationManager.shared)
        register(CacheManager.self, service: CacheManager())
        register(SyncManager.self, service: SyncManager.shared)
    }
    
    /**
     * Register a service
     */
    func register<T>(_ type: T.Type, service: T) {
        let key = String(describing: type)
        services[key] = service
    }
    
    /**
     * Resolve a service
     */
    func resolve<T>(_ type: T.Type) -> T {
        let key = String(describing: type)
        guard let service = services[key] as? T else {
            fatalError("Service of type \(type) not registered")
        }
        return service
    }
}

/**
 * Property wrapper for dependency injection
 * Usage: @Injected var apiService: APIService
 */
@propertyWrapper
struct Injected<T> {
    private let type: T.Type
    
    init(_ type: T.Type) {
        self.type = type
    }
    
    var wrappedValue: T {
        return DependencyContainer.shared.resolve(type)
    }
}

/**
 * Extension to make dependency injection easier in SwiftUI Views
 */
extension View {
    func injectDependencies() -> some View {
        self
    }
} 