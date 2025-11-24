# Play Integrity API Setup Guide

## Overview
Play Integrity API has been integrated into DuitU to enable secure phone number authentication with Firebase.

## What's Been Done

### 1. Android Dependencies
- Added `com.google.android.play:integrity:1.6.0` to `android/app/build.gradle`

### 2. Native Module
Created Kotlin files for Play Integrity integration:
- `PlayIntegrityModule.kt` - Native module to request integrity tokens
- `PlayIntegrityPackage.kt` - React Native package wrapper
- Registered the package in `MainApplication.kt`

### 3. TypeScript Wrapper
Created `modules/PlayIntegrity.ts` for easy JavaScript/TypeScript access

## Setup Steps Required

### 1. Link Your App to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create an app or select your existing app
3. Note your package name: `com.duitu.fypcode`

### 2. Configure Play Integrity API
1. In Google Play Console, go to **Release** → **Setup** → **App Integrity**
2. Link your Firebase project if not already linked
3. Configure integrity settings

### 3. Generate Upload Key (for Release)
If you haven't already, generate a release keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Update `android/app/build.gradle` with your release signing config.

### 4. Test Integration
1. Build a release APK or AAB
2. Upload to Play Console (Internal Testing track is fine)
3. Download and install from Play Store

### 5. Get Cloud Project Number
1. Go to Firebase Console → Project Settings
2. Copy your Cloud Project Number
3. You'll need this for requesting integrity tokens

## Usage in Your App

```typescript
import PlayIntegrity from '@/modules/PlayIntegrity';

// Generate a nonce (random string) for each request
const nonce = generateNonce(); // You need to implement this

try {
  const integrityToken = await PlayIntegrity.requestIntegrityToken(nonce);
  
  // Use this token with Firebase Phone Auth
  // Send to your backend for verification
  console.log('Integrity Token:', integrityToken);
} catch (error) {
  console.error('Play Integrity Error:', error);
}
```

## Integration with Firebase Phone Auth

To use Play Integrity with Firebase Phone Authentication:

1. **Enable App Check in Firebase Console:**
   - Go to Firebase Console → Build → App Check
   - Register your Android app
   - Select "Play Integrity" as the provider

2. **In your authentication code:**
```typescript
import PlayIntegrity from '@/modules/PlayIntegrity';
import { FirebaseRecaptchaVerifierModal } from '@react-native-firebase/auth';

// Before phone auth
const nonce = Math.random().toString(36).substring(7);
const integrityToken = await PlayIntegrity.requestIntegrityToken(nonce);

// Now proceed with phone authentication
// Firebase will automatically verify the integrity token
```

## Important Notes

- Play Integrity API only works on real Android devices with Google Play Services
- Won't work on emulators without Google Play
- App must be distributed through Google Play Store (even via internal testing)
- Tokens are single-use and expire after a short time

## Testing

For development/testing:
1. Use Internal Testing track in Play Console
2. Add your Google account as a tester
3. Install the app from Play Store
4. Test the integrity token generation

## Troubleshooting

**Error: "Play Integrity API is not available"**
- Make sure you're running on a real device with Google Play Services
- App must be downloaded from Play Store

**Error: "APP_NOT_LINKED"**
- App is not properly linked in Play Console
- Make sure package name matches

**Error: "NETWORK_ERROR"**
- Check internet connection
- Ensure Google Play Services is up to date

## References
- [Play Integrity API Setup](https://developer.android.com/google/play/integrity/setup)
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [Play Integrity Standard API](https://developer.android.com/google/play/integrity/standard)
