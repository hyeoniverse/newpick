/** 방문 통계 (#131) 화면 공통 이름 · 표시 */

export const CHANNEL_LABEL: Record<string, string> = {
	direct: '직접 (주소 입력 · 즐겨찾기)',
	search: '검색',
	social: 'SNS',
	email: '메일',
	referral: '다른 사이트',
	internal: '사이트 안 이동',
};

export const DEVICE_LABEL: Record<string, string> = { mobile: '모바일', tablet: '태블릿', desktop: '데스크톱' };

const ROUTE_LABEL: Record<string, string> = {
	'/': '홈',
	'/articles': '뉴스레터 목록',
	'/articles/detail/:id': '뉴스레터 상세',
	'/about': '소개',
	'/mypage': '마이페이지',
	'/privacy': '개인정보 처리방침',
	'/terms': '이용약관',
	'/unsubscribe': '수신 거부',
};

/** 경로 이름 (모르는 경로는 그대로) */
export const routeName = (route: string) => ROUTE_LABEL[route] ?? route;

/** 구역 이름표 → 읽기 좋은 이름 */
export function sectionName(name: string) {
	const story = name.match(/^story-(\d+)$/);
	if (story) return `소식 ${story[1]}`;
	const known: Record<string, string> = {
		briefing: '에디터 브리핑',
		summary: 'AI 요약',
		'subscribe-cta': '구독 권유',
		'detail-title': '제목 · 태그',
		'detail-image': '대표 사진',
		'detail-sources': '출처 기사',
		'detail-popular': '인기 뉴스레터',
		'detail-prev-next': '이전 · 다음 글',
		'detail-latest': '최신 뉴스레터',
		'home-title': '홈 첫 화면',
		'home-hero': '홈 소개',
		'home-trend': '홈 트렌드',
		'home-subscribe': '홈 구독',
		'articles-hot': '목록 위 배너',
		'articles-list': '뉴스레터 목록',
	};
	return known[name] ?? name.replace(/^about-/, '소개 · ');
}

/** 밀리초 → '1분 20초' · '35초' */
export function duration(ms: number) {
	const seconds = Math.round(ms / 1000);
	if (seconds < 60) return `${seconds}초`;
	const minutes = Math.floor(seconds / 60);
	return seconds % 60 ? `${minutes}분 ${seconds % 60}초` : `${minutes}분`;
}
