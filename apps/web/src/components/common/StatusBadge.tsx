export type BadgeTone = 'success' | 'failed' | 'warning' | 'neutral';

/** 작업 · 기록 상태 → 배지 색 (success · failed/error · partial/running · 그 밖) */
export const toneOf = (status: string | null | undefined): BadgeTone =>
	status === 'success'
		? 'success'
		: status === 'failed' || status === 'error'
			? 'failed'
			: status === 'partial' || status === 'running'
				? 'warning'
				: 'neutral';

interface Props {
	tone: BadgeTone;
	children: React.ReactNode;
	className?: string;
}

/** 배지 색 (Tailwind, #10). 섞는 색은 예전과 같은 srgb로 (Tailwind 기본 /14는 oklab이라 색이 조금 다르다) */
const TONE: Record<BadgeTone, string> = {
	success: 'bg-tertiary text-primary',
	failed: 'bg-[color-mix(in_srgb,var(--np-color-error)_14%,transparent)] text-error',
	warning: 'bg-[color-mix(in_srgb,var(--np-color-warning)_20%,transparent)] text-text',
	neutral: 'bg-neutral text-sub-text',
};

/** 상태 배지 (공통, 관리자 표에서 시작): 성공(강조색) · 실패(빨강) · 진행 중/일부 실패(노랑) · 건너뜀/기록 없음(회색) */
export default function StatusBadge({ tone, children, className }: Props) {
	return (
		<span
			className={[
				'inline-block shrink-0 rounded-chip px-2 py-0.5 text-extra-small font-semi-bold whitespace-nowrap',
				TONE[tone],
				className,
			]
				.filter(Boolean)
				.join(' ')}
		>
			{children}
		</span>
	);
}
