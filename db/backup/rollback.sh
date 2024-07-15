#!/bin/bash

# 스크립트의 실제 경로 추적
SCRIPT_DIR=$(dirname $(realpath $0))

# 복원할 백업 파일 경로 (사용자가 입력)
BACKUP_FILE=$1

# 백업 파일이 제공되었는지 확인
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file_path>"
  exit 1
fi

# 데이터베이스 삭제 및 재생성
docker exec -it mariadb mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS hive_data; CREATE DATABASE hive_data;"

# 백업 파일을 사용하여 데이터베이스 복원
docker exec -i mariadb mysql -u root -prootpassword hive_data < $BACKUP_FILE

# 복원이 성공했는지 확인
if [ $? -eq 0 ]; then
  echo "Database restored successfully from $BACKUP_FILE"
else
  echo "Database restoration failed"
fi
