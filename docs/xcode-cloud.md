# Xcode Cloud → TestFlight

Objetivo: que un `git push` compile la app en los servidores de Apple y la deje en
TestFlight, sin depender de esta Mac ni de `eas build`.

```
git push  →  Xcode Cloud  →  Archive  →  firma  →  App Store Connect  →  TestFlight
```

Xcode Cloud **no reemplaza a Expo**: el proyecto sigue siendo Expo y se programa igual.
Lo que reemplaza es EAS Build y EAS Submit, y solo para iOS. Android sigue por EAS o por
otro CI, porque Xcode Cloud solo compila plataformas Apple.

## Lo que cambió en el repositorio

- **`ios/` ya no está ignorado.** Xcode Cloud compila lo que encuentra en el repositorio,
  así que el `.xcodeproj` y el `.xcworkspace` tienen que estar versionados. Son 24
  archivos, unos 2 MB. Lo pesado no entra: `ios/.gitignore`, que genera Expo, ya excluye
  `Pods/` (940 MB), `build/` y los datos de usuario de Xcode.
- **`ios/ci_scripts/ci_post_clone.sh`.** Apple lo ejecuta por su nombre y ubicación, sin
  configurarlo en ningún sitio. Instala Node 22, bun, las dependencias y los Pods.
- **`ios/ci_scripts/ci_pre_xcodebuild.sh`.** Sella el número de build antes de compilar.

## Cuidado con `expo prebuild`

Antes `ios/` era una carpeta desechable. Ahora es parte del repositorio, así que
`npx expo prebuild --clean` **borra y regenera** el proyecto nativo, y con él cualquier
ajuste hecho a mano en Xcode. Los scripts de `ci_scripts/` sobreviven porque prebuild no
los toca, pero conviene revisar el diff antes de commitear una regeneración.

La configuración que sí se conserva es la que vive en `app.json` y en los plugins, que es
donde debe seguir estando: iconos, esquemas de URL, permisos y el resto.

## Datos del proyecto

El proyecto nativo se llama **Clubhive**, no Tiked: es el nombre con el que se generó y
cambiarlo obligaría a rehacer la ficha en App Store Connect. Lo que ve el usuario en el
teléfono sí dice Tiked, por `CFBundleDisplayName`.

| Dato | Valor |
| --- | --- |
| Repositorio | `sasamile/app-mobile-clubhive` |
| Workspace | `ios/Clubhive.xcworkspace` |
| Esquema | `Clubhive` (ya compartido, que es lo que Xcode Cloud exige) |
| Bundle identifier | `com.clubhive.app` |
| Equipo de firma | `53SH2AJW4L`, con firma automática |

## Pasos en Xcode, una sola vez

1. Sube esta rama a GitHub. Xcode Cloud no ve nada que esté solo en tu disco.
2. Abre el proyecto:

```bash
open ios/Clubhive.xcworkspace
```

3. En Xcode, menú Product, submenú Xcode Cloud, opción para crear el primer workflow.
4. Conecta la cuenta de GitHub y autoriza el repositorio `sasamile/app-mobile-clubhive`.
5. Configura el workflow así:
   - Condición de inicio: cambios en la rama que quieras publicar.
   - Acción: **Archive**, plataforma iOS, esquema `Clubhive`.
   - En la preparación del despliegue, elige **TestFlight (Internal Testing Only)**
     mientras haces las primeras pruebas.
   - Post-acción: **TestFlight**, con el grupo de probadores internos.
6. Lanza el primer build a mano desde Xcode para ver el log completo antes de confiar en
   el disparo automático.

## Número de build

App Store Connect rechaza una subida cuyo número de build ya exista para esa versión. El
Info.plist que genera Expo llega siempre con `1`, así que `ci_pre_xcodebuild.sh` lo
reemplaza por el contador de Xcode Cloud, que es único y creciente.

Ese contador empieza en 1. Si el producto ya tiene builds subidos con EAS ocupando los
primeros números, define `BUILD_NUMBER_OFFSET` en las variables de entorno del workflow
con un valor que quede por encima del último build ya publicado.

## Qué esperar del primer build

Tarda bastante más que los siguientes: la Mac de CI parte de cero e instala Node, bun y
todos los Pods. Los puntos donde suele fallar, por orden de probabilidad:

- **Firma.** Xcode Cloud necesita que la app exista en App Store Connect con ese bundle
  identifier y que el equipo tenga permiso para distribuir.
- **Pods desincronizados.** Si `Podfile.lock` no corresponde al `Podfile`, `pod install`
  cambia cosas en CI y el build se vuelve impredecible. Commitea siempre los dos juntos.
- **Node no encontrado en la fase de bundle.** Lo cubre el final de `ci_post_clone.sh`,
  que escribe `ios/.xcode.env.local` con la ruta de Node.

## EAS

No se quitó nada. `eas.json` sigue igual y `eas build` funciona como siempre. Cuando el
camino por Xcode Cloud esté estable, simplemente dejas de usar EAS para iOS y lo conservas
para Android.
