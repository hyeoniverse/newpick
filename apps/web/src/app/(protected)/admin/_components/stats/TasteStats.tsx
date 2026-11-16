'use client';

import { ADMIN, COMMON } from '@/copy';
import BarList from '@/components/common/charts/BarList';
import { people } from '../../_lib/statsLabels';
import { Chart, Section, Stat } from './StatsParts';
import { fetchTasteStats } from '@/api/admin';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';

/** 취향 신호: 북마크 · 스크랩 · 메모로 쌓인 관심사 · 태그 점수 (기간과 상관없이 지금 점수) */
export default function TasteStats() {
	const state = useQuery({ queryKey: queryKeys.admin.tasteStats, queryFn: () => fetchTasteStats() });
	return (
		<Section id="stats-taste" title="취향 신호" state={state}>
			{(t) => (
				<>
					<dl className="numbers">
						<Stat label="신호를 남긴 사람" value={people(t.users)} sub="맞춤 뉴스레터를 받을 수 있는 사람" />
						<Stat
							label="스크랩"
							value={`${t.signals.scrap.toLocaleString()}개`}
							sub={`메모 ${t.signals.memo.toLocaleString()}개 따로`}
						/>
						<Stat label="북마크" value={`${t.signals.bookmark.toLocaleString()}개`} />
					</dl>
					<p className="note" role="note">
						{ADMIN.stats.tasteNote(t.weights.bookmark, t.weights.scrap, t.weights.memo, t.halfLifeDays)}
					</p>
					<div className="charts">
						<Chart title="많이 모인 주제" hint="옆 숫자는 그 주제를 가진 사람 수">
							{t.topics.length ? (
								<BarList
									label="주제별 취향 점수"
									rows={t.topics.map((x) => ({
										key: x.topic,
										label: `#${x.topic}`,
										value: x.score,
										note: `${x.users}명`,
									}))}
									format={(v) => v.toFixed(1)}
								/>
							) : (
								<p className="empty">{COMMON.noneYet}</p>
							)}
						</Chart>
						<Chart title="관심사별">
							{t.categories.length ? (
								<BarList
									label="관심사별 취향 점수"
									rows={t.categories.map((c) => ({
										key: String(c.categoryId),
										label: c.name ?? String(c.categoryId),
										value: c.score,
									}))}
									format={(v) => v.toFixed(1)}
								/>
							) : (
								<p className="empty">{COMMON.noneYet}</p>
							)}
						</Chart>
					</div>
				</>
			)}
		</Section>
	);
}
