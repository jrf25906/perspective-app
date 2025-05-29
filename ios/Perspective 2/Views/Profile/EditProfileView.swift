import SwiftUI
import Combine

struct EditProfileView: View {
    @EnvironmentObject var apiService: APIService
    @Environment(\.dismiss) private var dismiss
    
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var username: String = ""
    @State private var email: String = ""
    @State private var preferredChallengeTime: String = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    
    private let challengeTimes = [
        "Morning (8:00 AM)",
        "Lunch (12:00 PM)",
        "Evening (6:00 PM)",
        "Night (9:00 PM)"
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Profile Information") {
                    // Profile picture
                    HStack {
                        Button(action: { showingImagePicker = true }) {
                            if let selectedImage = selectedImage {
                                Image(uiImage: selectedImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 60, height: 60)
                                    .clipShape(Circle())
                            } else {
                                AsyncImage(url: apiService.currentUser?.avatarUrl.flatMap(URL.init)) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Image(systemName: "person.circle.fill")
                                        .font(.system(size: 60))
                                        .foregroundColor(.gray)
                                }
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                            }
                        }
                        
                        VStack(alignment: .leading) {
                            Text("Profile Picture")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            Text("Tap to change")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                    
                    TextField("First Name", text: $firstName)
                    TextField("Last Name", text: $lastName)
                    TextField("Username", text: $username)
                        .autocapitalization(.none)
                    TextField("Email", text: $email)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }
                
                Section("Preferences") {
                    Picker("Preferred Challenge Time", selection: $preferredChallengeTime) {
                        ForEach(challengeTimes, id: \.self) { time in
                            Text(time).tag(time)
                        }
                    }
                }
                
                if !errorMessage.isEmpty {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveProfile()
                    }
                    .disabled(isLoading)
                }
            }
            .onAppear {
                loadCurrentUserData()
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(selectedImage: $selectedImage)
            }
        }
    }
    
    private func loadCurrentUserData() {
        guard let user = apiService.currentUser else { return }
        
        firstName = user.firstName ?? ""
        lastName = user.lastName ?? ""
        username = user.username
        email = user.email
        preferredChallengeTime = user.preferredChallengeTime ?? challengeTimes[0]
    }
    
    private func saveProfile() {
        isLoading = true
        errorMessage = ""
        
        // In a real app, this would make an API call to update the profile
        // For now, we'll simulate a successful update
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isLoading = false
            dismiss()
        }
    }
}

// Simple image picker wrapper
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        picker.allowsEditing = true
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let editedImage = info[.editedImage] as? UIImage {
                parent.selectedImage = editedImage
            } else if let originalImage = info[.originalImage] as? UIImage {
                parent.selectedImage = originalImage
            }
            
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
} 