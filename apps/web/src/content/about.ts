import { PROFILE_IMAGES } from '@/constants/images';

export const GITHUB = {
	/** 지금 서비스 저장소 */
	REPO: 'https://github.com/hyeoniverse/newpick',
	TEAM: 'https://github.com/Devcourse-NewPick',
	FRONT_1: 'https://github.com/hyeoniverse',
	FRONT_2: 'https://github.com/jayl100',
	BACK_1: 'https://github.com/Crow-yoo',
	BACK_2: 'https://github.com/jae-yon',
	BACK_3: 'https://github.com/rungchan2',
};

/** 시작하기 WHO WE ARE: v2(개인 리팩토링·재배포)와 v1(데브코스 팀 프로젝트) */
export const V2 = {
	period: '2026.09 ~',
	label: '개인 리팩토링 · 재설계 · 재배포',
	member: {
		name: '김정현',
		position: '기획 · 개발 · 운영',
		link: `${GITHUB.FRONT_1}`,
		image: `${PROFILE_IMAGES.FRONT_1}`,
	},
	/** 영역별로 한 일 (PR 기준) */
	works: [
		{
			area: '보안',
			items: [
				'모든 API를 로그인 필요로 두고(기본 거부), 120개 경로의 권한을 테스트로 고정',
				'배포 구조를 따라 직접 점검해 취약점 4개 수정 (요청 제한 · 로그인 CSRF · SSRF)',
				'의존성 취약점 171개 → 0개, 탈퇴하면 개인정보를 한 번에 파기',
			],
		},
		{
			area: '백엔드 · AI',
			items: [
				'2단계 AI 생성으로 비용 절감 (30일 약 11달러)',
				'관심사를 엮은 맞춤 메일 한 통, 실패한 분야는 자동으로 다시',
			],
		},
		{
			area: '프론트엔드',
			items: ['디자인 시스템 · 다크 모드 · 접근성으로 화면 다시 설계', '휴대폰 첫 화면 약 2초 (상세 4.6초 → 1.0초)'],
		},
		{
			area: '운영',
			items: ['테스트 · CI · 자동 배포, 무료 서버로 매일 운영', '이용약관 · 개인정보 처리방침 작성'],
		},
	],
};

export const V1 = {
	period: '2024.12 ~ 2025.02',
	label: '데브코스 팀 프로젝트',
};

export const TEAMS = [
	{
		role: '프론트엔드',
		members: [
			{
				name: '김정현',
				position: '프론트엔드 리드',
				detail:
					'프로젝트 세팅 · 공통 컴포넌트 · 구글 로그인·접근 제한 · 구독·관심사 설정 · 홈·시작하기·관심사별 화면 · AI 뉴스레터 체험 · 회의록·팀 노션 문서 작성 · 일정·트러블슈팅 정리 · README·이슈·PR 템플릿',
				link: `${GITHUB.FRONT_1}`,
				image: `${PROFILE_IMAGES.FRONT_1}`,
			},
			{
				name: '이주현',
				position: '디자인 · 화면 개발',
				detail:
					'와이어프레임·디자인 · 색·글꼴 테마 · 기사 상세 페이지 · 마이페이지·프로필 · 북마크·내 뉴스레터 · 헤더·푸터',
				link: `${GITHUB.FRONT_2}`,
				image: `${PROFILE_IMAGES.FRONT_2}`,
			},
		],
		color: '#13B336',
	},
	{
		role: '백엔드',
		members: [
			{
				name: '유지상',
				position: '인증 · 구독',
				detail: '구글 로그인·JWT 인증 · 구독·북마크·마이페이지 API · 서버 배포·코드 통합',
				isLeader: true,
				link: `${GITHUB.BACK_1}`,
				image: `${PROFILE_IMAGES.BACK_1}`,
			},
			{
				name: '김재영',
				position: '크롤링 · 스케줄러',
				detail: '뉴스 크롤링·MongoDB 저장 · 크롤링·정리 스케줄러 · 배포 자동화',
				link: `${GITHUB.BACK_2}`,
				image: `${PROFILE_IMAGES.BACK_2}`,
			},
			{
				name: '이희찬',
				position: 'AI · 데이터',
				detail: 'DB 설계 · AI 요약·뉴스레터 생성 · 뉴스레터·관심사 API · 메일 발송·Sentry',
				link: `${GITHUB.BACK_3}`,
				image: `${PROFILE_IMAGES.BACK_3}`,
			},
		],
		color: '#BD5E00',
	},
];
