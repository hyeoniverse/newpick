import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 스크랩 · 메모 (#123) */
export interface Highlight {
	id: number;
	newsletterId: number;
	section: string | null;
	/** 소식(story-N)이면 그 소식의 제목 (목록에서만) */
	sectionTitle?: string | null;
	text: string;
	note: string | null;
	createdAt: string;
	updatedAt: string;
	newsletter?: { title: string; createdAt: string; category: { id: number; name: string } };
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

/** 저장 · 메모 고치기 · 지우기. 끝나면 스크랩 목록을 모두 새로 */
export function useHighlightMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	// 스크랩이 바뀌면 취향 점수도 다시
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ['highlights'] });
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
	const update = useMutation({
		mutationFn: ({ id, note }: { id: number; note: string }) =>
			apiFetch<Highlight>(API_ENDPOINTS.MY.HIGHLIGHT(id), { method: 'PATCH', body: { note } }),
		onSuccess: () => {
			refresh();
			showToast('메모를 고쳤어요.', 'success');
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
	return { create, update, remove };
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
