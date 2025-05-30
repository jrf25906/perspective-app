import SwiftUI
import Combine

struct DailyChallengeView: View {
    @EnvironmentObject var apiService: APIService
    @StateObject private var viewModel = DailyChallengeViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient matching brand
                LinearGradient(
                    colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Header with streak and score
                        DailyChallengeHeaderView()
                        
                        // Main challenge content
                        if viewModel.isLoading {
                            ChallengeLoadingView()
                        } else if let challenge = viewModel.currentChallenge {
                            if viewModel.isCompleted {
                                ChallengeCompletedView(
                                    challenge: challenge,
                                    result: viewModel.challengeResult
                                )
                            } else {
                                ChallengeContentView(
                                    challenge: challenge,
                                    onSubmit: viewModel.submitChallenge
                                )
                            }
                        } else if let error = viewModel.errorMessage {
                            ChallengeErrorView(error: error) {
                                viewModel.loadTodayChallenge()
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
            }
            .navigationTitle("Daily Challenge")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.loadTodayChallenge()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
        }
        .onAppear {
            viewModel.setup(apiService: apiService)
        }
    }
}

class DailyChallengeViewModel: ObservableObject {
    @Published var currentChallenge: Challenge?
    @Published var isLoading = false
    @Published var isCompleted = false
    @Published var challengeResult: ChallengeResult?
    @Published var errorMessage: String?
    
    private var apiService: APIService?
    private var cancellables = Set<AnyCancellable>()
    private var startTime: Date?
    
    func setup(apiService: APIService) {
        self.apiService = apiService
        loadTodayChallenge()
    }
    
    func loadTodayChallenge() {
        guard let apiService = apiService else { return }
        
        isLoading = true
        errorMessage = nil
        
        apiService.getTodayChallenge()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] challenge in
                    self?.isLoading = false
                    self?.currentChallenge = challenge
                    self?.startTime = Date()
                    self?.isCompleted = false
                    self?.challengeResult = nil
                }
            )
            .store(in: &cancellables)
    }
    
    func submitChallenge(answer: Any) {
        guard let apiService = apiService,
              let challenge = currentChallenge,
              let startTime = startTime else { return }
        
        let timeSpentSeconds = Int(Date().timeIntervalSince(startTime))
        
        isLoading = true
        
        apiService.submitChallenge(
            challengeId: challenge.id,
            userAnswer: answer,
            timeSpent: timeSpentSeconds
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] result in
                self?.isLoading = false
                self?.challengeResult = result
                self?.isCompleted = true
                
                // Update user's current data
                self?.apiService?.fetchProfile()
            }
        )
        .store(in: &cancellables)
    }
} 