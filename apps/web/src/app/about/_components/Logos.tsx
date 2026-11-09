'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Image from '@/components/common/Image';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
}

function Logos({ className }: Props) {
	const logoPaths1 = Array.from({ length: 6 }, (_, idx) => `/img/logos/${idx + 1}.jpg`);
	const logoPaths2 = Array.from({ length: 13 - 7 + 1 }, (_, idx) => `/img/logos/${idx + 7}.jpg`);

	const extendedLogoPaths1 = [...logoPaths1, ...logoPaths1, ...logoPaths1];
	const extendedLogoPaths2 = [...logoPaths2, ...logoPaths2, ...logoPaths2];

	return (
		<div className={cx('np-about-logos-logos', className)}>
			<Swiper
				dir={'rtl'}
				modules={[Autoplay]}
				loop={true} // 슬라이드 루프
				loopAdditionalSlides={12}
				spaceBetween={20} // 슬라이스 사이 간격
				slidesPerView={'auto'} // 보여질 슬라이스 수
				autoplay={{
					delay: 0,
					stopOnLastSlide: false,
					disableOnInteraction: false,
				}}
				observer={true}
				observeParents={true}
				speed={4000}
			>
				{extendedLogoPaths1.map((src, i) => (
					<SwiperSlide key={i} className="swiper-slide">
						<Image src={src} alt="logo" ratio="square" className="logo" />
					</SwiperSlide>
				))}
			</Swiper>
			<Swiper
				dir={'ltr'}
				modules={[Autoplay]}
				loop={true} // 슬라이드 루프
				loopAdditionalSlides={1}
				spaceBetween={20} // 슬라이스 사이 간격
				slidesPerView={'auto'} // 보여질 슬라이스 수
				autoplay={{
					delay: 0,
					stopOnLastSlide: false,
					disableOnInteraction: false,
				}}
				observer={true}
				observeParents={true}
				speed={4000}
			>
				{extendedLogoPaths2.map((src, i) => (
					<SwiperSlide key={i} className="swiper-slide">
						<Image src={src} alt="logo" ratio="square" className="logo" />
					</SwiperSlide>
				))}
			</Swiper>
		</div>
	);
}

export default Logos;
