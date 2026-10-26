#!/usr/bin/env bash
# api 배포: 지정한 이미지 태그로 api 컨테이너를 바꾸고, /health의 version이 그 태그가 될 때까지 본다.
# 안 되면 이전 태그로 되돌린다 (#39).
#
# GitHub Actions가 배포 전용 SSH 키로 부른다. 그 키는 authorized_keys의 command=로 이 스크립트만 돌릴 수 있고,
# 보낸 명령(태그)은 SSH_ORIGINAL_COMMAND로 온다. 서버에서 손으로 부를 때는: ~/newpick/ops/deploy.sh sha-1a2b3c4
#
# 순서: 태그 검사 → 잠금 → 배포 직전 백업 → .env의 API_TAG 바꾸기 → (서버에 없으면) pull → up → version 확인
#       → 성공: 지금·이전 버전 말고 이미지 정리
#       → 이미지를 받지 못함: 아무것도 바꾸지 않고 1로 끝남
#       → 새 버전이 뜨지 않음: 이전 태그로 되돌리고 1로 끝남
#
# 설정 (생략 가능)
#   DEPLOY_DIR      compose.yml·.env가 있는 곳 (기본 ~/deploy)
#   IMAGE_REPO      이미지 이름 (기본 ghcr.io/hyeoniverse/newpick-api)
#   HEALTH_TIMEOUT  새 버전을 기다리는 초 (기본 180). 시작할 때 prisma migrate deploy가 먼저 돈다
#   SKIP_BACKUP     1이면 배포 직전 백업을 건너뛴다
set -euo pipefail
# SSH가 끊겨도(Actions 실행 취소 등) 끝까지 한다. 중간에 멈추면 .env와 컨테이너가 어긋날 수 있다
trap '' HUP

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/deploy}"
IMAGE_REPO="${IMAGE_REPO:-ghcr.io/hyeoniverse/newpick-api}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$DEPLOY_DIR/.env"

# 화면(Actions 로그)과 deploy.log에 함께 남긴다
exec > >(tee -a "$DEPLOY_DIR/deploy.log") 2>&1
log() { echo "$(date -u +%FT%TZ) $*"; }

# SSH로 오면 인자 대신 SSH_ORIGINAL_COMMAND. 정해진 모양이 아니면 아무것도 하지 않는다 (키로 다른 명령을 못 돌리게)
tag="${1:-${SSH_ORIGINAL_COMMAND:-}}"
if [[ ! "$tag" =~ ^sha-[0-9a-f]{7,40}$ ]]; then
	log "배포 실패: 태그 모양이 아니다 ('sha-' + 커밋 7~40자리): '${tag}'"
	exit 2
fi

cd "$DEPLOY_DIR"
[[ -f compose.yml && -f "$ENV_FILE" ]] || {
	log "배포 실패: ${DEPLOY_DIR}에 compose.yml과 .env가 있어야 한다"
	exit 1
}

# 한 번에 하나만
exec 9>"$DEPLOY_DIR/.deploy.lock"
flock -w 600 9 || {
	log "배포 실패: 다른 배포가 10분 넘게 끝나지 않는다"
	exit 1
}

current_tag() { grep -E '^API_TAG=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true; }

# .env의 API_TAG 줄만 바꾼다 (빈 값이면 지운다). 다른 줄(비밀 값)과 권한은 그대로
set_tag() {
	local tmp="$ENV_FILE.tmp"
	{
		grep -vE '^API_TAG=' "$ENV_FILE" || true
		if [[ -n "$1" ]]; then echo "API_TAG=$1"; fi
	} >"$tmp"
	chmod --reference="$ENV_FILE" "$tmp" 2>/dev/null || chmod 600 "$tmp"
	mv "$tmp" "$ENV_FILE"
	export API_TAG="$1"
}

# 컨테이너 안에서 /health를 부른다 (이미지에 curl·wget이 없어 node의 fetch를 쓴다)
health_version() {
	docker compose exec -T api node -e \
		'fetch("http://127.0.0.1:3001/health").then((r) => r.json()).then((b) => console.log(b.version)).catch(() => process.exit(1))' \
		2>/dev/null
}

wait_version() {
	local deadline=$((SECONDS + HEALTH_TIMEOUT))
	while ((SECONDS < deadline)); do
		[[ "$(health_version || true)" == "$1" ]] && return 0
		sleep 3
	done
	log "${HEALTH_TIMEOUT}초 안에 ${1}이(가) 뜨지 않았다"
	return 1
}

# 그 태그로 바꾸고 뜰 때까지 기다린다. 이미지를 받지 못하면 3 (컨테이너는 그대로)
up() {
	set_tag "$1"
	if ! docker image inspect "$IMAGE_REPO:$1" >/dev/null 2>&1; then
		docker compose pull -q api || return 3
	fi
	docker compose up -d api && wait_version "$1"
}

previous="$(current_tag)"
log "배포 시작: ${previous:-없음} → ${tag}"
# compose.yml이 ${API_TAG:?}로 태그를 요구한다. 첫 배포면 .env에 아직 없으니 새 태그로 알려 준다
export API_TAG="${previous:-$tag}"

if [[ "$tag" == "$previous" && "$(health_version || true)" == "$tag" ]]; then
	log "이미 이 버전이 떠 있다: ${tag}"
	exit 0
fi

if [[ "${SKIP_BACKUP:-}" != 1 ]]; then
	# 새 버전에 migration이 있으면 DB가 바뀐다. 바꾸기 전에 남긴다
	BACKUP_LABEL="predeploy-$tag" DEPLOY_DIR="$DEPLOY_DIR" "$REPO_DIR/ops/backup.sh" || {
		log "배포 실패: 배포 직전 백업이 되지 않아 멈췄다"
		exit 1
	}
fi

result=0
up "$tag" || result=$?
if ((result == 0)); then
	log "배포 완료: ${tag}"
	# 지금 버전과 되돌릴 이전 버전만 남긴다 (1GB 서버의 디스크). 정리가 안 돼도 배포는 성공
	{ docker image ls "$IMAGE_REPO" --format '{{.Tag}}' | grep -E '^sha-' | grep -vxF -e "$tag" -e "${previous:-none}" || true; } |
		while read -r old; do docker image rm "$IMAGE_REPO:$old" >/dev/null 2>&1 || true; done
	exit 0
fi

if ((result == 3)); then
	set_tag "$previous"
	log "배포 실패: ${tag} 이미지를 받지 못해 아무것도 바꾸지 않았다. 태그가 GHCR에 있는지, 서버가 ghcr.io에 로그인돼 있는지 본다"
	exit 1
fi

log "새 버전이 뜨지 않았다. api 로그 끝:"
docker compose logs --tail 40 api || true
if [[ -z "$previous" ]]; then
	set_tag ""
	log "배포 실패: 되돌릴 이전 태그가 없다 (.env에 API_TAG가 없었다)"
	exit 1
fi
log "이전 버전으로 되돌린다: ${previous}"
if up "$previous"; then
	log "배포 실패, 되돌림: ${previous}가 다시 떠 있다"
else
	log "배포 실패, 되돌리기도 실패: 서버에서 docker compose ps, logs api를 본다"
fi
exit 1
