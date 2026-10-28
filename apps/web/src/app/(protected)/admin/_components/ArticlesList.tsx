'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import Pagination from '@/components/common/Pagination';
import FilterChips from '@/components/common/FilterChips';
import ExternalLink from '@/components/common/ExternalLink';
import InputSelect from '@/components/common/InputSelect';
import AdminSubPage, { Cols } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader, useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';
import { when } from './format';
import type { ClockTime, Schedule } from './ScheduleEditor';

const PAGE_SIZE = 20;

/** 기사 작성 시각 'YYYY-MM-DD HH:mm:ss'(KST, 네이버 기사 날짜) → 수집 시각과 같은 모양으로 */
const publishedText = (value: string | null, today: string) =>
	value ? when(new Date(`${value.replace(' ', 'T')}+09:00`).toISOString(), today) : '-';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 주기 = 수집 → AI 요약 → 뉴스레터 생성 한 바퀴. 전날 요약 시각부터 그날 요약 시각까지 모은 기사가
 * 그날 뉴스레터의 재료다 (요약은 그 전 24시간 기사만 쓴다). 기사가 어느 날 뉴스레터 주기인지: 'YYYY-MM-DD'
 */
const cycleOf = (createdAt: string, summary: ClockTime) => {
	const kst = new Date(new Date(createdAt).getTime() + 9 * 60 * 60 * 1000);
	const minutes = kst.getUTCHours() * 60 + kst.getUTCMinutes();
	// 요약 시각이 지나서 모은 기사는 다음 날 뉴스레터로
	if (minutes > summary.hour * 60 + summary.minute) kst.setUTCDate(kst.getUTCDate() + 1);
	return kst.toISOString().slice(0, 10);
};

/** 주기 머리: '10-27 뉴스레터 · 10-26 08:30 ~ 10-27 08:30 수집' */
const cycleLabel = (day: string, summary: ClockTime) => {
	const end = new Date(`${day}T00:00:00Z`);
	const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
	const time = `${pad(summary.hour)}:${pad(summary.minute)}`;
	const md = (d: Date) => d.toISOString().slice(5, 10);
	return `${md(end)} 뉴스레터 · ${md(start)} ${time} ~ ${md(end)} ${time} 수집`;
};

/** 수집 시각 순으로 늘어선 기사를 뉴스레터 주기마다 묶는다 */
const byCycle = <T extends { createdAt: string }>(items: T[], summary: ClockTime) => {
	const cycles: { day: string; items: T[] }[] = [];
	for (const item of items) {
		const day = cycleOf(item.createdAt, summary);
		const last = cycles[cycles.length - 1];
		if (last?.day === day) last.items.push(item);
		else cycles.push({ day, items: [item] });
	}
	return cycles;
};

/** 언론사 고르기에서 '직접 입력'을 뜻하는 값 (언론사 이름과 겹치지 않게) */
const CUSTOM = '__custom';

interface Row {
	id: string;
	title: string;
	link: string;
	source: string;
	category: string[];
	publishedAt: string | null;
	createdAt: string;
	image: string | null;
	usedIn: { id: number; title: string }[];
}

/**
 * 관리자 상세: 수집한 기사 (#31). 크롤링 원문은 30일 뒤 지워진다.
 * 관심사 · 언론사 · 제목으로 거르고, 어느 뉴스레터에 쓰였는지 함께
 */
export default function ArticlesList() {
	const { from, to, page, set, get, today } = useAdminQuery();
	const categoryId = Number(get('categoryId')) || 0;
	const source = get('source');
	const title = get('title');
	const [titleInput, setTitleInput] = useState(title);
	const [sourceInput, setSourceInput] = useState(source);
	// 목록에 없는 언론사로 거르는 중이면 직접 입력 칸을 연다
	const [customSource, setCustomSource] = useState(false);
	useEffect(() => setTitleInput(title), [title]);
	useEffect(() => setSourceInput(source), [source]);

	const sortQuery = useSortQuery();
	// 주기를 나누는 기준: 관리자가 정한 AI 요약 시각 (기본 08:30)
	const { data: schedule } = useQuery({
		queryKey: ['adminSchedule'],
		queryFn: () => apiFetch<{ data: Schedule }>(API_ENDPOINTS.ADMIN.SCHEDULE()).then((r) => r.data),
		staleTime: 1000 * 60 * 10,
	});
	const summaryAt = schedule?.summary ?? { hour: 8, minute: 30 };
	const query = new URLSearchParams({ from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (categoryId) query.set('categoryId', String(categoryId));
	if (source) query.set('source', source);
	if (title) query.set('title', title);
	for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminArticles', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number; sources: string[] } }>(
				API_ENDPOINTS.ADMIN.LIST('articles', query.toString()),
			).then((r) => r.data),
		placeholderData: (previous) => previous,
	});

	const sources = data?.sources ?? [];
	const custom = customSource || (!!source && !!data && !sources.includes(source));
	const sourceOptions = [
		{ label: '전체 언론사', value: '' },
		...sources.map((name) => ({ label: name, value: name })),
		{ label: '직접 입력', value: CUSTOM },
	];

	return (
		<AdminSubPage
			title="수집한 기사"
			summary={data && `${data.total.toLocaleString()}건 · 원문은 수집하고 30일 뒤 지워져요`}
			filters={
				<>
					<FilterChips
						label="관심사"
						options={CATEGORY_OPTIONS}
						value={categoryId ? String(categoryId) : ''}
						onChange={(v) => set({ categoryId: v || null })}
					/>
					<form
						role="search"
						className="searches"
						onSubmit={(event) => {
							event.preventDefault();
							set({ title: titleInput.trim() || null, ...(custom && { source: sourceInput.trim() || null }) });
						}}
					>
						<div className="filter-row">
							<span className="chips-label">언론사</span>
							{/* 이 기간에 수집된 언론사로 목록을 만든다. 고르면 바로 거르고, 직접 입력은 이름 일부로 찾기 */}
							<div className="source-select">
								<InputSelect
									name="source"
									label="언론사"
									value={custom ? CUSTOM : source}
									options={sourceOptions}
									onChange={(value) => {
										if (value === CUSTOM) {
											setCustomSource(true);
											setSourceInput('');
											return;
										}
										setCustomSource(false);
										set({ source: value || null });
									}}
								/>
							</div>
							{custom && (
								<input
									type="search"
									className="search narrow"
									value={sourceInput}
									onChange={(event) => setSourceInput(event.target.value)}
									placeholder="언론사 이름 일부"
									aria-label="언론사 직접 입력"
									maxLength={50}
									autoFocus={customSource}
								/>
							)}
						</div>
						<div className="filter-row">
							<span className="chips-label">제목</span>
							<input
								type="search"
								className="search"
								value={titleInput}
								onChange={(event) => setTitleInput(event.target.value)}
								placeholder="제목으로 찾기"
								aria-label="기사 제목으로 찾기"
								maxLength={100}
							/>
							<button type="submit" className="search-submit">
								찾기
							</button>
						</div>
					</form>
				</>
			}
		>
			{isPending ? (
				<p className="state">불러오는 중…</p>
			) : isError ? (
				<p className="state">불러오지 못했어요.</p>
			) : data.items.length === 0 ? (
				<p className="state">이 조건의 수집 기사가 없어요.</p>
			) : (
				<div className="table-wrap">
					<table>
						<Cols widths={['8.75rem', '8.75rem', '7.5rem', '7.5rem', undefined, '15rem']} />
						<thead>
							<tr>
								{/* 위 거르기 상자와 같은 조건을 표 머리에서도 (#31). 기간은 정해 둔 범위만, 날짜는 위 칸에서 */}
								<th scope="col">
									<PeriodHeaderFilter label="수집" />
								</th>
								{/* 기사가 실제로 쓰인 시각 (네이버 기사 날짜). 수집은 3시간마다라 수집 시각보다 이를 수 있다 */}
								<th scope="col">기사 작성</th>
								<th scope="col">
									<HeaderSelect
										label="관심사"
										value={categoryId ? String(categoryId) : ''}
										options={CATEGORY_OPTIONS}
										onChange={(id) => set({ categoryId: id || null })}
									/>
								</th>
								<th scope="col">
									<HeaderSelect
										label="언론사"
										value={source}
										options={[
											{ label: '전체 언론사', value: '' },
											...sources.map((name) => ({ label: name, value: name })),
										]}
										onChange={(name) => {
											setCustomSource(false);
											set({ source: name || null });
										}}
									/>
								</th>
								<th scope="col">
									<SortHeader label="제목" field="title" first="asc" />
								</th>
								<th scope="col">쓰인 뉴스레터</th>
							</tr>
						</thead>
						{/* 뉴스레터 주기(수집 → 요약 → 발행)마다 묶음: 맨 위에 어느 날 뉴스레터 재료인지 · 수집 기간, 주기 사이에 구분선. 제목순일 때는 묶지 않는다 */}
						{(sortQuery.sort ? [{ day: '', items: data.items }] : byCycle(data.items, summaryAt)).map((run) => (
							<tbody key={run.day || 'all'} className={run.day ? 'run' : undefined}>
								{run.day && (
									<tr className="run-head">
										<th colSpan={6} scope="rowgroup">
											{cycleLabel(run.day, summaryAt)}
										</th>
									</tr>
								)}
								{run.items.map((article) => (
									<tr key={article.id}>
										<td className="nowrap num">{when(article.createdAt, today)}</td>
										<td className="nowrap num">{publishedText(article.publishedAt, today)}</td>
										<td className="nowrap category">{article.category.join(' · ')}</td>
										<td className="nowrap">{article.source}</td>
										<td>
											<ExternalLink href={article.link}>{article.title}</ExternalLink>
										</td>
										<td>
											{article.usedIn.length === 0
												? '-'
												: article.usedIn.map((n) => (
														<Link key={n.id} href={`/articles/detail/${n.id}`} className="used">
															#{n.id} {n.title}
														</Link>
													))}
										</td>
									</tr>
								))}
							</tbody>
						))}
					</table>
				</div>
			)}
			{data && (
				<Pagination
					className="pagination"
					page={page}
					total={data.total}
					pageSize={PAGE_SIZE}
					onChange={(next) => set({ page: next })}
				/>
			)}
		</AdminSubPage>
	);
}
