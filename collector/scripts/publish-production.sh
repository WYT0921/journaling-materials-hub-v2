#!/usr/bin/env sh
set -eu

cd /root/journaling-materials-hub/deploy
set -a
. ./.env
set +a

echo BEFORE
docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N \
  -e "SELECT status, COUNT(*) FROM text_assets GROUP BY status ORDER BY status;"

docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" \
  -e "START TRANSACTION; UPDATE text_assets SET status=1 WHERE status=0; SELECT ROW_COUNT() AS published; COMMIT;"

echo AFTER
docker exec mysql mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N \
  -e "SELECT status, COUNT(*) FROM text_assets GROUP BY status ORDER BY status;"
