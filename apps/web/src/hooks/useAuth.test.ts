import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { clearAccountQueries } from '@/hooks/useAuth';

describe('clearAccountQueries (로그아웃 · 탈퇴)', () => {
	it('계정별 결과는 모두 지우고 공개 결과만 남긴다', () => {
		const client = new QueryClient();
		const personal = [
			['user'],
			['follows', 1],
			['tag-follows'],
			['login-sessions'],
			['personal-mail'],
			['myMail', 3],
			['adminStats', 'x'],
		];
		const shared = [['articleList', 20, 0], ['articleContent', 'slug'], ['trends'], ['allKeywords', 0]];
		for (const key of [...personal, ...shared]) client.setQueryData(key, 'data');

		clearAccountQueries(client);

		for (const key of personal) expect(client.getQueryData(key)).toBeUndefined();
		for (const key of shared) expect(client.getQueryData(key)).toBe('data');
	});
});
