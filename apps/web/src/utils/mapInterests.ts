import { CATEGORIES } from '../constants/categories';

// id 목록을 title 목록으로 변환하는 함수
export const mapIdToTitle = (ids: number[]): string[] => {
	return ids.map((id) => CATEGORIES.find((category) => category.id === id)?.title ?? '');
};

// title 목록을 id 목록으로 변환하는 함수
export const mapTitleToId = (titles: string[]): number[] => {
	return titles
		.map((title) => CATEGORIES.find((category) => category.title === title)?.id ?? -1)
		.filter((id) => id !== -1);
};
