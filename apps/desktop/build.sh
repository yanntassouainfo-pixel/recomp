#!/bin/zsh
# Construit RECOMP.app et l'installe dans ~/Applications.
# Usage : ./build.sh [URL]   (par défaut : production Vercel)
set -euo pipefail
cd "$(dirname "$0")"
URL="${1:-https://recomp-ten-psi.vercel.app/app}"
OUT="$HOME/Applications/RECOMP.app"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

swiftc -O main.swift -o "$TMP/RECOMP" -framework Cocoa -framework WebKit
swiftc icon.swift -o "$TMP/makeicon" -framework Cocoa
"$TMP/makeicon" "$TMP/icon.png"
mkdir -p "$TMP/AppIcon.iconset"
for s in 16 32 128 256 512; do
  sips -z $s $s "$TMP/icon.png" --out "$TMP/AppIcon.iconset/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$TMP/icon.png" --out "$TMP/AppIcon.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$TMP/AppIcon.iconset" -o "$TMP/AppIcon.icns"

rm -rf "$OUT"
mkdir -p "$OUT/Contents/MacOS" "$OUT/Contents/Resources"
cp "$TMP/RECOMP" "$OUT/Contents/MacOS/RECOMP"
cp "$TMP/AppIcon.icns" "$OUT/Contents/Resources/AppIcon.icns"
cat > "$OUT/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>RECOMP</string>
  <key>CFBundleDisplayName</key><string>RECOMP</string>
  <key>CFBundleIdentifier</key><string>app.recomp.desktop</string>
  <key>CFBundleExecutable</key><string>RECOMP</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.healthcare-fitness</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>RecompURL</key><string>${URL}</string>
</dict></plist>
PLIST
codesign --force --deep --sign - "$OUT" >/dev/null 2>&1
echo "Installé : $OUT → $URL"
