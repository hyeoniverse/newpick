'use client';

import { HeaderSelect, SortButton, SortOrder } from '@/components/common/TableHeader';
import { findPreset, PRESETS, useAdminQuery } from './period';

/* 관리자 표 머리: 공통 표 머리 부품(TableHeader)을 주소(?from · to · sort · order)와 잇는다 */

/** 시각 칸 머리: 오늘 · 어제 · 최근 7일 · 최근 30일 (정확한 날짜는 위 날짜 칸에서). 기간은 늘 걸려 있어 강조하지 않는다 */
export function PeriodHeaderFilter({ label }: { label: string }) {
	const { from, to, set, custom } = useAdminQuery();
	return (
		<HeaderSelect
			label={label}
			highlight={false}
			value={(!custom && findPreset(from, to)?.key) || ''}
			options={PRESETS.map((p) => ({ label: p.label, value: p.key }))}
			onChange={(key) => {
				const preset = PRESETS.find((p) => p.key === key);
				if (preset) set({ ...preset.range(), custom: null });
			}}
		/>
	);
}

/**
 * 표 머리 정렬. 숫자(조회수 · id · 걸린 시간 · 비용 …)는 큰 순 → 작은 순, 글자(제목)는 가나다순 → 역순, 한 번 더 누르면 기본(최신부터).
 * 주소의 sort · order에 남아 새로 고침해도 그대로
 */
export function SortHeader({
	label,
	field,
	first = 'desc',
}: {
	label: string;
	field: string;
	/** 처음 누를 때 순서. 글자(제목)는 가나다순(asc)부터 */
	first?: 'asc' | 'desc';
}) {
	const { get, set } = useAdminQuery();
	const order = get('sort') === field ? ((get('order') || 'desc') as SortOrder) : '';
	return (
		<SortButton
			label={label}
			order={order}
			first={first}
			onChange={(next) => set(next ? { sort: field, order: next } : { sort: null, order: null })}
		/>
	);
}

/** 정렬 상태를 API 쿼리에 옮긴다 */
export function useSortQuery() {
	const { get } = useAdminQuery();
	const sort = get('sort');
	return sort ? { sort, order: get('order') || 'desc' } : {};
}
