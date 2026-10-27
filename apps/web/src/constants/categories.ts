import { Category } from '@/models/category.model';

export const CATEGORIES: Category[] = [
	{
		id: 0,
		name: '전체',
		description: '모든 분야의 주요 소식',
	},
	{
		id: 1,
		name: 'IT',
		description: 'AI·반도체·플랫폼·보안 소식',
	},
	{
		id: 2,
		name: '정치',
		description: '국회·정부·선거와 정책 결정',
	},
	{
		id: 3,
		name: '경제',
		description: '증시·금리·부동산·산업 흐름',
	},
	{
		id: 4,
		name: '사회',
		description: '사건·사고·노동·교육 이슈',
	},
	{
		id: 5,
		name: '생활',
		description: '건강·날씨·소비·문화 소식',
	},
	{
		id: 6,
		name: '세계',
		description: '국제 정세·외교·분쟁 소식',
	},
];

/** 고르기 칸 · 칩용 관심사 목록 ('전체'는 값 '') */
export const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ label: c.name, value: c.id ? String(c.id) : '' }));
