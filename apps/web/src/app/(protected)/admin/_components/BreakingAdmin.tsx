'use client';

import type { BreakingAlert } from '@newpick/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN } from '@/copy';
import { decideBreaking, fetchBreaking } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import { cx } from '@/styles/tw';
import AdminSubPage from './AdminSubPage';
import { when } from '../_lib/format';
import { kstDate } from '@/utils/formatter';

const COPY = ADMIN.breaking;

/** 상태 표시 색: 확인 대기만 눈에 띄게 */
const STATUS_TONE: Record<BreakingAlert['status'], string> = {
	pending: 'bg-primary text-background',
	approved: 'bg-surface text-primary',
	rejected: 'bg-surface text-sub-text',
	sent: 'bg-surface text-text',
};

/**
 * 관리자 › 속보: 매시 수집 뒤 판정한 속보 후보 (새것부터). 확인 대기인 것은 승인 · 기각한다.
 * 승인해도 아직 보내지 않는다 (속보 뉴스레터 만들기 · 보내기는 다음 단계)
 */
export default function BreakingAdmin() {
	const confirm = useConfirmAction();
	const queryClient = useQueryClient();
	const alerts = useQuery({ queryKey: queryKeys.admin.breaking, queryFn: fetchBreaking });
	const pending = alerts.data?.filter((a) => a.status === 'pending').length ?? 0;

	const decide = (alert: BreakingAlert, decision: 'approve' | 'reject') =>
		confirm({
			title: decision === 'approve' ? COPY.approveTitle : COPY.rejectTitle,
			content: decision === 'approve' ? COPY.approveContent : alert.headline,
			confirmLabel: decision === 'approve' ? COPY.approve : COPY.reject,
			run: () => decideBreaking(alert.id, decision),
			success: decision === 'approve' ? COPY.approved : COPY.rejected,
			failure: COPY.decideFailed,
			onDone: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.breaking }),
		});

	return (
		<AdminSubPage
			title={COPY.title}
			period={false}
			summary={pending ? COPY.status.pending + ` ${pending}건` : undefined}
		>
			<Text size="small" color="subText">
				{COPY.lead}
			</Text>
			{alerts.isError ? (
				<Text size="small" color="error">
					{COPY.loadFailed}
				</Text>
			) : !alerts.data ? null : !alerts.data.length ? (
				<p className="m-0 rounded-surface bg-surface p-5 text-small text-sub-text">{COPY.empty}</p>
			) : (
				<ul className="m-0 flex list-none flex-col gap-4 p-0">
					{alerts.data.map((alert) => (
						<li
							key={alert.id}
							className={cx(
								'flex flex-col gap-3 rounded-surface border p-5',
								alert.status === 'pending' ? 'border-primary' : 'border-light-grey',
							)}
						>
							<div className="flex flex-wrap items-center gap-2 text-small">
								<span className={cx('rounded-full px-2.5 py-0.5 font-semi-bold', STATUS_TONE[alert.status])}>
									{COPY.status[alert.status]}
								</span>
								<span className="font-bold text-primary">{COPY.score(alert.score)}</span>
								<span className="text-sub-text">{when(alert.detectedAt, kstDate())}</span>
							</div>
							<strong className="text-large leading-snug">{alert.headline}</strong>
							{alert.reason && <p className="m-0 text-small leading-relaxed text-sub-text">{alert.reason}</p>}
							<div className="flex flex-col gap-1">
								<span className="text-small font-semi-bold">{COPY.articles}</span>
								<ul className="m-0 flex list-none flex-col gap-1 p-0 text-small">
									{alert.articles.map((article) => (
										<li key={article.link}>
											<a href={article.link} target="_blank" rel="noreferrer" className="text-text hover:text-primary">
												{article.title}
											</a>{' '}
											<span className="text-sub-text">· {article.source}</span>
										</li>
									))}
								</ul>
							</div>
							{alert.status === 'pending' && (
								<div className="flex gap-2">
									<Button size="small" scheme="primary" onClick={() => decide(alert, 'approve')}>
										{COPY.approve}
									</Button>
									<Button size="small" scheme="outline" onClick={() => decide(alert, 'reject')}>
										{COPY.reject}
									</Button>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</AdminSubPage>
	);
}
