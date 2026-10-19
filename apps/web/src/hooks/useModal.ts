import { useModalStore } from '@/stores/useModalStore';

export const useModal = () => {
	const { isOpen, content, openModal, closeModal } = useModalStore();
	return { isOpen, content, openModal, closeModal };
};
