import type { ImageLoaderProps } from 'next/image';
import { IMAGE_URL } from '@/constants/api';

/**
 * next/image의 사진 줄이기를 Vercel(/_next/image) 대신 api 서버(GET /images)에서 한다.
 * Vercel 무료 사진 최적화 한도를 넘어 운영 사진이 402로 깨졌다. api는 받을 수 있는 출처 · 폭이 정해져 있고
 * 줄인 사진을 디스크에 캐시한다. 우리 사이트 사진(/img/…)은 api가 웹 주소에서 받는다
 */
/** 기본 품질: 75에서 65로 (눈으로는 거의 같고 사진이 약 12% 작다, #292). 화면마다 quality를 주면 그 값 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
	// 주소 끝이 .webp여야 Cloudflare가 가장자리에서 캐시한다 (확장자 없는 /images?…는 매번 api 서버까지 가서 0.3 ~ 3.8초 흔들렸다)
	return `${IMAGE_URL}/images/i.webp?${new URLSearchParams({ url: src, w: String(width), q: String(quality ?? 65) })}`;
}
