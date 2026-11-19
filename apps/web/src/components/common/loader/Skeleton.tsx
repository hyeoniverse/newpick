import { cx } from '@/styles/tw';

/** 불러오는 동안 카드 자리 (세로 카드 4장) */
export default function Skeleton() {
	return (
		<div className="flex w-full flex-col gap-4" aria-hidden>
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					key={index}
					className="flex h-[180px] w-full flex-col overflow-hidden rounded-surface border border-solid border-border"
				>
					<SkeletonBlock $height="120px" $radius="0" />
					<SkeletonBlock $width="80%" $height="16px" className="mx-auto my-2.5" />
				</div>
			))}
		</div>
	);
}

interface BlockProps {
	$width?: string;
	$height?: string;
	$radius?: string;
	className?: string;
}

/**
 * 불러오는 동안 글자·사진 자리를 채우는 회색 막대 (#17). 테마 색(neutral)이라 다크 모드에서도 어울리고, 제자리에서 은은하게 깜빡인다.
 * 화면마다 실제 모양대로 이어 붙여 쓴다. 폭 · 높이 · 모서리는 CSS 변수로 넘겨, 바깥에서 width 등을 덮어쓸 수 있게 둔다
 */
export function SkeletonBlock({ $width, $height, $radius, className }: BlockProps) {
	return (
		<span
			className={cx(
				'block h-[var(--sk-h,1rem)] w-[var(--sk-w,100%)] rounded-[var(--sk-r,var(--radius-chip))]',
				'bg-neutral animate-skeleton-pulse motion-reduce:animate-none',
				className,
			)}
			style={{ '--sk-w': $width, '--sk-h': $height, '--sk-r': $radius } as React.CSSProperties}
		/>
	);
}
