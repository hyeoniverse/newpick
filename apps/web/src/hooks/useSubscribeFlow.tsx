'use client';

import { ACTIONS } from '@/copy';
import { LuMailCheck } from 'react-icons/lu';
import ModalContent from '@/components/common/modal/ModalContent';
import { useModal } from '@/hooks/useModal';
import useSubscribe from '@/hooks/useSubscribe';

/**
 * 구독하기 → 끝나면 완료 창 (#230). 홈 · 시작하기 · 기사 시트 · 마이페이지가 같은 흐름이고 창 문구만 다르다.
 * useSubscribe가 돌려주는 것(상태 · 해지 등)도 그대로 함께 돌려주므로, 한 화면에서 이 훅 하나만 쓰면 된다
 */
export function useSubscribeFlow(done: { title: string; body: string }) {
	const subscription = useSubscribe();
	const { openModal, closeModal } = useModal();

	/** 구독하고, 되면 완료 창을 띄운 뒤 true */
	const subscribe = async (input: Parameters<typeof subscription.handleSubscribe>[0]) => {
		const isSuccess = await subscription.handleSubscribe(input);
		if (isSuccess)
			openModal(
				<ModalContent
					icon={<LuMailCheck />}
					title={done.title}
					content={done.body}
					filledButton={ACTIONS.confirm}
					onConfirmClick={closeModal}
				/>,
			);
		return isSuccess;
	};

	return { ...subscription, subscribe };
}
