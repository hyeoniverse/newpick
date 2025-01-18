import { Navigation } from '@/models/navigation.model';
import { CATEGORIES } from '@/constants/categories';

export const NAVIGATION: Navigation[] = [
	{
		id: 0,
		title: '시작하기',
		link: '/start',
	},
	{
		id: 1,
		title: '뉴스레터',
		link: '/articles',
		subItems: [
			...CATEGORIES.map((category, index) => ({
				id: index,
				title: category.title,
				link: index === 0 ? '/articles' : `/articles/categories/${category.id}`,
			})),
		],
	},
];
