# Certificates and Signing Setup for App Stores

This guide explains how to set up certificates and signing keys for uploading your app to Apple App Store and Google Play Store.

## Android (Google Play Store)

### What You Need
- **Release Keystore**: A Java keystore file (.jks or .keystore) to sign your app bundle
- **Keystore Properties**: Configuration file with keystore credentials

### Step 1: Create a Release Keystore

**⚠️ IMPORTANT**: Keep this keystore file safe! You'll need it for all future updates. If you lose it, you cannot update your app on Google Play.

```bash
cd apps/mobile/android/app

# Create a release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias sorbisch-leicht-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD
```

You'll be prompted for:
- **Name**: Your name or organization
- **Organizational Unit**: Your department/team
- **Organization**: Your company name
- **City/Locality**: Your city
- **State/Province**: Your state/province
- **Country Code**: Two-letter country code (e.g., US, DE)

**Replace `YOUR_STORE_PASSWORD` and `YOUR_KEY_PASSWORD` with strong passwords!**

### Step 2: Create keystore.properties

Create `apps/mobile/android/app/keystore.properties`:

```properties
storeFile=release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=sorbisch-leicht-release
keyPassword=YOUR_KEY_PASSWORD
```

**⚠️ SECURITY**: Add `keystore.properties` to `.gitignore` to avoid committing passwords!

### Step 3: Update .gitignore

Make sure `apps/mobile/android/app/.gitignore` includes:
```
keystore.properties
*.keystore
!debug.keystore
```

### Step 4: Build with Release Keystore

Now when you build:
```bash
npm run build:android:native
```

The build will automatically use your release keystore instead of the debug keystore.

### Step 5: Upload to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create your app (if not already created)
3. Go to **Release** → **Production** (or **Internal Testing** for test releases)
4. Click **Create new release**
5. Upload the `.aab` file from `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes
7. Review and publish

---

## iOS (Apple App Store / TestFlight)

### What You Need
- **Apple Developer Account**: $99/year subscription
- **Distribution Certificate**: For signing release builds
- **Provisioning Profile**: Links your app to your developer account
- **App Store Connect Access**: To upload and manage your app

### Option 1: Automatic Setup with EAS (Recommended)

EAS Build can handle certificates automatically:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure credentials (EAS will guide you)
eas credentials
```

EAS will:
- Create certificates for you
- Manage provisioning profiles
- Handle code signing automatically

### Option 2: Manual Setup with Xcode

#### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Sorbisch leicht
   - **Primary Language**: Your language
   - **Bundle ID**: `com.sorbischleicht.app` (must match your app.json)
   - **SKU**: Unique identifier (e.g., `sorbisch-leicht-001`)

#### Step 2: Generate Certificates in Xcode

1. Open Xcode
2. Go to **Xcode** → **Settings** → **Accounts**
3. Add your Apple ID (if not already added)
4. Select your account → **Manage Certificates**
5. Click **+** → **Apple Distribution** (for App Store)
6. Xcode will create and download the certificate

#### Step 3: Create Provisioning Profile

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Profiles** → **+**
4. Select **App Store** distribution
5. Select your App ID (`com.sorbischleicht.app`)
6. Select your Distribution Certificate
7. Name it (e.g., "Sorbisch leicht App Store")
8. Download the profile
9. Double-click to install in Xcode

#### Step 4: Build Archive in Xcode

1. Open `apps/mobile/ios/Sorbischleicht.xcworkspace` in Xcode
2. Select **Any iOS Device** (not a simulator) as target
3. Go to **Product** → **Archive**
4. Wait for archive to complete
5. In Organizer window, click **Distribute App**
6. Choose **App Store Connect**
7. Follow the wizard to upload

#### Step 5: Submit to TestFlight

1. Go to App Store Connect → Your App
2. Navigate to **TestFlight** tab
3. Wait for processing (10-30 minutes)
4. Add testers or internal testing group
5. Submit for review (if needed)

---

## Security Best Practices

### Android Keystore
- ✅ **Backup your keystore file** to a secure location (encrypted storage)
- ✅ **Never commit keystore files** to version control
- ✅ **Use strong passwords** (store them in a password manager)
- ✅ **Document the keystore location** for your team
- ✅ **Keep multiple backups** in different secure locations

### iOS Certificates
- ✅ **Use EAS** for automatic certificate management (recommended)
- ✅ **Or use Xcode** to manage certificates automatically
- ✅ **Don't share private keys** - each developer should have their own
- ✅ **Keep certificates in sync** across team members

---

## Troubleshooting

### Android: "Keystore file not found"
- Make sure `keystore.properties` exists in `android/app/`
- Check that the path in `keystore.properties` is correct
- Verify the keystore file exists at the specified location

### Android: "Keystore was tampered with, or password was incorrect"
- Double-check your passwords in `keystore.properties`
- Make sure there are no extra spaces or special characters

### iOS: "No signing certificate found"
- Make sure you're logged into Xcode with your Apple Developer account
- Run `eas credentials` to set up certificates with EAS
- Or manually create certificates in Apple Developer Portal

### iOS: "Provisioning profile doesn't match"
- Make sure the Bundle ID matches exactly: `com.sorbischleicht.app`
- Regenerate the provisioning profile with the correct Bundle ID
- Clean build folder in Xcode (Product → Clean Build Folder)

---

## Quick Reference

### Android Release Build
```bash
cd apps/mobile
npm run build:android:native
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS Release Build (Xcode)
1. Open `ios/Sorbischleicht.xcworkspace`
2. Product → Archive
3. Distribute App → App Store Connect

### iOS Release Build (EAS)
```bash
cd apps/mobile
npm run build:ios:testflight
```

---

## Next Steps After Setup

1. ✅ Create release keystore for Android
2. ✅ Set up Apple Developer account (if not already done)
3. ✅ Create app listings in both stores
4. ✅ Build release versions
5. ✅ Upload to stores
6. ✅ Submit for review

Good luck with your app release! 🚀

