'use client';

import { ROUTES } from '@/constants/routes';
import BarList from '@/components/common/charts/BarList';
import TrendChart from '../TrendChart';
import { people } from '../../_lib/statsLabels';
import { Chart, DayTable, Section, Stat } from './StatsParts';
import { fetchDeliveryStats } from '@/api/admin';
import { useStatsQuery, type StatsPeriod } from './useStatsQuery';

/** 발송 · 읽기: 보낸 메일 · 실패 · 열람, 날짜별 */
export default function DeliveryStats({ period }: { period: StatsPeriod }) {
	const state = useStatsQuery('delivery', fetchDeliveryStats, period);
	return (
		<Section id="stats-delivery" title="발송 · 읽기" state={state}>
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
										<a href={ROUTES.admin.newsletter(n.id)}>{n.title}</a>
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
	);
}
