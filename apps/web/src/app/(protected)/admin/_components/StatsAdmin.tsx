'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import Title from '@/components/common/Title';
import TrendChart from '@/components/common/charts/TrendChart';
import BarList from '@/components/common/charts/BarList';
import AdminSubPage from './AdminSubPage';
import { PRESETS, useAdminQuery } from './period';
import { usd } from './format';

type Runs = { success: number; partial: number; failed: number; skipped: number };

interface SubscriberStats {
	since: string | null;
	days: { date: string; subscribe: number; resume: number; pause: number; cancel: number; active: number }[];
	totals: { subscribe: number; resume: number; pause: number; cancel: number; activeStart: number; activeEnd: number };
	active: number;
	byCategory: { id: number; name: string; active: number }[];
}

interface CostStats {
	total: number;
	count: number;
	unknown: number;
	failed: number;
	newsletters: number;
	perNewsletter: number | null;
	days: { date: string; cost: number }[];
	byType: { key: string; cost: number; count: number }[];
	byModel: { key: string; cost: number }[];
	byStage: { key: string; cost: number }[];
	byCategory: { id: number | null; name: string | null; cost: number }[];
	month: { month: string; toDate: number; projected: number; elapsedDays: number; daysInMonth: number };
}

interface DeliveryStats {
	days: { date: string; recipients: number; mails: number; runs: Runs }[];
	totals: { recipients: number; mails: number; runs: Runs };
	views: {
		total: number;
		byCategory: { id: number; name: string; views: number; newsletters: number }[];
		top: { id: number; title: string; category: string | null; viewcount: number }[];
	};
}

const TYPE_LABEL: Record<string, string> = {
	summarization: '뉴스레터 쓰기',
	category: '기사 분류',
	edition: '하루 편집',
};
const STAGE_LABEL: Record<string, string> = {
	select: '고르기',
	write: '쓰기',
	category: '분류',
	edition: '편집',
	summarization: '뉴스레터 쓰기',
	mixed: '나눔 모름 (이전 기록)',
};
/** 'claude-haiku-5-5' → 'Haiku 5.5' */
const modelName = (model: string) =>
	model === 'mixed'
		? '나눔 모름 (이전 기록)'
		: model
				.replace(/^claude-/, '')
				.replace(/-(\d+)(?:-(\d+))?.*$/, (_, a, b) => ` ${a}${b ? `.${b}` : ''}`)
				.replace(/^\w/, (c) => c.toUpperCase());

const people = (n: number) => `${n.toLocaleString()}명`;
const money = (n: number) => usd(n);

/** 최근 30일 (통계는 추이를 보는 화면이라 기본 기간이 하루가 아니다) */
const DEFAULT_PRESET = PRESETS.find((p) => p.key === '30d')!;

/**
 * 관리자 통계 (#122): 구독자 · AI 비용 · 발송 · 읽기의 날짜별 추이. 영역마다 숫자 칸 → 그래프 → 나눔, 표로도 본다
 */
export default function StatsAdmin() {
	const searchParams = useSearchParams();
	const { from, to, set } = useAdminQuery();
	// 주소에 기간이 없으면 최근 30일로 (하루치로는 추이가 안 보여서)
	const noPeriod = !searchParams.get('from');
	useEffect(() => {
		if (noPeriod) set(DEFAULT_PRESET.range());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [noPeriod]);

	const query = `from=${from}&to=${to}`;
	const enabled = !noPeriod;
	const subscribers = useQuery({
		queryKey: ['adminStats', 'subscribers', query],
		queryFn: () =>
			apiFetch<{ data: SubscriberStats }>(API_ENDPOINTS.ADMIN.STATS('subscribers', query)).then((r) => r.data),
		enabled,
		placeholderData: (previous) => previous,
	});
	const cost = useQuery({
		queryKey: ['adminStats', 'cost', query],
		queryFn: () => apiFetch<{ data: CostStats }>(API_ENDPOINTS.ADMIN.STATS('cost', query)).then((r) => r.data),
		enabled,
		placeholderData: (previous) => previous,
	});
	const delivery = useQuery({
		queryKey: ['adminStats', 'delivery', query],
		queryFn: () => apiFetch<{ data: DeliveryStats }>(API_ENDPOINTS.ADMIN.STATS('delivery', query)).then((r) => r.data),
		enabled,
		placeholderData: (previous) => previous,
	});

	return (
		<AdminSubPage title="통계">
			<StyledStats>
				<Section id="stats-subscribers" title="구독자" state={subscribers}>
					{(s) => {
						const dates = s.days.map((d) => d.date);
						const change = s.totals.activeEnd - s.totals.activeStart;
						return (
							<>
								<dl className="numbers">
									<Stat label="지금 구독 중" value={people(s.active)} />
									<Stat
										label="기간 동안 늘어난 수"
										value={`${change > 0 ? '+' : ''}${change.toLocaleString()}명`}
										sub={`${people(s.totals.activeStart)} → ${people(s.totals.activeEnd)}`}
									/>
									<Stat
										label="새 구독 · 다시 시작"
										value={people(s.totals.subscribe + s.totals.resume)}
										sub={`다시 시작 ${s.totals.resume}명`}
									/>
									<Stat
										label="해지 · 일시정지"
										value={people(s.totals.cancel + s.totals.pause)}
										sub={`일시정지 ${s.totals.pause}명`}
									/>
								</dl>
								{s.since && s.since > dates[0] && (
									<p className="note" role="note">
										구독 기록은 {s.since}부터 쌓여요. 그 전 날짜는 그때의 구독 상태로 채운 추정값이라 해지 · 재구독이
										빠져 있어요.
									</p>
								)}
								<div className="charts">
									<Chart title="날짜별 구독 중">
										<TrendChart
											kind="line"
											label="날짜별 구독 중인 사람 수"
											dates={dates}
											series={[{ key: 'active', label: '구독 중', values: s.days.map((d) => d.active) }]}
										/>
									</Chart>
									<Chart title="날짜별 들어오고 나간 사람">
										<TrendChart
											kind="bar"
											label="날짜별 새 구독과 해지"
											dates={dates}
											series={[
												{
													key: 'in',
													label: '새 구독 · 다시 시작',
													values: s.days.map((d) => d.subscribe + d.resume),
												},
												{
													key: 'out',
													label: '해지 · 일시정지',
													tone: 'b',
													below: true,
													values: s.days.map((d) => d.cancel + d.pause),
												},
											]}
										/>
									</Chart>
								</div>
								<Chart
									title="관심사별 지금 구독 중"
									hint="한 사람이 관심사를 여럿 고를 수 있어 합이 구독자 수보다 커요"
								>
									<BarList
										label="관심사별 구독 중"
										rows={s.byCategory.map((c) => ({
											key: String(c.id),
											label: c.name,
											value: c.active,
											note: s.active ? `${Math.round((c.active / s.active) * 100)}%` : undefined,
										}))}
										format={people}
									/>
								</Chart>
								<DayTable
									caption="날짜별 구독자"
									head={['날짜', '새 구독', '다시 시작', '일시정지', '해지', '구독 중']}
									rows={s.days.map((d) => [d.date, d.subscribe, d.resume, d.pause, d.cancel, d.active])}
								/>
							</>
						);
					}}
				</Section>

				<Section id="stats-cost" title="AI 비용" state={cost}>
					{(c) => (
						<>
							<dl className="numbers">
								<Stat
									label="기간 합계"
									value={money(c.total)}
									sub={[
										`AI 호출 ${c.count}건`,
										c.unknown ? `비용 모름 ${c.unknown}건` : '',
										c.failed ? `실패 ${c.failed}건` : '',
									]
										.filter(Boolean)
										.join(' · ')}
								/>
								<Stat
									label="뉴스레터 한 편당"
									value={c.perNewsletter === null ? '-' : money(c.perNewsletter)}
									sub={`발행 ${c.newsletters}편 (분류 · 편집 포함)`}
								/>
								<Stat
									label={`이번 달 (${Number(c.month.month.slice(5))}월) 누적`}
									value={money(c.month.toDate)}
									sub={`${c.month.elapsedDays}일째`}
								/>
								<Stat
									label="이번 달 예상"
									value={money(c.month.projected)}
									sub={`지금까지 하루 평균으로 ${c.month.daysInMonth}일 환산`}
								/>
							</dl>
							<Chart title="날짜별 비용">
								<TrendChart
									kind="bar"
									label="날짜별 AI 비용"
									dates={c.days.map((d) => d.date)}
									series={[{ key: 'cost', label: '비용', values: c.days.map((d) => d.cost) }]}
									format={money}
								/>
							</Chart>
							<div className="charts three">
								<Chart title="종류별">
									<BarList
										label="종류별 비용"
										rows={c.byType.map((t) => ({
											key: t.key,
											label: TYPE_LABEL[t.key] ?? t.key,
											value: t.cost,
											note: `${t.count}건`,
										}))}
										format={money}
									/>
								</Chart>
								<Chart title="모델별">
									<BarList
										label="모델별 비용"
										rows={c.byModel.map((m) => ({ key: m.key, label: modelName(m.key), value: m.cost }))}
										format={money}
									/>
								</Chart>
								<Chart title="단계별" hint="뉴스레터 쓰기 = 고르기(가벼운 모델) + 쓰기">
									<BarList
										label="단계별 비용"
										rows={c.byStage.map((m) => ({ key: m.key, label: STAGE_LABEL[m.key] ?? m.key, value: m.cost }))}
										format={money}
									/>
								</Chart>
							</div>
							<Chart title="관심사별" hint="기사 분류 · 하루 편집은 관심사를 가리지 않아 '공통'">
								<BarList
									label="관심사별 비용"
									rows={c.byCategory.map((m) => ({ key: String(m.id), label: m.name ?? '공통', value: m.cost }))}
									format={money}
								/>
							</Chart>
							<DayTable
								caption="날짜별 AI 비용"
								head={['날짜', '비용']}
								rows={c.days.map((d) => [d.date, money(d.cost)])}
							/>
						</>
					)}
				</Section>

				<Section id="stats-delivery" title="발송 · 읽기" state={delivery}>
					{(d) => (
						<>
							<dl className="numbers">
								<Stat
									label="메일 받은 사람 (날짜별 합)"
									value={people(d.totals.recipients)}
									sub={`보낸 메일 ${d.totals.mails.toLocaleString()}통`}
								/>
								<Stat
									label="구독 메일 작업"
									value={`${d.totals.runs.success}번 성공`}
									sub={
										[
											d.totals.runs.partial ? `일부 실패 ${d.totals.runs.partial}` : '',
											d.totals.runs.failed ? `실패 ${d.totals.runs.failed}` : '',
											d.totals.runs.skipped ? `건너뜀 ${d.totals.runs.skipped}` : '',
										]
											.filter(Boolean)
											.join(' · ') || '실패 없음'
									}
								/>
								<Stat label="기간에 나온 뉴스레터 조회수" value={`${d.views.total.toLocaleString()}회`} />
							</dl>
							<Chart title="날짜별 메일 받은 사람">
								<TrendChart
									kind="bar"
									label="날짜별 메일 받은 사람"
									dates={d.days.map((x) => x.date)}
									series={[{ key: 'recipients', label: '받은 사람', values: d.days.map((x) => x.recipients) }]}
								/>
							</Chart>
							<div className="charts">
								<Chart title="관심사별 조회수" hint="기간 안에 나온 뉴스레터의 지금 조회수">
									<BarList
										label="관심사별 조회수"
										rows={d.views.byCategory.map((c) => ({
											key: String(c.id),
											label: c.name,
											value: c.views,
											note: `${c.newsletters}편`,
										}))}
										format={(v) => `${v.toLocaleString()}회`}
									/>
								</Chart>
								<Chart title="많이 본 뉴스레터">
									<ol className="top">
										{d.views.top.map((n) => (
											<li key={n.id}>
												<a href={`/admin/newsletters/${n.id}`}>{n.title}</a>
												<span>
													{n.category} · {n.viewcount.toLocaleString()}회
												</span>
											</li>
										))}
									</ol>
								</Chart>
							</div>
							<DayTable
								caption="날짜별 발송"
								head={['날짜', '받은 사람', '보낸 메일', '작업 성공', '일부 실패', '실패', '건너뜀']}
								rows={d.days.map((x) => [
									x.date,
									x.recipients,
									x.mails,
									x.runs.success,
									x.runs.partial,
									x.runs.failed,
									x.runs.skipped,
								])}
							/>
						</>
					)}
				</Section>
			</StyledStats>
		</AdminSubPage>
	);
}

/** 영역 하나: 제목 + 불러오는 중 · 실패 · 내용 */
function Section<T>({
	id,
	title,
	state,
	children,
}: {
	id: string;
	title: string;
	state: { data?: T; isError: boolean };
	children: (data: T) => React.ReactNode;
}) {
	return (
		<section className="section" aria-labelledby={id}>
			<Title as="h2" size="extraSmall" weight="bold">
				<span id={id}>{title}</span>
			</Title>
			{state.data ? (
				children(state.data)
			) : (
				<p className="state">{state.isError ? '불러오지 못했어요.' : '불러오는 중…'}</p>
			)}
		</section>
	);
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div>
			<dt>{label}</dt>
			<dd>{value}</dd>
			{sub && <span className="sub">{sub}</span>}
		</div>
	);
}

function Chart({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
	return (
		<figure className="chart">
			<figcaption>
				{title}
				{hint && <small>{hint}</small>}
			</figcaption>
			{children}
		</figure>
	);
}

/** 그래프만으로 읽기 어려울 때를 위한 표 (접어 둔다) */
function DayTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
	return (
		<details className="day-table">
			<summary>{caption} 표로 보기</summary>
			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							{head.map((h) => (
								<th key={h} scope="col">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{[...rows].reverse().map((row) => (
							<tr key={String(row[0])}>
								{row.map((cell, i) => (
									<td key={i} className={i ? 'num' : 'nowrap'}>
										{typeof cell === 'number' ? cell.toLocaleString() : cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</details>
	);
}

const StyledStats = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3rem;

	.section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.state {
		padding: 2rem 0;
		text-align: center;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 숫자 칸: 대시보드와 같은 모양 */
	.numbers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: 0.75rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		> div {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
			padding: 1rem 1.125rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
		}

		dt {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}

		dd {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.sub {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.note {
		padding: 0.625rem 0.875rem;
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.charts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;

		&.three {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: minmax(0, 1fr);

			&.three {
				grid-template-columns: minmax(0, 1fr);
			}
		}
	}

	.chart {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		margin: 0;
		padding: 1rem 1.125rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		figcaption {
			display: flex;
			flex-direction: column;
			gap: 0.125rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};

			small {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-weight: ${({ theme }) => theme.fontWeight.regular};
				color: ${({ theme }) => theme.color.subText};
			}
		}
	}

	.top {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		counter-reset: top;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};

		li {
			position: relative;
			padding-left: 1.25rem;
			counter-increment: top;

			&::before {
				content: counter(top);
				position: absolute;
				left: 0;
				color: ${({ theme }) => theme.color.subText};
				font-variant-numeric: tabular-nums;
			}
		}

		a {
			color: ${({ theme }) => theme.color.text};

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}
		}

		span {
			display: block;
			margin-top: 0.125rem;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.day-table summary {
		width: fit-content;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.primary};
		cursor: pointer;
	}

	.day-table .table-wrap {
		max-height: 20rem;
		margin-top: 0.75rem;
		overflow: auto;
	}
`;
