#!/usr/bin/env bash
# Patch baileys media upload supaya pakai axios.defaults.httpsAgent (proxy)
# saat fetchAgent tidak di-set. Jalanin: bash script/patch-baileys-proxy.sh
# Idempotent: aman dijalanin berkali-kali. Re-run tiap habis npm install.
set -e

F="$(cd "$(dirname "$0")/.." && pwd)/node_modules/baileys/lib/Utils/messages-media.js"

if [ ! -f "$F" ]; then
  echo "ERROR: file tidak ada: $F"
  exit 1
fi

if grep -q "httpsAgent: fetchAgent || axios.defaults.httpsAgent," "$F"; then
  echo "Sudah ke-patch sebelumnya."
else
  sed -i 's/httpsAgent: fetchAgent,/httpsAgent: fetchAgent || axios.defaults.httpsAgent,/' "$F"
  echo "Patched."
fi

echo "--- baris httpsAgent sekarang ---"
grep -n "httpsAgent: fetchAgent" "$F"
