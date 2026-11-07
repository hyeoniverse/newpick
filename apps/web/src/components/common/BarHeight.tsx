interface Props {
	height?: string;
	margin?: string;
}

/** 세로 구분선. 높이 · 좌우 여백은 CSS 변수로 (기본 100% · 4rem) */
function BarHeight({ height, margin }: Props) {
	return (
		<div
			className="mx-[var(--bar-margin,4rem)] h-[var(--bar-height,100%)] [border-left:1px_solid_var(--color-border)]"
			style={{ '--bar-height': height, '--bar-margin': margin } as React.CSSProperties}
		/>
	);
}

export default BarHeight;
