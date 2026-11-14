import { ACTIONS } from '@/copy';
import { LuTriangleAlert } from 'react-icons/lu';
import { errorMessage } from '@/api/client';
import ModalContents from '@/components/common/modal/ModalContent';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';

/**
 * 확인 창 → 실행 → 알림 (#230): 확인을 누르면 창을 닫고 run을 실행해, 되면 success 알림 · onDone, 안 되면 오류 알림.
 * 관리자 화면처럼 되돌리기 어려운 일을 하기 전에 묻는 곳에서 쓴다
 */
export function useConfirmAction() {
	const { openModal, closeModal } = useModal();
	const { showToast } = useToast();

	return <T,>({
		title,
		content,
		confirmLabel,
		children,
		run,
		success,
		failure,
		onDone,
	}: {
		title: string;
		content?: string;
		/** 확인 단추 글자 */
		confirmLabel: string;
		/** 설명 아래 넣을 것 */
		children?: React.ReactNode;
		run: () => Promise<T>;
		/** 됐을 때 알림 (결과로 문구를 만들 수도). 없으면 알리지 않는다 (run 안에서 따로 알릴 때) */
		success?: string | ((result: T) => string);
		/** 안 됐을 때 api 문구가 없으면 쓸 문구 */
		failure: string;
		onDone?: (result: T) => void;
	}) =>
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={title}
				content={content}
				outlineButton={ACTIONS.cancel}
				filledButton={confirmLabel}
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						const result = await run();
						if (success) showToast(typeof success === 'function' ? success(result) : success, 'success');
						onDone?.(result);
					} catch (error) {
						showToast(errorMessage(error, failure), 'error');
					}
				}}
			>
				{children}
			</ModalContents>,
		);
}
