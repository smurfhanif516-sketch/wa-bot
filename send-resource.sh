#!/bin/bash

# Konfigurasi
URL="http://10.17.7.15:8007/send-message"
TARGET="120363400049027196@g.us"

# Ambil info CPU dan RAM
CPU_LOAD=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4 "%"}')
MEMORY_USED=$(free -m | awk '/Mem:/ { printf("%.2f%"), $3/$2*100 }')

# Buat pesan dengan \n
MESSAGE="Info Server 🔥\nCPU Load: $CPU_LOAD\nRAM Usage: $MEMORY_USED"

# Kirim via curl
curl --location "$URL" \
--header 'Content-Type: application/json' \
--data-raw "{
    \"target\": \"$TARGET\",
    \"message\": \"$MESSAGE\"
}"
