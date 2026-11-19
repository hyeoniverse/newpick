import { Controller, Get, Query, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from 'src/auth/decorators/auth.decorators';
import { AppException } from 'src/common/errors/app.exception';
import { ImagesService } from './images.service';

/**
 * 사진 줄이기: GET /images?url=…&w=…&q=… (웹 next/image의 loader가 부른다, utils/imageLoader.ts).
 * 화면 한 장에 사진이 수십 장이라 요청 제한에서 뺀다. 대신 받을 수 있는 출처 · 폭이 정해져 있다(ImagesService)
 */
@Controller('images')
export class ImagesController {
	constructor(private readonly images: ImagesService) {}

	@Public()
	@SkipThrottle()
	@Get()
	async get(@Query('url') url: string, @Query('w') w: string, @Query('q') q: string, @Res() res: Response) {
		if (!url) throw new AppException('BAD_REQUEST', '사진 주소(url)가 필요합니다.');
		const { body, contentType } = await this.images.resize(url, Number(w), Number(q ?? 75));
		// 같은 주소 · 폭 · 품질이면 언제나 같은 사진이라 1년 동안 다시 받지 않게. 실패(404 등)에는 붙이지 않는다:
		// 원본이 잠깐 안 될 때 그 실패가 오래 남지 않게
		res.set('Cache-Control', 'public, max-age=31536000, immutable').type(contentType).send(body);
	}
}
