#!/bin/sh
#
# Xcode Cloud: ultimo paso antes de compilar.
#
# App Store Connect rechaza una subida cuyo CFBundleVersion ya exista para esa version, y
# el Info.plist que genera Expo llega siempre con "1". Sin esto el primer envio a TestFlight
# funciona y el segundo se cae. Se sella con el numero de build de Xcode Cloud, que es
# unico y creciente por producto.
#
# Si el producto ya tiene builds subidos con otra herramienta (por ejemplo EAS), define la
# variable de entorno BUILD_NUMBER_OFFSET en el workflow para arrancar por encima de ellos.
set -e

BUILD_NUMBER="$CI_BUILD_NUMBER"

if [ -n "$BUILD_NUMBER_OFFSET" ]; then
  BUILD_NUMBER=$((CI_BUILD_NUMBER + BUILD_NUMBER_OFFSET))
fi

INFO_PLIST="$CI_PRIMARY_REPOSITORY_PATH/ios/Clubhive/Info.plist"

/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$INFO_PLIST"

echo "CFBundleVersion = $BUILD_NUMBER"
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST" \
  | sed 's/^/CFBundleShortVersionString = /'
