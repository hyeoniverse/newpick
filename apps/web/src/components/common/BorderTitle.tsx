import Title from '@/components/common/Title';
import type { ColorKey } from '@/styles/tokens/theme';
import { cx, PART_TEXT_COLOR } from '@/styles/tw';

interface Props {
	className?: string;
	text: string;
	color?: ColorKey;
	/** 섹션 제목이므로 기본 h2 (페이지 제목 h1은 하나만). 바로 아래 진짜 제목이 따로 있으면 p */
	as?: 'h2' | 'p';
}

/** 글자 뒤로 실선이 이어지는 섹션 제목. 선은 글자색(currentColor)을 따른다 */
export default function BorderTitle({ className, text, color = 'text', as = 'h2' }: Props) {
	return (
		<div className={cx('np-border-title', className)}>
			<Title as={as} size="small" weight="semiBold" color={color} className="title mr-4 whitespace-nowrap">
				{text}
			</Title>
			<div className={cx('bar h-fit w-full [border-bottom:1px_solid_currentColor]', PART_TEXT_COLOR[color])} />
		</div>
	);
}
