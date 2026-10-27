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
			area: '백엔드',
			items: [
				'모든 API에 로그인 확인을 기본으로, 위험한 API 삭제, 관리자 권한 상승 막기',
				'관심 분야·북마크 테이블 정규화, 구독 시작 순서 버그 수정',
				'날짜를 한국 시간 기준으로, 예약 작업 실패 격리, 메일 발송 재시도',
				'오류 응답 통일 — 맞는 상태 코드·오류 이름·한국어 메시지',
				'회원 탈퇴 시 개인정보를 한 번에 파기',
			],
		},
		{
			area: 'AI · 메일',
			items: [
				'AI를 OpenAI에서 Claude로 전환',
				'주요 소식만 고르는 2단계 생성으로 비용 절감',
				'내 분야를 엮은 메일 한 통을 매일 아침 발송',
			],
		},
		{
			area: '프론트엔드',
			items: [
				'공통 API 클라이언트·프록시, 로그인 자동 연장과 화면 접근 제어',
				'디자인 시스템과 화면 다시 설계 (다크 모드·모바일·접근성)',
				'기사 본문 보안 취약점(XSS) 수정, 오류 화면 정리',
			],
		},
		{
			area: '테스트 · 운영',
			items: [
				'단위·E2E 테스트와 CI',
				'무료 서버(Oracle VM + Cloudflare Tunnel)로 재배포, 자동 배포',
				'이용약관·개인정보 처리방침 작성',
			],
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
				detail: '공통 컴포넌트 · 인증·구독 · API 연동 · 문서화',
				link: `${GITHUB.FRONT_1}`,
				image: `${PROFILE_IMAGES.FRONT_1}`,
			},
			{
				name: '이주현',
				position: '디자인',
				detail: '와이어프레임 · 디자인 · API 연동',
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
				position: '백엔드',
				isLeader: true,
				link: `${GITHUB.BACK_1}`,
				image: `${PROFILE_IMAGES.BACK_1}`,
			},
			{
				name: '김재영',
				position: '백엔드',
				link: `${GITHUB.BACK_2}`,
				image: `${PROFILE_IMAGES.BACK_2}`,
			},
			{
				name: '이희찬',
				position: '백엔드',
				link: `${GITHUB.BACK_3}`,
				image: `${PROFILE_IMAGES.BACK_3}`,
			},
		],
		color: '#BD5E00',
	},
];
