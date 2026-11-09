import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/queryKeys';
import { clearAccountQueries } from '@/hooks/useAuth';

describe('clearAccountQueries (로그아웃 · 탈퇴)', () => {
	it('계정별 결과는 모두 지우고 공개 결과만 남긴다 (열쇠는 queryKeys에서)', () => {
		const client = new QueryClient();
		const personal = [
			queryKeys.user,
			queryKeys.follows.list(1),
			queryKeys.tagFollows,
			queryKeys.loginSessions,
			queryKeys.personalMail,
			queryKeys.mails.one('2026-11-09'),
			queryKeys.bookmarks.page(1, ''),
			queryKeys.highlights.list(1),
			queryKeys.taste.mine(1),
			queryKeys.folders.list(1),
			queryKeys.subscription.status,
			queryKeys.admin.stats('cost', 'x'),
			queryKeys.admin.newsletter(3),
		];
		// 공개 결과: 열쇠 뿌리 이름을 바꾸면 useAuth의 PUBLIC_QUERY_ROOTS도 같이 바꿔야 한다
		const shared = [
			queryKeys.articles.list(20, 0),
			queryKeys.articles.content('slug'),
			queryKeys.articles.popular(5, 0),
			queryKeys.articles.related('a,b'),
			queryKeys.keywords.byCategory(0),
			queryKeys.keywords.popular(1),
			queryKeys.trends,
		];
		for (const key of [...personal, ...shared]) client.setQueryData(key, 'data');

		clearAccountQueries(client);

		for (const key of personal) expect(client.getQueryData(key)).toBeUndefined();
		for (const key of shared) expect(client.getQueryData(key)).toBe('data');
	});
});
