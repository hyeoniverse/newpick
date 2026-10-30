'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp } from 'react-icons/lu';

/** 바로 가기용 달 (서버가 거르기 · 정렬을 적용한 순서로 준다): 그 달 개수와 그 달 첫 항목의 순번 */
export interface MonthIndex {
	month: string;
	count: number;
	firstIndex: number;
}

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
		<LoadNewerStyled type="button" disabled={loading} onClick={onClick}>
			<LuChevronUp aria-hidden />
			{loading ? '불러오는 중…' : label}
		</LoadNewerStyled>
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
	useEffect(() => {
		if (!open) return;
		const close = (event: MouseEvent | KeyboardEvent) => {
			if (event instanceof KeyboardEvent ? event.key === 'Escape' : !ref.current?.contains(event.target as Node))
				setOpen(null);
		};
		document.addEventListener('mousedown', close);
		document.addEventListener('keydown', close);
		return () => {
			document.removeEventListener('mousedown', close);
			document.removeEventListener('keydown', close);
		};
	}, [open]);

	return (
		<MonthBarStyled
			ref={ref}
			className={`month-bar ${stuck ? 'stuck' : ''}`}
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
		</MonthBarStyled>
	);
}

const MonthBarStyled = styled.div`
	position: sticky;
	z-index: 5;
	padding: 1.25rem 1rem 1.125rem;
	text-align: center;
	transition: top 0.3s ease;

	/* 바탕 · 위아래 줄은 뒤 층에: 붙으면 화면 폭(--page-w)만큼 천천히 펼쳐진다. 달 목록이 잘리지 않게 막대 자체는 자르지 않는다 */
	&::before {
		content: '';
		position: absolute;
		z-index: -1;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 100%;
		transform: translateX(-50%);
		border-top: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};
		transition: width 0.6s ease;
	}

	&.stuck::before {
		width: var(--page-w, 100%);
	}

	/* 숫자판처럼 넘어가는 연도 · 월: 이전 값과 새 값을 한 칸에 겹쳐 두고 함께 위(또는 아래)로 민다 */
	.roll {
		display: inline-grid;
		overflow: hidden;

		> span {
			grid-area: 1 / 1;
			text-align: center;
		}

		/* 월은 한 자리 · 두 자리로 폭이 달라, 넘어간 뒤 제목이 옆으로 튀지 않게 두 자리 폭을 늘 잡아 둔다 */
		&.roll-month {
			min-width: 2.25em;
			font-variant-numeric: tabular-nums;
		}

		.roll-in.from-below {
			animation: roll-in-below 0.38s cubic-bezier(0.2, 0.7, 0.2, 1);
		}

		.roll-out.from-below {
			animation: roll-out-up 0.38s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
		}

		.roll-in.from-above {
			animation: roll-in-above 0.38s cubic-bezier(0.2, 0.7, 0.2, 1);
		}

		.roll-out.from-above {
			animation: roll-out-down 0.38s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
		}

		@media (prefers-reduced-motion: reduce) {
			.roll-in,
			.roll-out {
				animation-duration: 1ms;
			}
		}
	}

	@keyframes roll-in-below {
		from {
			opacity: 0;
			transform: translateY(100%);
		}
	}

	@keyframes roll-out-up {
		to {
			opacity: 0;
			transform: translateY(-100%);
		}
	}

	@keyframes roll-in-above {
		from {
			opacity: 0;
			transform: translateY(-100%);
		}
	}

	@keyframes roll-out-down {
		to {
			opacity: 0;
			transform: translateY(100%);
		}
	}

	/* 달 이름: 누르면 받은 달 목록 */
	.month-title {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		margin: 0 0 0.875rem;

		/* 연도 · 월 단추: 누르면 그 아래 목록 */
		.picker {
			position: relative;

			> button {
				display: inline-flex;
				align-items: center;
				gap: 0.25rem;
				padding: 0.125rem 0.375rem;
				border-radius: ${({ theme }) => theme.radius.control};
				font: inherit;
				font-size: ${({ theme }) => theme.fontSize.large};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};
				cursor: pointer;

				svg {
					width: 1.125rem;
					height: 1.125rem;
					color: ${({ theme }) => theme.color.subText};
					transition: transform 0.2s ease;
				}

				&[aria-expanded='true'] svg {
					transform: rotate(180deg);
				}

				&:hover {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}

	.month-menu {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 50%;
		z-index: 10;
		min-width: 9rem;
		max-height: 18rem;
		margin: 0;
		padding: 0.375rem;
		overflow-y: auto;
		list-style: none;
		transform: translateX(-50%);
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		text-align: left;

		button {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			width: 100%;
			padding: 0.5rem 0.625rem;
			border-radius: ${({ theme }) => theme.radius.control};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover {
				background: ${({ theme }) => theme.color.surface};
			}
		}

		[aria-selected='true'] button {
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		.month-count {
			font-size: 0.75rem;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 그 달에 받은 날짜 바로가기 (원래 디자인의 관심사 바로가기 자리) */
	/* 날짜 줄을 감싸 더 볼 수 있는 쪽에 흐림(마스크)과 화살표 */
	.days-wrap {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		--fade-left: 0px;
		--fade-right: 0px;

		&.more-left {
			--fade-left: 3rem;
		}

		&.more-right {
			--fade-right: 3rem;
		}

		.month-days {
			mask-image: linear-gradient(
				to right,
				transparent 0,
				#000 var(--fade-left),
				#000 calc(100% - var(--fade-right)),
				transparent 100%
			);
		}
	}

	.days-arrow {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: transparent;
		color: ${({ theme }) => theme.color.mediumGrey};
		/* 날짜 줄은 밑줄 자리만큼 아래 여백이 있어 글자 높이에 맞춘다 */
		margin-bottom: 0.25rem;
		cursor: pointer;
		visibility: hidden;

		&.show {
			visibility: visible;
		}

		svg {
			width: 1rem;
			height: 1rem;
		}

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 그 달에 받은 날짜 바로가기: 늘 한 줄, 넘치면 옆으로 밀어 본다 (다 들어가면 가운데) */
	.month-days {
		display: flex;
		flex-wrap: nowrap;
		justify-content: safe center;
		flex: 1;
		min-width: 0;
		gap: 1.25rem;
		margin: 0 0 -0.25rem;
		/* 아래 여백: 지금 보는 날짜의 밑줄이 가로 스크롤 상자에 잘리지 않게 */
		padding: 0 0 0.5rem;
		overflow-x: auto;
		list-style: none;
		transition: opacity 0.16s ease;

		/* 달이 바뀌는 동안 잠깐 흐려졌다가 새 달 날짜로 또렷해진다 */
		&.leaving {
			opacity: 0;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}

		/* 옆으로 밀어 보되 스크롤바는 숨긴다 (지금 보는 날짜로 저절로 옮겨 준다) */
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}

		li {
			flex-shrink: 0;
		}

		button {
			padding: 0;
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.small};
			white-space: nowrap;
			color: ${({ theme }) => theme.color.mediumGrey};
			cursor: pointer;
			transition: color 0.2s ease;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
			}

			/* 지금 보는 메일: 보라 · 밑줄 (굵기는 그대로 두어 줄이 흔들리지 않게) */
			&.active {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
				text-decoration-thickness: 2px;
				text-underline-offset: 0.375em;
			}
		}
	}
`;

const LoadNewerStyled = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	width: 100%;
	padding: 1rem;
	border: none;
	border-radius: 0;
	/* 위는 투명, 아래(달 막대 쪽)로 갈수록 진하게 */
	background: linear-gradient(
		to bottom,
		transparent 0%,
		color-mix(in srgb, ${({ theme }) => theme.color.tertiary} 50%, transparent) 45%,
		${({ theme }) => theme.color.tertiary} 100%
	);
	font: inherit;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	color: ${({ theme }) => theme.color.primary};
	cursor: pointer;
	transition: background-color 0.2s ease;

	svg {
		width: 1rem;
		height: 1rem;
		transition: transform 0.2s ease;
	}

	&:hover:not(:disabled) {
		background-color: ${({ theme }) => theme.color.tertiary};

		svg {
			transform: translateY(-2px);
		}
	}

	&:disabled {
		cursor: progress;
	}
`;
