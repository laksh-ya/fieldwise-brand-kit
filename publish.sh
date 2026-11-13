#!/bin/sh
# Assemble deploy/ from the sources and publish it to the fieldwise-brand-kit Vercel project.
# usage: sh publish.sh [--files]   (--files re-renders the logo and application downloads first)
set -e
cd "$(dirname "$0")"
mkdir -p deploy
sed 's#\.\./lab/##g' kit/index.html > deploy/index.html
cp kit/kit.js kit/kit.css kit/art.css kit/water-layer.js deploy/
cp lab/pebbles.js lab/layouts.js lab/layouts-all.js deploy/
cp lab/board.html deploy/lab.html
if [ -d dist/instagram ]; then mkdir -p deploy/instagram && cp dist/instagram/* deploy/instagram/; fi
if [ "$1" = "--files" ] || [ ! -d deploy/files ]; then (cd kit && node export.js ../deploy); fi
(cd email && node build.js)
rm -rf deploy/email && cp -R email/dist deploy/email
if [ -d email/assets/u ]; then cp -R email/assets/u deploy/email/assets/u; fi
cd deploy && vercel deploy --prod --yes
