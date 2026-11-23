import { cx } from '@/styles/tw';

/**
 * 홈 '오늘' 칸 제목: 작은 꼬리표 + 큰 제목 + 오른쪽 설명.
 * 칸마다 같은 실선 제목(BorderTitle)이 이어져 단조로워서, '오늘의 뉴스레터'만 실선 제목을 두고 나머지는 이 모양 + 칸 틀로 구분한다.
 * inverse: 강조색 띠 위 (글자는 띠의 글자색을 따른다)
 */
export function SectionHeader({
	eyebrow,
	title,
	note,
	inverse = false,
}: {
	eyebrow: string;
	title: string;
	note?: string;
	inverse?: boolean;
}) {
	return (
		<div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-1">
			<div className="flex flex-col gap-1">
				<span className={cx('text-small font-semi-bold tracking-[0.08em]', inverse ? 'opacity-80' : 'text-primary')}>
					{eyebrow}
				</span>
				<h2 className="m-0 text-[1.625rem] leading-tight font-bold mobile:text-[1.375rem]">{title}</h2>
			</div>
			{note && <span className={cx('text-small', inverse ? 'opacity-80' : 'text-sub-text')}>{note}</span>}
		</div>
	);
}

/** 홈 '오늘' 칸 하나의 틀 */
export const SECTION = 'flex w-full flex-col gap-6 py-8';
