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
    let apiService = APIService.shared
    let appStateManager = AppStateManager.shared
    let networkMonitor = NetworkMonitor.shared
    @StateObject private var offlineDataManager = OfflineDataManager()

    init() {
        // Configure Google Sign-In
        configureGoogleSignIn()
    }

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
    
    private func configureGoogleSignIn() {
        // Load Google configuration from GoogleService-Info.plist
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let plist = NSDictionary(contentsOfFile: path),
           let clientId = plist["CLIENT_ID"] as? String {
            GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
            print("Google Sign-In configured with Client ID: \(clientId)")
        } else {
            print("Warning: GoogleService-Info.plist not found or CLIENT_ID missing")
        }
    }
}
