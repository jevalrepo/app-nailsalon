# Build y Deploy Android — Coraline Nails

## Requisitos previos

- EAS CLI instalado (`npm install -g eas-cli`)
- Keystore de release configurado en EAS (`eas credentials --platform android`)
- Cuenta de Play Store con la app creada

---

## Opción A: Solo actualización JS (sin cambios nativos)

Usa esto cuando solo cambiaste código JS/TS (pantallas, lógica, estilos).
No requiere pasar por Play Store — llega a usuarios en el próximo reinicio de la app.
El script valida que Android tenga canal OTA `production` y runtime nativo sincronizado antes de publicar.

```bash
./scripts/eas-update.sh "descripción del cambio"
```

---

## Opción B: Nueva build nativa (nuevo .aab a Play Store)

Usa esto cuando:

- Agregaste un paquete con código nativo
- Cambiaste permisos, package ID, o configuración en `app.json`
- Es el primer release

### 1. Actualizar versión

```bash
./scripts/bump-android-version.sh 1.0.1
```

Actualiza `version` y `versionCode` en `app.json`, `android/app/build.gradle` y el `runtimeVersion` nativo de Android.
Si alguno de esos valores no queda sincronizado, el script falla para evitar builds incompatibles con OTA.

### 2. Compilar

**Opción local (más rápido):**
```bash
rm -rf android/app/.cxx android/.cxx
cd android && ./gradlew :app:bundleRelease
```
El `.aab` queda en `android/app/build/outputs/bundle/release/app-release.aab`.

No uses `./gradlew clean bundleRelease` si falla limpiando CMake/debug con carpetas de codegen faltantes. En ese caso borra `.cxx` como arriba y compila release directamente.

**Opción EAS en la nube:**
```bash
eas build --platform android --profile production
```
El `.aab` queda disponible para descargar desde el dashboard de EAS.

### 3. Subir a Play Store

**Opción manual:**
1. Descarga el `.aab` desde [expo.dev](https://expo.dev)
2. Ve a [play.google.com/console](https://play.google.com/console)
3. Selecciona Coraline Nails → **Production** (o **Internal testing** primero)
4. Click **Create new release** → sube el `.aab`
5. Completa las notas de la versión y envía a revisión

**Opción automática con EAS Submit:**
```bash
eas submit --platform android --profile production --latest
```

Requiere tener `google-service-account.json` configurado en `eas.json`.

### 4. Publicar OTA (obligatorio después de subir a Play Store)

**Hacer esto inmediatamente después de subir el build.**
Sin este paso, los usuarios con esta versión no recibirán futuros OTA updates.

```bash
./scripts/eas-update.sh "release X.X.X" android
```

---

## Reglas importantes

- `eas update` solo funciona si el usuario ya tiene instalada una build nativa compatible
- `runtimeVersion` usa política `appVersion` — al cambiar `version` en `app.json` cambia el runtime automáticamente
- Android debe tener embebido el canal `production` en `app.json` y `AndroidManifest.xml`
- `android/app/src/main/res/values/strings.xml` debe tener `expo_runtime_version` igual a `expo.version`
- El `versionCode` en Play Store debe ser siempre mayor al anterior — el script lo incrementa automáticamente
- No modifiques `versionCode` manualmente
- El keystore está guardado en EAS — no hace falta archivo local para compilar

---

## Keystore

- **Archivo:** `~/keystores/coraline-nails-release.jks`
- **Alias:** `coraline-nails`
- **Package:** `com.vltech.coralinenails`
- Guardado en EAS bajo el perfil `production`

## Versiones

| Build | versionCode | Fecha    | Notas                          |
|-------|-------------|----------|--------------------------------|
| 1.0.0 | 1           | May 2026 | Build inicial — primer release |
