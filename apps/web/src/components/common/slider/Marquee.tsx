'use client';

import { Children } from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

interface Props {
	/** 흐르는 방향: 'rtl'이면 왼쪽에서 오른쪽으로, 'ltr'이면 오른쪽에서 왼쪽으로 */
	dir: 'rtl' | 'ltr';
	/** 끝에서 처음으로 이을 때 앞뒤로 더 복제해 둘 칸 수 (칸이 작아 한 화면에 많이 보이면 늘린다) */
	loopAdditionalSlides?: number;
	children: React.ReactNode;
}

/**
 * 멈추지 않고 계속 흐르는 띠 (#230): 홈 첫 화면 사진 줄 · 시작하기 로고 줄.
 * 칸 하나가 한 슬라이드. 칸 모양 · 크기는 쓰는 쪽 CSS(.swiper-slide)가 정한다
 */
export default function Marquee({ dir, loopAdditionalSlides = 1, children }: Props) {
	return (
		<Swiper
			dir={dir}
			modules={[Autoplay]}
			loop
			loopAdditionalSlides={loopAdditionalSlides}
			spaceBetween={20}
			slidesPerView="auto"
			autoplay={{ delay: 0, stopOnLastSlide: false, disableOnInteraction: false }}
			observer
			observeParents
			speed={4000}
		>
			{Children.map(children, (child, i) => (
				<SwiperSlide key={i} className="swiper-slide">
					{child}
				</SwiperSlide>
			))}
		</Swiper>
	);
}
