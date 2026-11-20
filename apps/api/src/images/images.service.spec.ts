import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { AppException } from 'src/common/errors/app.exception';
import { ImagesService } from './images.service';

const keys = ['IMAGE_CACHE_DIR', 'FRONTEND_URL'] as const;
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
let dir: string;

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'newpick-images-'));
	process.env.IMAGE_CACHE_DIR = dir;
	process.env.FRONTEND_URL = 'https://newpick.hyeoniverse.com';
});
afterEach(async () => {
	for (const k of keys) {
		if (saved[k] === undefined) delete process.env[k];
		else process.env[k] = saved[k];
	}
	await rm(dir, { recursive: true, force: true });
});

/** 1200×700 JPEG 원본 */
const original = () =>
	sharp({ create: { width: 1200, height: 700, channels: 3, background: '#3610e1' } })
		.jpeg()
		.toBuffer();
const imageResponse = async () =>
	new Response(new Uint8Array(await original()), { status: 200, headers: { 'content-type': 'image/jpeg' } });

const NAVER = 'https://imgnews.pstatic.net/image/032/2026/11/18/a.jpg?type=w860';

const codeOf = async (promise: Promise<unknown>) => {
	try {
		await promise;
		return 'ok';
	} catch (error) {
		return error instanceof AppException ? error.code : String(error);
	}
};

describe('ImagesService', () => {
	it('폭 w로 줄여 WebP로 바꾸고, 두 번째부터는 캐시에서 (원본을 다시 받지 않음)', async () => {
		const service = new ImagesService();
		const fetcher = jest.fn(imageResponse);
		service.fetcher = fetcher as never;

		const first = await service.resize(NAVER, 256, 75);
		expect(first.contentType).toBe('image/webp');
		const meta = await sharp(first.body).metadata();
		expect([meta.format, meta.width, meta.height]).toEqual(['webp', 256, 149]);

		const second = await service.resize(NAVER, 256, 75);
		expect(second.body.equals(first.body)).toBe(true);
		expect(fetcher).toHaveBeenCalledTimes(1);
		// 반쯤 쓴 임시 파일은 남지 않는다
		expect((await readdir(dir)).filter((f) => f.endsWith('.tmp'))).toEqual([]);
	});

	it('원본보다 크게 늘리지 않는다', async () => {
		const service = new ImagesService();
		service.fetcher = jest.fn(imageResponse) as never;
		const { body } = await service.resize(NAVER, 1920, 75);
		expect((await sharp(body).metadata()).width).toBe(1200);
	});

	it('우리 사이트 사진(/img/…)은 웹 주소에서 받는다', async () => {
		const service = new ImagesService();
		const fetcher = jest.fn(imageResponse);
		service.fetcher = fetcher as never;
		await service.resize('/img/category_all.jpg', 640, 75);
		expect((fetcher.mock.calls[0] as unknown[])[0]).toBe('https://newpick.hyeoniverse.com/img/category_all.jpg');
	});

	it('허용하지 않은 출처 · http · 정해지지 않은 폭은 받지 않는다 (SSRF · 캐시가 끝없이 늘지 않게)', async () => {
		const service = new ImagesService();
		service.fetcher = jest.fn(imageResponse) as never;
		expect(await codeOf(service.resize('https://evil.example.com/a.jpg', 256, 75))).toBe('BAD_REQUEST');
		expect(await codeOf(service.resize('http://imgnews.pstatic.net/a.jpg', 256, 75))).toBe('BAD_REQUEST');
		expect(await codeOf(service.resize('http://169.254.169.254/latest', 256, 75))).toBe('BAD_REQUEST');
		expect(await codeOf(service.resize(NAVER, 300, 75))).toBe('BAD_REQUEST');
		expect(service.fetcher).not.toHaveBeenCalled();
	});

	it('리디렉션은 직접 따라가고, 다음 주소가 허용하지 않은 곳이면 그 주소로는 요청하지 않는다 (SSRF)', async () => {
		const service = new ImagesService();
		const fetcher = jest.fn(async (url: string) =>
			url === NAVER
				? new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } })
				: imageResponse(),
		);
		service.fetcher = fetcher as never;
		expect(await codeOf(service.resize(NAVER, 256, 75))).toBe('BAD_REQUEST');
		// 내부 주소로는 한 번도 요청하지 않았다 (예전에는 fetch가 따라간 뒤에 거절)
		expect(fetcher.mock.calls.map((call) => call[0])).toEqual([NAVER]);
		expect((fetcher.mock.calls[0] as unknown[])[1]).toMatchObject({ redirect: 'manual' });
	});

	it('허용한 출처 사이의 리디렉션은 따라가 받는다 (상대 주소도)', async () => {
		const service = new ImagesService();
		const next = 'https://imgnews.pstatic.net/image/032/2026/11/18/b.jpg';
		const fetcher = jest.fn(async (url: string) =>
			url === NAVER
				? new Response(null, { status: 301, headers: { location: '/image/032/2026/11/18/b.jpg' } })
				: imageResponse(),
		);
		service.fetcher = fetcher as never;
		expect(await codeOf(service.resize(NAVER, 256, 75))).toBe('ok');
		expect(fetcher.mock.calls.map((call) => call[0])).toEqual([NAVER, next]);
	});

	it('리디렉션이 너무 많으면 멈춘다 (끝없이 돌지 않게)', async () => {
		const service = new ImagesService();
		const fetcher = jest.fn(async () => new Response(null, { status: 302, headers: { location: NAVER } }));
		service.fetcher = fetcher as never;
		expect(await codeOf(service.resize(NAVER, 256, 75))).toBe('BAD_REQUEST');
		expect(fetcher).toHaveBeenCalledTimes(4);
	});

	it('원본이 없거나(지워진 기사 사진) 사진이 아니면 404: 웹이 대신할 사진으로 넘어간다', async () => {
		const service = new ImagesService();
		service.fetcher = jest.fn(async () => new Response('', { status: 404 })) as never;
		expect(await codeOf(service.resize(NAVER, 256, 75))).toBe('NOT_FOUND');
		service.fetcher = jest.fn(
			async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }),
		) as never;
		expect(await codeOf(service.resize(NAVER, 256, 75))).toBe('NOT_FOUND');
		// 실패는 캐시에 남기지 않는다
		expect(await readdir(dir).catch(() => [])).toEqual([]);
	});
});
