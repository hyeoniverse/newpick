'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuMailPlus, LuMail, LuNewspaper } from 'react-icons/lu';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useTab } from '@/hooks/useTab';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import { useHeader } from '@/hooks/useHeader';
import MyMailSheet from '@/app/(protected)/mypage/_components/subscribe/MyMailSheet';
import EmptyState from '@/components/common/EmptyState';
import Image from '@/components/common/Image';
import StarToggle from '@/components/common/icons/StarToggle';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import FilterChips from '@/components/common/FilterChips';
import { errorStateFor, statusOf } from '@/constants/errors';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/useToast';
import FolderBar, { FolderFilter } from './folders/FolderBar';
import FolderMenu from './folders/FolderMenu';
import ListHead, { SortSelect } from './list/ListHead';

/** 한 번에 받아 오는 메일 수 (무한 스크롤 한 묶음, 서버는 20통까지) */
const PAGE_SIZE = 10;

interface MailNewsletter {
	id: number;
	title: string;
	subtitle: string | null;
	image: string | null;
	summary: string | null;
	createdAt: string;
	category: { id: number; name: string };
}

interface Mail {
	sentAt: string;
	/** 메일 제목 (발송 때와 같은 방식으로 다시 만든 것) */
	subject: string | null;
	newsletters: MailNewsletter[];
	starred: boolean;
	folderId: number | null;
	/** 메일의 짜임새 (발송 때처럼 고른 분야로 다시 엮은 것). 편집본 · 소식이 없으면 null */
	digest: MailDigest | null;
}

/** 받은 메일은 사이트 뉴스레터를 그대로 붙인 게 아니라, 그날 편집본으로 고른 분야만 다시 엮은 것 */
interface MailDigest {
	/** 오늘 한눈에: 고른 분야 전체에서 중요도 순 */
	top: { category: string; heading: string; line: string }[];
	/** 분야를 넘는 흐름 (고른 분야끼리만) */
	threads: { title: string; text: string; categories: string[] }[];
	/** 분야별 소식 (같은 사건은 한 번만, 다른 분야에도 실렸으면 alsoIn) */
	sections: {
		category: string;
		newsletterId: number;
		title: string;
		stories: { heading: string; alsoIn: string[] }[];
	}[];
	/** 관전 포인트 */
	watch: string[];
}

interface MonthIndex {
	month: string;
	count: number;
	firstIndex: number;
}

interface MailsPage {
	items: Mail[];
	total: number;
	/** 달 이동용: 거르기 · 정렬을 적용한 순서로 달마다 통수와 그 달 첫 메일의 순번 */
	months?: MonthIndex[];
	/** 거르기와 상관없는 개수: 전체 · 중요 · 폴더 없음 */
	counts: { all: number; starred: number; unfiled: number };
}

/** 받은 메일 한 통 표시 (중요 · 폴더). 목록 · 폴더 개수를 다시 받는다 */
const useMarkMail = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (body: { sentAt: string; starred?: boolean; folderId?: number | null }) =>
			apiFetch(API_ENDPOINTS.MY.MAIL_MARK(), { method: 'PATCH', body }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['myMails'] });
			queryClient.invalidateQueries({ queryKey: ['folders'] });
		},
		onError: () => showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요.', 'error'),
	});
};

/** '10월 27일 (월) 오전 8:40' (한국 시각) */
const sentText = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(iso));

/** 날짜 막대: '2026년 10월 27일 (화)' (한국 시각) */
/** 메일 날짜 줄: '27일 (화)' (달은 위 달 막대에, 한국 시각) */
const issueDate = (iso: string) => {
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(new Date(iso));
	return `${part({ day: 'numeric' })} (${part({ weekday: 'short' })})`;
};

/** 달 막대 바로가기: '27일' */
const dayLabel = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', day: 'numeric' }).format(new Date(iso));

/** 받은 달 (한국 시각 'YYYY-MM') */
const monthOf = (iso: string) =>
	new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso)).slice(0, 7);

/** 달 막대: '2026년 10월' */
const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;

/** 받은 순서 그대로 달별로 묶는다 */
function byMonth(items: Mail[]) {
	const groups: { month: string; items: Mail[] }[] = [];
	for (const item of items) {
		const month = monthOf(item.sentAt);
		const last = groups[groups.length - 1];
		if (last?.month === month) last.items.push(item);
		else groups.push({ month, items: [item] });
	}
	return groups;
}

/**
 * 달 막대 (원래 마이페이지의 날짜 막대처럼): 큰 '2026년 10월 ▾' + 이 쪽에서 그 달에 받은 날짜 바로가기('27일 · 24일 …').
 * 위에 붙어 따라오고, 붙는 순간 바탕 · 위아래 줄이 화면 양끝까지 천천히 펼쳐진다 (원래 디자인의 full-width).
 * 달 이름을 누르면 받은 달 목록이 펼쳐져 다른 달로 바로 간다
 */
function MonthBar({
	month,
	mails,
	top,
	months,
	onJump,
}: {
	month: string;
	mails: Mail[];
	top: string;
	months: MonthIndex[];
	onJump: (month: MonthIndex) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [stuck, setStuck] = useState(false);
	// 지금 보고 있는 메일 (달 막대 바로 아래에 와 있는 것)의 보낸 시각
	const [active, setActive] = useState<string | null>(null);
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
	}, [mails]);
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
			// 붙어 있으면 막대가 자기 달 묶음의 시작보다 아래에 와 있다. 헤더가 나타나고 숨으며 막대가 움직이는 동안에도
			// 이 관계는 그대로라 너비가 줄었다 늘었다 하지 않는다 (예전엔 붙는 높이와 비교해 움직이는 0.3초 동안 풀렸다)
			const section = el.parentElement;
			const isStuck = !!section && el.getBoundingClientRect().top - section.getBoundingClientRect().top > 0.5;
			setStuck(isStuck);
			// 지금 보는 메일: 막대 아래 줄을 지난 마지막 메일 (막대가 붙어 있을 때만, 아니면 강조 없음)
			const barBottom = el.getBoundingClientRect().bottom;
			let current: string | null = null;
			if (isStuck) {
				for (const mail of mails) {
					const item = document.getElementById(`mail-${mail.sentAt}`);
					if (item && item.getBoundingClientRect().top <= barBottom + 80) current = mail.sentAt;
				}
				current ??= mails[0]?.sentAt ?? null;
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
	}, [top, mails]);

	// 지금 보는 날짜가 날짜 줄 밖에 있으면 줄만 옆으로 밀어 가운데로 (페이지는 위아래로 움직이지 않게 scrollIntoView 대신)
	useEffect(() => {
		const list = daysRef.current;
		const button = active && list?.querySelector<HTMLElement>(`[data-sent="${active}"]`);
		if (!list || !button) return;
		const left = button.offsetLeft - list.offsetLeft;
		if (left < list.scrollLeft || left + button.offsetWidth > list.scrollLeft + list.clientWidth) {
			list.scrollTo({ left: left - (list.clientWidth - button.offsetWidth) / 2, behavior: 'smooth' });
		}
	}, [active]);

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
		<div
			ref={ref}
			className={`month-bar ${stuck ? 'stuck' : ''}`}
			style={{ top, ['--page-w' as string]: `${pageWidth}px` }}
		>
			{/* 연도 · 월을 따로 고른다: '2026년 ▾' · '10월 ▾' */}
			<div className="month-title">
				<div className="picker">
					<button
						type="button"
						aria-haspopup="listbox"
						aria-expanded={open === 'year'}
						onClick={() => setOpen((v) => (v === 'year' ? null : 'year'))}
					>
						{year}년
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
						{Number(month.slice(5))}월
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
				{edges.left && (
					<button type="button" className="days-arrow left" aria-label="앞 날짜 보기" onClick={() => slide(-1)}>
						<LuChevronLeft aria-hidden />
					</button>
				)}
				<ul ref={daysRef} className="month-days" aria-label={`${monthLabel(month)}에 받은 메일`} onScroll={updateEdges}>
					{mails.map((mail) => (
						<li key={mail.sentAt}>
							<button
								type="button"
								data-sent={mail.sentAt}
								className={mail.sentAt === active ? 'active' : undefined}
								aria-current={mail.sentAt === active ? 'true' : undefined}
								onClick={() =>
									document.getElementById(`mail-${mail.sentAt}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
								}
							>
								{dayLabel(mail.sentAt)}
							</button>
						</li>
					))}
				</ul>
				{edges.right && (
					<button type="button" className="days-arrow right" aria-label="뒤 날짜 보기" onClick={() => slide(1)}>
						<LuChevronRight aria-hidden />
					</button>
				)}
			</div>
		</div>
	);
}

/**
 * 내 뉴스레터: 내가 실제로 받은 메일함 (보낸 시각별 한 통씩, 최신부터). 누르면 받은 그대로의 메일.
 * 예전엔 오늘 내 관심사 뉴스레터를 보여 줘, 관심사를 바꾼 뒤엔 받은 적 없는 것이 섞였다
 */
export default function MySubscribe() {
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const { status: isSubscribed = user?.isSubscribed } = useSubscribe();
	const { openModal } = useModal();
	// 달 막대가 붙는 높이: 헤더가 보이면(위로 스크롤) 그 아래, 숨으면 맨 위
	const { headerHeight } = useHeader();
	// 달 막대에서 고른 달: 그 달 첫 메일이 있는 쪽으로 넘기고, 받아 오면 그 달 묶음으로 스크롤
	const [pendingMonth, setPendingMonth] = useState<string | null>(null);
	// 목록이 시작하는 순번: 보통 0(맨 위), 달 · 연도로 건너뛰면 그 달 첫 메일 순번부터 (위로는 '더 최근 메일 보기')
	const [startOffset, setStartOffset] = useState(0);
	const [folder, setFolder] = useState<FolderFilter>('all');
	const [starred, setStarred] = useState(false);
	const [order, setOrder] = useState<'desc' | 'asc'>('desc');
	const { data: folders = [] } = useFolders();
	const mark = useMarkMail();
	// 끄는 중인 메일 (보낸 시각). 끄는 동안 폴더 줄 · 화면 위 폴더 칸에 놓으면 옮긴다
	const [dragging, setDragging] = useState<string | null>(null);

	const filters = new URLSearchParams({
		...(starred && { starred: 'true' }),
		...(folder !== 'all' && { folder: String(folder) }),
		...(order === 'asc' && { order }),
	}).toString();
	// 무한 스크롤: 아래 끝에 닿으면 다음 묶음, 맨 위 '더 최근 메일 보기'로 앞 묶음 (달 · 연도로 건너뛴 뒤)
	const {
		data: pages,
		isPending,
		isError,
		error,
		refetch,
		fetchNextPage,
		fetchPreviousPage,
		hasNextPage,
		hasPreviousPage,
		isFetchingNextPage,
		isFetchingPreviousPage,
	} = useInfiniteQuery({
		queryKey: ['myMails', user?.id, filters, startOffset],
		queryFn: async ({ pageParam }) => ({
			...(await apiFetch<MailsPage>(API_ENDPOINTS.MY.MAILS(pageParam, PAGE_SIZE, filters))),
			offset: pageParam,
		}),
		initialPageParam: startOffset,
		getNextPageParam: (last) => (last.offset + last.items.length < last.total ? last.offset + PAGE_SIZE : undefined),
		getPreviousPageParam: (first) => (first.offset > 0 ? Math.max(0, first.offset - PAGE_SIZE) : undefined),
		enabled: !!user,
		placeholderData: (previous) => previous,
	});
	// 앞 묶음이 겹치지 않게 (건너뛴 자리가 PAGE_SIZE의 배수가 아니면 앞 묶음 끝이 겹칠 수 있다)
	const seen = new Set<string>();
	const allItems = (pages?.pages ?? [])
		.flatMap((p) => p.items)
		.filter((m) => !seen.has(m.sentAt) && seen.add(m.sentAt));
	const latest = pages?.pages[pages.pages.length - 1];
	const data = latest && { ...latest, items: allItems };

	// 아래 끝 표시: 화면에 들어오면 다음 묶음
	const endRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = endRef.current;
		if (!el || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
			},
			{ rootMargin: '400px 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, allItems.length]);

	// 거르기를 바꾸면 맨 위부터
	const refilter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setStartOffset(0);
		};

	// 달 · 연도로 가기: 이미 받아 온 달이면 그 자리로, 아니면 그 달 첫 메일부터 새로 받아 와서
	const jumpToMonth = (target: MonthIndex) => {
		setPendingMonth(target.month);
		if (!document.getElementById(`month-${target.month}`)) setStartOffset(target.firstIndex);
	};
	useEffect(() => {
		if (!pendingMonth || !pages) return;
		const section = document.getElementById(`month-${pendingMonth}`);
		if (!section) return;
		section.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setPendingMonth(null);
	}, [pages, pendingMonth]);

	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;

	if (!user || isPending || !data) {
		return (
			<MySubscribeStyled aria-busy>
				<div className="cards">
					<Skeleton />
				</div>
			</MySubscribeStyled>
		);
	}

	if (data.counts.all === 0) {
		// 받은 메일이 없으면: 구독 중이면 기다리라고, 아니면 구독하라고
		return isSubscribed === null ? (
			<EmptyState
				icon={LuMailPlus}
				title="아직 구독하지 않았어요"
				description={'관심사를 고르면 매일 아침 8시 40분에\n그 관심사만 엮은 뉴스레터를 보내 드려요.'}
				action={{ label: '구독 시작하기', onClick: () => setActiveTab('settings') }}
			/>
		) : (
			<EmptyState
				icon={LuMail}
				title="아직 받은 메일이 없어요"
				description={'매일 아침 8시 40분에 첫 메일이 가요.\n보낸 메일은 여기에 날짜별로 모여요.'}
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	const folderName = new Map(folders.map((f) => [f.id, f.name]));

	return (
		<MySubscribeStyled>
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.mails}
				allLabel="모든 메일"
				value={folder}
				onChange={refilter(setFolder)}
				total={data.counts.all}
				unfiled={data.counts.unfiled}
				dragging={dragging ? 1 : 0}
				onDropTo={(folderId) => {
					if (dragging) mark.mutate({ sentAt: dragging, folderId });
					setDragging(null);
				}}
			/>
			<ListHead title="받은 메일" count={data.total}>
				<FilterChips
					label="보기"
					options={[
						{ value: '', label: '전체' },
						{ value: 'starred', label: `중요 ${data.counts.starred}` },
					]}
					value={starred ? 'starred' : ''}
					onChange={refilter((value: string) => setStarred(value === 'starred'))}
				/>
				<SortSelect
					value={order}
					options={[
						{ value: 'desc', label: '최신순' },
						{ value: 'asc', label: '오래된순' },
					]}
					onChange={refilter(setOrder)}
				/>
			</ListHead>
			{/* 달 · 연도로 건너뛰었으면 위로 더 최근 메일 */}
			{hasPreviousPage && (
				<button
					type="button"
					className="load-newer"
					disabled={isFetchingPreviousPage}
					onClick={() => fetchPreviousPage()}
				>
					{isFetchingPreviousPage ? '불러오는 중…' : '더 최근 메일 보기'}
				</button>
			)}
			{data.total === 0 ? (
				<p className="empty">이 조건의 메일이 없어요.</p>
			) : (
				/* 받은편지함: 한 줄이 메일 한 통. 누르면 받은 그대로의 메일을 시트로 */
				/* 원래 마이페이지(/legacy/mypage)의 '오늘의 뉴스레터' 모양: 받은 메일마다 날짜 막대(날짜 · 관심사 바로가기)와
				   그 메일의 뉴스레터들(관심사 › · 제목 · 그림 + AI 요약 상자). 중요 · 폴더 · 메일 보기는 날짜 막대 오른쪽 */
				/* 받은 달로 묶고, 달 막대(원래 디자인의 날짜 막대 모양)는 위에 붙어 따라온다 — 헤더가 보이면 그 아래에 */
				byMonth(data.items).map(({ month, items }) => (
					<section key={month} id={`month-${month}`} className="month" aria-label={monthLabel(month)}>
						<MonthBar month={month} mails={items} top={headerHeight} months={data.months ?? []} onJump={jumpToMonth} />
						<ol className="issues">
							{items.map((mail) => (
								<li key={mail.sentAt} className="issue" id={`mail-${mail.sentAt}`}>
									<div
										className="issue-head"
										draggable
										onDragStart={(event) => {
											event.dataTransfer.effectAllowed = 'move';
											event.dataTransfer.setData('text/plain', mail.subject ?? '');
											setDragging(mail.sentAt);
										}}
										onDragEnd={() => setDragging(null)}
									>
										<time className="issue-date" dateTime={mail.sentAt} title={sentText(mail.sentAt)}>
											{issueDate(mail.sentAt)}
										</time>
										<div className="issue-actions">
											{folder === 'all' && mail.folderId && (
												<span className="folder-tag">{folderName.get(mail.folderId)}</span>
											)}
											<FolderMenu
												className="mail-folder"
												label="폴더"
												current={mail.folderId}
												onPick={(folderId) => mark.mutate({ sentAt: mail.sentAt, folderId })}
											/>
										</div>
									</div>
									{/* 원래 디자인의 뉴스레터 블록 하나에 메일 한 통: 메일 제목 · 그림 | 오늘 한눈에 상자 (메일은 분야를 합쳐 한 통이라 관심사 줄은 없음) */}
									{(() => {
										const first = mail.newsletters.find((n) => n.image) ?? mail.newsletters[0];
										const openMail = () => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' });
										return (
											<article className="news">
												<button type="button" className="news-title" onClick={openMail}>
													<h3>{mail.subject ?? first?.title}</h3>
												</button>
												<div className="news-body">
													<div className="news-media">
														<button type="button" className="news-image" tabIndex={-1} aria-hidden onClick={openMail}>
															{first?.image ? (
																<Image src={first.image} alt="" ratio="wide" borderRadius="medium" priority={false} />
															) : (
																<LuNewspaper />
															)}
														</button>
														{first && (
															/* 받은 메일은 사이트 기사가 아니라 북마크 대신 중요 표시만 (북마크는 기사 화면에서) */
															<div className="news-icons">
																<StarToggle
																	pressed={mail.starred}
																	onToggle={() => mark.mutate({ sentAt: mail.sentAt, starred: !mail.starred })}
																/>
															</div>
														)}
													</div>
													<div className="news-summary">
														{mail.digest?.top.length ? (
															<>
																<strong>오늘 한눈에</strong>
																<ol className="glance">
																	{mail.digest.top.map((t, i) => (
																		<li key={t.heading}>
																			<span className="glance-no">{String(i + 1).padStart(2, '0')}</span>
																			<div>
																				<p className="glance-head">
																					<span className="glance-cat">{t.category}</span>
																					{t.heading}
																				</p>
																				<p className="glance-line">{t.line}</p>
																			</div>
																		</li>
																	))}
																</ol>
															</>
														) : (
															<>
																<strong>요약</strong>
																<p>{first?.summary ?? first?.subtitle ?? ''}</p>
															</>
														)}
														<p className="summary-more">
															{!!mail.digest?.threads.length && (
																<span>분야를 넘는 흐름 {mail.digest.threads.length}</span>
															)}
															{!!mail.digest?.watch.length && <span>관전 포인트 {mail.digest.watch.length}</span>}
															<button type="button" onClick={openMail}>
																메일로 보기 <LuChevronRight aria-hidden />
															</button>
														</p>
													</div>
												</div>
											</article>
										);
									})()}
								</li>
							))}
						</ol>
					</section>
				))
			)}
			{/* 무한 스크롤: 이 표시가 보이면 다음 묶음 */}
			<div ref={endRef} className="list-end" aria-hidden />
			{isFetchingNextPage && <p className="list-status">메일을 더 불러오는 중…</p>}
			{!hasNextPage && data.total > PAGE_SIZE && <p className="list-status">받은 메일을 모두 봤어요.</p>}
		</MySubscribeStyled>
	);
}

const MySubscribeStyled = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	/* 위 여백은 탭 줄이 둔다 */
	padding: 0 0 2rem;

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.list-end {
		height: 1px;
	}

	.list-status {
		margin: 0;
		padding: 1rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.load-newer {
		align-self: center;
		padding: 0.5rem 1rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		font: inherit;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover:not(:disabled) {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 받은 메일 한 통 = 원래 마이페이지의 '오늘의 뉴스레터' 한 묶음 */
	/* 달 묶음: 원래 디자인의 날짜 막대 모양(연한 바탕 · 위아래 줄 · 가운데 굵은 글자)으로 위에 붙어 따라온다 */
	.month + .month {
		margin-top: 2.5rem;
	}

	.month-bar {
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
		position: relative;
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
		position: absolute;
		top: 50%;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: ${({ theme }) => theme.color.background};
		color: ${({ theme }) => theme.color.mediumGrey};
		transform: translateY(-60%);
		cursor: pointer;

		&.left {
			left: -0.5rem;
		}

		&.right {
			right: -0.5rem;
		}

		svg {
			width: 1rem;
			height: 1rem;
		}

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 그 달에 받은 날짜 바로가기: 늘 한 줄, 넘치면 옆으로 밀어 본다 (다 들어가면 가운데) */
	.month-days {
		display: flex;
		flex-wrap: nowrap;
		justify-content: safe center;
		gap: 1.25rem;
		margin: 0 -1rem -0.25rem;
		/* 아래 여백: 지금 보는 날짜의 밑줄이 가로 스크롤 상자에 잘리지 않게 */
		padding: 0 1rem 0.5rem;
		overflow-x: auto;
		list-style: none;
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

	.issues {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* 날짜 바로가기로 왔을 때 헤더 · 달 막대에 가리지 않게 */
	.issue {
		scroll-margin-top: 10rem;
	}

	.issue + .issue {
		border-top: 1px solid ${({ theme }) => theme.color.border};
	}

	/* 메일 날짜 줄: '27일 (화)' · 오른쪽 폴더 (끌어서 폴더에 넣는 손잡이) */
	.issue-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1.5rem 0 0;
	}

	.issue-date {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
	}

	.issue-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.text-btn,
	.mail-folder .trigger {
		padding: 0.25rem;
		font: inherit;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}

	.glance {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			gap: 0.875rem;
		}

		p {
			margin: 0;
			word-break: keep-all;
		}
	}

	/* 소식 번호: 원래 뉴스레터 본문의 번호와 같은 보라 굵은 숫자 */
	.glance-no {
		flex-shrink: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
		font-variant-numeric: tabular-nums;
	}

	.glance-head {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
	}

	.glance-cat {
		margin-right: 0.5rem;
		font-size: 0.75rem;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	.glance-line {
		margin-top: 0.25rem !important;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	/* 상자 아래: 흐름 · 관전 포인트 수 · 메일로 보기 */
	.summary-more {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.875rem;
		margin: 1rem 0 0 !important;
		padding-top: 0.75rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		font-size: 0.75rem !important;
		color: ${({ theme }) => theme.color.subText} !important;

		button {
			display: inline-flex;
			align-items: center;
			gap: 0.125rem;
			margin-left: auto;
			padding: 0;
			font: inherit;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
			cursor: pointer;

			svg {
				width: 0.875rem;
				height: 0.875rem;
			}

			&:hover {
				text-decoration: underline;
			}
		}
	}

	/* 뉴스레터 하나: 관심사 › · 큰 제목 · 그림(+ 북마크 · 링크 복사) | AI 요약 상자, 사이는 가는 줄 */
	.news {
		padding: 0.75rem 0 2rem;
		scroll-margin-top: 6rem;
	}

	.news-title {
		display: block;
		margin-bottom: 1.5rem;
		padding: 0;
		text-align: left;
		color: inherit;
		cursor: pointer;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			word-break: keep-all;
		}

		&:hover h3 {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.news-body {
		display: flex;
		gap: 1.25rem;
	}

	.news-media {
		flex: 1;
		min-width: 0;
	}

	.news-image {
		display: flex;
		width: 100%;
		padding: 0;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		> div {
			width: 100%;
		}

		> svg {
			width: 1.75rem;
			height: 1.75rem;
		}
	}

	.news-icons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.news-summary {
		flex: 3;
		min-width: 0;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		strong {
			display: block;
			margin-bottom: 0.625rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		p {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			line-height: 1.75;
			color: ${({ theme }) => theme.color.mediumGrey};
			word-break: keep-all;
		}
	}

	.folder-tag {
		padding: 0 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.background};
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 좁은 화면: 날짜 막대의 단추들은 날짜 아래로, 그림 위 · 요약 아래로 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.news-body {
			flex-direction: column;
		}

		.news-title h3 {
			font-size: ${({ theme }) => theme.fontSize.medium};
		}
	}
`;
