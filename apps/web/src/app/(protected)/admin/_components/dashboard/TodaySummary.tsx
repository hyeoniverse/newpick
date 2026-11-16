'use client';

import { ROUTES } from '@/constants/routes';
import type { Dashboard as DashboardData } from '@newpick/shared';
import Title from '@/components/common/Title';
import MoreLink from '@/components/common/MoreLink';
import { PeriodPicker, PeriodTitle, useAdminQuery } from '../period';
import { usd, when } from '../../_lib/format';

/** 오늘(고른 기간) 숫자: 수집한 기사 · 발행한 뉴스레터 · AI 비용 · 메일 받은 사람, 각각 상세로 */
export default function TodaySummary({ data }: { data: DashboardData }) {
	const { today, from, to, periodQuery } = useAdminQuery();
	const { crawling, newsletters, summaryLogs, mail, aiCost } = data;
	const recipients = mail.byDay.reduce((sum, row) => sum + row.recipients, 0);
	const singleDay = from === to;
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
	return (
		<section aria-labelledby="dash-today">
			<div className="section-head period-head">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<PeriodTitle id="dash-today" />
				</Title>
				<PeriodPicker />
			</div>
			<dl className="numbers">
				<div>
					<dt>수집한 기사</dt>
					<dd>{crawling.count.toLocaleString()}건</dd>
					<span className="sub">마지막 {when(crawling.latestAt, today)}</span>
					<MoreLink href={`${ROUTES.admin.articles}${periodQuery}`}>기사 보기 →</MoreLink>
				</div>
				<div>
					<dt>발행한 뉴스레터</dt>
					<dd>{newsletters.total.toLocaleString()}편</dd>
					<span className="sub">
						{singleDay
							? `관심사 6개 중 ${new Set(newsletters.items.map((n) => n.categoryId)).size}개`
							: `${days}일 · 하루 평균 ${(newsletters.total / days).toFixed(1)}편`}
					</span>
					<MoreLink href={`${ROUTES.admin.newsletters}${periodQuery}`}>발행 목록 보기 →</MoreLink>
				</div>
				<div>
					<dt>AI 비용</dt>
					<dd>{usd(aiCost.total)}</dd>
					<span className="sub">
						{aiCost.unknown > 0 ? `비용 모르는 이전 기록 ${aiCost.unknown}건 제외` : `AI 호출 ${summaryLogs.total}건`}
					</span>
					<MoreLink href={`${ROUTES.admin.aiLogs}${periodQuery}`}>AI 기록 보기 →</MoreLink>
				</div>
				<div>
					<dt>메일 받은 사람</dt>
					<dd>{recipients.toLocaleString()}명</dd>
					<span className="sub">구독 중 {mail.activeSubscribers.toLocaleString()}명</span>
					<MoreLink href={`${ROUTES.admin.mail}${periodQuery}`}>발송 기록 보기 →</MoreLink>
				</div>
			</dl>
		</section>
	);
}
