#!/bin/bash
# Использование: ./build-netlify.sh https://твой-туннель.example.com
# После сборки залей папку dist/ на Netlify (drag & drop)

if [ -z "$1" ]; then
  echo "Укажи URL туннеля к API:"
  echo "  ./build-netlify.sh https://xxx.trycloudflare.com"
  exit 1
fi

VITE_API_URL="$1" npm run build
echo ""
echo "Готово! Теперь залей папку dist/ на netlify.com (drag & drop)"
