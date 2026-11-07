import { cx } from '@/styles/tw';

interface Props {
	width?: string;
	margin?: string;
	className?: string;
}

/** 가로 구분선. 폭 · 위아래 여백은 CSS 변수로 (기본 100% · 5rem) */
function BarWidth({ width, margin, className }: Props) {
	return (
		<div
			className={cx(
				'my-[var(--bar-margin,5rem)] w-[var(--bar-width,100%)] [border-bottom:1px_solid_var(--color-border)]',
				className,
			)}
			style={{ '--bar-width': width, '--bar-margin': margin } as React.CSSProperties}
		/>
	);
}

export default BarWidth;
