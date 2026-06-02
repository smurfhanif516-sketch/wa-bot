#!/bin/bash

# Script untuk cek penggunaan resource proses index.js secara rapi

echo "Menampilkan proses index.js dengan penggunaan CPU, Memori, VSZ, dan RSS:"
echo

# Header + proses yang match "index.js", diformat rapi
ps -eo user,pid,%cpu,%mem,vsz,rss,cmd | grep "index.js" | grep -v "grep" | awk '
BEGIN {
  printf "%-10s %-6s %-5s %-5s %-8s %-8s %s\n", "USER", "PID", "%CPU", "%MEM", "VSZ", "RSS", "COMMAND"
}
{
  vsz = int(100 * $5 / 1024 / 1024) / 100 "GB";
  rss = int(100 * $6 / 1024) / 100 "MB";
  printf "%-10s %-6s %-5s %-5s %-8s %-8s %s\n", $1, $2, $3, $4, vsz, rss, substr($0, index($0,$7))
}
'
