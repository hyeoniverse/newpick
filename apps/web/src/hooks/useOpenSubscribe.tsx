import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useOpenLogin } from '@/hooks/useOpenLogin';

import ModalContent from '@/components/common/modal/ModalContent';
import SubscribeSheet from '@/components/common/article/SubscribeSheet';
import { LuMailCheck } from 'react-icons/lu';

/**
 * 구독 시트 열기 (#52). 기사 하단 '구독하기'와 체험 미리보기(#54)가 함께 쓴다.
 * interests를 주면 그 분야를 미리 고른 채로 연다. 로그인 전·이미 구독 중이면 안내만
 */
export function useOpenSubscribe() {
	const { user } = useAuth();
	const { openModal, closeModal } = useModal();
	const openLogin = useOpenLogin();

	return (interests?: string[]) => {
		if (user && user.isSubscribed !== true) {
			openModal(<SubscribeSheet initialInterests={interests} />);
		} else if (user) {
			openModal(
				<ModalContent
					icon={<LuMailCheck />}
					title="이미 구독중입니다."
					content="구독중인 뉴스레터가 있습니다."
					filledButton="확인"
					onConfirmClick={closeModal}
				/>,
			);
		} else {
			openLogin('구독하려면 로그인해 주세요');
		}
	};
}
