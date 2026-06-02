#!/bin/bash
# Uso: ./scripts/eas-update.sh "mensaje del cambio" [android|ios|all]
# Publica OTA usando el runtimeVersion de app.json.

MESSAGE=$1
PLATFORM=${2:-all}

if [ -z "$MESSAGE" ]; then
  echo "Error: especifica un mensaje. Ejemplo: ./scripts/eas-update.sh \"fix pantalla de settings\" android"
  exit 1
fi

if [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "all" ]; then
  echo "Error: plataforma inválida. Usa android, ios o all."
  exit 1
fi

APP_VERSION=$(node -e "const app=require('./app.json').expo; console.log(app.version)")
CHANNEL=$(node -e "const app=require('./app.json').expo; console.log(app.updates?.requestHeaders?.['expo-channel-name'] || '')")
ANDROID_RUNTIME=$(node -e "const fs=require('fs'); const p='android/app/src/main/res/values/strings.xml'; const s=fs.existsSync(p) ? fs.readFileSync(p,'utf8') : ''; console.log((s.match(/<string name=\"expo_runtime_version\">([^<]+)<\\/string>/)||[])[1] || '')")
ANDROID_MANIFEST=$(cat android/app/src/main/AndroidManifest.xml 2>/dev/null || true)
IOS_RUNTIME=$(plutil -p ios/CoralineNails/Supporting/Expo.plist 2>/dev/null | grep EXUpdatesRuntimeVersion | sed 's/.*=> "\(.*\)"/\1/')
IOS_CHANNEL=$(plutil -extract EXUpdatesRequestHeaders.expo-channel-name raw -o - ios/CoralineNails/Supporting/Expo.plist 2>/dev/null || true)

if [ "$CHANNEL" != "production" ]; then
  echo "Error: app.json debe tener updates.requestHeaders.expo-channel-name = production"
  exit 1
fi

if [ "$PLATFORM" != "ios" ] && [ "$ANDROID_RUNTIME" != "$APP_VERSION" ]; then
  echo "Error: android expo_runtime_version ($ANDROID_RUNTIME) no coincide con app.json version ($APP_VERSION)"
  echo "Ejecuta ./scripts/bump-android-version.sh $APP_VERSION o sincroniza strings.xml antes de publicar OTA."
  exit 1
fi

if [ "$PLATFORM" != "ios" ] && ! echo "$ANDROID_MANIFEST" | grep -q 'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY'; then
  echo "Error: AndroidManifest.xml no tiene el header nativo expo-channel-name=production"
  exit 1
fi

if [ "$PLATFORM" != "android" ] && [ "$IOS_RUNTIME" != "$APP_VERSION" ]; then
  echo "Error: iOS EXUpdatesRuntimeVersion ($IOS_RUNTIME) no coincide con app.json version ($APP_VERSION)"
  echo "Ejecuta ./scripts/bump-ios-version.sh $APP_VERSION o sincroniza Expo.plist antes de publicar OTA."
  exit 1
fi

if [ "$PLATFORM" != "android" ] && [ "$IOS_CHANNEL" != "production" ]; then
  echo "Error: iOS Expo.plist debe tener EXUpdatesRequestHeaders expo-channel-name = production"
  exit 1
fi

RUNTIME_VERSION=$APP_VERSION

echo "runtimeVersion: $RUNTIME_VERSION"
echo "channel: production"
echo "platform: $PLATFORM"
echo "Mensaje: $MESSAGE"
echo ""

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
  echo "▶ Publicando iOS..."
  npx eas update --channel production --platform ios --message "$MESSAGE" --non-interactive
fi

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
  echo ""
  echo "▶ Publicando Android..."
  npx eas update --channel production --platform android --message "$MESSAGE" --non-interactive
fi

echo ""
echo "✓ OTA publicado"
  echo "  runtimeVersion: $RUNTIME_VERSION"
  echo "  platform: $PLATFORM"
  echo "  Mensaje: $MESSAGE"
