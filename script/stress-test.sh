#!/bin/bash

# Set tanggal hari ini
today=$(date +%Y%m%d)

# Daftar grup WhatsApp
group1="120363418559290985@g.us"
group2="120363400255503821@g.us"
group3="120363419305965053@g.us"

# Path log file
log_path="/data/DATA/whatsapp-api/logs-new-bot/stress-test-output.log"

# URL API dan auth
api_url="http://10.17.7.15:8007/send-message"
auth_user="admin"
auth_pass="password123"

# Start infinite loop
while true; do
    # Check if day has changed
    new_today=$(date +%Y%m%d)
    if [ "$new_today" != "$today" ]; then
        today=$new_today
        echo "The day has changed to $today" >> "$log_path"
    fi

    # Monitor log file changes
    while inotifywait -e modify  /data/DATA/whatsapp-api/logs/"wa-request_${today}"*.log; do
        # Read the last line from changed file
        last_line=$(tail -n 1 "$_")
        
        # Extract and decode the 13th column (message)
        message=$(echo "$last_line" | awk -F'|' '{print $13}' | sed 's/%/\\x/g' | xargs -0 printf "%b")
        
        # Pick a random group
        random_choice=$((RANDOM % 3 + 1))
        case $random_choice in
            1) random_group=$group1 ;;
            2) random_group=$group2 ;;
            3) random_group=$group3 ;;
        esac

        # Create JSON payload
        json_payload=$(jq -n --arg number "$random_group" --arg message "$message" '{number: $number, message: $message}')

        # Print timestamp
        current_time=$(date '+%F %H:%M:%S --- ')
        echo -en "$current_time" >> "$log_path"

        # Send to API
        response=$(echo "$json_payload" | curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -u "$auth_user:$auth_pass" \
            -d @- "$api_url")

        # Save response
        echo "Request Payload: $json_payload" >> "$log_path"
        echo "API Response:" >> "$log_path"
        echo "$response" >> "$log_path"
        echo "" >> "$log_path"
    done
done
