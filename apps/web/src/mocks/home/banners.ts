import { Banner as IBanner } from '@/models/banner.model';

export const bannersData: IBanner[] = [
	{
		id: 1,
		image: 'https://picsum.photos/800/400?random=1',
		title: '전체 인기 뉴스 아니면 그냥 이미지 슬라이드',
		description: '인기 뉴스 슬라이드. 화살표로 이동 및 시간 지나면 자동 롤링.',
		url: 'https://example.com/1',
		target: '_blank',
	},
	{
		id: 2,
		image: 'https://picsum.photos/800/400?random=2',
		title: '최신 IT 소식 업데이트',
		description: '오늘의 IT 관련 주요 뉴스 업데이트.',
		url: 'https://example.com/2',
		target: '_blank',
	},
	{
		id: 3,
		image: 'https://picsum.photos/800/400?random=3',
		title: '오늘의 경제 뉴스',
		description: '경제 주요 지표와 관련 뉴스 분석.',
		url: 'https://example.com/3',
		target: '_blank',
	},
	{
		id: 4,
		image: 'https://picsum.photos/800/400?random=4',
		title: '스포츠 핫이슈',
		description: '국내외 스포츠 주요 경기 및 결과.',
		url: 'https://example.com/4',
		target: '_blank',
	},
];
