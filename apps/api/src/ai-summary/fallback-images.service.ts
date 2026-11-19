import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { errorMessage } from 'src/common/error-message';
import { StoryImageService, pexelsSized } from './story-images';

/**
 * 분야별 대체 사진 검색어 (영어, 사람이 나오지 않는 사물 · 풍경). 소식의 imageQuery가 없는 이전 뉴스레터에 쓴다.
 * 한국어 키워드로 찾으면 '코스피' → 해변처럼 엉뚱한 사진이 나와 영어로 둔다
 */
export const CATEGORY_FALLBACK_QUERY: Record<number, string> = {
	1: 'technology circuit board',
	2: 'parliament building',
	3: 'stock market screen',
	4: 'city street at night',
	5: 'cozy home interior',
	6: 'world map globe',
};

/** 한 번에 채우는 수: Pexels 시간당 200회 한도 안에서, 매시 수집 뒤 조금씩 */
export const FILL_PER_RUN = 20;

/** 본문 HTML에 이미 들어간 Pexels 사진 (소식 사진, #49). 있으면 검색하지 않고 쓴다 */
export function pexelsImageIn(html: string | null): string | undefined {
	const match = html?.match(/https:\/\/images\.pexels\.com\/photos\/[^"'\s)]+/);
	return match ? pexelsSized(match[0]) : undefined;
}

/**
 * 뉴스레터 대체 사진 채우기. 발행할 때 찾지 못했거나(검색 실패 · 키 없음) 이 칸이 생기기 전에 발행된 뉴스레터를
 * 매시 수집 뒤 최근 것부터 조금씩 채운다. 실패해도 수집 작업에는 영향이 없다
 */
@Injectable()
export class FallbackImagesService {
	private readonly logger = new Logger(FallbackImagesService.name);

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly images: StoryImageService,
	) {}

	/** 발행할 때: 첫 소식의 사진 검색어로. 못 찾으면 null (매시 채우기가 다시 시도) */
	async forNewsletter(imageQuery: string | undefined): Promise<string | null> {
		if (!imageQuery) return null;
		try {
			return (await this.images.fallbackImage(imageQuery)) ?? null;
		} catch (error) {
			this.logger.warn(`대체 사진 검색 실패 (${imageQuery}): ${errorMessage(error)}`);
			return null;
		}
	}

	/** 비어 있는 뉴스레터를 최근 것부터 limit편 채운다. 채운 수를 돌려준다 */
	async fillMissing(limit = FILL_PER_RUN): Promise<number> {
		const targets = await this.prisma.newsletter.findMany({
			where: { fallbackImageUrl: null },
			select: { id: true, categoryId: true, contentAsHTML: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});
		let filled = 0;
		for (const { id, categoryId, contentAsHTML } of targets) {
			try {
				// 같은 분야끼리 같은 사진이 되지 않게 id로 검색 결과의 몇 번째 사진인지 바꾼다
				const url =
					pexelsImageIn(contentAsHTML) ??
					(await this.images.fallbackImage(CATEGORY_FALLBACK_QUERY[categoryId] ?? 'newspaper', (id % 15) + 1));
				if (!url) continue;
				await this.prisma.newsletter.update({ where: { id }, data: { fallbackImageUrl: url } });
				filled++;
			} catch (error) {
				// 한도 초과 등: 이번에는 멈추고 다음 시간에
				this.logger.warn(`대체 사진 채우기 멈춤 (뉴스레터 ${id}): ${errorMessage(error)}`);
				break;
			}
		}
		if (filled) this.logger.log(`대체 사진 ${filled}편 채움`);
		return filled;
	}
}
