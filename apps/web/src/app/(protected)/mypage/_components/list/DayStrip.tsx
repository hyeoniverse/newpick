'use client';

import { useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { dayLabel, monthLabel, type BarItem } from '../../_lib/months';

/**
 * 달 막대의 날짜 줄 (#198): 그 달의 날짜 바로가기('27일 · 24일 …'), 누르면 그 항목으로.
 * 한 줄로 옆으로 밀어 보고, 더 밀 수 있는 쪽에 화살표 · 흐림. 지금 보는 날짜가 줄 밖이면 줄만 옆으로 밀어 가운데로
 * (페이지는 위아래로 움직이지 않게 scrollIntoView 대신). 달이 막 바뀐 줄은 흐린 동안 바로 그 자리에 두어 또렷해질 때 미끄러지지 않게
 */
export default function DayStrip({
	days,
	daysMonth,
	leaving,
	active,
	noun,
}: {
	days: BarItem[];
	/** 날짜 줄에 보이는 달 (막대의 달을 조금 늦게 따라감) */
	daysMonth: string;
	/** 달이 바뀌는 중 (잠깐 흐리게) */
	leaving: boolean;
	active: string | null;
	noun: string;
}) {
	const listRef = useRef<HTMLUListElement>(null);
	const [edges, setEdges] = useState({ left: false, right: false });
	const updateEdges = () => {
		const list = listRef.current;
		if (!list) return;
		setEdges({
			left: list.scrollLeft > 1,
			right: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
		});
	};
	useEffect(() => {
		updateEdges();
		window.addEventListener('resize', updateEdges);
		return () => window.removeEventListener('resize', updateEdges);
	}, [daysMonth, days]);
	const slide = (direction: 1 | -1) => {
		const list = listRef.current;
		list?.scrollBy({ left: direction * list.clientWidth * 0.66, behavior: 'smooth' });
	};

	const centeredMonth = useRef(daysMonth);
	useEffect(() => {
		const list = listRef.current;
		const button = active && list?.querySelector<HTMLElement>(`[data-target="${active}"]`);
		if (!list || !button) return;
		const fresh = centeredMonth.current !== daysMonth;
		centeredMonth.current = daysMonth;
		const left = button.offsetLeft - list.offsetLeft;
		if (fresh || left < list.scrollLeft || left + button.offsetWidth > list.scrollLeft + list.clientWidth) {
			list.scrollTo({ left: left - (list.clientWidth - button.offsetWidth) / 2, behavior: fresh ? 'auto' : 'smooth' });
		}
	}, [active, daysMonth]);

	return (
		<div className={`days-wrap ${edges.left ? 'more-left' : ''} ${edges.right ? 'more-right' : ''}`}>
			{/* 화살표는 날짜 줄 양옆 제자리에 (줄 위에 겹치지 않게). 밀 곳이 없으면 자리만 남기고 숨긴다 */}
			<button
				type="button"
				className={`days-arrow ${edges.left ? 'show' : ''}`}
				aria-label="앞 날짜 보기"
				onClick={() => slide(-1)}
			>
				<LuChevronLeft aria-hidden />
			</button>
			<ul
				ref={listRef}
				className={`month-days ${leaving ? 'leaving' : ''}`}
				aria-label={`${monthLabel(daysMonth)} ${noun}`}
				onScroll={updateEdges}
			>
				{days.map((item) => (
					<li key={item.id}>
						<button
							type="button"
							data-target={item.id}
							className={item.id === active ? 'active' : undefined}
							aria-current={item.id === active ? 'true' : undefined}
							onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
						>
							{dayLabel(item.at)}
						</button>
					</li>
				))}
			</ul>
			<button
				type="button"
				className={`days-arrow ${edges.right ? 'show' : ''}`}
				aria-label="뒤 날짜 보기"
				onClick={() => slide(1)}
			>
				<LuChevronRight aria-hidden />
			</button>
		</div>
	);
}
