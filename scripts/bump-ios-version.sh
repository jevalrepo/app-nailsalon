#!/bin/bash
# Uso: ./scripts/bump-ios-version.sh 1.0.1

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Error: especifica la version. Ejemplo: ./scripts/bump-ios-version.sh 1.0.1"
  exit 1
fi

# 1. app.json (version)
OLD_APP_VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "app.json version: $OLD_APP_VERSION → $NEW_VERSION"
sed -i '' "s/\"version\": \"$OLD_APP_VERSION\"/\"version\": \"$NEW_VERSION\"/" app.json

# 2. app.json buildNumber
OLD_BUILD=$(grep '"buildNumber"' app.json | head -1 | sed 's/.*"buildNumber": "\(.*\)".*/\1/')
NEW_BUILD=$((OLD_BUILD + 1))
echo "app.json buildNumber: $OLD_BUILD → $NEW_BUILD"
sed -i '' "s/\"buildNumber\": \"$OLD_BUILD\"/\"buildNumber\": \"$NEW_BUILD\"/" app.json

# 3. project.pbxproj
OLD_PBX_VERSION=$(grep 'MARKETING_VERSION' ios/CoralineNails.xcodeproj/project.pbxproj | head -1 | sed 's/.*MARKETING_VERSION = \(.*\);/\1/' | tr -d '[:space:]')
echo "project.pbxproj: $OLD_PBX_VERSION → $NEW_VERSION"
sed -i '' "s/MARKETING_VERSION = $OLD_PBX_VERSION;/MARKETING_VERSION = $NEW_VERSION;/g" ios/CoralineNails.xcodeproj/project.pbxproj
sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" ios/CoralineNails.xcodeproj/project.pbxproj

# 4. Info.plist CFBundleShortVersionString
OLD_PLIST_VERSION=$(plutil -p ios/CoralineNails/Info.plist 2>/dev/null | grep CFBundleShortVersionString | sed 's/.*=> "\(.*\)"/\1/')
if [ -n "$OLD_PLIST_VERSION" ]; then
  echo "Info.plist: $OLD_PLIST_VERSION → $NEW_VERSION"
  plutil -replace CFBundleShortVersionString -string "$NEW_VERSION" ios/CoralineNails/Info.plist
  plutil -replace CFBundleVersion -string "$NEW_BUILD" ios/CoralineNails/Info.plist
fi

# 5. Expo.plist EXUpdatesRuntimeVersion
OLD_EXPO_VERSION=$(plutil -p ios/CoralineNails/Supporting/Expo.plist 2>/dev/null | grep EXUpdatesRuntimeVersion | sed 's/.*=> "\(.*\)"/\1/')
if [ -n "$OLD_EXPO_VERSION" ]; then
  echo "Expo.plist: $OLD_EXPO_VERSION → $NEW_VERSION"
  plutil -replace EXUpdatesRuntimeVersion -string "$NEW_VERSION" ios/CoralineNails/Supporting/Expo.plist
fi

APP_VERSION=$(node -e "const app=require('./app.json').expo; console.log(app.version)")
APP_BUILD=$(node -e "const app=require('./app.json').expo; console.log(app.ios.buildNumber)")
PBX_MARKETING_VERSION=$(grep 'MARKETING_VERSION' ios/CoralineNails.xcodeproj/project.pbxproj | head -1 | sed 's/.*MARKETING_VERSION = \(.*\);/\1/' | tr -d '[:space:]')
PBX_BUILD=$(grep 'CURRENT_PROJECT_VERSION' ios/CoralineNails.xcodeproj/project.pbxproj | head -1 | sed 's/.*CURRENT_PROJECT_VERSION = \(.*\);/\1/' | tr -d '[:space:]')
PLIST_VERSION=$(plutil -p ios/CoralineNails/Info.plist | grep CFBundleShortVersionString | sed 's/.*=> "\(.*\)"/\1/')
PLIST_BUILD=$(plutil -p ios/CoralineNails/Info.plist | grep CFBundleVersion | sed 's/.*=> "\(.*\)"/\1/')
IOS_RUNTIME=$(plutil -p ios/CoralineNails/Supporting/Expo.plist | grep EXUpdatesRuntimeVersion | sed 's/.*=> "\(.*\)"/\1/')

if [ "$APP_VERSION" != "$NEW_VERSION" ] ||
   [ "$APP_BUILD" != "$NEW_BUILD" ] ||
   [ "$PBX_MARKETING_VERSION" != "$NEW_VERSION" ] ||
   [ "$PBX_BUILD" != "$NEW_BUILD" ] ||
   [ "$PLIST_VERSION" != "$NEW_VERSION" ] ||
   [ "$PLIST_BUILD" != "$NEW_BUILD" ] ||
   [ "$IOS_RUNTIME" != "$NEW_VERSION" ]; then
  echo "Error: no se pudo sincronizar completamente la versión iOS."
  echo "app.json version/buildNumber: $APP_VERSION/$APP_BUILD"
  echo "project.pbxproj MARKETING_VERSION/CURRENT_PROJECT_VERSION: $PBX_MARKETING_VERSION/$PBX_BUILD"
  echo "Info.plist CFBundleShortVersionString/CFBundleVersion: $PLIST_VERSION/$PLIST_BUILD"
  echo "Expo.plist EXUpdatesRuntimeVersion: $IOS_RUNTIME"
  exit 1
fi

echo "✓ iOS version actualizada a $NEW_VERSION (buildNumber $NEW_BUILD)"
