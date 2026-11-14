'use client';

import { COMMON } from '@/copy';
import type { MonthIndex } from '@newpick/shared';
import { useEffect, useRef, useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp } from 'react-icons/lu';
import { cx } from '@/styles/tw';
import { useDismiss } from '@/hooks/useDismiss';

/** 바로 가기용 달 (서버가 거르기 · 정렬을 적용한 순서로 준다): 그 달 개수와 그 달 첫 항목의 순번 */
/** 달 이동 (@newpick/shared) */
export type { MonthIndex };

/** 날짜 바로가기 하나: 누르면 갈 요소의 id와 그 날짜 */
export interface BarItem {
	id: string;
	at: string;
}

/** 달 막대 바로가기: '27일' */
const dayLabel = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', day: 'numeric' }).format(new Date(iso));

/** 한국 시각 달 'YYYY-MM' */
export const monthOf = (iso: string) =>
	new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso)).slice(0, 7);

/** '2026년 10월' */
export const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;

/** 목록 순서 그대로 달별로 묶는다 */
export function byMonth<T>(items: T[], at: (item: T) => string) {
	const groups: { month: string; items: T[] }[] = [];
	for (const item of items) {
		const month = monthOf(at(item));
		const last = groups[groups.length - 1];
		if (last?.month === month) last.items.push(item);
		else groups.push({ month, items: [item] });
	}
	return groups;
}

/**
 * 달 · 연도로 건너뛰기: 이미 받아 온 달이면 그 자리로, 아니면 그 달 첫 항목 순번부터 새로 받아 와서 스크롤.
 * 목록은 달마다 id="month-YYYY-MM" 묶음을 둔다
 */
export function useMonthJump() {
	// 목록이 시작하는 순번: 보통 0(맨 위), 건너뛰면 그 달 첫 항목 순번부터 (위로는 '더 최근 … 보기')
	const [startOffset, setStartOffset] = useState(0);
	const [pendingMonth, setPendingMonth] = useState<string | null>(null);
	const jumpToMonth = (target: MonthIndex) => {
		setPendingMonth(target.month);
		if (!document.getElementById(`month-${target.month}`)) setStartOffset(target.firstIndex);
	};
	// 그 달 묶음이 그려지면 (새로 받아 온 뒤 다시 그릴 때마다 찾아본다. 찾으면 pendingMonth를 비워 멈춘다)
	// eslint-disable-next-line react-hooks/exhaustive-deps -- 받아 온 목록은 이 훅 밖(쿼리)에 있어 매번 본다
	useEffect(() => {
		if (!pendingMonth) return;
		const section = document.getElementById(`month-${pendingMonth}`);
		if (!section) return;
		section.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setPendingMonth(null);
	});
	return { startOffset, setStartOffset, jumpToMonth };
}

/** 달 · 연도로 건너뛴 뒤 위로 더 최근 것: 폭 가득, 각진 띠, 아래로 갈수록 진한 보라 · 달 막대에 틈 없이 붙음 */
export function LoadNewer({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
	return (
		<button className="np-mypage-month-bar-load-newer" type="button" disabled={loading} onClick={onClick}>
			<LuChevronUp aria-hidden />
			{loading ? COMMON.loading : label}
		</button>
	);
}

/**
 * 숫자판처럼 넘어가는 글자: 값이 바뀌면 이전 값은 빠져나가고 새 값이 같은 방향에서 들어온다.
 * from-below면 위로 넘어가고(아래에서 올라옴), from-above면 아래로 넘어간다
 */
function Roll({ value, enter, className = '' }: { value: string; enter: string; className?: string }) {
	const [current, setCurrent] = useState(value);
	const [previous, setPrevious] = useState<string | null>(null);
	const [turn, setTurn] = useState(0);
	if (current !== value) {
		setPrevious(current);
		setCurrent(value);
		setTurn((n) => n + 1);
	}
	return (
		<span className={`roll ${className}`}>
			<span key={`in-${turn}`} className={turn ? `roll-in ${enter}` : undefined}>
				{current}
			</span>
			{previous !== null && (
				<span key={`out-${turn}`} className={`roll-out ${enter}`} aria-hidden onAnimationEnd={() => setPrevious(null)}>
					{previous}
				</span>
			)}
		</span>
	);
}

/**
 * 달 막대 (원래 마이페이지의 날짜 막대처럼): 큰 '2026년 10월 ▾' + 그 달의 날짜 바로가기('27일 · 24일 …').
 * 내 뉴스레터 · 스크랩이 같이 쓴다. 목록 위에 하나만 두고 위에 붙어 따라오며, 지금 보는 항목의 달로 내용만 바뀐다.
 * 붙는 순간 바탕 · 위아래 줄이 화면 양끝까지 천천히 펼쳐진다 (원래 디자인의 full-width).
 * 연도 · 월을 누르면 받은 해 · 달 목록이 펼쳐져 바로 간다
 */
export default function MonthBar({
	groups,
	top,
	months,
	onJump,
	noun,
}: {
	/** 달마다 날짜 바로가기 (목록 순서대로). 막대 밑에 온 항목으로 지금 달 · 날짜를 정한다 */
	groups: { month: string; items: BarItem[] }[];
	/** 붙는 높이 (헤더가 보이면 그 아래) */
	top: string;
	/** 바로 가기용 달 목록 (서버가 준 것: 달마다 개수 · 첫 순번) */
	months: MonthIndex[];
	onJump: (month: MonthIndex) => void;
	/** 날짜 줄 이름에 쓰는 말: '받은 메일' · '스크랩' */
	noun: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [stuck, setStuck] = useState(false);
	// 지금 보고 있는 항목 (달 막대 바로 아래에 와 있는 것)의 id
	const [active, setActive] = useState<string | null>(null);
	// 막대에 보이는 달: 지금 보는 항목의 달 (붙기 전에는 목록 첫 달)
	const month = groups.find((g) => g.items.some((item) => item.id === active))?.month ?? groups[0].month;
	// 바뀐 방향: 목록에서 뒤에 있는 달로 가면 아래에서 올라오고, 앞 달로 가면 위에서 내려온다 (처음엔 움직이지 않음)
	const [shown, setShown] = useState(month);
	const [enter, setEnter] = useState('');
	if (shown !== month) {
		const order = (m: string) => groups.findIndex((g) => g.month === m);
		setShown(month);
		setEnter(order(month) > order(shown) ? 'from-below' : 'from-above');
	}
	// 날짜 줄은 잠깐 흐려졌다가 새 달 날짜로 바뀌어 또렷해진다 (daysMonth가 month를 조금 늦게 따라감)
	const [daysMonth, setDaysMonth] = useState(month);
	const leaving = daysMonth !== month;
	useEffect(() => {
		if (!leaving) return;
		const timer = window.setTimeout(() => setDaysMonth(month), 160);
		return () => window.clearTimeout(timer);
	}, [leaving, month]);
	const days = groups.find((g) => g.month === daysMonth)?.items ?? [];
	const daysRef = useRef<HTMLUListElement>(null);
	// 날짜 줄을 더 밀어 볼 수 있는 쪽 (그쪽에 화살표 · 흐림)
	const [edges, setEdges] = useState({ left: false, right: false });
	const updateEdges = () => {
		const list = daysRef.current;
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
	}, [daysMonth, groups]);
	const slide = (direction: 1 | -1) => {
		const list = daysRef.current;
		list?.scrollBy({ left: direction * list.clientWidth * 0.66, behavior: 'smooth' });
	};
	// 펼친 목록: 연도 · 월 (각각 따로 여는 단추)
	const [open, setOpen] = useState<'year' | 'month' | null>(null);
	const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
	const year = month.slice(0, 4);
	// 펼친 바탕의 폭 = 스크롤바를 뺀 화면 폭 (100vw는 스크롤바만큼 넘쳐 가로 스크롤이 생긴다)
	const [pageWidth, setPageWidth] = useState(0);

	useEffect(() => {
		let timer = 0;
		const check = () => {
			const el = ref.current;
			if (!el) return;
			setPageWidth(document.documentElement.clientWidth);
			// 막대 높이를 목록에 알려, 달 · 날짜로 건너뛸 때 막대에 가리지 않게 (scroll-margin)
			el.parentElement?.style.setProperty('--bar-h', `${el.offsetHeight}px`);
			// 붙어 있으면 막대가 목록의 시작보다 아래에 와 있다. 헤더가 나타나고 숨으며 막대가 움직이는 동안에도
			// 이 관계는 그대로라 너비가 줄었다 늘었다 하지 않는다 (예전엔 붙는 높이와 비교해 움직이는 0.3초 동안 풀렸다)
			const section = el.parentElement;
			const isStuck = !!section && el.getBoundingClientRect().top - section.getBoundingClientRect().top > 0.5;
			setStuck(isStuck);
			// 지금 보는 항목: 막대 아래 줄을 지난 마지막 항목 (막대가 붙어 있을 때만, 아니면 강조 없음)
			const barBottom = el.getBoundingClientRect().bottom;
			let current: string | null = null;
			if (isStuck) {
				for (const { id } of groups.flatMap((g) => g.items)) {
					const target = document.getElementById(id);
					if (target && target.getBoundingClientRect().top <= barBottom + 80) current = id;
				}
				current ??= groups[0].items[0]?.id ?? null;
			}
			setActive(current);
		};
		// 헤더가 나타나고 숨을 때 막대도 0.3초 움직이므로, 움직임이 끝난 뒤 한 번 더 본다
		const checkSoon = () => {
			check();
			window.clearTimeout(timer);
			timer = window.setTimeout(check, 350);
		};
		checkSoon();
		window.addEventListener('scroll', checkSoon, { passive: true });
		window.addEventListener('resize', checkSoon);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('scroll', checkSoon);
			window.removeEventListener('resize', checkSoon);
		};
	}, [top, groups]);

	// 지금 보는 날짜가 날짜 줄 밖에 있으면 줄만 옆으로 밀어 가운데로 (페이지는 위아래로 움직이지 않게 scrollIntoView 대신).
	// 달이 막 바뀐 줄은 흐린 동안 바로 그 자리에 두어, 또렷해질 때 옆으로 미끄러지지 않게
	const centeredMonth = useRef(daysMonth);
	useEffect(() => {
		const list = daysRef.current;
		const button = active && list?.querySelector<HTMLElement>(`[data-target="${active}"]`);
		if (!list || !button) return;
		const fresh = centeredMonth.current !== daysMonth;
		centeredMonth.current = daysMonth;
		const left = button.offsetLeft - list.offsetLeft;
		if (fresh || left < list.scrollLeft || left + button.offsetWidth > list.scrollLeft + list.clientWidth) {
			list.scrollTo({ left: left - (list.clientWidth - button.offsetWidth) / 2, behavior: fresh ? 'auto' : 'smooth' });
		}
	}, [active, daysMonth]);

	// 펼친 달 목록: 바깥을 누르거나 Esc면 닫는다
	useDismiss({ open: !!open, refs: [ref], onClose: () => setOpen(null) });

	return (
		<div
			ref={ref}
			className={cx('np-mypage-month-bar-month-bar', 'month-bar', stuck && 'stuck')}
			style={{ top, ['--page-w' as string]: `${pageWidth}px` }}
		>
			{/* 달이 바뀌면 연도 · 월 글자는 숫자판처럼 넘어가고(아래로 보면 위로, 위로 보면 아래로), 날짜 줄은 흐려졌다 바뀐다 */}
			{/* 연도 · 월을 따로 고른다: '2026년 ▾' · '10월 ▾' */}
			<div className="month-title">
				<div className="picker">
					<button
						type="button"
						aria-haspopup="listbox"
						aria-expanded={open === 'year'}
						onClick={() => setOpen((v) => (v === 'year' ? null : 'year'))}
					>
						<Roll value={`${year}년`} enter={enter} />
						<LuChevronDown aria-hidden />
					</button>
					{open === 'year' && (
						<ul className="month-menu" role="listbox" aria-label="받은 해로 이동">
							{years.map((y) => {
								const yearMonths = months.filter((m) => m.month.startsWith(y));
								return (
									<li key={y} role="option" aria-selected={y === year}>
										<button
											type="button"
											onClick={() => {
												setOpen(null);
												// 그해에서 지금 정렬 순서로 가장 먼저 나오는 달로
												onJump(yearMonths[0]);
											}}
										>
											{y}년<span className="month-count">{yearMonths.reduce((n, m) => n + m.count, 0)}통</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
				<div className="picker">
					<button
						type="button"
						aria-haspopup="listbox"
						aria-expanded={open === 'month'}
						onClick={() => setOpen((v) => (v === 'month' ? null : 'month'))}
					>
						<Roll value={`${Number(month.slice(5))}월`} enter={enter} className="roll-month" />
						<LuChevronDown aria-hidden />
					</button>
					{open === 'month' && (
						<ul className="month-menu" role="listbox" aria-label={`${year}년 받은 달로 이동`}>
							{months
								.filter((m) => m.month.startsWith(year))
								.map((m) => (
									<li key={m.month} role="option" aria-selected={m.month === month}>
										<button
											type="button"
											onClick={() => {
												setOpen(null);
												onJump(m);
											}}
										>
											{Number(m.month.slice(5))}월<span className="month-count">{m.count}통</span>
										</button>
									</li>
								))}
						</ul>
					)}
				</div>
			</div>
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
					ref={daysRef}
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
		</div>
	);
}
