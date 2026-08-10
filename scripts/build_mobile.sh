#!/bin/bash
# Xjoy Mobile Build Script
#
# 构建 iOS 和 Android 原生应用，用于 TestFlight / APK 分发。
#
# 用法：
#   ./scripts/build_mobile.sh [ios|android|all]
#
# 前置条件：
#   - macOS (iOS 构建需要 Xcode)
#   - Xcode 15+ (iOS)
#   - Android Studio + JDK 17 (Android)
#   - Node.js 22+
#   - pnpm

set -euo pipefail

PLATFORM="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_DIR/packages/app"

echo "🏗️  Xjoy Mobile Build"
echo "======================"
echo ""

# ── Step 1: Generate App Icons ──────────────────────────────────────────────

echo "📱 Step 1: Generating app icons..."
"$SCRIPT_DIR/generate_app_icons.sh"
echo ""

# ── Step 2: Set Production Config ───────────────────────────────────────────

echo "⚙️  Step 2: Setting production Capacitor config..."
cd "$APP_DIR"
if [ -f "capacitor.config.ts" ]; then
  cp capacitor.config.ts capacitor.config.dev.ts.bak 2>/dev/null || true
fi
cp capacitor.config.prod.ts capacitor.config.ts
echo ""

# ── Step 3: Sync Capacitor ──────────────────────────────────────────────────

echo "🔄 Step 3: Syncing Capacitor..."
npx cap sync
echo ""

# ── Step 4: Build Platform ──────────────────────────────────────────────────

build_ios() {
  echo "🍎 Building iOS..."
  cd "$APP_DIR/ios/App"

  # Verify Xcode is available
  if ! command -v xcodebuild &>/dev/null; then
    echo "❌ xcodebuild not found. Install Xcode first."
    exit 1
  fi

  # Clean build
  xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release 2>&1 | tail -5

  # Archive
  echo "   Archiving..."
  xcodebuild archive \
    -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -archivePath "$APP_DIR/build/ios/App.xcarchive" \
    CODE_SIGN_STYLE=Automatic \
    2>&1 | tail -10

  echo "✅ iOS archive created: $APP_DIR/build/ios/App.xcarchive"
  echo ""
  echo "📋 To upload to TestFlight:"
  echo "   1. Open Xcode → Window → Organizer"
  echo "   2. Select the archive → Distribute App"
  echo "   3. Choose 'TestFlight & App Store'"
  echo "   Or use: xcodebuild -exportArchive + altool --upload-app"
}

build_android() {
  echo "🤖 Building Android..."
  cd "$APP_DIR/android"

  # Verify Gradle is available
  if [ ! -f "./gradlew" ]; then
    echo "❌ gradlew not found. Run 'npx cap add android' first."
    exit 1
  fi

  # Build release APK
  echo "   Building release APK..."
  ./gradlew assembleRelease 2>&1 | tail -10

  APK_PATH="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
  if [ -f "$APK_PATH" ]; then
    echo "✅ APK created: $APK_PATH"
  else
    echo "⚠️  APK not found. Check build output above."
  fi
  echo ""
  echo "📋 To distribute APK:"
  echo "   1. Sign with: jarsigner -keystore your-keystore.jks $APK_PATH"
  echo "   2. Upload to Google Play Console or distribute directly"
}

case "$PLATFORM" in
  ios)
    build_ios
    ;;
  android)
    build_android
    ;;
  all)
    build_ios
    echo ""
    build_android
    ;;
  *)
    echo "Usage: $0 [ios|android|all]"
    exit 1
    ;;
esac

# ── Step 5: Restore Dev Config ──────────────────────────────────────────────

cd "$APP_DIR"
if [ -f "capacitor.config.dev.ts.bak" ]; then
  mv capacitor.config.dev.ts.bak capacitor.config.ts
  echo ""
  echo "🔄 Restored dev capacitor config."
fi

echo ""
echo "🎉 Build complete!"
