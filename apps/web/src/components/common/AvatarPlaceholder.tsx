import { cx } from '@/styles/tw';

interface Props {
	/** 불러오는 중이면 위로 옅은 빛이 지나간다. 사진이 없는 사람이면 끈다 */
	loading?: boolean;
	className?: string;
}

/* 헤더 펼침 메뉴 버튼처럼 안쪽 svg 크기를 정하는 곳 안에서도 원을 꽉 채우게 인라인으로 (바깥 규칙에 지지 않게) */
const FILL: React.CSSProperties = {
	display: 'block',
	width: '100%',
	height: '100%',
	margin: 0,
	fill: 'color-mix(in srgb, var(--np-color-text) 22%, var(--np-color-background))',
};

/**
 * 프로필 사진 자리 (#70). 사람 모양(머리·어깨)을 채운 원.
 * 헤더·마이페이지에서 불러오는 중이거나 프로필 사진이 없을 때 쓴다.
 * 색은 글자색을 바탕색에 섞어 만들어 라이트·다크 모두 같은 대비. 크기는 감싼 곳에 맞춘다
 */
export default function AvatarPlaceholder({ loading = false, className }: Props) {
	return (
		<span
			className={cx(
				'relative block aspect-square size-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_7%,var(--color-background))]',
				// 흰 빛은 다크 모드에서 원 전체를 밝혀 모양을 지운다. 바탕색 쪽으로 옅게
				loading &&
					"after:absolute after:inset-0 after:block after:animate-avatar-shimmer after:bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-background)_55%,transparent),transparent)] after:content-[''] motion-reduce:after:hidden",
				className,
			)}
			{...(loading
				? { role: 'status', 'aria-busy': true, 'aria-label': '프로필 불러오는 중' }
				: { 'aria-hidden': true })}
		>
			<svg viewBox="0 0 40 40" aria-hidden style={FILL}>
				<circle cx="20" cy="15" r="7" />
				<path d="M6 40c0-8.3 6.3-14 14-14s14 5.7 14 14z" />
			</svg>
		</span>
	);
}
