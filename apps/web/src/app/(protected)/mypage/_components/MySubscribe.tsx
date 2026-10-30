'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuChevronRight, LuMailPlus, LuMail, LuNewspaper } from 'react-icons/lu';
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
import { newsBlock } from './list/newsBlock';
import MonthBar, { LoadNewer, MonthIndex, byMonth, monthLabel, useMonthJump } from './list/MonthBar';

/** 작은 화면에서 오늘 한눈에를 몇 개까지 보일지 (나머지는 '외 N개') */
const GLANCE_SMALL = 3;

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
	// 달 막대에서 고른 달로: 그 달 첫 메일 순번부터 받아 와서 그 달 묶음으로 스크롤 (위로는 '더 최근 메일 보기')
	const { startOffset, setStartOffset, jumpToMonth } = useMonthJump();
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
	const groups = byMonth(data.items, (mail) => mail.sentAt);
	// 달 막대 날짜 바로가기: 메일마다 (하루 한 통)
	const barGroups = groups.map(({ month, items }) => ({
		month,
		items: items.map((mail) => ({ id: `mail-${mail.sentAt}`, at: mail.sentAt })),
	}));

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
			{data.total === 0 ? (
				<p className="empty">이 조건의 메일이 없어요.</p>
			) : (
				/* 받은편지함: 한 줄이 메일 한 통. 누르면 받은 그대로의 메일을 시트로 */
				/* 원래 마이페이지(/legacy/mypage)의 '오늘의 뉴스레터' 모양: 받은 메일마다 날짜 막대(날짜 · 관심사 바로가기)와
				   그 메일의 뉴스레터들(관심사 › · 제목 · 그림 + AI 요약 상자). 중요 · 폴더 · 메일 보기는 날짜 막대 오른쪽 */
				/* 받은 달로 묶고, 달 막대(원래 디자인의 날짜 막대 모양)는 위에 붙어 따라온다 — 헤더가 보이면 그 아래에 */
				<div className="inbox">
					{/* 달 · 연도로 건너뛰었으면 위로 더 최근 메일 (달 막대 바로 위에 틈 없이) */}
					{hasPreviousPage && (
						<LoadNewer label="더 최근 메일 보기" loading={isFetchingPreviousPage} onClick={() => fetchPreviousPage()} />
					)}
					<div className="months">
						<MonthBar
							groups={barGroups}
							top={headerHeight}
							months={data.months ?? []}
							onJump={jumpToMonth}
							noun="받은 메일"
						/>
						{groups.map(({ month, items }) => (
							<section key={month} id={`month-${month}`} className="month" aria-label={monthLabel(month)}>
								<ol className="issues">
									{items.map((mail) => (
										<li
											key={mail.sentAt}
											className="issue"
											id={`mail-${mail.sentAt}`}
											title={sentText(mail.sentAt)}
											// 메일 블록을 끌어 폴더 칸에 놓으면 그 폴더로
											draggable
											onDragStart={(event) => {
												event.dataTransfer.effectAllowed = 'move';
												event.dataTransfer.setData('text/plain', mail.subject ?? '');
												setDragging(mail.sentAt);
											}}
											onDragEnd={() => setDragging(null)}
										>
											{/* 원래 디자인의 뉴스레터 블록 하나에 메일 한 통: 메일 제목 · 그림 | 오늘 한눈에 상자 (메일은 분야를 합쳐 한 통이라 관심사 줄은 없음) */}
											{(() => {
												const first = mail.newsletters.find((n) => n.image) ?? mail.newsletters[0];
												const openMail = () => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' });
												const categories = [
													...new Set(
														mail.digest?.sections.map((section) => section.category) ??
															mail.newsletters.map((n) => n.category.name),
													),
												];
												return (
													<article className="news">
														{/* 제목 줄: 왼쪽 메일 제목, 오른쪽 끝 중요 표시 · 폴더 (메일 하나에 대한 동작을 제목 옆에 모음) */}
														<div className="news-head">
															<button type="button" className="news-title" onClick={openMail}>
																<h3>{mail.subject ?? first?.title}</h3>
															</button>
															{/* 받은 메일은 사이트 기사가 아니라 북마크 대신 중요 표시만 (북마크는 기사 화면에서). 제목이 여러 줄이어도 첫 줄 높이에 맞춘다 */}
															<div className="news-icons">
																<StarToggle
																	pressed={mail.starred}
																	onToggle={() => mark.mutate({ sentAt: mail.sentAt, starred: !mail.starred })}
																/>
																<FolderMenu
																	className="mail-folder"
																	label={
																		folder === 'all' && mail.folderId
																			? `폴더 · ${folderName.get(mail.folderId)}`
																			: '폴더'
																	}
																	current={mail.folderId}
																	onPick={(folderId) => mark.mutate({ sentAt: mail.sentAt, folderId })}
																/>
															</div>
														</div>
														<div className="news-body">
															<div className="news-media">
																<button
																	type="button"
																	className="news-image"
																	tabIndex={-1}
																	aria-hidden
																	onClick={openMail}
																>
																	{first?.image ? (
																		<Image
																			src={first.image}
																			alt=""
																			ratio="wide"
																			borderRadius="medium"
																			priority={false}
																		/>
																	) : (
																		<LuNewspaper />
																	)}
																</button>
																{/* 이 메일에 엮인 분야: 그림 바로 아래 (맞춤 메일이라 한 통에 여러 분야, 메일의 분야별 소식 순서대로) */}
																{categories.length > 0 && (
																	<ul className="news-cats" aria-label="분야">
																		{categories.map((name) => (
																			<li key={name}>{name}</li>
																		))}
																	</ul>
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
																	{/* 작은 화면에선 오늘 한눈에를 앞 3개만 보여 주고 나머지 수를 (큰 화면에선 숨김) */}
																	{(mail.digest?.top.length ?? 0) > GLANCE_SMALL && (
																		<span className="glance-rest">
																			오늘 한눈에 외 {(mail.digest?.top.length ?? 0) - GLANCE_SMALL}개
																		</span>
																	)}
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
						))}
					</div>
				</div>
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

	/* 받은 메일 한 통 = 원래 마이페이지의 '오늘의 뉴스레터' 한 묶음 */
	/* 달 묶음: 원래 디자인의 날짜 막대 모양(연한 바탕 · 위아래 줄 · 가운데 굵은 글자)으로 위에 붙어 따라온다 */
	/* '더 최근 메일 보기' · 달 막대 · 달 묶음을 틈 없이 한 상자로 (바깥 목록의 칸 사이 간격을 받지 않게) */
	.inbox,
	.months {
		display: flex;
		flex-direction: column;
	}

	/* 달로 건너뛰었을 때 헤더 · 달 막대에 가리지 않게 */
	.month {
		scroll-margin-top: calc(var(--bar-h, 7rem) + 3rem);
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
		scroll-margin-top: calc(var(--bar-h, 7rem) + 3rem);
	}

	.issue + .issue {
		border-top: 1px solid ${({ theme }) => theme.color.border};
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

	/* 작은 화면에서만 보이는 '오늘 한눈에 외 N개' */
	.glance-rest {
		display: none;
	}

	@container news (max-width: 28rem) {
		.glance-rest {
			display: inline;
		}
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

	${newsBlock}

	/* 작은 화면(좁은 블록): 오늘 한눈에 상자도 촘촘하게 */
	@container news (max-width: 28rem) {
		.news .news-summary strong {
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		/* 내용도 줄인다: 앞 3개(GLANCE_SMALL)만, 요약은 한 줄로 자름 */
		.news .glance > li:nth-child(n + 4) {
			display: none;
		}

		.news .news-summary .glance-line {
			display: -webkit-box;
			-webkit-line-clamp: 1;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.news .glance {
			gap: 0.625rem;

			li {
				gap: 0.5rem;
			}
		}

		.news .glance-no,
		.news .glance-head {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		.news .glance-cat {
			margin-right: 0.375rem;
		}

		.news .news-summary .glance-line {
			margin-top: 0.125rem !important;
			font-size: 0.8125rem;
			line-height: 1.5;
		}

		.news .news-summary .summary-more {
			margin-top: 0.75rem !important;
			padding-top: 0.5rem;
		}
	}

	.news-summary {
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
`;
