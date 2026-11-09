import type { Folder } from '@newpick/shared';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';

/** 폴더 (#123): 스크랩 · 북마크 · 받은 메일이 같이 쓰는 주제 폴더 */

/** 폴더를 지울 때 안의 것들: 폴더 없음으로 남기기 · 같이 지우기 · 다른 폴더로 옮기기 */
export type FolderContents = 'keep' | 'delete' | 'move';

export const fetchFolders = () => apiFetch<Folder[]>(API_ENDPOINTS.MY.FOLDERS());
export const createFolder = (name: string) =>
	apiFetch<{ id: number; name: string }>(API_ENDPOINTS.MY.FOLDERS(), { method: 'POST', body: { name } });
export const renameFolder = (id: number, name: string) =>
	apiFetch(API_ENDPOINTS.MY.FOLDER(id), { method: 'PATCH', body: { name } });
/** to: contents가 'move'일 때 옮겨 갈 폴더 */
export const deleteFolder = (id: number, contents: FolderContents, to?: number) =>
	apiFetch(API_ENDPOINTS.MY.FOLDER(id, new URLSearchParams({ contents, ...(to && { to: String(to) }) }).toString()), {
		method: 'DELETE',
	});
