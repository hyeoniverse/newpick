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
	works: [
		'보안·인증 다시 짜기, 데이터 정합성 정리',
		'디자인 시스템과 화면 다시 설계 (다크 모드·모바일·접근성)',
		'AI 뉴스레터 작성 방식 개선, 매일 아침 메일 발송',
		'단위·E2E 테스트와 CI, 저비용 재배포',
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
