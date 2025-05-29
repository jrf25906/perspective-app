//
//  PerspectiveApp.swift
//  Perspective
//
//  Created by James Farmer on 5/29/25.
//

import SwiftUI
import GoogleSignIn

@main
struct PerspectiveApp: App {
    let persistenceController = PersistenceController.shared
    
    // Initialize the required services
    @StateObject private var apiService = APIService.shared
    @StateObject private var appStateManager = AppStateManager.shared
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @StateObject private var offlineDataManager = OfflineDataManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(apiService)
                .environmentObject(appStateManager)
                .environmentObject(networkMonitor)
                .environmentObject(offlineDataManager)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
