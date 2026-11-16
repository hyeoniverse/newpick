'use client';

import { COMMON } from '@/copy';
import { LuChevronUp } from 'react-icons/lu';

/** 달 · 연도로 건너뛴 뒤 위로 더 최근 것: 폭 가득, 각진 띠, 아래로 갈수록 진한 보라 · 달 막대에 틈 없이 붙음 */
export default function LoadNewer({
	label,
	loading,
	onClick,
}: {
	label: string;
	loading: boolean;
	onClick: () => void;
}) {
	return (
		<button className="np-mypage-month-bar-load-newer" type="button" disabled={loading} onClick={onClick}>
			<LuChevronUp aria-hidden />
			{loading ? COMMON.loading : label}
		</button>
	);
}
