import { useState, useEffect } from 'react';
import { Category } from '@/models/category.model';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { mapIdToTitle } from '@/utils/mapInterests';

const useSelectInterests = () => {
	const { user } = useAuth();
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

	// 카테고리 선택 / 해제
	const handleSelectInterests = (category?: Category) => {
		if (!category) {
			return setSelectedInterests([]);
		}

		if (category.name === '전체') {
			if (selectedInterests.includes('전체')) {
				setSelectedInterests([]);
			} else {
				setSelectedInterests(CATEGORIES.map((cat) => cat.name));
			}
		} else {
			const updatedCategories = selectedInterests.includes(category.name)
				? selectedInterests.filter((cat) => cat !== category.name)
				: [...selectedInterests, category.name];

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
		if (user?.interests?.length) {
			const interests = mapIdToTitle(user.interests);
			setSelectedInterests(interests);
		} else {
			setSelectedInterests([]);
		}
	}, [user?.interests]);

	return { selectedInterests, handleSelectInterests };
};

export default useSelectInterests;
