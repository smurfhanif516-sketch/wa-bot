#!/bin/bash

# Nama proses yang mau di-monitor
PROCESS_NAME="index.js"
INTERVAL=5  # interval detik cek nya

echo "Monitoring memory usage for process containing: $PROCESS_NAME"
echo "Every $INTERVAL seconds. Press [CTRL+C] to stop."
echo ""

while true; do
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  ps aux | awk -v pname="$PROCESS_NAME" -v timestamp="$TIMESTAMP" '
  BEGIN {
    printf "%-20s %-8s %-8s %-8s %-10s %-10s %s\n", "TIME", "PID", "%CPU", "%MEM", "VSZ", "RSS", "COMMAND"
  }
  {
    if ($0 ~ pname && $0 !~ "awk" && $0 !~ "grep") {
      vsz = ($5 != "VSZ") ? int(100 * $5/1024/1024)/100"GB" : $5;
      rss = ($6 != "RSS") ? int(100*$6/1024)/100"MB" : $6;
      printf "%-20s %-8s %-8s %-8s %-10s %-10s %s\n", timestamp, $2, $3, $4, vsz, rss, $11
    }
  }'
  sleep $INTERVAL
done
