import { Controller, Get, Query, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from 'src/auth/decorators/auth.decorators';
import { AppException } from 'src/common/errors/app.exception';
import { ImagesService } from './images.service';

/**
 * 사진 줄이기: GET /images/i.webp?url=…&w=…&q=… (웹 next/image의 loader가 부른다, utils/imageLoader.ts).
 * 주소 끝이 .webp라 Cloudflare가 기본 설정으로 가장자리에서 캐시한다(확장자가 없는 /images?…는 캐시하지 않아 매번
 * Tunnel을 거쳐 이 서버까지 와서, 사진 하나가 0.3 ~ 3.8초씩 흔들렸다). 쿼리도 캐시 키에 들어가 사진마다 따로 캐시된다.
 * 예전 주소 /images?…도 그대로 받는다 (웹이 먼저 배포돼도 깨지지 않게).
 * 화면 한 장에 사진이 수십 장이라 요청 제한에서 뺀다. 대신 받을 수 있는 출처 · 폭이 정해져 있다(ImagesService)
 */
@Controller('images')
export class ImagesController {
	constructor(private readonly images: ImagesService) {}

	@Public()
	@SkipThrottle()
	@Get('i.webp')
	async get(@Query('url') url: string, @Query('w') w: string, @Query('q') q: string, @Res() res: Response) {
		if (!url) throw new AppException('BAD_REQUEST', '사진 주소(url)가 필요합니다.');
		const { body, contentType } = await this.images.resize(url, Number(w), Number(q ?? 75));
		// 같은 주소 · 폭 · 품질이면 언제나 같은 사진이라 1년 동안 다시 받지 않게. 실패(404 등)에는 붙이지 않는다:
		// 원본이 잠깐 안 될 때 그 실패가 오래 남지 않게
		res.set('Cache-Control', 'public, max-age=31536000, immutable').type(contentType).send(body);
	}

	/** 예전 주소 /images?… (웹이 /images/i.webp로 바꾸기 전 배포와 그 사이 브라우저 캐시용) */
	@Public()
	@SkipThrottle()
	@Get()
	legacy(@Query('url') url: string, @Query('w') w: string, @Query('q') q: string, @Res() res: Response) {
		return this.get(url, w, q, res);
	}
}
