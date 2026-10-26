import { useModalStore } from '@/stores/useModalStore';

export const useModal = () => {
	const { isOpen, content, variant, openModal, closeModal } = useModalStore();
	return { isOpen, content, variant, openModal, closeModal };
};
