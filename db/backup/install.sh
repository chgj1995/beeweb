#!/bin/bash

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 모든 스크립트에 실행 권한 추가
chmod +x $SCRIPT_DIR/*.sh

# DOCKER_PATH 설정
DOCKER_PATH=$(which docker)

# backup.sh 파일에서 DOCKER_PATH를 설정
sed -i "s|^DOCKER_PATH=.*|DOCKER_PATH=$DOCKER_PATH|" $SCRIPT_DIR/backup.sh

# 현재 크론 작업 목록 가져오기
CRON_JOBS=$(sudo crontab -l 2>/dev/null)

# 크론 작업이 이미 존재하는지 확인하고, 없으면 추가
if echo "$CRON_JOBS" | grep -q "$SCRIPT_DIR/backup.sh"; then
  echo "Cron job already exists."
else
  (sudo crontab -l 2>/dev/null; echo "0 2 * * * $SCRIPT_DIR/backup.sh >> /home/wcl/workspace/beeweb/db/backup/data/backup_cron.log 2>&1") | sudo crontab -
  echo "Cron job installed to run backup.sh daily at 2 AM."
fi
