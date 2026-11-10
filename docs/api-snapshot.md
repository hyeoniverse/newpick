# API 응답 전 · 후 비교 (#229)

API를 나누거나 옮기는 PR(#199 · #200)에서, **같은 요청의 응답이 바꾸기 전과 같은지** 봅니다. 화면 비교는 [visual-diff.md](visual-diff.md).

## 쓰는 법

api(3001)를 켜 둡니다. 도구가 서버를 켜거나 끄지 않습니다. 조회(GET)만 보내고 쓰기 요청은 보내지 않습니다.

```sh
cd apps/api
# 1. 바꾸기 전 (main에서)
SNAP_USER_ID=<관리자 id> npm run snap:take -- before
# 2. 코드를 바꾼 뒤 (nest --watch가 다시 띄운 다음)
SNAP_USER_ID=<관리자 id> npm run snap:take -- after
# 3. 비교
npm run snap:diff -- before after
```

- 응답은 `apps/api/.snap/<이름>/`에 JSON으로 쌓이고 git에 올라가지 않습니다.
- `snap:diff`는 요청마다 `=` · `≠` · `!`(응답 없음)을 보이고, 다른 것은 처음 다른 곳을 경로로 몇 개 보입니다 (예: `.body.data.topics[0].topic: "룰라" → "브라질 대선"`). 다르면 종료 코드 1입니다.
- **순서까지 비교합니다.** 목록 순서가 바뀌면 화면 순서도 바뀌기 때문입니다.
- 로그인은 `apps/api/.env`의 `JWT_SECRET`으로 시험 토큰을 만듭니다 (로컬 전용). 관리자 응답이 403이면 `SNAP_USER_ID`가 관리자가 아닌 것입니다.
- 일부만: `npm run snap:take -- before --only /scheduler`

## 보내는 요청

`apps/api/scripts/snapshot/targets.mjs`에서 정합니다 (공개 10 · 로그인 17 · 관리자 17). 기간은 고정합니다: '오늘'을 쓰면 날이 바뀔 때 결과가 달라집니다.

## 비교에서 빼는 값

`targets.mjs`의 `VOLATILE_KEYS`: 지금은 `timestamp`(응답 시각) 하나. 같은 코드로 두 번 불러 비교했을 때 이것 말고는 44개 모두 같았습니다 (2026-11-11).
