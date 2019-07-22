#!/bin/bash -e

git checkout gh-pages
git pull origin gh-pages
git merge master
npm run build
git add -f bundle.js
git commit -m "Update gh-pages"
git push -f origin gh-pages
git checkout master
