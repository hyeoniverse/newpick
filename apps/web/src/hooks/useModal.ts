import useModalStore from '@/stores/modalStore';

export const useModal = () => {
	const { isOpen, modalType, openModal, closeModal } = useModalStore();
	return { isOpen, modalType, openModal, closeModal };
};
