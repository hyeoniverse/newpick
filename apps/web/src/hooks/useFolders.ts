import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 폴더 (#123): 스크랩 · 북마크 · 받은 메일이 같이 쓰는 주제 폴더. 폴더마다 탭별 개수 */
export interface Folder {
	id: number;
	name: string;
	counts: { highlights: number; bookmarks: number; mails: number };
}

/** 폴더를 지울 때 안의 것들: 폴더 없음으로 남기기 · 같이 지우기 · 다른 폴더로 옮기기 */
export type FolderContents = 'keep' | 'delete' | 'move';

const REMOVED: Record<FolderContents, string> = {
	keep: '폴더를 지웠어요. 안의 것들은 폴더 없음으로 남겼어요.',
	delete: '폴더와 안의 것들을 지웠어요.',
	move: '폴더를 지우고 안의 것들을 옮겼어요.',
};

/** 폴더 안의 것들이 바뀌면 다시 불러올 목록들 */
export const FOLDER_CONTENT_KEYS = [['folders'], ['highlights'], ['bookmarks'], ['myMails']];

export function useFolders() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ['folders', user?.id],
		queryFn: () => apiFetch<Folder[]>(API_ENDPOINTS.MY.FOLDERS()),
		enabled: !!user,
	});
}

/** 폴더 만들기 · 이름 바꾸기 · 지우기 */
export function useFolderMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => FOLDER_CONTENT_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
	const fail = (error: Error) =>
		showToast(error instanceof ApiError ? error.message : '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error');

	const create = useMutation({
		mutationFn: (name: string) =>
			apiFetch<{ id: number; name: string }>(API_ENDPOINTS.MY.FOLDERS(), { method: 'POST', body: { name } }),
		onSuccess: () => refresh(),
		onError: fail,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: number; name: string }) =>
			apiFetch(API_ENDPOINTS.MY.FOLDER(id), { method: 'PATCH', body: { name } }),
		onSuccess: () => {
			refresh();
			showToast('폴더 이름을 바꿨어요.', 'success');
		},
		onError: fail,
	});
	const remove = useMutation({
		mutationFn: ({ id, contents, to }: { id: number; contents: FolderContents; to?: number }) =>
			apiFetch(
				API_ENDPOINTS.MY.FOLDER(id, new URLSearchParams({ contents, ...(to && { to: String(to) }) }).toString()),
				{ method: 'DELETE' },
			),
		onSuccess: (_, { contents }) => {
			refresh();
			// 북마크를 지웠으면 취향 점수도 바뀐다
			if (contents === 'delete') queryClient.invalidateQueries({ queryKey: ['taste'] });
			showToast(REMOVED[contents], 'success');
		},
		onError: fail,
	});
	return { create, rename, remove };
}
