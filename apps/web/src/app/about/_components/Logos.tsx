'use client';

import Marquee from '@/components/common/slider/Marquee';
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
			<Marquee dir="rtl" loopAdditionalSlides={12}>
				{extendedLogoPaths1.map((src, i) => (
					<Image key={i} src={src} alt="logo" ratio="square" className="logo" />
				))}
			</Marquee>
			<Marquee dir="ltr">
				{extendedLogoPaths2.map((src, i) => (
					<Image key={i} src={src} alt="logo" ratio="square" className="logo" />
				))}
			</Marquee>
		</div>
	);
}

export default Logos;
