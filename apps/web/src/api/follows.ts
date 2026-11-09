import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';

/** 지켜보기 (#118): 소식 하나를 지켜보고, 이어진 새 소식을 받는다 */
/** 지켜보는 소식에 이어진 새 소식 (하루 한 번 판정) */
export interface FollowUpdate {
	id: number;
	heading: string;
	/** 무엇이 새로 나왔는지 한 줄 (판정을 못 한 날은 빈 문자열) */
	reason: string;
	storyIndex: number;
	createdAt: string;
	seenAt: string | null;
	newsletter: { id: number; createdAt: string; category: { name: string } };
}

export interface StoryFollow {
	id: number;
	heading: string;
	storyIndex: number;
	createdAt: string;
	newsletter: { id: number; createdAt: string; category: { name: string } };
	updates: FollowUpdate[];
	/** 오래(30일) 후속이 없어 정리할지 묻는 것 */
	quiet: boolean;
}

/** 뉴스레터 상세: 이 뉴스레터의 소식 가운데 내가 지켜보던 소식의 후속 */
export interface FollowUpdateIn {
	id: number;
	storyIndex: number;
	seenAt: string | null;
	follow: { heading: string; newsletter: { id: number; createdAt: string } };
}

/** 뉴스레터 상세: 이 뉴스레터에서 지켜보는 소식 (단추 상태) */
export interface NewsletterFollow {
	id: number;
	storyIndex: number;
	_count: { updates: number };
}

export const fetchFollows = () => apiFetch<StoryFollow[]>(API_ENDPOINTS.MY.FOLLOWS());
export const fetchUnseenFollowCount = () =>
	apiFetch<{ count: number }>(API_ENDPOINTS.MY.FOLLOWS_UNSEEN()).then((r) => r.count);
export const fetchNewsletterFollows = (newsletterId: number) =>
	apiFetch<NewsletterFollow[]>(API_ENDPOINTS.MY.FOLLOWS_OF(newsletterId));
export const fetchFollowUpdatesIn = (newsletterId: number) =>
	apiFetch<FollowUpdateIn[]>(API_ENDPOINTS.MY.FOLLOW_UPDATES_IN(newsletterId));

export const followStory = (body: { newsletterId: number; storyIndex: number }) =>
	apiFetch(API_ENDPOINTS.MY.FOLLOWS(), { method: 'POST', body });
export const unfollowStory = (id: number) => apiFetch(API_ENDPOINTS.MY.FOLLOW(id), { method: 'DELETE' });
/** 본 후속 표시. newsletterId를 주면 그 뉴스레터 상세에서 본 것만 */
export const markFollowsSeen = (newsletterId?: number) =>
	apiFetch(API_ENDPOINTS.MY.FOLLOWS_SEEN(), { method: 'POST', body: newsletterId ? { newsletterId } : {} });
/** 오래 조용한 소식을 계속 지켜보기 */
export const keepFollow = (id: number) => apiFetch(API_ENDPOINTS.MY.FOLLOW_KEEP(id), { method: 'POST' });
