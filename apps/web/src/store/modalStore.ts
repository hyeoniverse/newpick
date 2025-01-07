import { create } from 'zustand';

interface ModalState {
	isOpen: boolean;
	modalType: string | null; // 활성화된 모달의 타입 (예: "login", "signup")
	openModal: (type: string) => void; // 모달 열기 함수
	closeModal: () => void; // 모달 닫기 함수
}

const useModalStore = create<ModalState>((set) => ({
	isOpen: false,
	modalType: null,
	openModal: (type) =>
		set({
			isOpen: true,
			modalType: type,
		}),
	closeModal: () =>
		set({
			isOpen: false,
			modalType: null,
		}),
}));

export default useModalStore;
