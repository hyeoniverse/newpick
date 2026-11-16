'use client';

import { ADMIN } from '@/copy';
import BarList from '@/components/common/charts/BarList';
import TrendChart from '../TrendChart';
import { people } from '../../_lib/statsLabels';
import { Chart, DayTable, Section, Stat } from './StatsParts';
import { fetchSubscriberStats } from '@/api/admin';
import { useStatsQuery, type StatsPeriod } from './useStatsQuery';

/** 구독자: 지금 구독 중 · 늘어난 수 · 들어오고 나간 사람, 날짜별 그래프, 관심사별 */
export default function SubscriberStats({ period }: { period: StatsPeriod }) {
	const state = useStatsQuery('subscribers', fetchSubscriberStats, period);
	return (
		<Section id="stats-subscribers" title="구독자" state={state}>
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
								{ADMIN.stats.subscribersSince(s.since)}
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
						<Chart title="관심사별 지금 구독 중" hint={ADMIN.stats.interestsHint}>
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
	);
}
