'use client';

import { COMMON } from '@/copy';
import Title from '@/components/common/Title';

/* 통계 화면 공용 틀 (#198): 영역 틀 · 숫자 칸 · 그래프 틀 · 표로 보기. 서로 붙어 다니는 작은 부품이라 한 파일에 둔다 */

/** 영역 하나: 제목 + 불러오는 중 · 실패 · 내용 */
export function Section<T>({
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
				<p className="state">{state.isError ? COMMON.loadFailed : COMMON.loading}</p>
			)}
		</section>
	);
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div>
			<dt>{label}</dt>
			<dd>{value}</dd>
			{sub && <span className="sub">{sub}</span>}
		</div>
	);
}

export function Chart({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
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
export function DayTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
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
