# Building Test Versions for App Stores

This guide will help you build test versions of the app for Apple App Store (TestFlight) and Google Play Store (Internal Testing).

**⚠️ IMPORTANT**: Before building for release, you need to set up certificates and signing keys. See [CERTIFICATES_SETUP.md](./CERTIFICATES_SETUP.md) for detailed instructions.

## Build Options: Cloud vs Local

You have **three options** for building:

### Option 1: Local Native Builds (Recommended for Privacy)
Build completely on your machine using native tools. **No cloud services needed.**

### Option 2: EAS Local Builds
Use EAS tooling but run the build on your machine. Requires EAS CLI but no cloud account.

### Option 3: EAS Cloud Builds
Build on Expo's servers. Requires EAS account (free tier available).

---

## Option 1: Local Native Builds (No Cloud Required)

Build directly on your machine using Xcode (iOS) and Gradle (Android). **This is completely offline and private.**

### Prerequisites
- **iOS**: Xcode installed, Apple Developer account ($99/year), certificates set up (see [CERTIFICATES_SETUP.md](./CERTIFICATES_SETUP.md))
- **Android**: Android Studio or JDK installed, release keystore created (see [CERTIFICATES_SETUP.md](./CERTIFICATES_SETUP.md))

### Building iOS Locally

**Step 1: Build Archive**
```bash
cd apps/mobile
npm run build:ios:native
```

Or manually:
```bash
cd apps/mobile/ios
xcodebuild -workspace Sorbischleicht.xcworkspace \
  -scheme Sorbischleicht \
  -configuration Release \
  archive \
  -archivePath build/Sorbischleicht.xcarchive
```

**Step 2: Export IPA**
1. Open Xcode
2. Go to Window → Organizer
3. Select your archive
4. Click "Distribute App"
5. Choose "App Store Connect"
6. Follow the wizard to export the .ipa

**Step 3: Upload to TestFlight**
- Use Transporter app or Xcode Organizer to upload the .ipa
- Or use: `xcrun altool --upload-app --file YourApp.ipa --type ios --apiKey YOUR_KEY --apiIssuer YOUR_ISSUER`

### Building Android Locally

**Step 1: Build App Bundle**
```bash
cd apps/mobile
npm run build:android:native
```

Or manually:
```bash
cd apps/mobile/android
./gradlew bundleRelease
```

**Step 2: Find Your Bundle**
The .aab file will be at:
```
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

**Step 3: Upload to Google Play**
1. Go to Google Play Console → Your App → Testing → Internal Testing
2. Create a new release
3. Upload the .aab file
4. Add release notes and publish

---

## Option 2: EAS Local Builds

Use EAS tooling but run builds on your machine. Requires EAS CLI but **no cloud account**.

### Prerequisites
1. **EAS CLI installed**: `npm install -g eas-cli`
2. **No EAS account needed** for local builds!

### Building with EAS Locally

**iOS:**
```bash
cd apps/mobile
npm run build:ios:local
# or
eas build --platform ios --profile local-ios --local
```

**Android:**
```bash
cd apps/mobile
npm run build:android:local
# or
eas build --platform android --profile local-android --local
```

The `--local` flag runs everything on your machine. No data is sent to Expo's servers.

---

## Option 3: EAS Cloud Builds

Build on Expo's servers. Useful if you don't have Xcode (for iOS) or want to build from any machine.

### Prerequisites

1. **EAS CLI installed**: `npm install -g eas-cli`
2. **EAS account**: Sign up at https://expo.dev (free tier available)
3. **Login to EAS**: `eas login`

### For iOS (TestFlight):
- Apple Developer account ($99/year)
- App Store Connect access
- Xcode installed (for local builds, optional with EAS)

### For Android (Google Play):
- Google Play Console account ($25 one-time fee)
- Service account JSON key (for automated submission, optional)

### Building for TestFlight (iOS) - Cloud Build

### Step 1: Update Version (if needed)
Before building, ensure your version numbers are correct:
- `app.json`: `version` field (e.g., "0.1.0")
- iOS will use `CFBundleShortVersionString` from Info.plist

### Step 2: Build iOS App
```bash
cd apps/mobile
eas build --platform ios --profile testflight
```

This will:
- Build an iOS app archive (.ipa)
- Sign it with your Apple Developer certificate
- Upload to EAS servers
- Provide a download link

### Step 3: Submit to TestFlight
After the build completes, you can:

**Option A: Manual Upload**
1. Download the .ipa from EAS dashboard
2. Use Transporter app or Xcode to upload to App Store Connect
3. Wait for processing (10-30 minutes)
4. Add to TestFlight in App Store Connect

**Option B: Automated Submission (requires setup)**
```bash
eas submit --platform ios --profile production
```

You'll need to configure your Apple credentials in `eas.json` under `submit.production.ios`.

### Building for Google Play (Android) - Cloud Build

### Step 1: Update Version Code
Before building, increment the version code in `android/app/build.gradle`:
```gradle
versionCode 2  // Increment this for each release
versionName "0.1.0"
```

### Step 2: Build Android App Bundle
```bash
cd apps/mobile
eas build --platform android --profile android-internal
```

This will:
- Build an Android App Bundle (.aab)
- Sign it with your keystore
- Upload to EAS servers
- Provide a download link

### Step 3: Submit to Google Play
After the build completes, you can:

**Option A: Manual Upload**
1. Download the .aab from EAS dashboard
2. Go to Google Play Console → Your App → Testing → Internal Testing
3. Create a new release and upload the .aab
4. Add release notes and publish

**Option B: Automated Submission (requires setup)**
```bash
eas submit --platform android --profile production
```

You'll need to:
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Configure the path in `eas.json` under `submit.production.android.serviceAccountKeyPath`
4. Grant the service account access in Google Play Console

## Building Both Platforms

**Cloud builds:**
```bash
eas build --platform all --profile testflight,android-internal
```

**Local builds:**
```bash
# Build iOS
npm run build:ios:native
# Build Android
npm run build:android:native
```

## Quick Reference: All Build Commands

### Local Native Builds (No Cloud)
- iOS: `npm run build:ios:native`
- Android: `npm run build:android:native`

### EAS Local Builds (No Cloud Account Needed)
- iOS: `npm run build:ios:local` or `eas build --platform ios --local`
- Android: `npm run build:android:local` or `eas build --platform android --local`

### EAS Cloud Builds (Requires Account)
- iOS: `npm run build:ios:testflight`
- Android: `npm run build:android:internal`

## Checking Build Status

```bash
eas build:list
```

## Important Notes

### Version Management
- **iOS**: Version is set in `app.json` → `version` and `Info.plist` → `CFBundleShortVersionString`
- **Android**: Version code is in `android/app/build.gradle` → `versionCode` (must increment for each release)
- **Android**: Version name is in `android/app/build.gradle` → `versionName`

### Signing
- **iOS**: EAS will handle code signing automatically if you have an Apple Developer account
- **Android**: You need a keystore file. EAS can generate one for you, or you can use an existing one.

### Keystore Setup (Android)
If you don't have a keystore yet:
```bash
eas credentials
```
This will guide you through creating or uploading a keystore.

### Environment Variables
If you need different configurations for test vs production, you can use environment variables in your build profiles.

## Troubleshooting

### iOS Build Fails
- Check that your Apple Developer account is active
- Verify bundle identifier matches in App Store Connect
- Ensure certificates are valid

### Android Build Fails
- Check that keystore is properly configured
- Verify `versionCode` is incremented
- Check that `applicationId` matches in Google Play Console

### Build Takes Too Long
- First build can take 15-30 minutes (dependencies download)
- Subsequent builds are usually faster (5-15 minutes)
- Check EAS dashboard for build queue status

## Next Steps After Test Release

1. Gather feedback from testers
2. Fix any critical issues
3. Update version numbers
4. Build production versions using the `production` profile
5. Submit to App Store and Google Play for public release

