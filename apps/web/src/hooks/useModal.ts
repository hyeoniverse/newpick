import useModalStore from '@/stores/useModalStore';

export const useModal = () => {
	const { isOpen, modalType, openModal, closeModal } = useModalStore();
	return { isOpen, modalType, openModal, closeModal };
};
