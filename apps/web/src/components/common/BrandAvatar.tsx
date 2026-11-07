import { cx } from '@/styles/tw';

/** 보낸 사람 'NP' 동그라미 (공통, 메일 화면 · 받은편지함): 강조색 바탕에 흰 글자. 장식이라 화면 읽기에서는 뺀다 */
export default function BrandAvatar({ size = '2.5rem', className }: { size?: string; className?: string }) {
	return (
		<span
			className={cx(
				'flex size-[var(--avatar-size)] shrink-0 items-center justify-center rounded-full bg-primary text-extra-small font-bold text-[#ffffff]',
				className,
			)}
			style={{ '--avatar-size': size } as React.CSSProperties}
			aria-hidden
		>
			NP
		</span>
	);
}
