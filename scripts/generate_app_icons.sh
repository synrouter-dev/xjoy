#!/bin/bash
# Xjoy App Icon Generator
#
# 从 512px 基础图标生成 iOS 和 Android 所需的所有尺寸图标。
# 需要 macOS (sips) 或 Linux (ImageMagick convert)。
#
# 用法：
#   chmod +x scripts/generate_app_icons.sh
#   ./scripts/generate_app_icons.sh
#
# 前置条件：
#   1. 准备一个 1024x1024 的 PNG 图标，命名为 icon-1024.png
#   2. 放在 packages/app/public/ 目录下

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_DIR/packages/app/public"
BASE_ICON="${PUBLIC_DIR}/icon-1024.png"

# ── Check prerequisites ─────────────────────────────────────────────────────

if ! command -v sips &>/dev/null; then
  echo "❌ sips not found. This script requires macOS."
  exit 1
fi

if [ ! -f "$BASE_ICON" ]; then
  echo "⚠️  icon-1024.png not found at ${BASE_ICON}"
  echo "   Falling back to icon-512.png..."
  BASE_ICON="${PUBLIC_DIR}/icon-512.png"
fi

# ── iOS Icon Set ─────────────────────────────────────────────────────────────

echo "📱 Generating iOS icons..."
IOS_ASSETS="$PROJECT_DIR/packages/app/ios/App/App/Assets.xcassets/AppIcon.appiconset"

mkdir -p "$IOS_ASSETS"

# iOS icon sizes (name:size)
IOS_ICONS=(
  "20:20"
  "29:29"
  "40:40"
  "58:58"
  "60:60"
  "76:76"
  "80:80"
  "87:87"
  "120:120"
  "152:152"
  "167:167"
  "180:180"
  "1024:1024"
)

for entry in "${IOS_ICONS[@]}"; do
  name="${entry%%:*}"
  size="${entry##*:}"
  output="$IOS_ASSETS/icon-${name}.png"
  sips -z "$size" "$size" "$BASE_ICON" --out "$output" &>/dev/null
  echo "  ✓ icon-${name}.png (${size}x${size})"
done

echo "✅ iOS icons generated: $IOS_ASSETS"

# ── Android Icon Set ─────────────────────────────────────────────────────────

echo "📱 Generating Android icons..."
ANDROID_RES="$PROJECT_DIR/packages/app/android/app/src/main/res"

# Android adaptive icon sizes
ANDROID_ICONS=(
  "mipmap-mdpi:48"
  "mipmap-hdpi:72"
  "mipmap-xhdpi:96"
  "mipmap-xxhdpi:144"
  "mipmap-xxxhdpi:192"
)

for entry in "${ANDROID_ICONS[@]}"; do
  dir="${entry%%:*}"
  size="${entry##*:}"
  output_dir="$ANDROID_RES/${dir}"
  mkdir -p "$output_dir"
  sips -z "$size" "$size" "$BASE_ICON" --out "$output_dir/ic_launcher.png" &>/dev/null
  sips -z "$size" "$size" "$BASE_ICON" --out "$output_dir/ic_launcher_round.png" &>/dev/null
  echo "  ✓ ${dir}/ic_launcher.png (${size}x${size})"
done

# Play Store icon (512x512)
mkdir -p "$ANDROID_RES/mipmap-xxxhdpi"
sips -z 512 512 "$BASE_ICON" --out "$PROJECT_DIR/packages/app/android/playstore-icon.png" &>/dev/null
echo "  ✓ playstore-icon.png (512x512)"

echo "✅ Android icons generated"

# ── Splash Screen ────────────────────────────────────────────────────────────

echo "🎨 Generating splash screen..."
SPLASH_DIR="$PROJECT_DIR/packages/app/resources"
mkdir -p "$SPLASH_DIR"

# Generate a simple splash from the icon (centered on background)
if [ -f "$BASE_ICON" ]; then
  cp "$BASE_ICON" "$SPLASH_DIR/splash.png"
  echo "  ✓ splash.png (using base icon — replace with custom splash)"
fi

echo ""
echo "✅ All icons generated!"
echo ""
echo "📋 Next steps:"
echo "   1. Create an iOS Contents.json for AppIcon.appiconset"
echo "   2. In Xcode, open ios/App/App.xcworkspace"
echo "   3. Verify icons in Assets.xcassets → AppIcon"
echo "   4. Build and archive for TestFlight"
