#!/bin/sh
#
# Xcode Cloud: preparacion del entorno despues de clonar el repositorio.
#
# Cada build arranca en una Mac limpia que solo tiene Xcode y Homebrew, asi que aqui se
# instala todo lo que el proyecto necesita antes de compilar: Node, bun, las dependencias
# de JavaScript y los Pods. Apple ejecuta este archivo automaticamente por su ubicacion y
# su nombre (ios/ci_scripts/ci_post_clone.sh); no hay que referenciarlo en ningun sitio.
#
# Falla al primer error a proposito: es preferible un build rojo a un archive construido
# a medias que acabe en TestFlight.
set -e

echo "──────────── Node ────────────"
# La imagen de Xcode Cloud no trae Node. Se fija la 22 (LTS) en vez de la ultima: es la
# que soporta Expo SDK 54, y evita que una version nueva rompa builds sin avisar.
brew install node@22
export PATH="$(brew --prefix node@22)/bin:$PATH"
node --version

echo "──────────── bun ────────────"
# El proyecto usa bun (solo hay bun.lock). Con npm las versiones instaladas no serian
# las del lockfile.
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun --version

echo "──────────── Dependencias de JavaScript ────────────"
cd "$CI_PRIMARY_REPOSITORY_PATH"
bun install --frozen-lockfile

echo "──────────── CocoaPods ────────────"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "──────────── NODE_BINARY para las fases de Xcode ────────────"
# Las variables de PATH de este script no sobreviven a las fases de build de Xcode, que
# corren en su propio shell. La fase "Bundle React Native code and images" necesita Node
# para generar el bundle de JavaScript, y sin esto no lo encuentra y el archive falla.
# `.xcode.env.local` es el mecanismo que React Native define para eso y esta fuera de git.
echo "export NODE_BINARY=$(command -v node)" > "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"
cat "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"

echo "──────────── Entorno listo ────────────"
