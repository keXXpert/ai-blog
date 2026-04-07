#!/bin/bash
cd /root/ai-blog
node generate_index.js
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit -m "chore: regenerate site $(date +%Y-%m-%d)"
  git push origin main
else
  echo "No changes to commit"
fi