import type { FontSize, FontWeight, ColorKey } from '@/styles/theme';
import { cx, FONT_WEIGHT, TEXT_COLOR, TEXT_SIZE } from '@/styles/tw';

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
		<Tag
			className={cx(
				TEXT_SIZE[size],
				FONT_WEIGHT[weight],
				TEXT_COLOR[color],
				'm-0 [transition:color_0.3s_ease]',
				className,
			)}
		>
			{children}
		</Tag>
	);
};

export default Text;
