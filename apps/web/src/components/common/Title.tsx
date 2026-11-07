import type { ColorKey, FontWeight, HeadingSize } from '@/styles/theme';
import { cx, FONT_WEIGHT, HEADING_SIZE, TEXT_COLOR } from '@/styles/tw';

interface Props {
	children: React.ReactNode;
	className?: string;
	size?: HeadingSize;
	weight?: FontWeight;
	color?: ColorKey;
	/** 문서 구조상 제목 단계 (기본 h1). 모양은 size로 따로 정한다 */
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
	ref?: React.Ref<HTMLHeadingElement>;
}

/** 제목 글자. 크기 · 굵기 · 색은 theme.ts 이름으로 받는다 (Tailwind, #10) */
const Title = ({
	children,
	className,
	size = 'medium',
	weight = 'regular',
	color = 'text',
	as: Tag = 'h1',
	ref,
}: Props) => {
	return (
		<Tag
			ref={ref}
			className={cx(
				HEADING_SIZE[size],
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

export default Title;
