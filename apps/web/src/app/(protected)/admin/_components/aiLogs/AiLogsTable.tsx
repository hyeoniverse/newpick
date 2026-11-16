'use client';

import type { AiLogRow } from '@newpick/shared';
import { Cols, HeaderSelect, tableMinWidth } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader } from '../HeaderFilter';
import { PROCESS_LABEL, usd, when } from '../../_lib/format';
import Result from './Result';

/** 가로로 넘겨도 왼쪽에 고정하는 칸 폭: 시각 · 분야 · 결과 (무엇이 언제 어떻게 됐는지) */
const PINNED = ['9rem', '3.5rem', '9rem'];
/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = [...PINNED, '5rem', '6.5rem', '6.5rem', '8.5rem', '5rem', undefined];

type Option = { value: string; label: string };

/**
 * AI 기록 표 (데스크톱): 시각 · 분야 · 결과는 가로로 넘겨도 고정, 머리에서도 기간 · 결과 · 종류 거르기와 정렬.
 * 같은 묶음(다시 시도)은 첫 줄(가장 최근 시도) 아래에 앞선 시도를 답글처럼 이어 그린다. 내용은 두 줄까지, 누르면 펼침
 */
export default function AiLogsTable({
	rows,
	today,
	type,
	status,
	types,
	statuses,
	onFilter,
	isOpen,
	onToggle,
	onRerun,
}: {
	rows: AiLogRow[];
	today: string;
	type: string;
	status: string;
	types: Option[];
	statuses: Option[];
	onFilter: (changes: { type?: string | null; status?: string | null }) => void;
	isOpen: (id: number) => boolean;
	onToggle: (id: number) => void;
	onRerun: (log: AiLogRow) => void;
}) {
	return (
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
								options={statuses}
								onChange={(v) => onFilter({ status: v || null })}
							/>
						</th>
						<th scope="col">
							<HeaderSelect label="종류" value={type} options={types} onChange={(v) => onFilter({ type: v || null })} />
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
									<Result log={log} onRerun={onRerun} />
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
										className={isOpen(log.id) ? 'text open' : 'text'}
										aria-expanded={isOpen(log.id)}
										onClick={() => onToggle(log.id)}
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
	);
}
