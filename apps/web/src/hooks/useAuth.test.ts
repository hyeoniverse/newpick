import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/queryKeys';
import { ApiError } from '@/api/client';
import { clearAccountQueries, endsSession } from '@/hooks/useAuth';

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

describe('endsSession: 로그아웃 상태로 바꿀 실패인가 (#340)', () => {
	it('토큰 갱신까지 실패(401)했거나 탈퇴한 계정이면 끝', () => {
		expect(endsSession(new ApiError(401, 'Unauthorized'))).toBe(true);
		expect(endsSession(new ApiError(404, '회원 정보를 찾을 수 없습니다.', { code: 'USER_NOT_FOUND' }))).toBe(true);
	});

	it('api 장애 · 네트워크 오류는 끝이 아니다 (로그인 상태를 지우지 않음)', () => {
		expect(endsSession(new ApiError(503, 'Service Unavailable'))).toBe(false);
		expect(endsSession(new ApiError(500, 'Internal Server Error'))).toBe(false);
		expect(endsSession(new TypeError('Failed to fetch'))).toBe(false);
	});
});
