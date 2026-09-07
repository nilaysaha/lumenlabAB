#!/bin/bash
# ==============================================================================
# LumenLab AI Studio - macOS Binary (.dmg) Build Script
# Builds native DMG installer for Apple Silicon (M1/M2/M3/M4) & Intel Macs
# ==============================================================================

set -e

echo "🚀 Starting LumenLab AI Studio macOS Build Process..."

# 1. Ensure dependencies are installed
echo "📦 Installing Node dependencies and Electron packaging toolchain..."
npm install
npm install --save-dev electron electron-builder concurrently wait-on

# 2. Build Frontend Assets
echo "⚡ Compiling Production Vite bundle..."
npm run build

# 3. Detect Host Architecture and Build DMG
ARCH=$(uname -m)
echo "🖥️ Host Architecture detected: $ARCH"

if [ "$ARCH" = "arm64" ]; then
  echo "🍏 Building Apple Silicon native DMG (arm64)..."
  npx electron-builder build --mac dmg --arm64 --config electron/electron-builder.json
else
  echo "💻 Building Intel Mac native DMG (x64)..."
  npx electron-builder build --mac dmg --x64 --config electron/electron-builder.json
fi

echo ""
echo "✅ Build Complete!"
echo "📁 Your installer is located at:"
echo "   $(pwd)/dist-electron/LumenLab Studio-1.0.0-$ARCH.dmg"
echo ""
echo "To install on your Mac, double-click the .dmg file and drag LumenLab Studio to Applications."
