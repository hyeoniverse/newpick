'use client';

import { ADMIN } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Dashboard as DashboardData } from '@newpick/shared';
import { LuArrowRight } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import MoreLink from '@/components/common/MoreLink';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import { useAdminQuery } from '../period';
import { PROCESS_LABEL, usd, when } from '../../_lib/format';

/** 기간의 AI 기록: 시각 · 종류 · 결과 · 걸린 시간 · 토큰 · 비용 · 내용 */
export default function AiLogSummary({ summaryLogs }: { summaryLogs: DashboardData['summaryLogs'] }) {
	const { today, periodQuery } = useAdminQuery();
	return (
		<section aria-labelledby="dash-logs">
			<div className="section-head">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-logs">AI 기록</span>
				</Title>
				<MoreLink href={`${ROUTES.admin.aiLogs}${periodQuery}`}>
					전체 {summaryLogs.total.toLocaleString()}건 보기 <LuArrowRight aria-hidden />
				</MoreLink>
			</div>
			{summaryLogs.items.length === 0 ? (
				<Text size="small" color="subText">
					{ADMIN.empty.periodLogs}
				</Text>
			) : (
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">시각</th>
								<th scope="col">종류</th>
								<th scope="col">결과</th>
								<th scope="col">걸린 시간</th>
								<th scope="col">토큰 (입력 / 출력)</th>
								<th scope="col">비용</th>
								<th scope="col">내용</th>
							</tr>
						</thead>
						<tbody>
							{summaryLogs.items.map((log) => (
								<tr key={log.id}>
									<td className="nowrap">{when(log.createdAt, today)}</td>
									<td className="nowrap" title={log.model ?? undefined}>
										{PROCESS_LABEL[log.processType] ?? log.processType}
									</td>
									<td className="nowrap">
										<StatusBadge tone={toneOf(log.status)}>{log.status === 'success' ? '성공' : '실패'}</StatusBadge>
									</td>
									<td className="nowrap num">{log.duration.toFixed(1)}초</td>
									<td className="nowrap num">
										{log.inputTokens || log.outputTokens
											? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
											: log.token.toLocaleString()}
									</td>
									<td className="nowrap num">{usd(log.costUsd)}</td>
									<td className="content" title={log.error ?? log.result ?? undefined}>
										{log.error ?? log.result}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
