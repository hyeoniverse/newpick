import { useCallback } from 'react';
import { useDropdownStore } from '@/stores/useDropdownStore';

export const useDropdown = (dropdownType: string | string[]) => {
	const { dropdowns, setOpen, closeAll, getState } = useDropdownStore();

	// 현재 상태 가져오기
	const isDropdownOpen =
		typeof dropdownType === 'string'
			? dropdowns[dropdownType] ?? false // 문자열이면 직접 접근
			: dropdownType.some((type) => dropdowns[type] ?? false); // 배열이면 하나라도 열려 있는지 확인

	// 드롭다운 열기
	const openDropdown = useCallback(() => {
		if (typeof dropdownType === 'string') {
			setOpen(dropdownType, true);
		} else {
			dropdownType.forEach((type) => setOpen(type, true));
		}
	}, [dropdownType, setOpen]);

	// 드롭다운 닫기
	const closeDropdown = useCallback(() => {
		if (typeof dropdownType === 'string') {
			setOpen(dropdownType, false);
		} else {
			dropdownType.forEach((type) => setOpen(type, false));
		}
	}, [dropdownType, setOpen]);

	// 드롭다운 토글
	const toggleDropdown = useCallback(() => {
		const currentState =
			typeof dropdownType === 'string'
				? getState()[dropdownType] ?? false // 현재 상태 가져오기
				: dropdownType.some((type) => getState()[type] ?? false);

		if (typeof dropdownType === 'string') {
			setOpen(dropdownType, !currentState);
		} else {
			dropdownType.forEach((type) => setOpen(type, !currentState));
		}
	}, [dropdownType, getState, setOpen]);

	// 모든 드롭다운 닫기
	const closeAllDropdowns = () => closeAll();

	return {
		isDropdownOpen,
		openDropdown,
		closeDropdown,
		toggleDropdown,
		closeAllDropdowns,
	};
};
