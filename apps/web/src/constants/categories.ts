import { CATEGORIES as SHARED_CATEGORIES } from '@newpick/shared';
import { Category } from '@/types/category';

/** 화면용 분야 목록: '전체'(id 0) + 공유 분야 (@newpick/shared, api와 같은 목록) */
export const CATEGORIES: Category[] = [
	{ id: 0, name: '전체', description: '모든 분야의 주요 소식' },
	...SHARED_CATEGORIES.map((c) => ({ id: c.id, name: c.name, description: c.description })),
];

/** 고르기 칸 · 칩용 관심사 목록 ('전체'는 값 '') */
export const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ label: c.name, value: c.id ? String(c.id) : '' }));
