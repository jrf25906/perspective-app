import SwiftUI
// MARK: - Sync Status Indicator Components

struct SyncStatusIndicator: View {
    @EnvironmentObject private var offlineManager: OfflineDataManager
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    @State private var showingDetails = false
    @State private var lastSyncText = "Never"
    
    var body: some View {
        Button(action: {
            showingDetails.toggle()
        }) {
            HStack(spacing: 8) {
                // Network Status Icon
                networkStatusIcon
                
                // Sync Status Text
                if offlineManager.pendingSyncCount > 0 {
                    Text("\(offlineManager.pendingSyncCount)")
                        .font(.caption2)
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.red)
                        .cornerRadius(8)
                } else if networkMonitor.isConnected {
                    Text("Synced")
                        .font(.caption2)
                        .foregroundColor(.green)
                } else {
                    Text("Offline")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColorForStatus)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColorForStatus, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .onAppear {
            updateLastSyncText()
        }
        .sheet(isPresented: $showingDetails) {
            SyncStatusDetailView()
        }
    }
    
    @ViewBuilder
    private var networkStatusIcon: some View {
        if networkMonitor.isConnected {
            if offlineManager.pendingSyncCount > 0 {
                Image(systemName: "arrow.clockwise")
                    .foregroundColor(.red)
                    .rotationEffect(.degrees(networkMonitor.isConnected ? 360 : 0))
                    .animation(.linear(duration: 1).repeatForever(autoreverses: false), 
                              value: networkMonitor.isConnected)
            } else {
                Image(systemName: networkIconName)
                    .foregroundColor(.green)
            }
        } else {
            Image(systemName: "wifi.slash")
                .foregroundColor(.gray)
        }
    }
    
    private var networkIconName: String {
        switch networkMonitor.connectionType {
        case .wifi:
            return "wifi"
        case .cellular:
            return "antenna.radiowaves.left.and.right"
        case .ethernet:
            return "cable.connector"
        case .unknown:
            return "network"
        }
    }
    
    private var backgroundColorForStatus: Color {
        if offlineManager.pendingSyncCount > 0 {
            return Color.red.opacity(0.1)
        } else if networkMonitor.isConnected {
            return Color.green.opacity(0.1)
        } else {
            return Color.gray.opacity(0.1)
        }
    }
    
    private var borderColorForStatus: Color {
        if offlineManager.pendingSyncCount > 0 {
            return Color.red.opacity(0.3)
        } else if networkMonitor.isConnected {
            return Color.green.opacity(0.3)
        } else {
            return Color.gray.opacity(0.3)
        }
    }
    
    private func updateLastSyncText() {
        if let lastSync = offlineManager.getLastSyncDate() {
            let formatter = RelativeDateTimeFormatter()
            formatter.dateTimeStyle = .named
            lastSyncText = formatter.localizedString(for: lastSync, relativeTo: Date())
        } else {
            lastSyncText = "Never"
        }
    }
}

// MARK: - Compact Sync Status Indicator

struct CompactSyncStatusIndicator: View {
    @EnvironmentObject private var offlineManager: OfflineDataManager
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    
    var body: some View {
        HStack(spacing: 4) {
            // Network Status Dot
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            
            // Pending Count (if any)
            if offlineManager.pendingSyncCount > 0 {
                Text("\(offlineManager.pendingSyncCount)")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
        }
    }
    
    private var statusColor: Color {
        if offlineManager.pendingSyncCount > 0 {
            return .red
        } else if networkMonitor.isConnected {
            return .green
        } else {
            return .gray
        }
    }
}

// MARK: - Banner Sync Status Indicator

struct BannerSyncStatusIndicator: View {
    @EnvironmentObject private var offlineManager: OfflineDataManager
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    @State private var isVisible = true
    
    var body: some View {
        Group {
            if shouldShow && isVisible {
                HStack {
                    Image(systemName: iconName)
                        .foregroundColor(iconColor)
                    
                    Text(message)
                        .font(.footnote)
                        .foregroundColor(textColor)
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation {
                            isVisible = false
                        }
                    }) {
                        Image(systemName: "xmark")
                            .foregroundColor(textColor.opacity(0.7))
                            .font(.caption)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(backgroundColor)
                .cornerRadius(8)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }
    
    private var shouldShow: Bool {
        !networkMonitor.isConnected || offlineManager.pendingSyncCount > 0
    }
    
    private var iconName: String {
        if !networkMonitor.isConnected {
            return "wifi.slash"
        } else if offlineManager.pendingSyncCount > 0 {
            return "arrow.clockwise"
        } else {
            return "checkmark.circle"
        }
    }
    
    private var iconColor: Color {
        if !networkMonitor.isConnected {
            return .gray
        } else if offlineManager.pendingSyncCount > 0 {
            return .red
        } else {
            return .green
        }
    }
    
    private var textColor: Color {
        if !networkMonitor.isConnected {
            return .gray
        } else if offlineManager.pendingSyncCount > 0 {
            return .red
        } else {
            return .green
        }
    }
    
    private var backgroundColor: Color {
        if !networkMonitor.isConnected {
            return Color.gray.opacity(0.1)
        } else if offlineManager.pendingSyncCount > 0 {
            return Color.red.opacity(0.1)
        } else {
            return Color.green.opacity(0.1)
        }
    }
    
    private var message: String {
        if !networkMonitor.isConnected {
            return "You're offline. Changes will sync when connected."
        } else if offlineManager.pendingSyncCount > 0 {
            return "\(offlineManager.pendingSyncCount) item(s) syncing..."
        } else {
            return "All data synchronized"
        }
    }
}

// MARK: - Sync Status Detail View

struct SyncStatusDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var offlineManager: OfflineDataManager
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    @State private var cacheInfo: CacheInfo = CacheInfo()
    
    struct CacheInfo {
        var challengeCount = 0
        var articleCount = 0
        var echoScoreCount = 0
        var totalSize = "0 KB"
    }
    
    var body: some View {
        NavigationView {
            List {
                // Network Status Section
                Section {
                    HStack {
                        Image(systemName: networkIconName)
                            .foregroundColor(networkStatusColor)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Network Status")
                                .font(.body)
                            Text(networkStatusText)
                                .font(.footnote)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Text(connectionTypeText)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                } header: {
                    Text("Connection")
                }
                
                // Sync Status Section
                Section {
                    HStack {
                        Image(systemName: offlineManager.pendingSyncCount > 0 ? "arrow.clockwise" : "checkmark.circle")
                            .foregroundColor(offlineManager.pendingSyncCount > 0 ? .red : .green)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Sync Status")
                                .font(.body)
                            Text(syncStatusText)
                                .font(.footnote)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if offlineManager.pendingSyncCount > 0 {
                            Text("\(offlineManager.pendingSyncCount)")
                                .font(.caption)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red)
                                .cornerRadius(8)
                        }
                    }
                    
                    if let lastSync = offlineManager.getLastSyncDate() {
                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(.secondary)
                                .frame(width: 24)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Last Sync")
                                    .font(.body)
                                Text(lastSync, style: .relative)
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                        }
                    }
                    
                } header: {
                    Text("Synchronization")
                }
                
                // Cache Information Section
                Section {
                    HStack {
                        Image(systemName: "puzzlepiece")
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        
                        Text("Challenges")
                            .font(.body)
                        
                        Spacer()
                        
                        Text("\(cacheInfo.challengeCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "newspaper")
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        
                        Text("News Articles")
                            .font(.body)
                        
                        Spacer()
                        
                        Text("\(cacheInfo.articleCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        
                        Text("Echo Scores")
                            .font(.body)
                        
                        Spacer()
                        
                        Text("\(cacheInfo.echoScoreCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "internaldrive")
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        
                        Text("Total Cache Size")
                            .font(.body)
                        
                        Spacer()
                        
                        Text(cacheInfo.totalSize)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                } header: {
                    Text("Cached Data")
                }
                
                // Actions Section
                Section {
                    if networkMonitor.isConnected && offlineManager.pendingSyncCount > 0 {
                        Button(action: {
                            // Trigger manual sync
                            print("Manual sync triggered")
                        }) {
                            HStack {
                                Image(systemName: "arrow.clockwise")
                                    .foregroundColor(.blue)
                                    .frame(width: 24)
                                
                                Text("Sync Now")
                                    .font(.body)
                                    .foregroundColor(.blue)
                                
                                Spacer()
                            }
                        }
                    }
                    
                    Button(action: {
                        // Navigate to settings
                        print("Settings tapped")
                    }) {
                        HStack {
                            Image(systemName: "gear")
                                .foregroundColor(.secondary)
                                .frame(width: 24)
                            
                            Text("Settings")
                                .font(.body)
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                    }
                    
                } header: {
                    Text("Actions")
                }
            }
            .navigationTitle("Sync Status")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            updateCacheInfo()
        }
    }
    
    private var networkIconName: String {
        if !networkMonitor.isConnected {
            return "wifi.slash"
        }
        
        switch networkMonitor.connectionType {
        case .wifi:
            return "wifi"
        case .cellular:
            return "antenna.radiowaves.left.and.right"
        case .ethernet:
            return "cable.connector"
        case .unknown:
            return "network"
        }
    }
    
    private var networkStatusColor: Color {
        networkMonitor.isConnected ? .green : .red
    }
    
    private var networkStatusText: String {
        networkMonitor.isConnected ? "Connected" : "Disconnected"
    }
    
    private var connectionTypeText: String {
        if !networkMonitor.isConnected {
            return "No Connection"
        }
        
        switch networkMonitor.connectionType {
        case .wifi:
            return "Wi-Fi"
        case .cellular:
            return "Cellular"
        case .ethernet:
            return "Ethernet"
        case .unknown:
            return "Unknown"
        }
    }
    
    private var syncStatusText: String {
        if offlineManager.pendingSyncCount > 0 {
            return "\(offlineManager.pendingSyncCount) item(s) pending sync"
        } else if networkMonitor.isConnected {
            return "All data synchronized"
        } else {
            return "Offline mode - data will sync when connected"
        }
    }
    
    private func updateCacheInfo() {
        cacheInfo.challengeCount = offlineManager.cachedChallengeCount
        cacheInfo.articleCount = offlineManager.cachedArticleCount
        cacheInfo.echoScoreCount = offlineManager.cachedEchoScoreCount
        
        let sizeInBytes = offlineManager.getCacheSize()
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        cacheInfo.totalSize = formatter.string(fromByteCount: Int64(sizeInBytes))
    }
}

// MARK: - Preview

struct SyncStatusIndicator_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            SyncStatusIndicator()
                .environmentObject(OfflineDataManager())
                .environmentObject(NetworkMonitor.shared)
            CompactSyncStatusIndicator()
                .environmentObject(OfflineDataManager())
                .environmentObject(NetworkMonitor.shared)
            BannerSyncStatusIndicator()
                .environmentObject(OfflineDataManager())
                .environmentObject(NetworkMonitor.shared)
        }
        .padding()
    }
}
