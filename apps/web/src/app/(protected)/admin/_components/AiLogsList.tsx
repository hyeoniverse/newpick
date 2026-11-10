'use client';

import { fetchAiLogs, rerunSummary } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import type { AiLogRow } from '@newpick/shared';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LuRotateCw, LuTriangleAlert } from 'react-icons/lu';
import { ApiError } from '@/api/client';
import Pagination from '@/components/common/Pagination';
import FilterChips from '@/components/common/FilterChips';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader, useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';
import { PROCESS_LABEL, usd, when } from './format';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import ModalContents from '@/components/common/modal/ModalContent';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 20;

/** 가로로 넘겨도 왼쪽에 고정하는 칸 폭: 시각 · 분야 · 결과 (무엇이 언제 어떻게 됐는지) */
const PINNED = ['9rem', '3.5rem', '9rem'];
/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = [...PINNED, '5rem', '6.5rem', '6.5rem', '8.5rem', '5rem', undefined];

const TYPES = [
	{ value: '', label: '전체' },
	{ value: 'summarization', label: '요약' },
	{ value: 'category', label: '분류' },
	{ value: 'edition', label: '편집' },
];
const STATUSES = [
	{ value: '', label: '전체' },
	{ value: 'success', label: '성공' },
	{ value: 'error', label: '실패' },
];

/** 기록이 남은 날 (KST, YYYY-MM-DD) */
const kstDay = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

/**
 * 다시 만들 수 있는 기록: 분야가 있는 요약이 실패했고, 그 묶음의 마지막 시도도 실패로 끝난 것.
 * (묶음 중간 실패는 뒤에서 이미 다시 시도했다)
 */
const canRerun = (log: AiLogRow) =>
	log.processType === 'summarization' &&
	log.status === 'error' &&
	log.categoryId != null &&
	(!log.attempt || (log.attempt.n === log.attempt.total && log.attempt.outcome !== 'success'));

/** 실패한 요약을 그날 · 그 분야로 다시 만든다 (서버가 그날 이미 있는 분야는 건너뛴다) */
function useRerun() {
	const { openModal, closeModal } = useModal();
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	return (log: AiLogRow) => {
		const date = kstDay(log.createdAt);
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={`${date} ${log.category ?? ''} 뉴스레터를 다시 생성하시겠습니까?`}
				content="해당 날짜에 수집된 기사로 다시 요약해 그날 날짜로 게시합니다. 그날 이 관심사의 뉴스레터가 이미 있으면 건너뜁니다. 구독 메일은 발송하지 않으며, Claude 비용이 발생합니다."
				outlineButton="취소"
				filledButton="다시 생성"
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						await rerunSummary({ date, categoryId: log.categoryId });
						showToast(
							`${date} ${log.category ?? ''} 뉴스레터 생성을 시작했습니다. 몇 분 후 기록에 표시됩니다.`,
							'success',
						);
						setTimeout(() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.aiLogs.all }), 60_000);
					} catch (error) {
						showToast(error instanceof ApiError ? error.message : '시작하지 못했습니다.', 'error');
					}
				}}
			/>,
		);
	};
}

/** 관리자 상세: AI 기록 (종류 · 결과로 거르기, 그 조건의 비용 합계, 쪽) */
export default function AiLogsList() {
	const { from, to, page, set, get, today } = useAdminQuery();
	const rerun = useRerun();
	const type = get('type');
	const status = get('status');
	const sortQuery = useSortQuery();
	const query = new URLSearchParams({ from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (type) query.set('type', type);
	if (status) query.set('status', status);
	for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.aiLogs.list(query.toString()),
		queryFn: () => fetchAiLogs(query.toString()),
		placeholderData: (previous) => previous,
	});

	// 기본 정렬(최신순)일 때 같은 묶음의 시도를 붙여 놓는다 (묶음 자리는 가장 최근 시도 자리)
	// 내용은 두 줄까지만, 누르면 펼친다 (펼친 기록 id)
	const [open, setOpen] = useState<Set<number>>(new Set());
	const toggle = (id: number) =>
		setOpen((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	const rows = useMemo(
		() => (data ? (Object.keys(sortQuery).length ? data.items : groupAttempts(data.items)) : []),
		[data, sortQuery],
	);

	// 카드 목록(휴대폰)용: 이어진 같은 묶음을 [마지막 시도, ...앞선 시도]로
	const groups = useMemo(() => {
		const out: AiLogRow[][] = [];
		for (const log of rows) {
			const last = out.at(-1);
			const chain = log.attempt && log.attempt.total > 1 ? log.attempt.chain : null;
			if (chain !== null && last && last[0].attempt?.chain === chain) last.push(log);
			else out.push([log]);
		}
		return out;
	}, [rows]);

	return (
		<AdminSubPage
			title="AI 기록"
			summary={
				data &&
				`${data.total.toLocaleString()}건 · 비용 ${usd(data.cost.total)}${data.cost.unknown ? ` (비용 모르는 이전 기록 ${data.cost.unknown}건 제외)` : ''}`
			}
			filters={
				<>
					<FilterChips label="종류" options={TYPES} value={type} onChange={(v) => set({ type: v })} />
					<FilterChips label="결과" options={STATUSES} value={status} onChange={(v) => set({ status: v })} />
				</>
			}
		>
			{isPending ? (
				<p className="state">불러오는 중…</p>
			) : isError ? (
				<p className="state">불러오지 못했어요.</p>
			) : data.items.length === 0 ? (
				<p className="state">이 조건의 기록이 없어요.</p>
			) : (
				<div className="np-admin-ai-logs-list-chains table-wrap">
					<table className="wide" style={{ minWidth: tableMinWidth(COLS, '60rem') }}>
						{/* 칸 폭 = 내용 · 머리글(정렬 아이콘 포함) + 오른쪽 여백 1rem. 좁으면 옆 칸에 붙는다.
						    앞 세 칸(시각 · 분야 · 결과)은 가로로 넘겨도 왼쪽에 고정 (PINNED) */}
						<Cols widths={COLS} />
						<thead>
							<tr>
								{/* 위 거르기와 같은 조건을 표 머리에서도 */}
								<th scope="col">
									<PeriodHeaderFilter label="시각" />
								</th>
								<th scope="col">분야</th>
								<th scope="col">
									<HeaderSelect
										label="결과"
										value={status}
										options={STATUSES}
										onChange={(v) => set({ status: v || null })}
									/>
								</th>
								<th scope="col">
									<HeaderSelect label="종류" value={type} options={TYPES} onChange={(v) => set({ type: v || null })} />
								</th>
								<th scope="col">모델</th>
								<th scope="col">
									<SortHeader label="걸린 시간" field="duration" />
								</th>
								<th scope="col">
									<SortHeader label="토큰" field="token" />
								</th>
								<th scope="col">
									<SortHeader label="비용" field="costUsd" />
								</th>
								<th scope="col">내용</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((log, i) => {
								const chained = !!log.attempt && log.attempt.total > 1;
								// 스레드: 묶음 첫 줄(가장 최근 시도)이 위, 앞선 시도는 그 아래 들여 쓴 답글처럼
								const child = chained && rows[i - 1]?.attempt?.chain === log.attempt!.chain;
								const continues = chained && rows[i + 1]?.attempt?.chain === log.attempt!.chain;
								const text = log.error ?? log.result ?? '';
								return (
									<tr
										key={log.id}
										className={[chained && 'chain', child && 'reply', continues ? 'continues' : chained && 'chain-end']
											.filter(Boolean)
											.join(' ')}
									>
										<td className="nowrap num">{when(log.createdAt, today)}</td>
										<td className="nowrap">{log.category ?? '-'}</td>
										<td>
											<Result log={log} onRerun={rerun} />
										</td>
										<td className="nowrap">{PROCESS_LABEL[log.processType] ?? log.processType}</td>
										<td className="model">
											{log.model
												? log.model.split(',').map((name) => (
														<span key={name} className="name">
															{name.trim().replace(/^claude-/, '')}
														</span>
													))
												: '-'}
										</td>
										<td className="nowrap num">{log.duration.toFixed(1)}초</td>
										<td className="nowrap num">
											{log.inputTokens || log.outputTokens
												? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
												: log.token.toLocaleString()}
										</td>
										<td className="nowrap num">{usd(log.costUsd)}</td>
										<td className="content">
											<button
												type="button"
												className={open.has(log.id) ? 'text open' : 'text'}
												aria-expanded={open.has(log.id)}
												onClick={() => toggle(log.id)}
											>
												{text}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
			{data && data.items.length > 0 && (
				<ul className="np-admin-ai-logs-list-card-list" aria-label="AI 기록">
					{groups.map((group) => (
						<li key={group[0].id}>
							<ol className="timeline">
								{group.map((log, i) => (
									<LogEntry
										key={log.id}
										log={log}
										today={today}
										earlier={i > 0}
										open={open.has(log.id)}
										onToggle={() => toggle(log.id)}
										onRerun={rerun}
									/>
								))}
							</ol>
						</li>
					))}
				</ul>
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

/** 같은 묶음(다시 시도)의 기록을 붙여 놓는다. 묶음 자리는 가장 최근 시도가 있던 자리, 묶음 안은 최신순 그대로 */
function groupAttempts(items: AiLogRow[]) {
	const placed = new Set<number>();
	const out: AiLogRow[] = [];
	for (const item of items) {
		const chain = item.attempt && item.attempt.total > 1 ? item.attempt.chain : null;
		if (chain === null) {
			out.push(item);
			continue;
		}
		if (placed.has(chain)) continue;
		placed.add(chain);
		out.push(...items.filter((other) => other.attempt?.chain === chain));
	}
	return out;
}

/** 결과 칸: 성공 · 실패 배지, 다시 시도 묶음이면 옆에 '시도 n/total' (묶음 결과는 붙어 있는 맨 위 줄에서 보인다) */
function Result({ log, onRerun }: { log: AiLogRow; onRerun: (log: AiLogRow) => void }) {
	const attempt = log.attempt;
	return (
		<span className="np-admin-ai-logs-list-badges">
			<StatusBadge tone={toneOf(log.status)}>{log.status === 'success' ? '성공' : '실패'}</StatusBadge>
			{attempt && attempt.total > 1 && (
				<span className="step">
					시도 {attempt.n}/{attempt.total}
				</span>
			)}
			{canRerun(log) && (
				<button type="button" className="rerun" onClick={() => onRerun(log)} aria-label={`${log.category} 다시 만들기`}>
					<LuRotateCw aria-hidden />
				</button>
			)}
		</span>
	);
}

/** 줄 수만큼 접힌 글을 펼치고 접는다: 높이를 재서 움직이고, 다 접힌 뒤에만 말줄임('…')을 붙인다 */
function useExpand(open: boolean) {
	const ref = useRef<HTMLSpanElement>(null);
	const [clamped, setClamped] = useState(!open);
	const mounted = useRef(false);
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (!mounted.current) {
			mounted.current = true;
			return;
		}
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (open) {
			setClamped(false);
			if (still) {
				el.style.maxHeight = 'none';
				return;
			}
			// 말줄임을 걷은 다음 프레임에 전체 높이를 재서 그만큼 늘린다
			requestAnimationFrame(() => {
				el.style.maxHeight = `${el.scrollHeight}px`;
			});
		} else {
			if (still) {
				el.style.maxHeight = '';
				setClamped(true);
				return;
			}
			// 지금 높이에서 시작해 접힌 높이(CSS)로 줄인다
			el.style.maxHeight = `${el.scrollHeight}px`;
			void el.offsetHeight;
			el.style.maxHeight = '';
		}
	}, [open]);
	const onTransitionEnd = (event: React.TransitionEvent) => {
		if (event.propertyName !== 'max-height' || !ref.current) return;
		if (open) ref.current.style.maxHeight = 'none';
		else setClamped(true);
	};
	return { ref, clamped, onTransitionEnd };
}

/**
 * 휴대폰 활동 목록 한 줄: 왼쪽 상태 점(성공 · 실패), 분야 · 종류와 시각, 내용 두 줄, 결과 · 걸린 시간 · 비용.
 * 누르면 내용 전체와 모델 · 토큰. 같은 묶음의 앞선 시도(earlier)는 점을 세로선으로 이어 타임라인처럼
 */
function LogEntry({
	log,
	today,
	earlier,
	open,
	onToggle,
	onRerun,
}: {
	log: AiLogRow;
	today: string;
	earlier: boolean;
	open: boolean;
	onToggle: () => void;
	onRerun: (log: AiLogRow) => void;
}) {
	const ok = log.status === 'success';
	const attempt = log.attempt && log.attempt.total > 1 ? log.attempt : null;
	const text = useExpand(open);
	const model = log.model
		?.split(',')
		.map((name) => name.trim().replace(/^claude-/, ''))
		.join(', ');
	const tokens =
		log.inputTokens || log.outputTokens
			? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
			: log.token
				? log.token.toLocaleString()
				: null;
	return (
		<li className={[earlier && 'earlier', ok ? 'ok' : 'failed'].filter(Boolean).join(' ')}>
			<span className="dot" aria-hidden />
			<button type="button" className="entry" aria-expanded={open} onClick={onToggle}>
				<span className="line">
					<span className="what">
						{log.category && <strong>{log.category}</strong>}
						{PROCESS_LABEL[log.processType] ?? log.processType}
					</span>
					<time className="when">{when(log.createdAt, today)}</time>
				</span>
				<span ref={text.ref} className={text.clamped ? 'text clamped' : 'text'} onTransitionEnd={text.onTransitionEnd}>
					{log.error ?? log.result ?? ''}
				</span>
				<span className="foot">
					<span className="status">
						{ok ? '성공' : '실패'}
						{attempt && ` · 시도 ${attempt.n}/${attempt.total}`}
					</span>
					<span>{log.duration.toFixed(1)}초</span>
					{log.costUsd != null && <span>{usd(log.costUsd)}</span>}
				</span>
				{(model || tokens) && (
					<span className={open ? 'more-panel open' : 'more-panel'} aria-hidden={!open}>
						<span className="more">
							{model && <span>모델 {model}</span>}
							{tokens && <span>토큰 {tokens}</span>}
						</span>
					</span>
				)}
			</button>
			{canRerun(log) && (
				<button type="button" className="rerun" onClick={() => onRerun(log)}>
					<LuRotateCw aria-hidden />
					다시 만들기
				</button>
			)}
		</li>
	);
}

/** 휴대폰 폭에서만 보이는 활동 목록 (표 대신): 묶음마다 구분선, 묶음 안은 상태 점을 세로선으로 잇는다 */
