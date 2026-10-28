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
	/** 중요 표시 (별) */
	starred: boolean;
	/** 폴더 (없으면 null) */
	folderId: number | null;
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
		queryClient.invalidateQueries({ queryKey: ['highlightFolders'] });
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
			if (body.starred !== undefined) showToast(body.starred ? '중요 표시했어요.' : '중요 표시를 뺐어요.', 'success');
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
	// 선택한 스크랩 한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 빼기
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
						: `${count}개의 중요 표시를 뺐어요.`,
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

/** 스크랩 폴더 (#123) */
export interface HighlightFolder {
	id: number;
	name: string;
	count: number;
}

export function useHighlightFolders() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ['highlightFolders', user?.id],
		queryFn: () => apiFetch<HighlightFolder[]>(API_ENDPOINTS.MY.HIGHLIGHT_FOLDERS()),
		enabled: !!user,
	});
}

/** 폴더 만들기 · 이름 바꾸기 · 지우기 */
export function useHighlightFolderMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ['highlightFolders'] });
		queryClient.invalidateQueries({ queryKey: ['highlights'] });
	};
	const fail = (error: Error) =>
		showToast(error instanceof ApiError ? error.message : '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error');

	const create = useMutation({
		mutationFn: (name: string) =>
			apiFetch<{ id: number; name: string }>(API_ENDPOINTS.MY.HIGHLIGHT_FOLDERS(), { method: 'POST', body: { name } }),
		onSuccess: () => refresh(),
		onError: fail,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: number; name: string }) =>
			apiFetch(API_ENDPOINTS.MY.HIGHLIGHT_FOLDER(id), { method: 'PATCH', body: { name } }),
		onSuccess: () => {
			refresh();
			showToast('폴더 이름을 바꿨어요.', 'success');
		},
		onError: fail,
	});
	const remove = useMutation({
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.HIGHLIGHT_FOLDER(id), { method: 'DELETE' }),
		onSuccess: () => {
			refresh();
			showToast('폴더를 지웠어요. 안의 스크랩은 폴더 없음으로 옮겼어요.', 'success');
		},
		onError: fail,
	});
	return { create, rename, remove };
}
