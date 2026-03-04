# FIDE Calculator Mobile App (Expo)

React Native mobile application built with Expo for the FIDE Calculator.

## Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- Expo CLI (optional, but recommended): `npm install -g expo-cli`
- For iOS: Xcode (macOS only)
- For Android: Android Studio

## Setup

### 1. Install Dependencies

From the monorepo root:
```bash
pnpm install
```

### 2. Build Shared Package

```bash
pnpm build:shared
```

### 3. Set Up Environment Variables

Create a `.env` file in `apps/mobile/`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Or configure in `app.json` under `expo.extra`:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your-url",
      "supabaseAnonKey": "your-key"
    }
  }
}
```

## Running the App

### Start Development Server

```bash
# From monorepo root
pnpm dev:mobile

# Or from apps/mobile
cd apps/mobile
pnpm start
```

### Run on iOS Simulator

```bash
pnpm ios
```

### Run on Android Emulator

```bash
pnpm android
```

### Run on Web

```bash
pnpm web
```

### Run on Physical Device

1. Install Expo Go app on your device
2. Start the dev server: `pnpm start`
3. Scan the QR code with Expo Go (iOS) or the Expo app (Android)

## Building for Production

### Build release APK locally (Android)

No EAS account needed. Requires **Android SDK** and **JDK 17** (set `ANDROID_HOME` and `JAVA_HOME`).

From monorepo root:

```bash
pnpm build:mobile:apk
```

Or from `apps/mobile`:

```bash
pnpm build:apk
```

The unsigned release APK is written to:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

- **First build:** runs `expo prebuild --platform android --clean` (generates the `android/` folder), then Gradle `assembleRelease`.
- **Faster rebuild** (if you only changed JS and already have `android/`):  
  `pnpm build:apk:fast` (from `apps/mobile`) or `cd apps/mobile/android && ./gradlew assembleRelease`.

### iOS

```bash
eas build --platform ios
```

### Android (EAS cloud)

```bash
eas build --platform android
```

Note: EAS builds require an Expo account. See [Expo documentation](https://docs.expo.dev/build/introduction/).

## Project Structure

```
apps/mobile/
├── src/
│   ├── contexts/      # React contexts (AuthContext)
│   └── lib/           # Library code (Supabase client)
├── assets/            # Images and static assets
├── App.tsx            # Main app component
├── app.json           # Expo configuration
└── package.json       # Dependencies
```

## Features

- ✅ Expo managed workflow (no native code needed)
- ✅ TypeScript support
- ✅ Shared package integration (`@fide-calculator/shared`)
- ✅ Supabase authentication
- ✅ Profile management
- ✅ Cross-platform (iOS, Android, Web)

## Troubleshooting

### Metro bundler can't find shared package

1. Make sure shared package is built: `pnpm build:shared` (from root)
2. Clear Expo cache: `expo start -c` or `pnpm start --clear`
3. Check `babel.config.js` has the module-resolver plugin configured

### Environment variables not working

- Make sure variables start with `EXPO_PUBLIC_` prefix
- Restart the Expo dev server after changing `.env` files
- Check `app.json` for `expo.extra` configuration

### Build errors

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check Expo SDK version compatibility

## Development Tips

- Use `expo start` to see all available options
- Press `i` for iOS simulator, `a` for Android emulator, `w` for web
- Use Expo DevTools for debugging: `expo start --dev-client`
