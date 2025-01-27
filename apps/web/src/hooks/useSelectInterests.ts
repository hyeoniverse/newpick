import { useState, useEffect } from 'react';
import { Category } from '@/models/category.model';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';

const useSelectInterests = () => {
	const { user } = useAuth();
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

	// 카테고리 선택 / 해제
	const handleSelectInterests = (category?: Category) => {
		if (!category) {
			return setSelectedInterests([]);
		}

		if (category.title === '전체') {
			if (selectedInterests.includes('전체')) {
				setSelectedInterests([]);
			} else {
				setSelectedInterests(CATEGORIES.map((cat) => cat.title));
			}
		} else {
			const updatedCategories = selectedInterests.includes(category.title)
				? selectedInterests.filter((cat) => cat !== category.title)
				: [...selectedInterests, category.title];

			if (updatedCategories.includes('전체') && !updatedCategories.includes(category.title)) {
				setSelectedInterests(updatedCategories.filter((cat) => cat !== '전체'));
			} else if (updatedCategories.length === CATEGORIES.length - 1) {
				setSelectedInterests(CATEGORIES.map((cat) => cat.title));
			} else {
				setSelectedInterests(updatedCategories);
			}
		}
	};

	// 사용자 관심사 반영 (초기 로드 및 관심사 업데이트 시)
	useEffect(() => {
		if (user?.interests?.length) {
			setSelectedInterests(user.interests);
		} else {
			setSelectedInterests([]);
		}
	}, [user?.interests]);

	return { selectedInterests, handleSelectInterests };
};

export default useSelectInterests;
