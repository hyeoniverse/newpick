import { StoryImageService, pexelsSized } from './story-images';
import { CATEGORY_FALLBACK_QUERY, FallbackImagesService, pexelsImageIn } from './fallback-images.service';

const saved = process.env.PEXELS_API_KEY;
afterEach(() => {
	if (saved === undefined) delete process.env.PEXELS_API_KEY;
	else process.env.PEXELS_API_KEY = saved;
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const photo = (id: number) => ({
	photos: [{ src: { original: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg` } }],
});

describe('pexelsSized · pexelsImageIn', () => {
	it('Pexels가 직접 줄인 크기(가로 800 · 16:9)로, 원래 붙은 크기 값은 버린다', () => {
		expect(pexelsSized('https://images.pexels.com/photos/1/a.jpeg?auto=compress&w=1200')).toBe(
			'https://images.pexels.com/photos/1/a.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=450',
		);
	});

	it('본문에 이미 들어간 Pexels 사진을 찾는다 (없으면 없음)', () => {
		const html = '<img src="https://img/hero.jpg"><img src="https://images.pexels.com/photos/7/b.jpeg?h=627">';
		expect(pexelsImageIn(html)).toBe(pexelsSized('https://images.pexels.com/photos/7/b.jpeg'));
		expect(pexelsImageIn('<img src="https://img/hero.jpg">')).toBeUndefined();
		expect(pexelsImageIn(null)).toBeUndefined();
	});
});

describe('StoryImageService.fallbackImage', () => {
	it('검색어 · 몇 번째 사진으로 Pexels를 찾고, 줄인 크기 주소를 돌려준다', async () => {
		process.env.PEXELS_API_KEY = 'pexels-key';
		const service = new StoryImageService();
		const fetcher = jest.fn(async () => json(photo(5)));
		service.fetcher = fetcher;

		await expect(service.fallbackImage('ballot box', 3)).resolves.toBe(
			pexelsSized('https://images.pexels.com/photos/5/pexels-photo-5.jpeg'),
		);
		const url = new URL(String((fetcher.mock.calls[0] as unknown[])[0]));
		expect(url.searchParams.get('query')).toBe('ballot box');
		expect(url.searchParams.get('page')).toBe('3');
	});

	it('키가 없으면 검색하지 않는다', async () => {
		delete process.env.PEXELS_API_KEY;
		const service = new StoryImageService();
		service.fetcher = jest.fn();
		await expect(service.fallbackImage('ballot box')).resolves.toBeUndefined();
		expect(service.fetcher).not.toHaveBeenCalled();
	});
});

describe('FallbackImagesService', () => {
	const setup = (rows: Array<{ id: number; categoryId: number; contentAsHTML: string | null }>) => {
		const prisma = {
			newsletter: {
				findMany: jest.fn().mockResolvedValue(rows),
				update: jest.fn().mockResolvedValue({}),
			},
		};
		const images = { fallbackImage: jest.fn() };
		const service = new FallbackImagesService(prisma as never, images as never);
		return { service, prisma, images };
	};

	it('발행할 때: 사진 검색어로 찾고, 실패하면 null (뉴스레터 발행은 계속)', async () => {
		const { service, images } = setup([]);
		images.fallbackImage.mockResolvedValueOnce('https://p/1').mockRejectedValueOnce(new Error('Pexels 429'));
		await expect(service.forNewsletter('stock market screen')).resolves.toBe('https://p/1');
		await expect(service.forNewsletter('stock market screen')).resolves.toBeNull();
		await expect(service.forNewsletter(undefined)).resolves.toBeNull();
	});

	it('비어 있는 뉴스레터를 최근 것부터: 본문 속 Pexels 사진이 있으면 그것, 없으면 분야 검색어로', async () => {
		const { service, prisma, images } = setup([
			{ id: 30, categoryId: 3, contentAsHTML: '<img src="https://images.pexels.com/photos/9/c.jpeg?h=627">' },
			{ id: 17, categoryId: 2, contentAsHTML: '<img src="https://img/hero.jpg">' },
		]);
		images.fallbackImage.mockResolvedValue('https://p/parliament');

		await expect(service.fillMissing(20)).resolves.toBe(2);
		expect(prisma.newsletter.findMany.mock.calls[0][0]).toMatchObject({
			where: { fallbackImageUrl: null },
			orderBy: { createdAt: 'desc' },
			take: 20,
		});
		// 30: 본문의 Pexels 사진 (검색하지 않음)
		expect(prisma.newsletter.update).toHaveBeenNthCalledWith(1, {
			where: { id: 30 },
			data: { fallbackImageUrl: pexelsSized('https://images.pexels.com/photos/9/c.jpeg') },
		});
		// 17: 정치 검색어, 같은 분야끼리 겹치지 않게 id로 몇 번째 사진인지
		expect(images.fallbackImage).toHaveBeenCalledWith(CATEGORY_FALLBACK_QUERY[2], (17 % 15) + 1);
		expect(prisma.newsletter.update).toHaveBeenNthCalledWith(2, {
			where: { id: 17 },
			data: { fallbackImageUrl: 'https://p/parliament' },
		});
	});

	it('검색이 실패하면(한도 초과 등) 이번에는 멈추고 다음 시간에', async () => {
		const { service, prisma, images } = setup([
			{ id: 3, categoryId: 1, contentAsHTML: null },
			{ id: 2, categoryId: 1, contentAsHTML: null },
		]);
		images.fallbackImage.mockRejectedValue(new Error('Pexels 429'));
		await expect(service.fillMissing()).resolves.toBe(0);
		expect(images.fallbackImage).toHaveBeenCalledTimes(1);
		expect(prisma.newsletter.update).not.toHaveBeenCalled();
	});
});
