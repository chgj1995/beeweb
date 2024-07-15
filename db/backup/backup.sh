#!/bin/bash

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 현재 날짜를 YYYYMMDD 형식으로 저장
BACKUP_DATE=$(date +"%Y%m%d")

# 백업 파일 경로 설정
BACKUP_DIR="$SCRIPT_DIR/data"
BACKUP_FILE="$BACKUP_DIR/hive_data_backup_$BACKUP_DATE.sql"

# 백업 디렉토리 생성 (존재하지 않는 경우)
mkdir -p $BACKUP_DIR

# Docker 컨테이너 ID 가져오기
CONTAINER_ID=$(docker ps -q -f "name=beeweb-mariadb")

# 컨테이너가 존재하는지 확인
if [ -z "$CONTAINER_ID" ]; then
  echo "Error: mariadb container not found"
  echo "Backup failed"
  exit 1
fi

# Docker 컨테이너에서 백업 명령 실행
docker exec $CONTAINER_ID mysqldump -u root -prootpassword hive_data > $BACKUP_FILE

# 백업이 성공했는지 확인
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "Backup failed"
fi
