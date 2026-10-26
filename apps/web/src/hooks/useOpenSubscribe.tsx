import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import useInterestsStore from '@/stores/useInterestStore';

import ModalContent from '@/components/common/modal/ModalContent';
import SubscribeSheet from '@/components/common/article/SubscribeSheet';
import { BiSolidMessageRoundedError } from 'react-icons/bi';
import { LuMailCheck } from 'react-icons/lu';

/**
 * 구독 시트 열기 (#52). 기사 하단 '구독하기'와 체험 미리보기(#54)가 함께 쓴다.
 * interests를 주면 그 분야를 미리 고른 채로 연다. 로그인 전·이미 구독 중이면 안내만
 */
export function useOpenSubscribe() {
	const { user } = useAuth();
	const { openModal, closeModal } = useModal();
	const setSelectedInterests = useInterestsStore((state) => state.setSelectedInterests);

	return (interests?: string[]) => {
		if (user && user.isSubscribed !== true) {
			if (interests) setSelectedInterests(interests);
			openModal(<SubscribeSheet />);
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
			openModal(
				<ModalContent
					icon={<BiSolidMessageRoundedError />}
					title="로그인이 필요합니다."
					content="로그인 후 이용해주세요."
					filledButton="확인"
					onConfirmClick={closeModal}
				/>,
			);
		}
	};
}
