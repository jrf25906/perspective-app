import SwiftUI

struct ProfileHeaderView: View {
    let user: User?
    let onEditProfile: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Avatar and basic info
            HStack(spacing: 16) {
                // Profile picture
                AsyncImage(url: user?.avatarUrl.flatMap(URL.init)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                }
                .frame(width: 80, height: 80)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 3
                        )
                )
                
                // User info
                VStack(alignment: .leading, spacing: 4) {
                    if let user = user {
                        Text(user.firstName != nil || user.lastName != nil ? 
                             "\(user.firstName ?? "") \(user.lastName ?? "")".trimmingCharacters(in: .whitespaces) : 
                             user.username)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("@\(user.username)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Text(user.email)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Loading...")
                            .font(.title2)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                
                Spacer()
            }
            
            // Edit profile button
            Button(action: onEditProfile) {
                HStack {
                    Image(systemName: "pencil")
                    Text("Edit Profile")
                }
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.blue)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(20)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
} 