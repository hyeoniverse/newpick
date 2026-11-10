import React from 'react';
import type { ColorKey } from '@/styles/tokens/theme';
import { PART_BG_COLOR, PART_BORDER_COLOR, cx, PART_TEXT_COLOR } from '@/styles/tw';

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
				'np-full-width-panel',
				PART_BORDER_COLOR[border ?? background],
				PART_TEXT_COLOR[color],
				PART_BG_COLOR[background],
				className,
			)}
		>
			{children}
		</section>
	);
};

export default FullWidthPanel;
