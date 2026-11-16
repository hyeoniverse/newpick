'use client';

import { ADMIN, COMMON } from '@/copy';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import BarList from '@/components/common/charts/BarList';
import TrendChart from '../TrendChart';
import { CHANNEL_LABEL, DEVICE_LABEL, duration, routeName } from '../../_lib/trafficLabels';
import { Chart, DayTable, Section, Stat } from './StatsParts';
import { fetchTrafficStats } from '@/api/admin';
import { useStatsQuery, type StatsPeriod } from './useStatsQuery';

/** 방문 · 유입: 방문 · 페이지 보기 · 체류 시간, 유입 경로 · 이전 사이트 · 첫 페이지 · 캠페인 · 기기, 페이지별 표(히트맵으로) */
export default function TrafficStats({ period }: { period: StatsPeriod }) {
	const state = useStatsQuery('traffic', fetchTrafficStats, period);
	const { from, to } = period;
	return (
		<Section id="stats-traffic" title="방문 · 유입" state={state}>
			{(t) => {
				const visits = (n: number) => `${n.toLocaleString()}번`;
				const rows = (list: { key: string; sessions: number }[], label = (k: string) => k) =>
					list.map((r) => ({ key: r.key, label: label(r.key), value: r.sessions }));
				return (
					<>
						<dl className="numbers">
							<Stat label="방문 (탭)" value={visits(t.totals.sessions)} sub="쿠키 없이 탭마다 한 번" />
							<Stat label="페이지 보기" value={visits(t.totals.views)} sub={`방문마다 ${t.totals.viewsPerSession}쪽`} />
							<Stat label="평균 체류 시간" value={duration(t.totals.avgMs)} sub="탭이 보이고 움직임이 있던 시간" />
						</dl>
						<Chart title="날짜별 방문 · 페이지 보기">
							<TrendChart
								kind="line"
								label="날짜별 방문과 페이지 보기"
								dates={t.days.map((d) => d.date)}
								series={[
									{ key: 'views', label: '페이지 보기', values: t.days.map((d) => d.views) },
									{ key: 'sessions', label: '방문', tone: 'b', values: t.days.map((d) => d.sessions) },
								]}
							/>
						</Chart>
						<div className="charts">
							<Chart title="유입 경로" hint="탭의 첫 페이지 기준">
								<BarList
									label="유입 경로별 방문"
									rows={rows(t.channels, (k) => CHANNEL_LABEL[k] ?? k)}
									format={visits}
								/>
							</Chart>
							<Chart title="이전 사이트" hint={ADMIN.stats.referrerHint}>
								{t.referrers.length ? (
									<BarList label="이전 사이트별 방문" rows={rows(t.referrers)} format={visits} />
								) : (
									<p className="empty">{COMMON.noneYet}</p>
								)}
							</Chart>
							<Chart title="처음 들어온 페이지">
								<BarList label="첫 페이지별 방문" rows={rows(t.entryPages, routeName)} format={visits} />
							</Chart>
							<Chart title="캠페인 (utm 출처 / 매체 / 이름)" hint="구독 메일 링크는 newsletter / email">
								{t.campaigns.length ? (
									<BarList label="캠페인별 방문" rows={rows(t.campaigns)} format={visits} />
								) : (
									<p className="empty">{COMMON.noneYet}</p>
								)}
							</Chart>
							<Chart title="기기">
								<BarList label="기기별 방문" rows={rows(t.devices, (k) => DEVICE_LABEL[k] ?? k)} format={visits} />
							</Chart>
						</div>
						<Chart title="페이지별" hint={ADMIN.stats.pagesHint}>
							{t.pages.length ? (
								<div className="table-wrap">
									<table>
										<thead>
											<tr>
												<th scope="col">페이지</th>
												<th scope="col">보기</th>
												<th scope="col">방문</th>
												<th scope="col">평균 체류 시간</th>
												<th scope="col">스크롤 깊이</th>
												<th scope="col">
													<span className="sr-only">히트맵</span>
												</th>
											</tr>
										</thead>
										<tbody>
											{t.pages.map((p) => (
												<tr key={p.route}>
													<td>
														{routeName(p.route)}
														{routeName(p.route) !== p.route && <small className="route">{p.route}</small>}
													</td>
													<td className="num">{p.views.toLocaleString()}</td>
													<td className="num">{p.sessions.toLocaleString()}</td>
													<td className="num">{duration(p.avgMs)}</td>
													<td className="num">{p.avgScroll}%</td>
													<td className="row-link">
														<Link
															href={ROUTES.admin.statsHeatmap(
																`route=${encodeURIComponent(p.route)}&from=${from}&to=${to}`,
															)}
														>
															히트맵 보기 →
														</Link>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="empty">{COMMON.noRecordsYet}</p>
							)}
						</Chart>
						<DayTable
							caption="날짜별 방문"
							head={['날짜', '방문', '페이지 보기']}
							rows={t.days.map((d) => [d.date, d.sessions, d.views])}
						/>
					</>
				);
			}}
		</Section>
	);
}
