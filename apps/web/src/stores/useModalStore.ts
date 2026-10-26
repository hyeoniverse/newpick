import { create } from 'zustand';

/** dialog: 가운데 대화상자 (기본), sheet: 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 (#52) */
export type ModalVariant = 'dialog' | 'sheet';

type ModalState = {
	isOpen: boolean;
	content: React.ReactNode | null;
	variant: ModalVariant;
	openModal: (content: React.ReactNode, options?: { variant?: ModalVariant }) => void;
	closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
	isOpen: false,
	content: null,
	variant: 'dialog',
	openModal: (content, options) => set({ isOpen: true, content, variant: options?.variant ?? 'dialog' }),
	closeModal: () => set({ isOpen: false, content: null, variant: 'dialog' }),
}));
