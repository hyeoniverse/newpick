import { queryKeys } from '@/api/queryKeys';
import type { Folder } from '@newpick/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { createFolder, deleteFolder, fetchFolders, renameFolder, type FolderContents } from '@/api/folders';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 폴더 (#123): 스크랩 · 북마크 · 받은 메일이 같이 쓰는 주제 폴더. 폴더마다 탭별 개수 */
/** 폴더 (@newpick/shared, api 응답과 같다) */
export type { Folder };

export type { FolderContents };

const REMOVED: Record<FolderContents, string> = {
	keep: '폴더를 지웠습니다. 안의 것들은 폴더 없음으로 남겼습니다.',
	delete: '폴더와 안의 것들을 지웠습니다.',
	move: '폴더를 지우고 안의 것들을 옮겼습니다.',
};

/** 폴더 안의 것들이 바뀌면 다시 불러올 목록들 */
export const FOLDER_CONTENT_KEYS = [
	queryKeys.folders.all,
	queryKeys.highlights.all,
	queryKeys.bookmarks.all,
	queryKeys.mails.all,
];

export function useFolders() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.folders.list(user?.id),
		queryFn: fetchFolders,
		enabled: !!user,
	});
}

/** 폴더 만들기 · 이름 바꾸기 · 지우기 */
export function useFolderMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => FOLDER_CONTENT_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
	const fail = (error: Error) =>
		showToast(errorMessage(error, '저장하지 못했습니다. 잠시 뒤 다시 시도해 주십시오.'), 'error');

	const create = useMutation({
		mutationFn: (name: string) => createFolder(name),
		onSuccess: () => refresh(),
		onError: fail,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: number; name: string }) => renameFolder(id, name),
		onSuccess: () => {
			refresh();
			showToast('폴더 이름을 바꿨습니다.', 'success');
		},
		onError: fail,
	});
	const remove = useMutation({
		mutationFn: ({ id, contents, to }: { id: number; contents: FolderContents; to?: number }) =>
			deleteFolder(id, contents, to),
		onSuccess: (_, { contents }) => {
			refresh();
			// 북마크를 지웠으면 취향 점수도 바뀐다
			if (contents === 'delete') queryClient.invalidateQueries({ queryKey: queryKeys.taste.all });
			showToast(REMOVED[contents], 'success');
		},
		onError: fail,
	});
	return { create, rename, remove };
}
