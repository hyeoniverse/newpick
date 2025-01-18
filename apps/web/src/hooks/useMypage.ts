import React, { useState } from 'react';
import { Category as ICategory } from '@/models/category.model';
import { CATEGORIES } from '@/constants/categories';

export interface INewsletterData {
	id: number;
	categoryName: string;
	userId?: number;
	createdAt: string;
	likes: number;
	img: string;
	title: string;
	summary: string;
}

const useMypage = () => {
	const [selectCategory, setSelectCategory] = useState<string[]>([]);
	const [allSelectCategory, setAllSelectCate] = useState(false);

	// 구독한 뉴스레터 네비게이션 스크롤 앵커 설정
	const handleAnchorNavigation = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
		e.preventDefault();
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	// 뉴스레터 설정 카테고리 선택
	const handleSelectCategory = (category: ICategory) => {
		setSelectCategory((prev) => {
			const isSelected = selectCategory.includes(category.title);
			let newSelectCate = [...prev];

			if (!isSelected) {
				newSelectCate = [...newSelectCate, category.title];
			} else {
				newSelectCate = prev.filter((el) => el !== category.title);
			}

			// 전체 카테고리와 길이가 같으면 전체 true, 아니면 false
			if (newSelectCate.length === CATEGORIES.length) {
				setAllSelectCate(true);
			} else {
				setAllSelectCate(false);
			}

			return newSelectCate;
		});
	};

	// 뉴스레터 설정 카테고리 전체 선택
	const handleSelectAll = () => {
		if (selectCategory.length === CATEGORIES.length) {
			setSelectCategory([]);
			setAllSelectCate(false);
		} else {
			setSelectCategory(CATEGORIES.map((category) => category.title));
			setAllSelectCate(true);
		}
	};

	return {
		handleAnchorNavigation,
		handleSelectCategory,
		handleSelectAll,
		allSelectCategory,
		selectCategory,
		setSelectCategory,
	};
};

export default useMypage;
