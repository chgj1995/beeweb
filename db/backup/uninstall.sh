#!/bin/bash

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 현재 크론 작업 목록에서 해당 작업 제거
(sudo crontab -l 2>/dev/null | grep -v "$SCRIPT_DIR/backup.sh") | sudo crontab -

echo "Cron job for backup.sh removed."
