'use client';

import AdminSubPage from './AdminSubPage';
import CostStats from './stats/CostStats';
import DeliveryStats from './stats/DeliveryStats';
import SubscriberStats from './stats/SubscriberStats';
import TasteStats from './stats/TasteStats';
import TrafficStats from './stats/TrafficStats';
import { useStatsPeriod } from './stats/useStatsQuery';

/**
 * 관리자 통계 (#122): 구독자 · AI 비용 · 발송 · 읽기의 날짜별 추이. 영역마다 숫자 칸 → 그래프 → 나눔, 표로도 본다.
 * 이 파일은 조립만 (#198): 영역마다 stats/의 컴포넌트가 자기 데이터를 받아 그린다. 기간 기본값은 useStatsPeriod (최근 30일)
 */
export default function StatsAdmin() {
	const period = useStatsPeriod();
	return (
		<AdminSubPage title="통계">
			<div className="np-admin-stats-admin-stats">
				<TrafficStats period={period} />
				<SubscriberStats period={period} />
				<CostStats period={period} />
				<DeliveryStats period={period} />
				{/* 취향 신호는 기간과 상관없이 지금 점수 (반감기로 오래된 신호는 저절로 줄어듦) */}
				<TasteStats />
			</div>
		</AdminSubPage>
	);
}
