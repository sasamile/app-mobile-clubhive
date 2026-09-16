const { withDangerousMod } = require("@expo/config-plugins")
const fs = require("fs")
const path = require("path")

const MARKER = "# tiked: normalizar IPHONEOS_DEPLOYMENT_TARGET"

/**
 * Xcode 27 rechaza cualquier target con un deployment target por debajo de iOS 15, y varios
 * pods siguen declarando 9.0, 11.0 o 12.0 en sus bundles de recursos de privacidad. Xcode 26
 * todavia los tolera, asi que el proyecto compila en local y se cae en Xcode Cloud.
 *
 * `react_native_post_install` sube el deployment target de los pods principales, pero no toca
 * esos bundles de recursos, que es justo lo que falla. Este plugin añade un barrido final.
 */
function withIosDeploymentTarget(config, { deploymentTarget = "15.1" } = {}) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile")
      let contents = fs.readFileSync(podfilePath, "utf8")
      if (contents.includes(MARKER)) return config

      const hookStart = contents.indexOf("post_install do |installer|")
      if (hookStart === -1) {
        throw new Error(
          "withIosDeploymentTarget: no encontre el bloque post_install del Podfile. " +
            "Si Expo cambio la plantilla, hay que actualizar este plugin."
        )
      }

      // Cierre del bloque: el primer `end` con la indentacion del hook.
      const hookEnd = contents.indexOf("\n  end\n", hookStart)
      if (hookEnd === -1) {
        throw new Error(
          "withIosDeploymentTarget: no encontre el cierre del bloque post_install."
        )
      }

      const snippet = `
    ${MARKER}
    # Va despues de react_native_post_install a proposito: ese hook sube los pods principales
    # pero deja atras los bundles de recursos, que son los que Xcode 27 rechaza.
    installer.generated_projects.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |build_configuration|
          current = build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
          if current.nil? || current.to_f < ${deploymentTarget}
            build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
          end
        end
      end
    end
`

      contents = contents.slice(0, hookEnd) + snippet + contents.slice(hookEnd)
      fs.writeFileSync(podfilePath, contents)
      return config
    },
  ])
}

module.exports = withIosDeploymentTarget
