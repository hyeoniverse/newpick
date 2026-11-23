import BorderTitle from '@/components/common/BorderTitle';

/** 홈 '오늘' 칸 제목: 실선 제목 + 오른쪽 작은 설명 */
export function SectionHeader({ title, note }: { title: string; note?: string }) {
	return (
		// 공통 실선 제목은 아래 여백(3rem)이 있어 칸 사이가 벌어진다. 여기서는 칸 틀(gap)이 간격을 맡는다
		<div className="flex w-full items-center gap-3">
			<BorderTitle text={title} className="mb-0 flex-1" />
			{note && <span className="shrink-0 text-small text-sub-text">{note}</span>}
		</div>
	);
}

/** 홈 '오늘' 칸 하나의 틀 */
export const SECTION = 'flex w-full flex-col gap-6 py-8';
