# Google Sign-In Setup Guide

This guide covers the complete setup process for Google Sign-In integration in the Perspective app.

## Current Status ✅

**Backend:**
- ✅ Google Auth Library installed (`google-auth-library`)
- ✅ Google OAuth endpoint created (`POST /api/auth/google`)
- ✅ Database migration added for `google_id` field
- ✅ User model updated with Google OAuth fields
- ✅ UserService methods added for Google authentication

**iOS:**
- ✅ GoogleSignIn SDK imported
- ✅ URL handling configured in main app
- ✅ Google Sign-In button added to LoginView
- ✅ APIService method added for Google authentication
- ✅ Models updated with GoogleSignInRequest

## Remaining Steps 🚧

### 1. Google Cloud Console Setup

1. **Create/Configure Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Sign-In API

2. **Create OAuth 2.0 Credentials:**
   
   **For iOS App:**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Select "iOS" as application type
   - Enter your iOS bundle identifier (e.g., `com.perspective.app`)
   - Download the `GoogleService-Info.plist` file

   **For Backend Server:**
   - Create another OAuth client ID
   - Select "Web application" as application type
   - Add authorized redirect URIs (for web if needed)
   - Note the Client ID and Client Secret

### 2. iOS Configuration

1. **Add GoogleService-Info.plist:**
   ```bash
   # Add the downloaded GoogleService-Info.plist to your Xcode project
   # Make sure it's added to the target
   ```

2. **Update Info.plist with Client ID:**
   - Open `ios/Perspective/Perspective/Info.plist`
   - Replace `YOUR_REVERSED_CLIENT_ID` with the actual reversed client ID from GoogleService-Info.plist
   - Example: `com.googleusercontent.apps.123456789-abcdefg`

3. **Configure Google Sign-In in App Delegate:**
   ```swift
   // Add to PerspectiveApp.swift or App Delegate
   import GoogleSignIn
   
   // In application initialization
   if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
      let plist = NSDictionary(contentsOfFile: path),
      let clientId = plist["CLIENT_ID"] as? String {
       GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
   }
   ```

### 3. Backend Environment Variables

Add these to your backend `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Android Setup (If Applicable)

1. **Add GoogleService-Info.json:**
   - Download the Android configuration file
   - Place it in `android/app/google-services.json`

2. **Configure Android OAuth:**
   - Add the SHA-1 fingerprint to Google Console
   - Update Android manifest with Google Sign-In configuration

### 5. Testing & Validation

1. **Test Backend Endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{"idToken":"test-token"}'
   ```

2. **Test iOS Integration:**
   - Build and run the iOS app
   - Tap "Continue with Google" button
   - Verify Google Sign-In flow works
   - Check that backend receives and validates token

### 6. Production Considerations

1. **Security:**
   - Use strong JWT secrets in production
   - Implement rate limiting on auth endpoints
   - Validate all Google tokens server-side

2. **Error Handling:**
   - Add proper error messages for failed Google sign-in
   - Handle network connectivity issues
   - Implement retry mechanisms

3. **User Experience:**
   - Add loading states during Google sign-in
   - Handle account linking scenarios
   - Implement proper logout flow

## Environment Variables Reference

**Backend (.env):**
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-secure-jwt-secret
```

**iOS Configuration:**
- GoogleService-Info.plist file in project
- Reversed Client ID in Info.plist URL schemes

## Troubleshooting

**Common Issues:**

1. **"Invalid token" errors:**
   - Verify Google Client ID matches between iOS and backend
   - Check that token is being sent correctly

2. **iOS sign-in not appearing:**
   - Ensure GoogleService-Info.plist is added to project
   - Verify bundle identifier matches Google Console

3. **Backend verification fails:**
   - Check environment variables are loaded
   - Verify Google Client ID in backend matches console

## Testing Checklist

- [ ] Google Console project created and configured
- [ ] iOS GoogleService-Info.plist added
- [ ] Backend environment variables set
- [ ] Database migration run
- [ ] iOS app builds without errors
- [ ] Google Sign-In button appears and functions
- [ ] Backend receives and validates Google tokens
- [ ] User account creation/login works
- [ ] JWT tokens are generated and stored properly

## Support Resources

- [Google Sign-In iOS Documentation](https://developers.google.com/identity/sign-in/ios)
- [Google Auth Library Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [Google Cloud Console](https://console.cloud.google.com/) 