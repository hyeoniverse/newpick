import { cx } from '@/styles/tw';

interface ToggleProps extends React.SVGAttributes<SVGSVGElement> {
	$toggle: boolean;
	className?: string;
}

/** 켜짐 · 꺼짐 그림 (마이페이지 구독 토글). 켜지면 강조색 바탕에 동그라미가 오른쪽으로 */
export const ToggleIcon = ({ $toggle, className, ...props }: ToggleProps) => {
	return (
		<svg className={className} viewBox="0 0 40 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect
				x="0.5"
				y="1"
				width="39"
				height="19"
				rx="9.5"
				fill="currentColor"
				stroke="currentColor"
				className={cx(
					'back [transition:fill_0.8s,stroke_0.5s]',
					$toggle ? 'fill-primary stroke-primary' : 'fill-border stroke-border',
				)}
			/>
			<rect
				x={$toggle ? '20.5' : '1'}
				y="1"
				width="19"
				height="19"
				rx="9.5"
				fill="currentColor"
				stroke="currentColor"
				className={cx(
					'front fill-[#ffffff] [transition:x_0.5s,fill_0.5s,stroke_0.5s]',
					$toggle ? 'stroke-primary' : 'stroke-border',
				)}
			/>
		</svg>
	);
};
