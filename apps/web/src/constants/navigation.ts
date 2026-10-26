import { Navigation as INavigation } from '@/models/navigation.model';

export const NAVIGATION: INavigation[] = [
	{
		id: 0,
		title: '시작하기',
		link: '/about',
	},
	{
		id: 1,
		title: '뉴스레터',
		link: '/articles',
	},
];

export const MYPAGE_NAVIGATION: INavigation[] = [
	{
		id: 0,
		title: `내 뉴스레터`,
		link: `subscriptions`,
	},
	{
		id: 1,
		title: `북마크한 뉴스레터`,
		link: `bookmarks`,
	},
	{
		id: 2,
		title: `뉴스레터 설정`,
		link: `settings`,
	},
];
