# Dependency Injection and Decoupling Migration Guide

## Overview

This document describes the systematic approach to addressing tight coupling and dependency inversion issues in the Perspective app codebase, implementing SOLID principles throughout.

## Issues Addressed

### 1. Backend Services Direct Dependencies
- **Problem**: Services directly import database and each other rather than depending on abstractions
- **Example**: `challengeService.ts` imports `adaptiveChallengeService` directly
- **Solution**: Introduced interfaces and dependency injection container

### 2. Controllers Using Concrete Singletons
- **Problem**: Controllers instantiate no interfaces and rely on concrete singleton services
- **Solution**: Controllers now use dependency injection to get service instances

### 3. iOS Singleton Pattern
- **Problem**: APIService and OfflineDataManager are singletons accessed via shared properties
- **Solution**: Created protocols and dependency container for iOS

## Backend Architecture Changes

### 1. Service Interfaces

Created interfaces for all services in `/backend/src/interfaces/`:

```typescript
// IChallengeService.ts
export interface IChallengeService {
  getAllChallenges(filters?: ChallengeFilters): Promise<Challenge[]>;
  getChallengeById(challengeId: number): Promise<Challenge | null>;
  getTodaysChallengeForUser(userId: number): Promise<Challenge | null>;
  submitChallenge(userId: number, challengeId: number, answer: any, timeSpentSeconds: number): Promise<ChallengeResult>;
  // ... other methods
}
```

### 2. Dependency Injection Container

Created a DI container in `/backend/src/di/container.ts`:

```typescript
export class DIContainer {
  private services: Map<string, any> = new Map();
  
  register<T>(token: string, factory: () => T): void { /* ... */ }
  get<T>(token: string): T { /* ... */ }
}
```

### 3. Service Registration

Services are registered during app startup in `/backend/src/di/serviceRegistration.ts`:

```typescript
export function registerServices(): void {
  container.register(ServiceTokens.ChallengeService, () => {
    return createChallengeService(
      container.get(ServiceTokens.Database),
      container.get(ServiceTokens.AdaptiveChallengeService),
      // ... other dependencies
    );
  });
}
```

### 4. Refactored Services

Services now accept dependencies through constructor injection:

```typescript
export class ChallengeService implements IChallengeService {
  constructor(
    private db: Knex,
    private adaptiveChallengeService: IAdaptiveChallengeService,
    private challengeRepository: IChallengeRepository,
    // ... other dependencies
  ) {}
}
```

### 5. Updated Controllers

Controllers now use DI to get service instances:

```typescript
const getChallengeService = (): IChallengeService => 
  getService<IChallengeService>(ServiceTokens.ChallengeService);

export const getTodayChallenge = async (req: any, res: any) => {
  const challengeService = getChallengeService();
  // ... use service
};
```

## iOS Architecture Changes

### 1. Service Protocols

Created protocols in `/ios/Perspective/Protocols/`:

```swift
protocol APIServiceProtocol {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, APIError>
    func getTodayChallenge() -> AnyPublisher<Challenge, APIError>
    // ... other methods
}
```

### 2. Dependency Container

Created a DI container in `/ios/Perspective/Services/DependencyContainer.swift`:

```swift
class DependencyContainer {
    static let shared = DependencyContainer()
    
    func register<T>(_ type: T.Type, service: T)
    func resolve<T>(_ type: T.Type) -> T
}
```

### 3. Property Wrapper for Injection

Created a property wrapper for easy dependency injection:

```swift
@propertyWrapper
struct Injected<T> {
    var wrappedValue: T {
        return DependencyContainer.shared.resolve(T.self)
    }
}
```

### 4. Refactored ViewModels

ViewModels now accept dependencies through initializer:

```swift
class DailyChallengeViewModel: ObservableObject {
    private let apiService: APIServiceProtocol
    private let offlineDataManager: OfflineDataManagerProtocol
    
    init(apiService: APIServiceProtocol, 
         offlineDataManager: OfflineDataManagerProtocol) {
        self.apiService = apiService
        self.offlineDataManager = offlineDataManager
    }
}
```

## Benefits

### 1. Testability
- Services can be easily mocked for unit testing
- Dependencies are explicit and can be substituted

### 2. Flexibility
- Easy to swap implementations (e.g., different data sources)
- Can introduce decorators/proxies for cross-cutting concerns

### 3. Maintainability
- Clear separation of concerns
- Reduced coupling between components
- Easier to understand dependencies

### 4. SOLID Principles Compliance
- **S**ingle Responsibility: Services focus on their core functionality
- **O**pen/Closed: Can extend behavior without modifying existing code
- **L**iskov Substitution: Interfaces ensure substitutability
- **I**nterface Segregation: Focused interfaces for specific needs
- **D**ependency Inversion: Depend on abstractions, not concretions

## Migration Steps

### Backend Migration

1. **Phase 1**: Create interfaces for all services
2. **Phase 2**: Set up DI container and registration
3. **Phase 3**: Refactor services to use constructor injection
4. **Phase 4**: Update controllers to use DI
5. **Phase 5**: Update tests to use mocks

### iOS Migration

1. **Phase 1**: Create protocols for services
2. **Phase 2**: Set up dependency container
3. **Phase 3**: Make services conform to protocols
4. **Phase 4**: Refactor ViewModels to use DI
5. **Phase 5**: Update SwiftUI views to inject dependencies

## Testing Example

### Backend Test Example

```typescript
describe('ChallengeService', () => {
  let challengeService: IChallengeService;
  let mockAdaptiveService: jest.Mocked<IAdaptiveChallengeService>;
  
  beforeEach(() => {
    mockAdaptiveService = createMock<IAdaptiveChallengeService>();
    challengeService = new ChallengeService(
      mockDb,
      mockAdaptiveService,
      // ... other mocks
    );
  });
  
  it('should get today\'s challenge', async () => {
    mockAdaptiveService.getNextChallengeForUser.mockResolvedValue(mockChallenge);
    const result = await challengeService.getTodaysChallengeForUser(1);
    expect(result).toEqual(mockChallenge);
  });
});
```

### iOS Test Example

```swift
class DailyChallengeViewModelTests: XCTestCase {
    var viewModel: DailyChallengeViewModel!
    var mockAPIService: MockAPIService!
    var mockOfflineManager: MockOfflineDataManager!
    
    override func setUp() {
        mockAPIService = MockAPIService()
        mockOfflineManager = MockOfflineDataManager()
        viewModel = DailyChallengeViewModel(
            apiService: mockAPIService,
            offlineDataManager: mockOfflineManager
        )
    }
    
    func testLoadChallenge() {
        // Test implementation
    }
}
```

## Next Steps

1. Complete migration of remaining services
2. Add comprehensive test coverage using mocks
3. Implement advanced DI features (scopes, lifecycles)
4. Consider using established DI frameworks:
   - Backend: InversifyJS, tsyringe
   - iOS: Resolver, Swinject

## Best Practices

1. **Keep interfaces focused**: Don't create "god interfaces"
2. **Use factory functions**: For complex object creation
3. **Avoid service locator anti-pattern**: Inject dependencies, don't pull them
4. **Document dependencies**: Make it clear what each service needs
5. **Test with mocks**: Always test services in isolation 