#!/bin/bash

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 복원할 백업 파일 경로 (사용자가 입력)
BACKUP_FILE=$1

# 디버깅 정보 출력
echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "BACKUP_FILE: $BACKUP_FILE"

# 백업 파일이 제공되었는지 확인
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file_path>"
  exit 1
fi

# Docker 컨테이너 ID 가져오기
CONTAINER_ID=$(docker ps -q -f "name=beeweb-mariadb")

# 디버깅 정보 출력
echo "CONTAINER_ID: $CONTAINER_ID"

# 컨테이너가 존재하는지 확인
if [ -z "$CONTAINER_ID" ]; then
  echo "Error: mariadb container not found"
  echo "Database restoration failed"
  exit 1
fi

# Docker 컨테이너 내부에 백업 디렉토리 생성
docker exec $CONTAINER_ID mkdir -p /backup

# Docker 컨테이너 내부에 백업 파일 복사
docker cp $BACKUP_FILE $CONTAINER_ID:/backup/restore_backup.sql
COPY_STATUS=$?

# 백업 파일이 성공적으로 복사되었는지 확인
if [ $COPY_STATUS -ne 0 ]; then
  echo "Error: Failed to copy backup file to container"
  echo "Database restoration failed"
  exit 1
fi

# 데이터베이스 삭제 및 재생성
docker exec $CONTAINER_ID sh -c "mysql -u root -prootpassword -e 'DROP DATABASE IF EXISTS hive_data; CREATE DATABASE hive_data;'"
EXEC_STATUS=$?

# 데이터베이스 삭제 및 재생성이 성공했는지 확인
if [ $EXEC_STATUS -ne 0 ]; then
  echo "Error: Failed to drop and recreate database"
  echo "Database restoration failed"
  exit 1
fi

# Docker 컨테이너에서 복원 명령 실행
docker exec $CONTAINER_ID sh -c "mysql -u root -prootpassword hive_data < /backup/restore_backup.sql"
EXEC_STATUS=$?

# 복원이 성공했는지 확인
if [ $EXEC_STATUS -eq 0 ]; then
  echo "Database restored successfully from $BACKUP_FILE"
else
  echo "Database restoration failed"
fi

# 복원 후 임시 파일 삭제
docker exec $CONTAINER_ID rm /backup/restore_backup.sql
