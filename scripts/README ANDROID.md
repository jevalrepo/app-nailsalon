# Scripts — Coraline Nails

## Cambios solo de JS/TS (pantallas, lógica, estilos)

No requiere pasar por Play Store. Los usuarios reciben el update en el próximo reinicio de la app.
El script valida antes de publicar que Android e iOS tengan configurado el canal OTA `production` y que el `runtimeVersion` nativo coincida con la versión de `app.json`.

```bash
./scripts/eas-update.sh "descripción del cambio" all
```

---

## Cambios nativos (nuevo paquete nativo, permisos, configuración en app.json)

### 1. Bump de versión

```bash
./scripts/bump-android-version.sh 1.0.1
```

Actualiza `version` y `versionCode` en `app.json`, `android/app/build.gradle` y el `runtimeVersion` nativo de Android.
Si alguno de esos valores no queda sincronizado, el script falla para evitar subir una build que no pueda recibir OTA.

### 2. Compilar

```bash
rm -rf android/app/.cxx android/.cxx
cd android && ./gradlew :app:bundleRelease
```

El `.aab` queda en `android/app/build/outputs/bundle/release/app-release.aab`.
No uses `./gradlew clean bundleRelease` si falla limpiando CMake/debug con carpetas de codegen faltantes. Borra `.cxx` y compila release directamente.

### 3. Subir a Play Store

1. Ve a [play.google.com/console](https://play.google.com/console)
2. Selecciona Coraline Nails → **Production**
3. Click **Create new release** → sube el `.aab`
4. Completa las notas de la versión y envía a revisión

### 4. Publicar OTA

Para que los usuarios de la nueva versión puedan recibir futuros updates de JS.

```bash
./scripts/eas-update.sh "release 1.0.1" android
```

---

## OTA: reglas que no se deben romper

- La build nativa de Android e iOS debe traer el canal `production` embebido.
- `app.json` debe tener `updates.requestHeaders.expo-channel-name = production`.
- `android/app/src/main/AndroidManifest.xml` debe tener `expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY`.
- `android/app/src/main/res/values/strings.xml` debe tener `expo_runtime_version` igual a `expo.version`.
- `ios/CoralineNails/Supporting/Expo.plist` debe tener `EXUpdatesRequestHeaders` con `expo-channel-name = production`.
- `ios/CoralineNails/Supporting/Expo.plist` debe tener `EXUpdatesRuntimeVersion` igual a `expo.version`.
- Con `runtimeVersion.policy = appVersion`, un OTA publicado para `1.1.0` solo lo recibe una app instalada cuyo runtime también sea `1.1.0`.
- Si cambias `version` en `app.json`, necesitas nueva build nativa. Después de instalarla, publica el OTA de esa misma versión.
