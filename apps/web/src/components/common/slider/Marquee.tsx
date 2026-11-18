import { Children } from 'react';
import { cx } from '@/styles/tw';

/** 칸 하나가 지나가는 시간 (예전 Swiper speed 4000과 같은 빠르기) */
const SECONDS_PER_SLIDE = 4;

interface Props {
	/** 흐르는 방향: 'rtl'이면 왼쪽에서 오른쪽으로, 'ltr'이면 오른쪽에서 왼쪽으로 */
	dir: 'rtl' | 'ltr';
	className?: string;
	children: React.ReactNode;
}

/**
 * 멈추지 않고 계속 흐르는 띠 (#230): 홈 첫 화면 사진 줄 · 시작하기 로고 줄.
 * 칸 모양 · 크기는 쓰는 쪽 CSS(.slide 안의 내용)가 정한다.
 *
 * CSS 애니메이션으로 흐른다 (#292, 예전에는 Swiper로 약 23 KB JS). 같은 줄을 두 번 이어 붙이고 한 줄 길이만큼(-50%) 옮긴 뒤
 * 처음으로 돌아가 이음매가 보이지 않는다. 그래서 한 줄이 화면 폭보다 길어야 한다 (모자라면 쓰는 쪽에서 반복해 채운다).
 * 뒤 줄은 눈에만 보이게: 화면 읽기 · 키보드에서는 빠진다
 */
export default function Marquee({ dir, className, children }: Props) {
	const slides = Children.toArray(children);
	const row = (copy: boolean) =>
		slides.map((child, i) => (
			<div key={`${copy ? 'copy' : 'slide'}-${i}`} className="slide">
				{child}
			</div>
		));

	return (
		<div
			className={cx('np-marquee', className)}
			data-dir={dir}
			style={{ '--marquee-duration': `${slides.length * SECONDS_PER_SLIDE}s` } as React.CSSProperties}
		>
			<div className="track">
				<div className="row">{row(false)}</div>
				<div className="row" aria-hidden inert>
					{row(true)}
				</div>
			</div>
		</div>
	);
}
