import React from 'react';
import type { ColorKey } from '@/styles/theme';
import { BG_COLOR, BORDER_COLOR, cx, TEXT_COLOR } from '@/styles/tw';

interface Props {
	children?: React.ReactNode;
	className?: string;
	border?: ColorKey;
	background?: ColorKey;
	color?: ColorKey;
}

/** 본문 폭을 벗어나 화면 끝까지 닿는 띠. 테두리는 따로 주지 않으면 바탕색과 같게 */
const FullWidthPanel: React.FC<Props> = ({
	children,
	className,
	border,
	background = 'primary',
	color = 'subText',
}) => {
	return (
		<section
			className={cx(
				'relative left-1/2 mx-0 my-16 flex h-fit w-screen -translate-x-1/2 flex-col items-center justify-center border border-solid px-4 py-12',
				BORDER_COLOR[border ?? background],
				TEXT_COLOR[color],
				BG_COLOR[background],
				className,
			)}
		>
			{children}
		</section>
	);
};

export default FullWidthPanel;
