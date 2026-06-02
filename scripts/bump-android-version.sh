#!/bin/bash
# Uso: ./scripts/bump-android-version.sh 1.0.1
# Actualiza version, runtimeVersion y versionCode en app.json y Android nativo

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Error: especifica la version. Ejemplo: ./scripts/bump-android-version.sh 1.0.1"
  exit 1
fi

OLD_VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/' | tr -d '[:space:]')
OLD_VERSION_CODE=$(grep '"versionCode"' app.json | head -1 | grep -o '[0-9]*')
NEW_VERSION_CODE=$((OLD_VERSION_CODE + 1))

echo "version:     $OLD_VERSION → $NEW_VERSION"
echo "versionCode: $OLD_VERSION_CODE → $NEW_VERSION_CODE"

# 1. app.json — version y versionCode
sed -i '' "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/" app.json
sed -i '' "s/\"versionCode\": $OLD_VERSION_CODE/\"versionCode\": $NEW_VERSION_CODE/" app.json

# 2. android/app/build.gradle — versionCode y versionName (para compilación local)
BUILD_GRADLE="android/app/build.gradle"
if [ -f "$BUILD_GRADLE" ]; then
  sed -i '' "s/versionCode $OLD_VERSION_CODE/versionCode $NEW_VERSION_CODE/" "$BUILD_GRADLE"
  sed -i '' "s/versionName \"$OLD_VERSION\"/versionName \"$NEW_VERSION\"/" "$BUILD_GRADLE"
fi

# 3. android/app/src/main/res/values/strings.xml — runtimeVersion para builds locales
STRINGS_XML="android/app/src/main/res/values/strings.xml"
if [ -f "$STRINGS_XML" ]; then
  sed -i '' "s/<string name=\"expo_runtime_version\">$OLD_VERSION<\\/string>/<string name=\"expo_runtime_version\">$NEW_VERSION<\\/string>/" "$STRINGS_XML"
fi

APP_VERSION=$(node -e "const app=require('./app.json').expo; console.log(app.version)")
APP_VERSION_CODE=$(node -e "const app=require('./app.json').expo; console.log(app.android.versionCode)")
GRADLE_VERSION_CODE=$(grep 'versionCode ' "$BUILD_GRADLE" | head -1 | awk '{print $2}')
GRADLE_VERSION_NAME=$(grep 'versionName ' "$BUILD_GRADLE" | head -1 | sed 's/.*versionName "\(.*\)".*/\1/')
ANDROID_RUNTIME=$(grep 'expo_runtime_version' "$STRINGS_XML" | head -1 | sed 's/.*>\(.*\)<.*/\1/')

if [ "$APP_VERSION" != "$NEW_VERSION" ] ||
   [ "$APP_VERSION_CODE" != "$NEW_VERSION_CODE" ] ||
   [ "$GRADLE_VERSION_CODE" != "$NEW_VERSION_CODE" ] ||
   [ "$GRADLE_VERSION_NAME" != "$NEW_VERSION" ] ||
   [ "$ANDROID_RUNTIME" != "$NEW_VERSION" ]; then
  echo "Error: no se pudo sincronizar completamente la versión Android."
  echo "app.json version/versionCode: $APP_VERSION/$APP_VERSION_CODE"
  echo "Gradle versionName/versionCode: $GRADLE_VERSION_NAME/$GRADLE_VERSION_CODE"
  echo "Android runtimeVersion: $ANDROID_RUNTIME"
  exit 1
fi

echo "✓ Versión actualizada a $NEW_VERSION (versionCode $NEW_VERSION_CODE)"
