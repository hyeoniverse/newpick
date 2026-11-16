'use client';

import { useState } from 'react';
import { useHighlightPages } from '@/hooks/useHighlights';
import { uniqueItems, useInfiniteSentinel } from '@/hooks/useBidirectionalPages';
import type { FolderFilter } from '../folders/FolderBar';
import { useMonthJump } from '../list/useMonthJump';

/**
 * 스크랩 목록 데이터 (#198): 폴더 · 보기(중요 · 메모) · 정렬로 서버에서 걸러 한 쪽씩 받고, 아래 끝에 닿으면 이어 붙인다.
 * 달 막대로 건너뛰면 그 달 첫 스크랩부터(위로는 '더 최근 스크랩 보기'). 거르기 · 정렬을 바꾸면 맨 위부터
 */
export function useHighlightList() {
	const [filter, setFilter] = useState('');
	const [folder, setFolder] = useState<FolderFilter>('all');
	// 정렬: 최근 스크랩순(기본) · 오래된순. 날짜별 묶음도 이 순서를 따른다
	const [order, setOrder] = useState<'desc' | 'asc'>('desc');
	const { startOffset, setStartOffset, jumpToMonth } = useMonthJump();
	const filters = new URLSearchParams({
		...(folder !== 'all' && { folder: String(folder) }),
		...(filter && { filter }),
		...(order === 'asc' && { order }),
	}).toString();
	const pages = useHighlightPages(filters, startOffset);
	const items = pages.data && uniqueItems(pages.data.pages, (h) => h.id);
	// 아래 끝 표시: 화면에 들어오면 다음 쪽
	const endRef = useInfiniteSentinel({
		hasNextPage: pages.hasNextPage,
		isFetchingNextPage: pages.isFetchingNextPage,
		fetchNextPage: pages.fetchNextPage,
		itemCount: items?.length,
	});
	const refilter =
		<T>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setStartOffset(0);
		};

	return {
		filter,
		folder,
		order,
		setFilter: refilter(setFilter),
		setFolder: refilter(setFolder),
		setOrder: refilter(setOrder),
		jumpToMonth,
		pages,
		items,
		endRef,
	};
}
