import { useCallback } from 'react';
import { LuStar, LuTriangleAlert } from 'react-icons/lu';
import ModalContents from '@/components/common/modal/ModalContent';
import { useModal } from '@/hooks/useModal';
import { Highlight, useHighlightMutations } from '@/hooks/useHighlights';

/**
 * 스크랩 지우기 확인 (#123). 한 개든 여러 개든 같은 순서로 묻는다:
 * 1. "지울까요?" (askFirst가 false면 건너뜀 — 상세 페이지 형광펜처럼 바로 지우는 곳)
 * 2. 별표(중요)한 문장이 있으면 한 번 더: "별표한 문장이에요. 그래도 지울까요?"
 */
export function useConfirmRemoveHighlights() {
	const { openModal, closeModal } = useModal();
	const { remove, removeMany } = useHighlightMutations();

	return useCallback(
		(items: Highlight[], { askFirst = true, onDone }: { askFirst?: boolean; onDone?: () => void } = {}) => {
			if (items.length === 0) return;
			const starred = items.filter((h) => h.starred).length;
			const run = () => {
				closeModal();
				const done = { onSuccess: () => onDone?.() };
				if (items.length === 1) remove.mutate(items[0].id, done);
				else
					removeMany.mutate(
						items.map((h) => h.id),
						done,
					);
			};

			const askStarred = () =>
				openModal(
					<ModalContents
						icon={<LuStar />}
						title={
							items.length === 1
								? '별표한 문장이에요. 그래도 지울까요?'
								: `별표한 문장이 ${starred}개 있어요. 그래도 지울까요?`
						}
						content="중요하다고 표시해 둔 문장이에요. 지우면 되돌릴 수 없어요."
						outlineButton="그만두기"
						filledButton="지우기"
						onCancelClick={closeModal}
						onConfirmClick={run}
					/>,
				);

			const next = () => (starred > 0 ? askStarred() : run());
			if (!askFirst) {
				next();
				return;
			}
			const one = items[0];
			openModal(
				<ModalContents
					icon={<LuTriangleAlert />}
					title={items.length === 1 ? '이 스크랩을 지울까요?' : `스크랩 ${items.length}개를 지울까요?`}
					content={
						items.length === 1
							? one.note
								? '메모도 함께 지워져요.'
								: '문장만 지워지고 뉴스레터는 그대로예요.'
							: '고른 문장과 그 메모가 함께 지워져요. 뉴스레터는 그대로예요.'
					}
					outlineButton="취소"
					filledButton="지우기"
					onCancelClick={closeModal}
					onConfirmClick={() => {
						closeModal();
						next();
					}}
				/>,
			);
		},
		[closeModal, openModal, remove, removeMany],
	);
}
