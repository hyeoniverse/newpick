'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { PRESETS, useAdminQuery } from '../period';

/** 통계를 받을 기간. ready가 아니면(주소에 기간을 넣는 중) 아직 받지 않는다 */
export type StatsPeriod = { from: string; to: string; ready: boolean };

/** 최근 30일 (통계는 추이를 보는 화면이라 기본 기간이 하루가 아니다) */
const DEFAULT_PRESET = PRESETS.find((p) => p.key === '30d')!;

/** 주소의 기간. 주소에 기간이 없으면 최근 30일을 넣는다 (하루치로는 추이가 안 보여서) */
export function useStatsPeriod(): StatsPeriod {
	const searchParams = useSearchParams();
	const { from, to, set } = useAdminQuery();
	const noPeriod = !searchParams.get('from');
	useEffect(() => {
		if (noPeriod) set(DEFAULT_PRESET.range());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [noPeriod]);
	return { from, to, ready: !noPeriod };
}

/** 기간별 통계 한 종류: 기간을 바꾸는 동안은 앞 기간 것을 보여 준다 */
export function useStatsQuery<T>(
	kind: 'subscribers' | 'cost' | 'traffic' | 'delivery',
	fetch: (query: string) => Promise<T>,
	period: StatsPeriod,
) {
	const query = `from=${period.from}&to=${period.to}`;
	return useQuery({
		queryKey: queryKeys.admin.stats(kind, query),
		queryFn: () => fetch(query),
		enabled: period.ready,
		placeholderData: (previous) => previous,
	});
}
