#!/bin/bash

# Function to parse headers array
parse_headers() {
    local headers_array=("$@")
    local headers_str=""
    for header in "${headers_array[@]}"; do
        headers_str+="-headers \"$header\" "
    done
    echo "$headers_str"
}

# Check if the correct number of arguments is passed
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <m3u8_source_link> <output_file> [header1 header2 ...]"
    exit 1
fi

# Assign the first two arguments to variables
SOURCE_LINK=$1
OUTPUT_FILE=$2

# Default User-Agent header
DEFAULT_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"

# Shift to get the remaining arguments as headers
shift 2
HEADERS=("$@")

# Check if a custom User-Agent is provided
USER_AGENT_SET=false
for header in "${HEADERS[@]}"; do
    if [[ $header == User-Agent:* ]]; then
        USER_AGENT_SET=true
        break
    fi
done

# If no custom User-Agent is set, use the default one
if [ "$USER_AGENT_SET" = false ]; then
    HEADERS+=("User-Agent: $DEFAULT_USER_AGENT")
fi

# Parse headers
HEADERS_STR=$(parse_headers "${HEADERS[@]}")
echo $HEADERS_STR
# Use ffmpeg to record the stream with headers if provided
eval ffmpeg $HEADERS_STR -i "\"$SOURCE_LINK\"" -t "03:00:00" -codec:v mpeg4 -c copy "\"$OUTPUT_FILE\""

