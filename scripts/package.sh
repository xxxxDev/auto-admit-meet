#!/bin/sh
# Packs extension/ into dist/ with manifest.json at the zip's root, as the Chrome Web Store expects.
set -e
cd "$(dirname "$0")/.."
version=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' extension/manifest.json)
mkdir -p dist
rm -f "dist/auto-admit-meet-$version.zip"
cd extension
zip -qr -X "../dist/auto-admit-meet-$version.zip" . -x '.*'
cd ..
zip -q -X "dist/auto-admit-meet-$version.zip" LICENSE BRAND.md
echo "dist/auto-admit-meet-$version.zip"
