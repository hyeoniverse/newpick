import { cache } from 'react';
import { faker } from '@faker-js/faker';
import { Newsletter as INewsletter } from '@/models/newsletter.model';
import { CATEGORIES } from '@/constants/categories';

export const getRandomText = (min: number, max: number): string => {
	const length = Math.floor(Math.random() * (max - min + 1)) + min;
	return faker.lorem.sentence(length);
};

/**
 * Picsum을 이용한 랜덤 이미지 URL 반환
 * @param width 이미지 너비 (기본값: 640)
 * @param height 이미지 높이 (기본값: 480)
 * @returns 랜덤 이미지 URL
 */
export const getRandomImage = cache((width: number = 640, height: number = 480): string => {
	const randomId = Math.floor(Math.random() * 1000);
	return `https://picsum.photos/${width}/${height}?random=${randomId}`;
});
/**
 * Picsum을 이용한 랜덤 이미지 여러 개 반환
 * @param count 반환할 이미지 개수
 * @param width 이미지 너비
 * @param height 이미지 높이
 * @returns 랜덤 이미지 URL 배열
 */
export const getRandomImages = (count: number, width: number = 640, height: number = 480): string[] => {
	return Array.from({ length: count }, () => getRandomImage(width, height));
};

export const getNewsletters = (): INewsletter[] => {
	const categories = CATEGORIES.filter((category) => category.name !== '전체').map((category) => category.name);

	return Array.from({ length: 6 }, (_, dayIndex) => {
		const baseDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
		baseDate.setDate(baseDate.getDate() - dayIndex);
		const dateString = baseDate.toLocaleDateString('en-CA'); // YYYY-MM-DD 형식

		return categories.map((category, categoryIndex) => ({
			id: dayIndex * categories.length + categoryIndex + 1,
			category,
			date: dateString,
			title: getRandomText(10, 25),
			summary: getRandomText(100, 150),
			image: getRandomImage(),
			link: `/news/${dayIndex * categories.length + categoryIndex + 1}`,
			views: Math.floor(Math.random() * 1000),
			likes: Math.floor(Math.random() * 500),
			comments: Math.floor(Math.random() * 300),
		}));
	}).flat();
};
