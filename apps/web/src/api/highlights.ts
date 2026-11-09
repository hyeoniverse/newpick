import type { Highlight, HighlightPage, MyTaste } from '@newpick/shared';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';

/** 스크랩 · 메모 (#123) · 내 취향 */

/** 내 스크랩. newsletterId를 주면 그 뉴스레터 것만 */
export const fetchHighlights = (newsletterId?: number) =>
	apiFetch<Highlight[]>(API_ENDPOINTS.MY.HIGHLIGHTS(newsletterId));
/** 스크랩 한 쪽. filters: 'folder=none&filter=starred' 같은 쿼리 */
export const fetchHighlightPage = (offset: number, limit: number, filters = '') =>
	apiFetch<HighlightPage>(
		API_ENDPOINTS.MY.HIGHLIGHTS_PAGE(`offset=${offset}&limit=${limit}${filters ? `&${filters}` : ''}`),
	);
/** 스크랩 수만 (한 개짜리 쪽) */
export const fetchHighlightCount = () =>
	apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.HIGHLIGHTS_PAGE('limit=1'));

export const createHighlight = (body: { newsletterId: number; section?: string; text: string; note?: string }) =>
	apiFetch<Highlight>(API_ENDPOINTS.MY.HIGHLIGHTS(), { method: 'POST', body });
/** 메모 고치기 · 중요 표시 (준 것만) */
export const updateHighlight = (id: number, body: { note?: string; starred?: boolean }) =>
	apiFetch<Highlight>(API_ENDPOINTS.MY.HIGHLIGHT(id), { method: 'PATCH', body });
export const deleteHighlight = (id: number) => apiFetch(API_ENDPOINTS.MY.HIGHLIGHT(id), { method: 'DELETE' });
export const deleteHighlights = (ids: number[]) =>
	apiFetch<{ count: number }>(API_ENDPOINTS.MY.HIGHLIGHTS_DELETE(), { method: 'POST', body: { ids } });
/** 한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 해제 */
export const bulkHighlights = (body: { ids: number[]; action: 'move' | 'star' | 'unstar'; folderId?: number | null }) =>
	apiFetch<{ count: number }>(API_ENDPOINTS.MY.HIGHLIGHTS_BULK(), { method: 'POST', body });

export const fetchTaste = () => apiFetch<MyTaste>(API_ENDPOINTS.MY.TASTE());
