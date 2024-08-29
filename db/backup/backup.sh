#!/bin/bash

set -x

# Docker 명령어 절대 경로
DOCKER_PATH=/snap/bin/docker

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 현재 날짜를 YYYYMMDD 형식으로 저장
BACKUP_DATE=$(date +"%Y%m%d")

# 컨테이너 내부 백업 파일 경로 설정
CONTAINER_BACKUP_DIR="/backup"
BACKUP_FILE="$CONTAINER_BACKUP_DIR/hive_data_backup_$BACKUP_DATE.sql"
HOST_BACKUP_DIR="$SCRIPT_DIR/data"
HOST_BACKUP_FILE="$HOST_BACKUP_DIR/hive_data_backup_$BACKUP_DATE.sql"
ERROR_LOG="$HOST_BACKUP_DIR/mysqldump_error.log"

# 백업 디렉토리 생성 (존재하지 않는 경우)
mkdir -p $HOST_BACKUP_DIR

# Docker 컨테이너 ID 가져오기
CONTAINER_ID=$($DOCKER_PATH ps -q -f "name=beeweb-mariadb")

# 디버깅 정보 출력
echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "BACKUP_FILE: $BACKUP_FILE"
echo "HOST_BACKUP_FILE: $HOST_BACKUP_FILE"
echo "CONTAINER_ID: $CONTAINER_ID"

# 컨테이너가 존재하는지 확인
if [ -z "$CONTAINER_ID" ]; then
  echo "Error: mariadb container not found"
  echo "Backup failed"
  exit 1
fi

# Docker 컨테이너 내부에 백업 디렉토리 생
$DOCKER_PATH exec $CONTAINER_ID mkdir -p $CONTAINER_BACKUP_DIR

# Docker 컨테이너에서 백업 명령 실행 및 오류 로그 캡처
$DOCKER_PATH exec $CONTAINER_ID sh -c "mariadb-dump -u root -p'rootpassword' hive_data > $BACKUP_FILE" 2> $ERROR_LOG
EXEC_STATUS=$?

# 백업이 성공했는지 확인
if [ $EXEC_STATUS -eq 0 ]; then
  # 백업 파일을 호스트로 복사
  $DOCKER_PATH cp $CONTAINER_ID:$BACKUP_FILE $HOST_BACKUP_FILE
  COPY_STATUS=$?

  if [ $COPY_STATUS -eq 0 ]; then
    echo "Backup successful: $HOST_BACKUP_FILE"

    # 최신 10개의 백업 파일만 유지하고 나머지는 삭제
    ls -1t $HOST_BACKUP_DIR/hive_data_backup_*.sql | tail -n +11 | xargs -I {} rm -- {}
  else
    echo "Backup copy failed"
  fi
else
  echo "Backup failed"
  echo "Check the log file for more details: $ERROR_LOG"
fi

set +x
