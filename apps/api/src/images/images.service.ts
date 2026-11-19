import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { env } from 'src/config/env';
import { AppException } from 'src/common/errors/app.exception';
import { errorMessage } from 'src/common/error-message';

/**
 * 받을 수 있는 사진 출처 (web next.config.ts의 images.remotePatterns와 같게).
 * 아무 주소나 대신 받아 주는 통로(SSRF)가 되지 않게, 이 밖의 주소는 받지 않는다
 */
export const ALLOWED_HOSTS = new Set([
	'imgnews.pstatic.net',
	'images.pexels.com',
	'images.unsplash.com',
	'lh3.googleusercontent.com',
	'avatars.githubusercontent.com',
	'picsum.photos',
]);

/** 줄일 수 있는 폭: Next의 기본 deviceSizes + imageSizes. 이 밖은 받지 않아 캐시가 끝없이 늘지 않는다 */
export const ALLOWED_WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);

/** 원본 크기 상한 · 받기 시간 제한 */
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

export type ResizedImage = { body: Buffer; contentType: string };

type Fetch = typeof fetch;

/**
 * 사진 줄이기 (Vercel 사진 최적화 대신). 받은 사진을 폭 w로 줄여 WebP로 바꾸고 디스크에 캐시한다.
 * 운영 /_next/image가 Vercel 무료 한도를 넘어 402로 실패해, 사진을 api 서버에서 직접 줄인다
 */
@Injectable()
export class ImagesService {
	private readonly logger = new Logger(ImagesService.name);
	/** 시험에서 바꿔 끼울 수 있게 */
	fetcher: Fetch = (input, init) => fetch(input, init);

	constructor() {
		// 작은 서버(Oracle 무료 VM)에서 사진 여러 장을 동시에 줄일 때 메모리가 튀지 않게
		sharp.concurrency(1);
		sharp.cache(false);
	}

	/** 우리 사이트 사진(/img/…)은 웹 주소로, 바깥 사진은 허용한 곳만. 안 되면 400 */
	sourceUrl(url: string): URL {
		let parsed: URL;
		try {
			parsed = url.startsWith('/') ? new URL(url, env.frontendUrl || 'http://localhost:3000') : new URL(url);
		} catch {
			throw new AppException('BAD_REQUEST', '사진 주소가 올바르지 않습니다.');
		}
		const own = env.frontendUrl && parsed.origin === new URL(env.frontendUrl).origin;
		if (parsed.protocol !== 'https:' && !own) throw new AppException('BAD_REQUEST', 'https 사진만 받습니다.');
		if (!own && !ALLOWED_HOSTS.has(parsed.hostname))
			throw new AppException('BAD_REQUEST', '허용하지 않은 사진 출처입니다.');
		return parsed;
	}

	async resize(url: string, width: number, quality: number): Promise<ResizedImage> {
		if (!ALLOWED_WIDTHS.has(width)) throw new AppException('BAD_REQUEST', '지원하지 않는 사진 폭입니다.');
		const q = Math.min(100, Math.max(1, Math.round(quality) || 75));
		const source = this.sourceUrl(url);
		const file = join(
			env.imageCacheDir,
			`${createHash('sha1').update(`${source.href}|${width}|${q}`).digest('hex')}.webp`,
		);

		const cached = await readFile(file).catch(() => null);
		if (cached) return { body: cached, contentType: 'image/webp' };

		const original = await this.download(source);
		const body = await sharp(original, { failOn: 'none' })
			.rotate()
			.resize({ width, withoutEnlargement: true })
			.webp({ quality: q })
			.toBuffer()
			.catch((error) => {
				throw new AppException('BAD_REQUEST', `사진을 줄이지 못했습니다: ${errorMessage(error)}`);
			});
		await this.save(file, body);
		return { body, contentType: 'image/webp' };
	}

	/** 원본 받기. 원본이 없으면(지워진 기사 사진) 404: 웹이 대신할 사진으로 넘어간다 */
	private async download(source: URL): Promise<Buffer> {
		const res = await this.fetcher(source.href, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch((error) => {
			throw new AppException('NOT_FOUND', `사진을 받지 못했습니다: ${errorMessage(error)}`);
		});
		// 리디렉션을 따라간 끝 주소도 허용한 곳이어야 한다 (허용한 곳을 거쳐 내부 주소로 가지 않게)
		if (res.url && res.url !== source.href) this.sourceUrl(res.url);
		if (!res.ok) throw new AppException('NOT_FOUND', `사진 원본 ${res.status}`);
		if (!res.headers.get('content-type')?.startsWith('image/')) throw new AppException('NOT_FOUND', '사진이 아닙니다.');
		if (Number(res.headers.get('content-length') ?? 0) > MAX_SOURCE_BYTES) {
			throw new AppException('BAD_REQUEST', '사진 원본이 너무 큽니다.');
		}
		const body = Buffer.from(await res.arrayBuffer());
		if (body.length > MAX_SOURCE_BYTES) throw new AppException('BAD_REQUEST', '사진 원본이 너무 큽니다.');
		return body;
	}

	/** 캐시에 쓰기. 다른 요청이 반쯤 쓴 파일을 읽지 않게 임시 파일에 쓰고 이름을 바꾼다. 실패해도 응답은 그대로 */
	private async save(file: string, body: Buffer) {
		try {
			await mkdir(env.imageCacheDir, { recursive: true });
			const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
			await writeFile(tmp, body);
			await rename(tmp, file);
		} catch (error) {
			this.logger.warn(`사진 캐시 쓰기 실패: ${errorMessage(error)}`);
		}
	}
}
