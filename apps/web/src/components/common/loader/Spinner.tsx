import { FaSpinner } from 'react-icons/fa';
import { cx } from '@/styles/tw';

interface Props {
	size?: string;
}

/** 도는 아이콘. 크기를 주지 않으면 4rem에 위아래 여백 */
function Spinner({ size }: Props) {
	return (
		<div
			className={cx('text-center', size ? 'py-0' : 'py-8')}
			style={size ? ({ '--spinner-size': size } as React.CSSProperties) : undefined}
		>
			<FaSpinner className="size-[var(--spinner-size,4rem)] animate-spin fill-secondary" />
		</div>
	);
}

export default Spinner;
