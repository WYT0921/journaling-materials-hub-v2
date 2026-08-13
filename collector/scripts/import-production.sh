#!/usr/bin/env sh
set -eu

cd /root/journaling-materials-hub/deploy
set -a
. ./.env
set +a

SQL_FILE=/tmp/text-assets-import.sql
test -f "$SQL_FILE"

echo BEFORE
docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N \
  -e "SELECT COUNT(*), SUM(status=0), SUM(status=1) FROM text_assets;"

docker exec -i mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"

echo AFTER
docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N \
  -e "SELECT COUNT(*), SUM(status=0), SUM(status=1) FROM text_assets;"

echo SOURCES
docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N \
  -e "SELECT source, status, COUNT(*) FROM text_assets GROUP BY source, status ORDER BY source, status;"
