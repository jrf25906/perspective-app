import SwiftUI
import Charts

@available(iOS 16.0, *)
struct EchoScoreChartView: View {
    let history: [EchoScoreHistory]
    @State private var selectedTimeframe: TimeFrame = .week
    
    enum TimeFrame: String, CaseIterable {
        case week = "7D"
        case month = "30D"
        
        var days: Int {
            switch self {
            case .week: return 7
            case .month: return 30
            }
        }
        
        var title: String {
            switch self {
            case .week: return "Last 7 Days"
            case .month: return "Last 30 Days"
            }
        }
    }
    
    private var filteredHistory: [EchoScoreHistory] {
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -selectedTimeframe.days, to: Date()) ?? Date()
        return history.filter { $0.scoreDate >= cutoffDate }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Progress Over Time")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(TimeFrame.allCases, id: \.self) { timeframe in
                        Text(timeframe.rawValue)
                            .tag(timeframe)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 120)
            }
            
            if !filteredHistory.isEmpty {
                Chart(filteredHistory) { entry in
                    LineMark(
                        x: .value("Date", entry.scoreDate),
                        y: .value("Score", entry.totalScore)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .lineStyle(StrokeStyle(lineWidth: 3))
                    
                    AreaMark(
                        x: .value("Date", entry.scoreDate),
                        y: .value("Score", entry.totalScore)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.blue.opacity(0.3), .purple.opacity(0.1)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                .frame(height: 200)
                .chartYScale(domain: 0...100)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: selectedTimeframe == .week ? 1 : 5)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 40))
                        .foregroundColor(.gray)
                    
                    Text("No data available for \(selectedTimeframe.title.lowercased())")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(height: 200)
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

// Fallback for iOS 15 and below
struct EchoScoreChartViewLegacy: View {
    let history: [EchoScoreHistory]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Progress Over Time")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 8) {
                Text("Chart visualization requires iOS 16+")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let latest = history.last, let earliest = history.first {
                    let change = latest.totalScore - earliest.totalScore
                    HStack {
                        Text("Total Change:")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text("\(change > 0 ? "+" : "")\(String(format: "%.1f", change)) points")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(change > 0 ? .green : change < 0 ? .red : .primary)
                    }
                }
            }
            .frame(height: 100)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
} 