import { useEffect, useRef, useState } from 'react';
import { increaseViewCount } from '@/api/view';

/**
 * 기사를 연 브라우저에서 조회수를 한 번 올립니다.
 * (이전에는 서버 렌더링 중에 올려서 prefetch·봇 요청에도 증가하고, 실패하면 페이지가 500이 되었습니다.)
 * 개발 모드 StrictMode의 이중 실행에도 한 번만 보내도록 id별로 기록합니다.
 */
export function useViewCount(newsletterId: number) {
	const [viewCount, setViewCount] = useState<number | null>(null);
	const sentFor = useRef<number | null>(null);

	useEffect(() => {
		if (!newsletterId || sentFor.current === newsletterId) return;
		sentFor.current = newsletterId;
		increaseViewCount(newsletterId)
			.then((response) => setViewCount(response.data))
			.catch(() => setViewCount(null));
	}, [newsletterId]);

	return viewCount;
}
