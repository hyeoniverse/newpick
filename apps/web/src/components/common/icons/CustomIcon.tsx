import { IconStyled } from '@/styles/Icon';

interface Props {
	children?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	/** 아이콘만 있는 버튼이라 화면 읽기 프로그램용 이름이 필요하다 */
	label?: string;
}

/** 아이콘 버튼. 원 전체가 눌린다 (예전에는 안쪽 아이콘 영역만 눌렸다) */
function CustomIcon({ children, onClick, className, label }: Props) {
	return (
		<IconStyled onClick={onClick} className={className} aria-label={label}>
			{children}
		</IconStyled>
	);
}

export default CustomIcon;
