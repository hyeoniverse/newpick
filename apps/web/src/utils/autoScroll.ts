/**
 * 코드가 스크롤하는 중인가 (목차로 소식 찾아가기 등). 그동안 헤더는 스크롤 방향에 반응하지 않는다 (#342 상세 목차:
 * 부드럽게 가는 동안 · 자리를 맞추는 동안 방향이 바뀔 때마다 헤더가 펼쳐졌다 접히기를 반복했다)
 */
let holders = 0;

/** 시작하고, 끝낼 함수를 돌려준다 (여러 번 불러도 한 번만 끝난다) */
export function beginAutoScroll() {
	holders++;
	let ended = false;
	return () => {
		if (ended) return;
		ended = true;
		holders--;
	};
}

export const isAutoScrolling = () => holders > 0;
