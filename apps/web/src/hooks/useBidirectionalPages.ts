import { useEffect, useRef } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

type Page<T> = { items: T[]; total: number };

/**
 * 위아래로 이어 붙이는 목록 (#230): startOffset부터 한 묶음씩 받아, 아래로는 다음 묶음 · 위로는 앞 묶음.
 * 달로 건너뛰면 그 달 첫 순번(startOffset)부터 받고, 위쪽은 '더 최근 보기'로 앞 묶음을 받는다
 */
export function useBidirectionalPages<T, P extends Page<T>>({
	queryKey,
	fetchPage,
	pageSize,
	startOffset = 0,
	enabled = true,
	staleTime,
}: {
	queryKey: QueryKey;
	fetchPage: (offset: number, limit: number) => Promise<P>;
	pageSize: number;
	startOffset?: number;
	enabled?: boolean;
	/** 받은 뒤 이만큼은 다시 받지 않는다 (서버가 미리 넣어 준 첫 쪽을 화면이 뜨자마자 또 받지 않게) */
	staleTime?: number;
}) {
	return useInfiniteQuery({
		queryKey,
		queryFn: async ({ pageParam }) => ({ ...(await fetchPage(pageParam, pageSize)), offset: pageParam }),
		initialPageParam: startOffset,
		getNextPageParam: (last) => (last.offset + last.items.length < last.total ? last.offset + pageSize : undefined),
		getPreviousPageParam: (first) => (first.offset > 0 ? Math.max(0, first.offset - pageSize) : undefined),
		enabled,
		staleTime,
		placeholderData: (previous) => previous,
	});
}

/** 묶음들을 한 줄로. 건너뛴 자리가 묶음 크기의 배수가 아니면 앞 묶음 끝이 겹칠 수 있어 key로 한 번만 */
export function uniqueItems<T>(pages: { items: T[] }[] | undefined, key: (item: T) => string | number): T[] {
	const seen = new Set<string | number>();
	return (pages ?? []).flatMap((page) => page.items).filter((item) => !seen.has(key(item)) && !!seen.add(key(item)));
}

/**
 * 아래 끝 표시 (#230): 돌려준 ref를 목록 끝 요소에 달면, 화면 400px 앞에 들어올 때 다음 묶음을 부른다.
 * itemCount: 묶음이 붙어도 끝 표시가 여전히 화면 안이면 다시 부르도록 다시 살핀다
 */
export function useInfiniteSentinel({
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	itemCount,
}: {
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => unknown;
	itemCount: number | undefined;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
			},
			{ rootMargin: '400px 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, itemCount]);
	return ref;
}
