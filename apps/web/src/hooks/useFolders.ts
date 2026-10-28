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
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.FOLDER(id), { method: 'DELETE' }),
		onSuccess: () => {
			refresh();
			showToast('폴더를 지웠어요. 안의 것들은 폴더 없음으로 옮겼어요.', 'success');
		},
		onError: fail,
	});
	return { create, rename, remove };
}
