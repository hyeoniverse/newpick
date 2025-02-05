import { useState, useEffect } from 'react';
import useInterestsStore from '@/stores/useInterestStore';
import { Category } from '@/models/category.model';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { mapIdToTitle } from '@/utils/mapInterests';
import { init } from 'next/dist/compiled/webpack/webpack';

export const useSelectInterests = () => {
	const { user } = useAuth();
	const { selectedInterests, setSelectedInterests } = useInterestsStore();

	// 카테고리 선택 / 해제
	const handleSelectInterests = (category?: Category) => {
		if (!category) {
			return setSelectedInterests([]);
		}

		if (category.name === '전체') {
			// 전체 카테고리 선택 시
			if (selectedInterests.includes('전체')) {
				// 전체 카테고리가 이미 선택되어 있을 경우
				setSelectedInterests([]); // 전체 카테고리 선택 해제
			} else {
				// 전체 카테고리가 선택되어 있지 않을 경우
				setSelectedInterests(CATEGORIES.map((cat) => cat.name)); // 전체 카테고리 선택
			}
		} else {
			// 전체 카테고리가 아닌 카테고리 선택 시
			const updatedCategories = selectedInterests.includes(category.name) // 선택된 카테고리가 이미 선택되어 있을 경우
				? selectedInterests.filter((cat) => cat !== category.name) // 선택된 카테고리 선택 해제
				: [...selectedInterests, category.name]; // 선택된 카테고리 선택

			if (updatedCategories.includes('전체') && !updatedCategories.includes(category.name)) {
				setSelectedInterests(updatedCategories.filter((cat) => cat !== '전체'));
			} else if (updatedCategories.length === CATEGORIES.length - 1) {
				setSelectedInterests(CATEGORIES.map((cat) => cat.name));
			} else {
				setSelectedInterests(updatedCategories);
			}
		}
	};

	// 사용자 관심사 반영 (초기 로드 및 관심사 업데이트 시)
	useEffect(() => {
		if (!user || user === null) {
			// 사용자 정보가 없을 경우
			setSelectedInterests([]);
		} else if (user.interests) {
			// 사용자 정보가 있을 경우
			const interests = mapIdToTitle(user.interests ?? []);
			setSelectedInterests(interests);
		}
	}, [user, setSelectedInterests]);

	useEffect(() => {
		if (selectedInterests.length === CATEGORIES.length - 1) {
			setSelectedInterests(CATEGORIES.map((cat) => cat.name));
		}
	}, [selectedInterests, setSelectedInterests]);

	return { selectedInterests, handleSelectInterests };
};

export const useSingleSelectInterest = (initialInterest?: string) => {
	const [selectedInterest = initialInterest, setSelectedInterest] = useState<string>();

	// 카테고리 선택 (전체 선택 방지)
	const handleSelectInterest = (category?: Category) => {
		if (!category || category.name === '전체') return; // "전체" 선택 불가

		setSelectedInterest(category.name);
	};

	return { selectedInterest, handleSelectInterest };
};
