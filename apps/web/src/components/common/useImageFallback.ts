import { useState } from 'react';
import { DEFAULT_IMAGES } from '@/constants/images';

/**
 * 사진이 깨지면 차례로 바꿔 보인다: 원래 사진 → 대신할 사진(뉴스레터 키워드로 찾은 Pexels 사진) → 기본 그림.
 * 원래 사진이 없으면(비었거나 기본 그림을 넘김) 대신할 사진부터.
 * 원래 사진이 아닌 것은 사진 최적화(/_next/image)를 거치지 않는다(unoptimized). 최적화가 실패할 때(한도 초과 402 등)
 * 대신 보이는 사진까지 같은 길로 받으면 같이 깨진다. 대신할 사진은 Pexels가 줄인 크기, 기본 그림은 14 KB 정적 파일이다.
 * src가 바뀌면(다른 글) 다시 처음부터 시도한다
 */
export function useImageFallback(src: string | null | undefined, fallback?: string | null) {
	const original = src && src !== DEFAULT_IMAGES.MONO ? src : null;
	const chain = [...new Set([original, fallback, DEFAULT_IMAGES.MONO].filter((u): u is string => !!u))];
	const [failed, setFailed] = useState<{ src: typeof src; count: number }>({ src, count: 0 });
	const count = failed.src === src ? failed.count : 0;
	const shown = chain[Math.min(count, chain.length - 1)];

	return {
		shown,
		unoptimized: shown !== original,
		onError: () => {
			if (count < chain.length - 1) setFailed({ src, count: count + 1 });
		},
	};
}
