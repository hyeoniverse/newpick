'use client';

import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import FilterChips from '@/components/common/FilterChips';
import BarList from '@/components/common/charts/BarList';
import AdminSubPage from './AdminSubPage';
import { useAdminQuery } from './period';
import Heatmap, { Click } from './Heatmap';
import { DEVICE_LABEL, duration, routeName, sectionName } from './trafficLabels';

interface PageStats {
	route: string;
	device: 'desktop' | 'tablet' | 'mobile';
	views: number;
	samplePath: string | null;
	avgMs: number;
	avgScroll: number;
	sections: { name: string; avgMs: number; totalMs: number; reach: number }[];
	attention: number[];
	clicks: Click[];
}

const DEVICES = (['desktop', 'tablet', 'mobile'] as const).map((value) => ({ value, label: DEVICE_LABEL[value] }));

/**
 * 한 페이지에서 머문 곳 (#131): 구역별 평균 머문 시간 · 도달률, 실제 페이지 위 히트맵(머문 곳 · 클릭).
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
		queryKey: ['adminStats', 'page', query],
		queryFn: () => apiFetch<{ data: PageStats }>(API_ENDPOINTS.ADMIN.STATS('page', query)).then((r) => r.data),
		placeholderData: (previous) => previous,
	});

	return (
		<AdminSubPage
			title={`머문 곳 · ${routeName(route)}`}
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
			<StyledPage>
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
								<dt>평균 머문 시간</dt>
								<dd>{duration(data.avgMs)}</dd>
							</div>
							<div>
								<dt>평균 스크롤</dt>
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
									구역별 평균 머문 시간
									<small>화면에 절반 넘게 보인 시간 · 옆 %는 그 구역을 1초 넘게 본 보기 비율(도달률)</small>
								</figcaption>
								<BarList
									label="구역별 평균 머문 시간"
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
			</StyledPage>
		</AdminSubPage>
	);
}

const StyledPage = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	.state {
		padding: 3rem 0;
		text-align: center;
		color: ${({ theme }) => theme.color.subText};
	}

	.numbers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 0.75rem;

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
`;
