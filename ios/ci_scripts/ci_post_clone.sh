#!/bin/sh
#
# Xcode Cloud: preparacion del entorno despues de clonar el repositorio.
#
# Cada build arranca en una Mac limpia, y la imagen cambia segun la version de Xcode que
# use el workflow: lo que trae preinstalado no es el mismo en la imagen de Xcode 26 que en
# la de Xcode 27. Por eso aqui no se asume nada y cada paso comprueba antes de instalar.
# Apple ejecuta este archivo automaticamente por su ubicacion y su nombre.
set -e

log() { echo ""; echo "──────────── $1 ────────────"; }

log "Entorno"
echo "macOS: $(sw_vers -productVersion)"
echo "Xcode: $(xcodebuild -version 2>/dev/null | head -1)"
echo "PATH:  $PATH"

log "Node"
# Algunas imagenes ya traen Node. Solo se instala si falta o si es demasiado viejo para
# Expo SDK 54, que necesita 20 o superior. `brew install` va con || true porque devuelve
# error cuando la formula ya esta instalada, y eso con `set -e` mataria el build entero.
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  major=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
  [ "$major" -ge 20 ] 2>/dev/null
}

if node_ok; then
  echo "Node ya disponible: $(node -v)"
else
  echo "Node ausente o demasiado antiguo, instalando"
  brew install node@22 || true
  if [ -d "$(brew --prefix)/opt/node@22/bin" ]; then
    export PATH="$(brew --prefix)/opt/node@22/bin:$PATH"
  fi
  node_ok || { brew install node || true; }
fi

node_ok || { echo "ERROR: no hay Node utilizable"; exit 1; }
echo "Node: $(node -v)"

log "bun"
# El proyecto solo tiene bun.lock, asi que bun no es opcional: con npm las versiones
# instaladas no serian las del lockfile. Se intenta el instalador oficial y, si la red o
# el script fallan, se cae a npm, que ya viene con Node.
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
# `.xcode.env.local` es el mecanismo que React Native define para eso y esta fuera de git.
echo "export NODE_BINARY=$(command -v node)" > "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"
cat "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"

log "Entorno listo"
