const { withDangerousMod } = require("@expo/config-plugins")
const fs = require("fs")
const path = require("path")

const MARKER = "pod 'GoogleUtilities', :modular_headers => true"

/**
 * AppCheckCore (Google Sign-In) is a Swift pod that cannot import
 * GoogleUtilities / RecaptchaInterop as static libraries unless they emit module maps.
 */
function withIosModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile")
      let contents = fs.readFileSync(podfilePath, "utf8")
      if (contents.includes(MARKER)) return config

      const snippet = `
  # Google Sign-In: Swift static pods need module maps for these deps
  ${MARKER}
  pod 'RecaptchaInterop', :modular_headers => true
`

      contents = contents.replace(/target ['"][^'"]+['"] do\n/, (match) => `${match}${snippet}`)
      fs.writeFileSync(podfilePath, contents)
      return config
    },
  ])
}

module.exports = withIosModularHeaders
