'use client';

import FilterChips from '@/components/common/FilterChips';
import ListHead, { SortSelect } from '../list/ListHead';

/** 목록 머리: '스크랩한 문장 N' · 보기(전체 · 중요 · 메모) · 정렬 · 선택 단추 */
export default function HighlightsHead({
	total,
	stars,
	memos,
	filter,
	onFilter,
	order,
	onOrder,
	selecting,
	onToggleSelecting,
}: {
	total: number;
	/** 고른 폴더 안의 중요 · 메모 수 */
	stars: number;
	memos: number;
	filter: string;
	onFilter: (value: string) => void;
	order: 'desc' | 'asc';
	onOrder: (value: 'desc' | 'asc') => void;
	selecting: boolean;
	onToggleSelecting: () => void;
}) {
	return (
		<ListHead title="스크랩한 문장" count={total}>
			<FilterChips
				label="보기"
				options={[
					{ value: '', label: '전체' },
					{ value: 'starred', label: `중요 ${stars}` },
					{ value: 'memo', label: `메모 ${memos}` },
				]}
				value={filter}
				onChange={onFilter}
			/>
			<SortSelect
				value={order}
				options={[
					{ value: 'desc', label: '최근 스크랩순' },
					{ value: 'asc', label: '오래된순' },
				]}
				onChange={onOrder}
			/>
			<button type="button" className="select-toggle" aria-pressed={selecting} onClick={onToggleSelecting}>
				{selecting ? '완료' : '선택'}
			</button>
		</ListHead>
	);
}
