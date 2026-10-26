import { useModalStore } from '@/stores/useModalStore';

export const useModal = () => {
	const { isOpen, content, size, openModal, closeModal } = useModalStore();
	return { isOpen, content, size, openModal, closeModal };
};
