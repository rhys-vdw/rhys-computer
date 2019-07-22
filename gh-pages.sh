#!/bin/bash -e

git checkout gh-pages
git pull origin gh-pages --no-edit
git merge master --no-edit
npm run build
git add -f bundle.js
git commit -m "Update gh-pages"
git push -f origin gh-pages
git checkout master
