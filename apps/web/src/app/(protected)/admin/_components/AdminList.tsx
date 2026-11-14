'use client';

import { COMMON } from '@/copy';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import Pagination from '@/components/common/Pagination';
import { useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';

/** 관리자 목록 한 쪽에 보이는 줄 수 */
export const ADMIN_PAGE_SIZE = 20;

type Params = Record<string, string | number | null | undefined>;

/**
 * 관리자 목록 (#230): 주소의 기간 · 쪽 · 정렬과 화면이 준 거르기로 쿼리를 만들어 한 쪽을 불러온다.
 * 쿼리 순서는 기간(from · to) → limit · offset → 거르기(준 순서, 빈 값은 뺌) → 정렬 (주소 · 캐시 열쇠가 늘 같게)
 * - period: false면 기간 없이 (사용자 · 구독자처럼 기간이 없는 목록)
 * - sort: true면 표 머리의 정렬(sort · order)을 붙인다
 */
export function useAdminList<T extends { total: number }>({
	queryKey,
	fetch,
	params = {},
	period = true,
	sort = false,
	pageSize = ADMIN_PAGE_SIZE,
}: {
	queryKey: (query: string) => QueryKey;
	fetch: (query: string) => Promise<T>;
	params?: Params;
	period?: boolean;
	sort?: boolean;
	pageSize?: number;
}) {
	const { from, to, page } = useAdminQuery();
	const sortQuery = useSortQuery();
	const query = new URLSearchParams({
		...(period && { from, to }),
		limit: String(pageSize),
		offset: String((page - 1) * pageSize),
	});
	for (const [key, value] of Object.entries(params))
		if (value !== null && value !== undefined && value !== '') query.set(key, String(value));
	if (sort) for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const result = useQuery({
		queryKey: queryKey(query.toString()),
		queryFn: () => fetch(query.toString()),
		placeholderData: (previous) => previous,
	});
	return { ...result, pageSize };
}

/** 목록 자리: 불러오는 중 · 못 불러옴 · 비었음이면 그 안내를, 아니면 표를 */
export function AdminListState<T extends { items: unknown[] }>({
	list,
	empty,
	children,
}: {
	list: { data: T | undefined; isPending: boolean; isError: boolean };
	/** 비었을 때 안내 (글자만이면 그대로, 링크 등을 넣으려면 요소로) */
	empty: React.ReactNode;
	children: (data: T) => React.ReactNode;
}) {
	if (list.isPending) return <p className="state">{COMMON.loading}</p>;
	if (list.isError || !list.data) return <p className="state">{COMMON.loadFailed}</p>;
	if (list.data.items.length === 0) return <p className="state">{empty}</p>;
	return <>{children(list.data)}</>;
}

/** 목록 아래 쪽 넘기기 (주소의 page) */
export function AdminListPagination({ list }: { list: { data: { total: number } | undefined; pageSize: number } }) {
	const { page, set } = useAdminQuery();
	if (!list.data) return null;
	return (
		<Pagination
			className="pagination"
			page={page}
			total={list.data.total}
			pageSize={list.pageSize}
			onChange={(next) => set({ page: next })}
		/>
	);
}
