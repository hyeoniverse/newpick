import { useInputCheckStore } from '@/stores/useInputCheckStore';

export const useInputCheck = (name: string) => {
	const { values, setChecked, toggleChecked } = useInputCheckStore();

	return {
		isChecked: values[name] || false, // 기본값 false
		setChecked: (checked: boolean) => setChecked(name, checked),
		toggleChecked: () => toggleChecked(name),
	};
};
