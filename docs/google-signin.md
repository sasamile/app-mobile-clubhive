# Login con Google (Tiked)

Implementación: **SDK nativo** `@react-native-google-signin/google-signin`.
Código: [`lib/auth/google.ts`](../lib/auth/google.ts).

No funciona en **Expo Go**: hay que usar un dev build o un build de EAS
(`npx expo run:ios`, `npx expo run:android`, `eas build`).

## Proyecto de Google Cloud

Todo vive en **`tiked-493821`** (nombre "Tiked"), el mismo proyecto que usa la web.
El proyecto `tiked-486003` **no** se usa: sus credenciales quedaron fuera del código.

| Client | Para qué | Valor |
| --- | --- | --- |
| Aplicación web ("Tiked Cognito Client") | `webClientId`. Define el `aud` del idToken que valida el backend | `1014451974721-gcpkfkr3pmknnoi26r8djq4g9r61qt03.apps.googleusercontent.com` |
| iOS | Abrir el flujo nativo en iPhone | **falta crearlo** |
| Android | Abrir el flujo nativo en Android | **falta crearlo** |

El **client secret nunca va en la app**. El SDK nativo no lo necesita y cualquiera
podría extraerlo del binario (`.ipa` / `.apk` son archivos zip).

## Por qué se pasa el client web además del nativo

El SDK envía el client web como `serverClientID`, y Google devuelve un idToken cuyo
`aud` es ese client web. Así el token que manda la app es equivalente al de la web y
el backend lo valida con la misma configuración de Cognito.

## Falta: crear el client iOS

1. Google Cloud → APIs y servicios → Credenciales → Crear cliente → **iOS**.
2. ID del paquete: `com.clubhive.app` (el `ios.bundleIdentifier` de `app.json`).
3. Copiar el Client ID a `app.json`, en dos lugares:
   - `ios.infoPlist.GIDClientID`: el client ID completo.
   - `ios.infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes`: el esquema invertido,
     o sea `com.googleusercontent.apps.<parte antes de .apps.googleusercontent.com>`.
4. Regenerar el proyecto nativo y correr:

```bash
npx expo prebuild --platform ios --clean && npx expo run:ios
```

Mientras el valor siga en `reemplazar-con-client-id-ios`, el botón de Google muestra
un mensaje explicando qué falta en vez de reventar.

## Falta: crear el client Android

1. Google Cloud → Credenciales → Crear cliente → **Android**.
2. Nombre del paquete: `com.clubhive.app`.
3. Huella SHA-1 de la firma. Para builds de EAS:

```bash
eas credentials --platform android
```

   Para el keystore de debug local:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

4. El client Android no se referencia en el código: basta con que exista en Google Cloud.
   Si falta, el login falla con `DEVELOPER_ERROR` (código 10).

## Usuarios de prueba

La pantalla de consentimiento está en estado **Prueba**, con 0 usuarios de prueba
cargados. En ese estado solo pueden entrar las cuentas que estén en la lista de
usuarios de prueba (máximo 100). Para abrirlo a cualquiera hay que completar la
página de Información de marca y publicar la app.

## Cambio de nombre visible

El nombre que ve el usuario en el diálogo del sistema al tocar "Continuar con Google"
sale de `CFBundleDisplayName`, que ya es **Tiked** en `app.json`. Se aplica al
regenerar el proyecto nativo. Siguen diciendo "clubhive", sin impacto para el usuario:

- `ios.bundleIdentifier` y `android.package`: `com.clubhive.app`. Cambiarlos rompe la
  ficha en App Store / Play y obliga a rehacer los clients de Google y Apple.
- `expo.slug`: `Clubhive`, atado al proyecto de EAS.
