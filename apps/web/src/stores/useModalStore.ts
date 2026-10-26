import { create } from 'zustand';

/** 모든 모달은 아래에서 올라오는 시트 (#52). small: 30rem (기본), large: 42rem (메일 미리보기가 꽉 차는 폭). 모바일은 둘 다 화면 폭 전체 */
export type ModalSize = 'small' | 'large';

type ModalState = {
	isOpen: boolean;
	content: React.ReactNode | null;
	size: ModalSize;
	openModal: (content: React.ReactNode, options?: { size?: ModalSize }) => void;
	closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
	isOpen: false,
	content: null,
	size: 'small',
	openModal: (content, options) => set({ isOpen: true, content, size: options?.size ?? 'small' }),
	closeModal: () => set({ isOpen: false, content: null, size: 'small' }),
}));
