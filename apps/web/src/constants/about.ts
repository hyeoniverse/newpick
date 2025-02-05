import { PROFILE_IMAGES } from '@/constants/images';

export const GITHUB = {
	TEAM: 'https://github.com/Devcourse-NewPick',
	FRONT_1: 'https://github.com/CodingKirby',
	FRONT_2: 'https://github.com/jayl100',
	BACK_1: 'https://github.com/Crow-yoo',
	BACK_2: 'https://github.com/jae-yon',
	BACK_3: 'https://github.com/rungchan2',
};

export const TEAMS = [
	{
		role: '프론트엔드',
		members: [
			{
				name: '김정현',
				position: '기획',
				link: `${GITHUB.FRONT_1}`,
				image: `${PROFILE_IMAGES.FRONT_1}`,
			},
			{
				name: '이주현',
				position: '디자인',
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
