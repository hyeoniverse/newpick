'use client';

import type { PageStats } from '@newpick/shared';

import { fetchPageStats } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import { useQuery } from '@tanstack/react-query';
import FilterChips from '@/components/common/FilterChips';
import BarList from '@/components/common/charts/BarList';
import AdminSubPage from './AdminSubPage';
import { useAdminQuery } from './period';
import Heatmap from './Heatmap';
import { DEVICE_LABEL, duration, routeName, sectionName } from './trafficLabels';

const DEVICES = (['desktop', 'tablet', 'mobile'] as const).map((value) => ({ value, label: DEVICE_LABEL[value] }));

/**
 * 한 페이지의 히트맵 (#131): 섹션별 체류 시간 · 도달률, 실제 페이지 위 어텐션 맵 · 클릭 맵.
 * 기기마다 화면 배치가 달라 기기를 하나씩 고른다
 */
export default function PageStatsAdmin() {
	const { from, to, get, set } = useAdminQuery();
	const route = get('route') || '/';
	const device = (
		['desktop', 'tablet', 'mobile'].includes(get('device')) ? get('device') : 'desktop'
	) as PageStats['device'];
	const query = new URLSearchParams({ from, to, route, device }).toString();

	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.stats('page', query),
		queryFn: () => fetchPageStats(query),
		placeholderData: (previous) => previous,
	});

	return (
		<AdminSubPage
			title={`히트맵 · ${routeName(route)}`}
			back={{ text: '통계', href: '/admin/stats' }}
			filters={
				<FilterChips
					label="기기"
					options={DEVICES}
					value={device}
					onChange={(value) => set({ device: value === 'desktop' || !value ? null : value })}
				/>
			}
			summary={data && `${route} · ${DEVICE_LABEL[device]} 보기 ${data.views.toLocaleString()}번`}
		>
			<div className="np-admin-page-stats-admin-page">
				{isPending ? (
					<p className="state">불러오는 중…</p>
				) : isError || !data ? (
					<p className="state">불러오지 못했어요.</p>
				) : data.views === 0 ? (
					<p className="state">이 기간 · 기기의 기록이 없어요.</p>
				) : (
					<>
						<dl className="numbers">
							<div>
								<dt>평균 체류 시간</dt>
								<dd>{duration(data.avgMs)}</dd>
							</div>
							<div>
								<dt>스크롤 깊이</dt>
								<dd>{data.avgScroll}%</dd>
							</div>
							<div>
								<dt>클릭</dt>
								<dd>{data.clicks.length.toLocaleString()}번</dd>
							</div>
						</dl>
						{data.sections.length > 0 && (
							<figure className="chart">
								<figcaption>
									섹션별 체류 시간
									<small>섹션이 화면에 절반 넘게 보인 평균 시간 · 옆 %는 도달률(그 섹션을 1초 넘게 본 보기 비율)</small>
								</figcaption>
								<BarList
									label="섹션별 체류 시간"
									rows={data.sections.map((s) => ({
										key: s.name,
										label: sectionName(s.name),
										value: s.avgMs,
										note: `${s.reach}%`,
									}))}
									format={duration}
								/>
							</figure>
						)}
						{data.samplePath ? (
							<figure className="chart">
								<figcaption>
									히트맵
									<small>
										{data.samplePath} 을 지금 모습으로 띄웠어요. 내용이 바뀐 페이지는 위치가 조금 어긋날 수 있어요.
									</small>
								</figcaption>
								<Heatmap path={data.samplePath} device={device} attention={data.attention} clicks={data.clicks} />
							</figure>
						) : null}
					</>
				)}
			</div>
		</AdminSubPage>
	);
}
