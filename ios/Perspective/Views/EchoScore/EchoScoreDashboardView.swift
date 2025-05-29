import SwiftUI
import Charts
import Combine

struct EchoScoreDashboardView: View {
    @EnvironmentObject var apiService: APIService
    @StateObject private var viewModel = EchoScoreDashboardViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Current Echo Score
                    CurrentEchoScoreView(score: viewModel.currentScore)
                    
                    // Score breakdown
                    if let score = viewModel.currentScore {
                        EchoScoreBreakdownView(score: score)
                    }
                    
                    // Progress chart
                    if !viewModel.scoreHistory.isEmpty {
                        EchoScoreChartView(history: viewModel.scoreHistory)
                    }
                    
                    // Insights and recommendations
                    if let score = viewModel.currentScore {
                        EchoScoreInsightsView(score: score)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle("Echo Score")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.refreshData()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .refreshable {
                await viewModel.refreshDataAsync()
            }
        }
        .onAppear {
            viewModel.setup(apiService: apiService)
        }
    }
}

class EchoScoreDashboardViewModel: ObservableObject {
    @Published var currentScore: EchoScore?
    @Published var scoreHistory: [EchoScoreHistory] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var apiService: APIService?
    private var cancellables = Set<AnyCancellable>()
    
    func setup(apiService: APIService) {
        self.apiService = apiService
        loadData()
    }
    
    func refreshData() {
        loadData()
    }
    
    @MainActor
    func refreshDataAsync() async {
        loadData()
    }
    
    private func loadData() {
        guard let apiService = apiService else { return }
        
        isLoading = true
        errorMessage = nil
        
        // Load current score and history in parallel
        Publishers.Zip(
            apiService.getEchoScore(),
            apiService.getEchoScoreHistory(days: 30)
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] (score, history) in
                self?.isLoading = false
                self?.currentScore = score
                self?.scoreHistory = history.sorted { $0.scoreDate < $1.scoreDate }
            }
        )
        .store(in: &cancellables)
    }
} 