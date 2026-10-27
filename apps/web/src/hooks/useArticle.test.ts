import { describe, expect, it, vi } from 'vitest';
import { getRelatedNews } from '@/hooks/useArticle';
import { fetchRelatedNews } from '@/api/article';
import { ApiError } from '@/api/client';
import { NewsInfo } from '@/models/article.model';

vi.mock('@/api/article', () => ({ fetchRelatedNews: vi.fn() }));

const news = (link: string) => ({ link, title: link }) as unknown as NewsInfo;

describe('getRelatedNews', () => {
	// E2E에서 발견: 원문 하나가 404면 관련 뉴스가 모두 사라지고 처리되지 않은 오류가 남았다
	it('찾지 못한 원문은 빼고 나머지를 순서대로 돌려준다', async () => {
		vi.mocked(fetchRelatedNews).mockImplementation(async (link) => {
			if (link === 'https://n.news/deleted') throw new ApiError(404, 'Not Found');
			return news(link);
		});

		await expect(getRelatedNews(['https://n.news/a', 'https://n.news/deleted', 'https://n.news/b'])).resolves.toEqual([
			news('https://n.news/a'),
			news('https://n.news/b'),
		]);
	});

	it('모두 없으면 빈 배열 (오류를 던지지 않음)', async () => {
		vi.mocked(fetchRelatedNews).mockRejectedValue(new ApiError(404, 'Not Found'));

		await expect(getRelatedNews(['https://n.news/a'])).resolves.toEqual([]);
	});

	// 스크롤마다 다시 요청하던 때 요청 제한(429)에 걸려 빈 목록이 캐시되고 카드가 사라졌다
	it('모두 실패했고 404가 아닌 실패가 있으면 오류를 던져 다시 시도하게 한다', async () => {
		vi.mocked(fetchRelatedNews).mockRejectedValue(new ApiError(429, 'Too Many Requests'));

		await expect(getRelatedNews(['https://n.news/a', 'https://n.news/b'])).rejects.toMatchObject({ status: 429 });
	});
});
