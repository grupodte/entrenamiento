# Capacitor Mobile Release Checklist

Este documento resume los pasos necesarios para dejar lista la app Fit para publicación en App Store y Play Store usando Capacitor.

## 1. Validar configuración base

- Asegúrate de que `capacitor.config.json` tenga estos valores correctos:
  - `appId` con el identificador inverso (ej. `com.tuempresa.fit`).
  - `appName` igual al nombre comercial.
  - `webDir` apuntando a `dist`.
  - Agrega `server.url` o `server.cleartext` sólo si usas localhost/remoto durante pruebas.

- Verifica que `package.json` tenga scripts útiles:
  ```json
  {
    "build:mobile": "npm run build && npx cap sync",
    "sync:cap": "npx cap sync",
    "open:android": "npx cap open android",
    "open:ios": "npx cap open ios"
  }
  ```

## 2. Preparar recursos nativos

- Corre `npm run build && npx cap sync` para generar `dist/` y actualizar los folders `android/` e `ios/`.
- Sustituye los íconos/splash dentro de `android/app/src/main/res` y `ios/App/App/Assets.xcassets` para que coincidan con los del PWA.
- Confirma que no haya referencias al service worker activo en producción nativa (puedes envolver `registerSW` para que sólo se ejecute en web).

## 3. App Store (Apple Developer)

1. Ingresa a developer.apple.com y asegúrate de tener:
   - Team y App ID configurados en Certificates, Identifiers & Profiles.
   - Certificados de desarrollo/distribución válidos y perfil de aprovisionamiento (provisioning profile) para el bundle ID (`appId`).
2. En App Store Connect:
   - Crea la app, define privacidad, descripción, capturas, categoría y rating.
   - Sube meta (package) y los assets (screenshots, íconos, texto).
3. En Xcode (abre con `npx cap open ios`):
   - Selecciona tu equipo (Team) en la pestaña Signing & Capabilities.
   - Agrega permisos necesarios (Push Notifications, Background Modes, etc.).
   - Ajusta el esquema de build (Release) y prueba con `Cmd+R` en simulador/dispositivo real.
4. Archiva (`Product > Archive`), luego distribuye a App Store Connect.
5. Una vez procesado, completa la metadata y envía para revisión.
6. Asegúrate de haber cumplido las pautas de App Review (UI/UX, privacidad, contenido, permisos) y de tener una política de privacidad accesible dentro de la app o desde la App Store Connect.

## 4. Play Store (Google)

1. Accede a Google Play Console:
   - Crea la app, define nombre, descripción, categoría y contenido.
   - Sube capturas, íconos y video si aplica.
2. En Android Studio (`npx cap open android`):
   - Abre el módulo `app`, selecciona Build Variants (release) y configura firma (`Signing Config`) apuntando al `keystore` (archivo `.jks`).
   - Verifica `minSdkVersion`, `targetSdkVersion` y permisos en `app/src/main/AndroidManifest.xml`.
3. Genera el release `Build > Generate Signed Bundle / APK` y elige `Android App Bundle (AAB)` para Play Store.
4. Súbelo a Play Console en la sección “Releases > Production”.
5. Completa checklist de privacidad y políticas, luego lanza la release.
6. Declara el uso de datos sensibles y verifica que el `Data safety` esté actualizado, además de que todos los recursos usen HTTPS y el tamaño final cumpla las recomendaciones (bundle AAB < 150 MB).

## 5. Pruebas finales y seguimiento

- Antes de publicar, prueba la app instalada en dispositivos reales (iOS y Android) para chequear rutas, autenticación y notificaciones.
- Documenta cualquier plugin nativo nuevo en `docs/` para futuros mantenimientos.
- Mantén el flujo `npm run build && npx cap sync` antes de cualquier re-deploy nativo.
- Verifica métricas y monitoreo (crash reporting, analytics) antes del lanzamiento.
- Revisa periódicamente que los permisos solicitados coincidan con el uso real para evitar rechazos de revisión.

## 6. Limitaciones de entorno (Linux)

- Desde Linux sólo puedes completar la parte web y Android; la compilación y subida a App Store requiere un entorno macOS con Xcode instalado.
- Mantén el directorio `ios/` sincronizado (`npx cap sync`) y transfiérelo a un mac cuando necesites generar el archivo `.ipa`. Considera usar servicios de CI/CD con runners macOS (GitHub Actions, Bitrise, etc.).
- Para automatizar el envío en macOS puedes usar Fastlane o `xcodebuild` + `altool`. Repite la lógica de verificación de permisos, íconos y metadata antes de cada envío.
