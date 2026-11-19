import { type RefObject, useEffect, useState } from 'react';

/**
 * 요소가 화면에서 margin 안으로 들어왔는지 (한 번 들어오면 계속 true). enabled가 false면 처음부터 true.
 * 브라우저의 lazy 사진은 화면에서 1250 ~ 2500px 안이면 미리 받아, 첫 화면 아래의 큰 사진까지 첫 화면과 같이 받았다.
 * 이것으로 그보다 가까이 왔을 때 사진을 넣는다 (#292). IntersectionObserver가 없는 브라우저는 바로 true
 */
export function useNearViewport(ref: RefObject<Element | null>, { enabled = true, margin = '300px' } = {}) {
	const [near, setNear] = useState(!enabled);

	useEffect(() => {
		if (near) return;
		const el = ref.current;
		if (!el || !('IntersectionObserver' in window)) {
			setNear(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setNear(true);
					observer.disconnect();
				}
			},
			{ rootMargin: margin },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, near, margin]);

	return near;
}
