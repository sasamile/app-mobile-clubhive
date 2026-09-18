#!/bin/sh
#
# Xcode Cloud: preparacion del entorno despues de clonar el repositorio.
#
# Instala Node y bun y deja listas las dependencias antes de compilar. Apple ejecuta este
# archivo automaticamente por su ubicacion y su nombre.
#
# Node NO se instala con Homebrew a proposito. La imagen de Xcode 26.6 corre sobre Intel
# x86_64, una plataforma que Homebrew ya no soporta: no publica binarios precompilados,
# intenta compilar desde fuente y falla con "C compiler cannot create executables". Se
# descarga el binario oficial de nodejs.org, que existe para las dos arquitecturas y no
# depende de que la imagen traiga un compilador utilizable.
set -e

log() { echo ""; echo "──────────── $1 ────────────"; }

log "Entorno"
echo "macOS:        $(sw_vers -productVersion)"
echo "Arquitectura: $(uname -m)"
echo "Xcode:        $(xcodebuild -version 2>/dev/null | head -1)"

log "Node"
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  major=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
  [ "$major" -ge 20 ] 2>/dev/null
}

if node_ok; then
  echo "Node ya disponible: $(node -v)"
else
  case "$(uname -m)" in
    arm64) NODE_ARCH="arm64" ;;
    *)     NODE_ARCH="x64" ;;
  esac

  NODE_DIR="$HOME/.node-ci"
  mkdir -p "$NODE_DIR"

  echo "Buscando la ultima Node 22 para darwin-$NODE_ARCH"
  NODE_TARBALL=$(curl -fsSL "https://nodejs.org/dist/latest-v22.x/" \
    | grep -o "node-v22\.[0-9][0-9.]*-darwin-${NODE_ARCH}\.tar\.gz" \
    | head -1)

  [ -n "$NODE_TARBALL" ] || { echo "ERROR: no encontre un tarball de Node 22"; exit 1; }
  echo "Descargando $NODE_TARBALL"

  curl -fsSL "https://nodejs.org/dist/latest-v22.x/${NODE_TARBALL}" -o "$NODE_DIR/node.tar.gz"
  tar -xzf "$NODE_DIR/node.tar.gz" -C "$NODE_DIR"

  NODE_HOME="$NODE_DIR/$(basename "$NODE_TARBALL" .tar.gz)"
  export PATH="$NODE_HOME/bin:$PATH"
fi

node_ok || { echo "ERROR: no hay Node utilizable"; exit 1; }
echo "Node: $(node -v)  ($(command -v node))"

log "bun"
# El proyecto solo tiene bun.lock: con npm las versiones instaladas no serian las del
# lockfile. El instalador oficial baja un binario precompilado, sin compilar nada.
if ! command -v bun >/dev/null 2>&1; then
  export BUN_INSTALL="$HOME/.bun"
  curl -fsSL https://bun.sh/install | bash || true
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "El instalador de bun no funciono, probando por npm"
  npm install -g bun || true
fi

command -v bun >/dev/null 2>&1 || { echo "ERROR: no se pudo instalar bun"; exit 1; }
echo "bun: $(bun --version)"

log "Dependencias de JavaScript"
cd "$CI_PRIMARY_REPOSITORY_PATH"
bun install --frozen-lockfile

log "CocoaPods"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

log "NODE_BINARY para las fases de Xcode"
# Las variables de PATH de este script no sobreviven a las fases de build de Xcode, que
# corren en su propio shell. La fase "Bundle React Native code and images" necesita Node
# para generar el bundle de JavaScript, y sin esto no lo encuentra y el archive falla.
echo "export NODE_BINARY=$(command -v node)" > "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"
cat "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"

log "Entorno listo"
