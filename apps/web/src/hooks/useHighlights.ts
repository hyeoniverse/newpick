import { ROUTES } from '@/constants/routes';
import { queryKeys } from '@/api/queryKeys';
import type { Highlight, HighlightPage, MyTaste } from '@newpick/shared';
import {
	bulkHighlights,
	createHighlight,
	deleteHighlight,
	deleteHighlights,
	fetchHighlightPage,
	fetchHighlights,
	fetchTaste,
	updateHighlight,
} from '@/api/highlights';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 스크랩 · 메모 (#123) */
/** 스크랩 · 스크랩 한 쪽 · 내 취향 (@newpick/shared, api 응답과 같다) */
export type { Highlight, HighlightPage };

/** 내 스크랩. newsletterId를 주면 그 뉴스레터 것만 (상세 화면 형광펜), 아니면 전체 (마이페이지) */
export function useHighlights(newsletterId?: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.highlights.list(user?.id, newsletterId),
		queryFn: () => fetchHighlights(newsletterId),
		enabled: !!user,
	});
}

/** 마이페이지 스크랩 한 쪽 (서버에서 거름) */

/** 한 번에 받는 스크랩 수 */
export const HIGHLIGHT_PAGE_SIZE = 30;

/**
 * 마이페이지 스크랩 (#123): 쪽 단위로 받아 아래로 이어 붙인다 (무한 스크롤).
 * filters: 'folder=none&filter=starred' 같은 쿼리. startOffset: 달로 건너뛰면 그 달 첫 스크랩 순번부터 (위로는 앞 쪽)
 */
export function useHighlightPages(filters: string, startOffset = 0) {
	const { user } = useAuth();
	return useInfiniteQuery({
		queryKey: queryKeys.highlights.page(user?.id, filters, startOffset),
		queryFn: async ({ pageParam }) => ({
			...(await fetchHighlightPage(pageParam, HIGHLIGHT_PAGE_SIZE, filters)),
			offset: pageParam,
		}),
		initialPageParam: startOffset,
		getNextPageParam: (last) =>
			last.offset + last.items.length < last.total ? last.offset + HIGHLIGHT_PAGE_SIZE : undefined,
		getPreviousPageParam: (first) => (first.offset > 0 ? Math.max(0, first.offset - HIGHLIGHT_PAGE_SIZE) : undefined),
		enabled: !!user,
		placeholderData: (previous) => previous,
	});
}

/** 저장 · 메모 고치기 · 지우기. 끝나면 스크랩 목록을 모두 새로 */
export function useHighlightMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	// 스크랩이 바뀌면 취향 점수도 다시
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: queryKeys.highlights.all });
		queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
		queryClient.invalidateQueries({ queryKey: queryKeys.taste.all });
	};
	const fail = (error: Error) =>
		showToast(error instanceof ApiError ? error.message : '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error');

	const create = useMutation({
		mutationFn: createHighlight,
		onSuccess: (saved, body) => {
			refresh();
			// 마이페이지 스크랩 탭의 이 문장으로 바로 (#hl-번호로 스크롤 · 잠깐 강조)
			showToast(
				body.note ? '메모를 남겼어요.' : '스크랩했어요. 마이페이지에서 모아 볼 수 있어요.',
				'success',
				undefined,
				{
					label: '스크랩 모아 보기 →',
					href: `${ROUTES.mypage('highlights')}#hl-${saved.id}`,
				},
			);
		},
		onError: fail,
	});
	// 메모 고치기 · 중요 표시 켜고 끄기 (준 것만)
	const update = useMutation({
		mutationFn: ({ id, ...body }: { id: number; note?: string; starred?: boolean }) => updateHighlight(id, body),
		onSuccess: (_, body) => {
			refresh();
			if (body.starred !== undefined)
				showToast(body.starred ? '중요 표시했어요.' : '중요 표시를 해제했어요.', 'success');
			else showToast('메모를 고쳤어요.', 'success');
		},
		onError: fail,
	});
	const remove = useMutation({
		mutationFn: deleteHighlight,
		onSuccess: () => {
			refresh();
			showToast('스크랩을 지웠어요.', 'success');
		},
		onError: fail,
	});
	const removeMany = useMutation({
		mutationFn: (ids: number[]) => deleteHighlights(ids),
		onSuccess: ({ count }) => {
			refresh();
			showToast(`스크랩 ${count}개를 지웠어요.`, 'success');
		},
		onError: fail,
	});
	// 선택한 스크랩 한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 해제
	const bulk = useMutation({
		mutationFn: bulkHighlights,
		onSuccess: ({ count }, body) => {
			refresh();
			showToast(
				body.action === 'move'
					? `${count}개를 옮겼어요.`
					: body.action === 'star'
						? `${count}개를 중요 표시했어요.`
						: `${count}개의 중요 표시를 해제했어요.`,
				'success',
			);
		},
		onError: fail,
	});
	return { create, update, remove, removeMany, bulk };
}

/** 내 취향 점수 (#123 2단계) */
export type Taste = MyTaste;

export function useTaste() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.taste.mine(user?.id),
		queryFn: fetchTaste,
		enabled: !!user,
	});
}
