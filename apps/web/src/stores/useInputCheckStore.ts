import { create } from 'zustand';

interface InputCheckState {
	values: Record<string, boolean>; // name을 키로 한 체크 상태
	setChecked: (name: string, checked: boolean) => void;
	toggleChecked: (name: string) => void;
	reset: () => void;
}

export const useInputCheckStore = create<InputCheckState>((set) => ({
	values: {},

	// 특정 체크박스 상태 변경
	setChecked: (name, checked) =>
		set((state) => ({
			values: { ...state.values, [name]: checked },
		})),

	// 특정 체크박스 상태 토글
	toggleChecked: (name) =>
		set((state) => ({
			values: { ...state.values, [name]: !state.values[name] },
		})),

	// 모든 체크박스 상태 초기화
	reset: () => set({ values: {} }),
}));
