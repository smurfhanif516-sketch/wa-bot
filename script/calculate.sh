#!/bin/bash

logdir="/opt/wa-bot-dynamic/logs"
logpattern="success-wa-history-*.log"

# Cek apakah ada file
files=$(ls ${logdir}/${logpattern} 2>/dev/null)
if [ -z "$files" ]; then
  echo "Tidak ada file log ditemukan di $logdir"
  exit 1
fi

# Gabungkan semua log dan proses awk
grep "Berhasil kirim ke" ${logdir}/${logpattern} | awk '
function parse_timestamp(ts,    d, m, y, H, M, S, MS) {
    split(ts, a, "[/: ]")
    d = a[1]; m = a[2]; y = a[3]; H = a[4]; M = a[5]; split(a[6], b, ":"); S = b[1]; MS = b[2]
    return mktime(y " " m " " d " " H " " M " " S) + (MS / 1000)
}

{
    match($0, /\[([0-9\/: ]+:[0-9]+)\]/, arr)
    timestamp = arr[1]
    if (first_time == "") {
        first_time = timestamp
        first_epoch = parse_timestamp(timestamp)
    }
    last_time = timestamp
    last_epoch = parse_timestamp(timestamp)

    time = $(NF-1) + 0
    total += time
    if (min == "" || time < min) min = time
    if (max == "" || time > max) max = time
    count++
}
END {
    if (count > 0) {
        diff = last_epoch - first_epoch
        days = int(diff / 86400)
        hours = int((diff % 86400) / 3600)
        minutes = int((diff % 3600) / 60)
        seconds = int(diff % 60)

        printf("Total Message              : %d\n", count)
        printf("Average Send Time          : %.3f s\n", total / count)
        printf("Slowest Send Time          : %.3f s\n", max)
        printf("Fastest Send Time          : %.3f s\n", min)
        printf("First Message              : %s\n", first_time)
        printf("Last Message               : %s\n", last_time)
        printf("Total Duration             : %d hari, %d jam, %d menit, %d detik\n", days, hours, minutes, seconds)
        printf("Saving cost (USD 0.02)     : %.2f USD\n", count * 0.02)
        printf("Saving cost (USD 0.04)     : %.2f USD\n", count * 0.04)
        printf("Saving cost IDR            : %d IDR - %d IDR\n", count * 0.02 * 16000, count * 0.04 * 16000)
    } else {
        print "Tidak ada data."
    }
}'
