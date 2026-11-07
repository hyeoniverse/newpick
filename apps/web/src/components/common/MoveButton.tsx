import Button from '@/components/common/Button';

interface Props {
	onClick?: () => void;
	text?: string;
	frontIcon?: React.ReactNode;
	backIcon?: React.ReactNode;
	className?: string;
	width?: string;
	disabled?: boolean;
}

/**
 * 이동 단추 ('← 목록으로'): 회색 테두리 버튼. 글자 · 아이콘은 진한 회색.
 * Button의 색 변수(--btn-color)만 바꿔, 마우스 올림 모양은 Button 그대로 둔다 (styles/button.css)
 */
function MoveButton({ onClick, frontIcon, backIcon, text, className, width, disabled }: Props) {
	return (
		<Button
			scheme="monoOutline"
			onClick={onClick}
			className={className}
			disabled={disabled}
			style={{ '--btn-color': 'var(--np-color-medium-grey)', '--btn-width': width } as React.CSSProperties}
		>
			{frontIcon}
			{text && <span className="move-text">{text}</span>}
			{backIcon}
		</Button>
	);
}

export default MoveButton;
