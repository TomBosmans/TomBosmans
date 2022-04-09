#!/usr/bin/env sh

set -e # abort on errors
npm run blog:build
cd blog/.vitepress/dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:TomBosmans/TomBosmans.github.io.git master
cd -
