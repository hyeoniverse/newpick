#!/usr/bin/env bash
# MySQL 백업: ~/backups에 gzip 덤프를 남기고 7일이 지난 것은 지운다 (#39).
# MongoDB는 30일 TTL로 지워지는 크롤링 원문이라 백업하지 않는다.
#
#   매일: cron이 부른다 (docs/deployment.md '백업')
#   배포 직전: ops/deploy.sh가 BACKUP_LABEL=predeploy-<태그>로 부른다
#
# 설정 (생략 가능)
#   DEPLOY_DIR    compose.yml·.env가 있는 곳 (기본 ~/deploy)
#   BACKUP_DIR    덤프를 둘 곳 (기본 ~/backups)
#   BACKUP_LABEL  파일 이름에 붙일 말 (기본 daily)
#   KEEP_DAYS     보관 일수 (기본 7)
set -euo pipefail
umask 077

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/deploy}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
BACKUP_LABEL="${BACKUP_LABEL:-daily}"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
out="$BACKUP_DIR/newpick-$(date -u +%Y%m%dT%H%M%SZ)-${BACKUP_LABEL}.sql.gz"

cd "$DEPLOY_DIR"
# 비밀번호는 컨테이너 안의 환경 변수로만 쓴다 (명령줄·로그에 남기지 않게)
docker compose exec -T mysql sh -c \
	'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --no-tablespaces newpick 2>/dev/null' |
	gzip >"$out.tmp"

# 덤프가 중간에 끊기면 마지막 줄 "-- Dump completed"가 없다. 그런 파일은 백업으로 치지 않는다
if ! gunzip -c "$out.tmp" | tail -n 1 | grep -q 'Dump completed'; then
	rm -f "$out.tmp"
	echo "$(date -u +%FT%TZ) 백업 실패: 덤프가 끝나지 않았다" >&2
	exit 1
fi
mv "$out.tmp" "$out"
find "$BACKUP_DIR" -name 'newpick-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) 백업: $out ($(du -h "$out" | cut -f1))"
