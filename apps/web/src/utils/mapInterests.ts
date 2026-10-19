import { CATEGORIES } from '../constants/categories';

// id 목록을 name 목록으로 변환하는 함수
export const mapIdToTitle = (ids: number[]): string[] => {
	return ids.map((id) => CATEGORIES.find((category) => category.id === id)?.name ?? '');
};

// name 목록을 id 목록으로 변환하는 함수
export const mapTitleToId = (titles: string[]): number[] => {
	return titles
		.map((name) => CATEGORIES.find((category) => category.name === name)?.id ?? -1)
		.filter((id) => id !== -1);
};
