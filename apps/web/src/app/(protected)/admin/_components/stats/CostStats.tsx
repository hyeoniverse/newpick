'use client';

import BarList from '@/components/common/charts/BarList';
import TrendChart from '../TrendChart';
import { STAGE_LABEL, TYPE_LABEL, modelName, money } from '../../_lib/statsLabels';
import { Chart, DayTable, Section, Stat } from './StatsParts';
import { fetchCostStats } from '@/api/admin';
import { useStatsQuery, type StatsPeriod } from './useStatsQuery';

/** AI 비용: 합계 · 작업 · 단계 · 모델별 비용과 토큰 */
export default function CostStats({ period }: { period: StatsPeriod }) {
	const state = useStatsQuery('cost', fetchCostStats, period);
	return (
		<Section id="stats-cost" title="AI 비용" state={state}>
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
	);
}
