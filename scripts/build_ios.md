# Build y Deploy iOS — Coraline Nails

## Requisitos previos

- Xcode abierto con `ios/CoralineNails.xcworkspace`
- Cuenta Apple Developer activa (`com.coralinenails.app`)
- EAS CLI instalado (`npm install -g eas-cli`)

---

## Opción A: Solo actualización JS (sin cambios nativos)

Usa esto cuando solo cambiaste código JS/TS (pantallas, lógica, estilos).
No requiere pasar por App Store — llega a usuarios en el próximo reinicio de la app.
El script compartido valida que iOS tenga canal OTA `production` y runtime nativo sincronizado antes de publicar.

```bash
./scripts/eas-update.sh "descripción del cambio" all
```

---

## Opción B: Nueva build nativa (nuevo .ipa a App Store)

Usa esto cuando:

- Agregaste un paquete con código nativo
- Cambiaste permisos, bundle ID, o configuración en `app.json`
- Cambiaste algo en `ios/`

### 1. Actualizar versión

```bash
./scripts/bump-ios-version.sh 1.0.1
```

Esto actualiza `version` y `buildNumber` en `app.json`, `MARKETING_VERSION` y `CURRENT_PROJECT_VERSION` en `ios/CoralineNails.xcodeproj/project.pbxproj`, `CFBundleShortVersionString` y `CFBundleVersion` en `Info.plist`, y `EXUpdatesRuntimeVersion` en `Expo.plist`.
Si alguno de esos valores no queda sincronizado, el script falla para evitar builds incompatibles con OTA.

### 2. Reinstalar pods (si cambiaste dependencias nativas)

```bash
cd ios && pod install && cd ..
```

### 3. Archive desde Xcode

1. Abre `ios/CoralineNails.xcworkspace` en Xcode
2. Selecciona destino **Any iOS Device (arm64)** en el menú superior
3. Menú **Product → Archive**
4. Espera a que compile (varios minutos)
5. Se abre la ventana **Organizer** automáticamente

### 4. Subir a App Store Connect

En la ventana Organizer:

1. Selecciona el archive recién creado
2. Click **Distribute App**
3. Selecciona **App Store Connect**
4. Selecciona **Upload**
5. Deja todas las opciones por defecto → **Next** → **Upload**

### 5. Publicar en App Store Connect

1. Ve a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Coraline Nails → **TestFlight** o **App Store**
3. Selecciona el build recién subido
4. Completa la información requerida y envía a revisión

### 6. Publicar en EAS (obligatorio para activar OTA en esta versión)

**Hacer esto inmediatamente después de subir a App Store Connect.**
Sin este paso, los usuarios con esta versión no recibirán futuros OTA updates.

```bash
./scripts/eas-update.sh "release X.X.X" ios
```

### 7. App ID de la app (para links a App Store)

Una vez publicada en App Store, guardar el App ID aquí:

```
https://apps.apple.com/app/id/TU_APP_ID_AQUI
```

---

## Idiomas en App Store Connect

Al crear la versión en App Store Connect:

1. Agregar **Spanish (Mexico)** como idioma localizado
2. Completar nombre, descripción, keywords y capturas en español
3. El idioma primario debe ser **Spanish**

---

## Reglas importantes

- `eas update` solo funciona si el usuario ya tiene instalada una build nativa con el mismo `runtimeVersion` (definido por `appVersion` en `app.json`)
- Si cambias la versión en `app.json`, el `runtimeVersion` cambia automáticamente — necesitas nuevo build nativo (Opción B)
- iOS debe tener embebido el canal `production` en `ios/CoralineNails/Supporting/Expo.plist`
- `ios/CoralineNails/Supporting/Expo.plist` debe tener `EXUpdatesRuntimeVersion` igual a `expo.version`
- Si solo cambias JS, usa Opción A — no necesitas pasar por App Store
- Nunca corras `npx expo prebuild --clean` — borra la configuración nativa actual

---

## Versiones

| Build | buildNumber | runtimeVersion | Fecha | Notas |
|-------|-------------|----------------|-------|-------|
| 1.0.0 | 1           | 1.0.0          |       | Build inicial |
