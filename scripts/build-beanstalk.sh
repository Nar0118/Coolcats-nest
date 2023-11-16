#!/bin/bash
#
# Copyright (c) 2021. Cool Cats Group LLC
# ALL RIGHTS RESERVED
# Author: Christopher Hassett
#

npm run clean
npm run build
cp package.json dist
sed -i '' -e "s/nest start/node src\\/main.js/g" dist/package.json
cd dist
zip ../dist.zip -r * .[^.]*
cd ..
