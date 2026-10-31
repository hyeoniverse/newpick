import { API_ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/api/client';

/** 팔로우한 태그 (#123): 맞춤 메일에서 이 태그가 나온 소식을 앞에, 추천 기사에서 제목에 나온 기사를 챙긴다 */
export interface TagFollow {
	tag: string;
	createdAt: string;
}

export const fetchTagFollows = () => apiFetch<TagFollow[]>(API_ENDPOINTS.MY.TAG_FOLLOWS());

/** 팔로우: 돌려주는 태그는 뉴스레터 태그 표기에 맞춘 것 */
export const followTag = (tag: string) =>
	apiFetch<{ tag: string }>(API_ENDPOINTS.MY.TAG_FOLLOWS(), { method: 'POST', body: { tag } });

export const unfollowTag = (tag: string) =>
	apiFetch<{ tag: string }>(API_ENDPOINTS.MY.TAG_FOLLOW(tag), { method: 'DELETE' });
