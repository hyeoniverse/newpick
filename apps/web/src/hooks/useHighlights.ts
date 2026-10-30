import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 스크랩 · 메모 (#123) */
export interface Highlight {
	id: number;
	newsletterId: number;
	section: string | null;
	/** 소식(story-N)이면 그 소식의 제목 (스크랩할 때 꺼내 둔 것, 빈 글이면 제목 없음) */
	sectionTitle?: string | null;
	text: string;
	note: string | null;
	/** 중요 표시 (별) */
	starred: boolean;
	/** 폴더 (없으면 null) */
	folderId: number | null;
	createdAt: string;
	updatedAt: string;
	/** 썸네일(image)은 마이페이지 쪽 목록에만 온다 */
	newsletter?: { title: string; createdAt: string; image?: string | null; category: { id: number; name: string } };
}

/** 내 스크랩. newsletterId를 주면 그 뉴스레터 것만 (상세 화면 형광펜), 아니면 전체 (마이페이지) */
export function useHighlights(newsletterId?: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: ['highlights', user?.id, newsletterId ?? 'all'],
		queryFn: () => apiFetch<Highlight[]>(API_ENDPOINTS.MY.HIGHLIGHTS(newsletterId)),
		enabled: !!user,
	});
}

/** 마이페이지 스크랩 한 쪽 (서버에서 거름) */
export interface HighlightPage {
	items: Highlight[];
	total: number;
	/** 폴더 줄(전체 · 폴더 없음) · 보기 칩(고른 폴더 안의 중요 · 메모) 개수 */
	counts: { all: number; unfiled: number; starred: number; memo: number };
	/** 달 막대 바로 가기: 거르기 · 정렬을 적용한 순서로 달마다 개수와 그 달 첫 스크랩의 순번 */
	months?: { month: string; count: number; firstIndex: number }[];
}

/** 한 번에 받는 스크랩 수 */
export const HIGHLIGHT_PAGE_SIZE = 30;

/**
 * 마이페이지 스크랩 (#123): 쪽 단위로 받아 아래로 이어 붙인다 (무한 스크롤).
 * filters: 'folder=none&filter=starred' 같은 쿼리. startOffset: 달로 건너뛰면 그 달 첫 스크랩 순번부터 (위로는 앞 쪽)
 */
export function useHighlightPages(filters: string, startOffset = 0) {
	const { user } = useAuth();
	return useInfiniteQuery({
		queryKey: ['highlights', 'page', user?.id, filters, startOffset],
		queryFn: async ({ pageParam }) => ({
			...(await apiFetch<HighlightPage>(
				API_ENDPOINTS.MY.HIGHLIGHTS_PAGE(
					`offset=${pageParam}&limit=${HIGHLIGHT_PAGE_SIZE}${filters ? `&${filters}` : ''}`,
				),
			)),
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
		queryClient.invalidateQueries({ queryKey: ['highlights'] });
		queryClient.invalidateQueries({ queryKey: ['folders'] });
		queryClient.invalidateQueries({ queryKey: ['taste'] });
	};
	const fail = (error: Error) =>
		showToast(error instanceof ApiError ? error.message : '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error');

	const create = useMutation({
		mutationFn: (body: { newsletterId: number; section?: string; text: string; note?: string }) =>
			apiFetch<Highlight>(API_ENDPOINTS.MY.HIGHLIGHTS(), { method: 'POST', body }),
		onSuccess: (saved, body) => {
			refresh();
			// 마이페이지 스크랩 탭의 이 문장으로 바로 (#hl-번호로 스크롤 · 잠깐 강조)
			showToast(
				body.note ? '메모를 남겼어요.' : '스크랩했어요. 마이페이지에서 모아 볼 수 있어요.',
				'success',
				undefined,
				{
					label: '스크랩 모아 보기 →',
					href: `/mypage?tab=highlights#hl-${saved.id}`,
				},
			);
		},
		onError: fail,
	});
	// 메모 고치기 · 중요 표시 켜고 끄기 (준 것만)
	const update = useMutation({
		mutationFn: ({ id, ...body }: { id: number; note?: string; starred?: boolean }) =>
			apiFetch<Highlight>(API_ENDPOINTS.MY.HIGHLIGHT(id), { method: 'PATCH', body }),
		onSuccess: (_, body) => {
			refresh();
			if (body.starred !== undefined)
				showToast(body.starred ? '중요 표시했어요.' : '중요 표시를 해제했어요.', 'success');
			else showToast('메모를 고쳤어요.', 'success');
		},
		onError: fail,
	});
	const remove = useMutation({
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.HIGHLIGHT(id), { method: 'DELETE' }),
		onSuccess: () => {
			refresh();
			showToast('스크랩을 지웠어요.', 'success');
		},
		onError: fail,
	});
	const removeMany = useMutation({
		mutationFn: (ids: number[]) =>
			apiFetch<{ count: number }>(API_ENDPOINTS.MY.HIGHLIGHTS_DELETE(), { method: 'POST', body: { ids } }),
		onSuccess: ({ count }) => {
			refresh();
			showToast(`스크랩 ${count}개를 지웠어요.`, 'success');
		},
		onError: fail,
	});
	// 선택한 스크랩 한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 해제
	const bulk = useMutation({
		mutationFn: (body: { ids: number[]; action: 'move' | 'star' | 'unstar'; folderId?: number | null }) =>
			apiFetch<{ count: number }>(API_ENDPOINTS.MY.HIGHLIGHTS_BULK(), { method: 'POST', body }),
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
export interface Taste {
	weights: { bookmark: number; scrap: number; memo: number };
	halfLifeDays: number;
	signals: { bookmark: number; scrap: number; memo: number };
	topics: { topic: string; score: number; bookmark: number; scrap: number; memo: number }[];
	categories: { categoryId: number; name: string | null; score: number }[];
}

export function useTaste() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ['taste', user?.id],
		queryFn: () => apiFetch<Taste>(API_ENDPOINTS.MY.TASTE()),
		enabled: !!user,
	});
}
