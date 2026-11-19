import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

/** 사진 줄이기 (Vercel 사진 최적화 대신) */
@Module({
	controllers: [ImagesController],
	providers: [ImagesService],
})
export class ImagesModule {}
