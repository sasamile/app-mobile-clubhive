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
| iOS ("Tiked iOS") | Abrir el flujo nativo en iPhone. Creado el 10 sep 2026 con el paquete `com.clubhive.app` | `1014451974721-f1q2t7kl9t20rp0g3n5v5tqhbd0q7vn3.apps.googleusercontent.com` |
| Android | Abrir el flujo nativo en Android | **falta crearlo** |

El **client secret nunca va en la app**. El SDK nativo no lo necesita y cualquiera
podría extraerlo del binario (`.ipa` / `.apk` son archivos zip).

## Por qué se pasa el client web además del nativo

El SDK envía el client web como `serverClientID`, y Google devuelve un idToken cuyo
`aud` es ese client web. Así el token que manda la app es equivalente al de la web y
el backend lo valida con la misma configuración de Cognito.

## Client iOS: ya creado

Está en `app.json` en dos lugares, escritos por
[`scripts/set-google-ios-client.mjs`](../scripts/set-google-ios-client.mjs):

- `ios.infoPlist.GIDClientID`: el client ID completo.
- Plugin `@react-native-google-signin/google-signin` con `iosUrlScheme`
  `com.googleusercontent.apps.1014451974721-f1q2t7kl9t20rp0g3n5v5tqhbd0q7vn3`
  (Expo lo escribe en Info.plist al hacer prebuild; no basta con ponerlo a mano
  junto a `scheme`, porque el plugin de linking puede pisarlo).

Si algún día hay que cambiarlo:

```bash
node scripts/set-google-ios-client.mjs <nuevo-client-id>
npx expo prebuild --platform ios && npx expo run:ios
```

Cambiar esos valores toca el binario, no solo el JS. Un reload de Metro no alcanza:
hay que reinstalar la app para que iOS registre el esquema de URL.

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

## El 401 CUSTOMER_SOCIAL_AUTH_FAILED: causa encontrada

El 10 de septiembre de 2026 el login en iPhone terminaba bien en Google pero
`POST /customers/auth/socialLogin` respondia 401. Eran dos cosas distintas:

**1. El backend validaba contra el client equivocado.** En `tiked-back`, la propiedad
`google.clientIds` de `application.yml` listaba solo el client
`359391005856-...` del proyecto `tiked-486003`. `SocialLoginService` arma un
`GoogleIdTokenVerifier` con esa lista como audiencias validas, asi que un token con
`aud` del client web real no verificaba: `verify()` devuelve null, el envoltorio
`GoogleAuthToken` revienta al leer el subject y `CustomerExceptionMapper.socialAuth`
lo traduce a `CUSTOMER_SOCIAL_AUTH_FAILED`. Ya esta corregido: la lista incluye el
client que usan la web y la app, y se puede sobreescribir con `GOOGLE_CLIENT_IDS`.
**El cambio necesita un despliegue del backend para que aplique en api.tiked.co.**

**2. La app no enviaba `termsAccepted`.** `CustomerService.getSocialAuth` lo exige
cuando el correo no existe todavia, y sin el responde
`CUSTOMER_TERMS_ACCEPTANCE_REQUIRED` en vez de crear la cuenta. La web ya lo mandaba
en `lib/customer-social-login.ts`. Ahora la app tambien lo manda, en Google y en
Apple, y la pantalla de login avisa que al continuar se aceptan los terminos, con
enlaces a `https://tiked.co/terms-and-conditions` y `https://tiked.co/privacy-policy`.

Para diagnosticar casos parecidos, en desarrollo la app imprime una linea
`🔎 idToken de Google` con los claims `aud`, `azp` e `iss`, sin exponer el token.

## Iniciar sesion con Apple

Mismo endpoint que Google, con `authType: "APPLE"` y el `identityToken` que devuelve
`expo-apple-authentication`. Dos diferencias que importan:

- **El nombre viaja aparte.** El identityToken de Apple no lo incluye, y Apple se lo
  entrega al cliente una unica vez: en el primer inicio de sesion de ese Apple ID con la
  app. Por eso [`lib/auth/apple.ts`](../lib/auth/apple.ts) lo reenvia en `fullName`. Si
  falta, el backend usa el tramo local del correo, porque la columna del nombre no admite
  nulos.
- **El correo puede ser una direccion de reenvio** del tipo `@privaterelay.appleid.com`
  si el usuario elige ocultarlo. Es una direccion valida y estable para esa cuenta.

En el backend el token se verifica contra el JWKS de Apple, comprobando firma, emisor,
expiracion y audiencia. La audiencia de un login nativo es el bundle identifier de la
app, configurado en `apple.clientIds` y sobreescribible con `APPLE_CLIENT_IDS`.

Para que funcione en el dispositivo, el App ID en Apple Developer necesita la capacidad
"Sign In with Apple" habilitada. En `app.json` ya estan `ios.usesAppleSignIn` y el plugin
`expo-apple-authentication`.

## Usuarios de prueba: el siguiente bloqueo

La pantalla de consentimiento está en estado **Prueba** con 0 usuarios de prueba
cargados. En ese estado Google rechaza cualquier cuenta que no esté en esa lista,
con un error de "acceso bloqueado", aunque los clients estén bien configurados.

Se arregla de dos maneras, en Google Cloud → Google Auth Platform → Público:

- Agregar las cuentas con las que vas a probar, hasta 100.
- O completar la página de Información de marca y publicar la app, para que entre
  cualquiera.

## Cambio de nombre visible

El nombre que ve el usuario en el diálogo del sistema al tocar "Continuar con Google"
sale de `CFBundleDisplayName`, que ya es **Tiked** en `app.json`. Se aplica al
regenerar el proyecto nativo. Siguen diciendo "clubhive", sin impacto para el usuario:

- `ios.bundleIdentifier` y `android.package`: `com.clubhive.app`. Cambiarlos rompe la
  ficha en App Store / Play y obliga a rehacer los clients de Google y Apple.
- `expo.slug`: `Clubhive`, atado al proyecto de EAS.
