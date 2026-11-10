import type { FontSize, FontWeight, ColorKey } from '@/styles/tokens/theme';
import { cx, PART_FONT_WEIGHT, PART_TEXT_COLOR, PART_TEXT_SIZE } from '@/styles/tw';

interface Props {
	as?: 'span' | 'p';
	className?: string;
	children: React.ReactNode;
	size?: FontSize;
	weight?: FontWeight;
	color?: ColorKey;
}

/** 본문 글자. 크기 · 굵기 · 색은 theme.ts 이름으로 받는다 (Tailwind, #10) */
const Text = ({ as: Tag = 'span', className, children, size = 'medium', weight = 'light', color = 'text' }: Props) => {
	return (
		<Tag className={cx(PART_TEXT_SIZE[size], PART_FONT_WEIGHT[weight], PART_TEXT_COLOR[color], 'np-typo', className)}>
			{children}
		</Tag>
	);
};

export default Text;
