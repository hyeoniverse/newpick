'use client';

import type { BreakingAlert } from '@newpick/shared';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN } from '@/copy';
import { decideBreaking, fetchBreaking, setBreakingAuto } from '@/api/admin';
import { errorMessage } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/common/Button';
import Switch from '@/components/common/Switch';
import Text from '@/components/common/Text';
import { Cols, tableMinWidth } from '@/components/common/TableHeader';
import { kstDate, pad2 } from '@/utils/formatter';
import AdminSubPage from './AdminSubPage';
import { when } from '../_lib/format';

const COPY = ADMIN.breaking;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
/** 지난 속보 표 칸 폭: 감지 · 상태 · 점수 · 사건 · 관련 기사 */
const COLS = ['9.5rem', '6.5rem', '4rem', undefined, '16rem'];

/** 아직 안 나간 것: 보류, 또는 보낼 시각 전인 발송 예정 (보내지 않기 · 지금 보내기를 누를 수 있다) */
const isOpen = (alert: BreakingAlert, now: number) =>
	alert.status === 'held' || (alert.status === 'scheduled' && !!alert.sendAt && Date.parse(alert.sendAt) > now);

/** 남은 시간 '분:초' */
const clock = (ms: number) => {
	const seconds = Math.max(0, Math.ceil(ms / SECOND));
	return `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}`;
};

/** 지난 속보의 상태 이름: 보낼 시각이 지난 발송 예정은 '발행' */
const pastLabel = (alert: BreakingAlert) => (alert.status === 'scheduled' ? COPY.out : COPY.status[alert.status]);

/**
 * 관리자 › 속보: 위에는 지금 막을 수 있는 속보(발송 예정 · 보류)를 크게, 아래에는 지난 속보를 표로.
 * 찾으면 잠깐 뒤 저절로 나가므로 남은 시간을 초 단위로 보이고, '보내지 않기'로 막거나 '지금 바로 보내기'로 당긴다.
 * 자동 발송 스위치를 끄면 새 속보는 보류로 남는다
 */
export default function BreakingAdmin() {
	const confirm = useConfirmAction();
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const view = useQuery({ queryKey: queryKeys.admin.breaking, queryFn: fetchBreaking, refetchInterval: MINUTE });
	// 남은 시간이 초 단위로 흐르게
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), SECOND);
		return () => clearInterval(timer);
	}, []);
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.breaking });
	const alerts = view.data?.alerts ?? [];
	const open = alerts.filter((a) => isOpen(a, now));
	const past = alerts.filter((a) => !isOpen(a, now));
	const today = kstDate();

	const decide = (alert: BreakingAlert, decision: 'cancel' | 'send') =>
		confirm({
			title: decision === 'cancel' ? COPY.cancelTitle : COPY.sendTitle,
			content: decision === 'cancel' ? alert.headline : COPY.sendContent,
			confirmLabel: decision === 'cancel' ? COPY.cancel : COPY.send,
			run: () => decideBreaking(alert.id, decision),
			success: decision === 'cancel' ? COPY.canceled : COPY.sent,
			failure: COPY.decideFailed,
			onDone: refresh,
		});

	const toggleAuto = async (auto: boolean) => {
		try {
			await setBreakingAuto(auto);
			showToast(auto ? COPY.autoOn : COPY.autoOff, 'success');
			refresh();
		} catch (error) {
			showToast(errorMessage(error, COPY.autoFailed), 'error');
		}
	};

	return (
		<AdminSubPage
			title={COPY.title}
			period={false}
			summary={open.length ? `${COPY.status.scheduled} · ${COPY.status.held} ${open.length}건` : undefined}
		>
			{view.isError && (
				<Text size="small" color="error">
					{COPY.loadFailed}
				</Text>
			)}
			{view.data && (
				<div className="flex flex-col gap-10">
					<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
						<Text size="small" color="subText" className="max-w-[44rem]">
							{COPY.lead(view.data.holdMinutes, view.data.dailyLimit)}
						</Text>
						<label className="flex shrink-0 items-center gap-2 text-small font-semi-bold">
							{COPY.auto}
							<Switch checked={view.data.auto} onChange={toggleAuto} label={COPY.auto} />
						</label>
					</div>

					<section className="flex flex-col gap-3" aria-labelledby="breaking-open">
						<h2 id="breaking-open" className="m-0 text-medium font-bold">
							{COPY.openTitle}
						</h2>
						{!open.length ? (
							<p className="m-0 rounded-surface bg-surface px-5 py-4 text-small text-sub-text">{COPY.openEmpty}</p>
						) : (
							open.map((alert) => (
								<article
									key={alert.id}
									className="grid grid-cols-[9rem_1fr] gap-x-6 gap-y-3 rounded-surface border-2 border-primary p-5 mobile:grid-cols-1"
								>
									{/* 왼쪽: 남은 시간 (보류면 보류) */}
									<div className="flex flex-col gap-1 text-primary">
										{alert.status === 'scheduled' && alert.sendAt ? (
											<>
												<span className="text-[2.25rem] leading-none font-bold tabular-nums">
													{clock(Date.parse(alert.sendAt) - now)}
												</span>
												<span className="text-small font-semi-bold">{COPY.untilSend}</span>
											</>
										) : (
											<span className="text-large font-bold">{COPY.status.held}</span>
										)}
									</div>
									<div className="flex min-w-0 flex-col gap-2">
										<span className="flex items-center gap-2 text-small text-sub-text">
											<span className="font-bold text-primary">{COPY.score(alert.score)}</span>
											{when(alert.detectedAt, today)}
										</span>
										<strong className="text-large leading-snug">{alert.headline}</strong>
										{alert.reason && <p className="m-0 text-small leading-relaxed text-sub-text">{alert.reason}</p>}
										{alert.status === 'held' && <p className="m-0 text-small text-sub-text">{COPY.heldNote}</p>}
										<ul className="m-0 flex list-none flex-col gap-1 p-0 text-small">
											{alert.articles.map((article) => (
												<li key={article.link}>
													<a
														href={article.link}
														target="_blank"
														rel="noreferrer"
														className="text-text hover:text-primary"
													>
														{article.title}
													</a>{' '}
													<span className="text-sub-text">· {article.source}</span>
												</li>
											))}
										</ul>
										<div className="mt-1 flex flex-wrap gap-2">
											<Button size="small" scheme="primary" onClick={() => decide(alert, 'cancel')}>
												{COPY.cancel}
											</Button>
											<Button size="small" scheme="outline" onClick={() => decide(alert, 'send')}>
												{COPY.send}
											</Button>
										</div>
									</div>
								</article>
							))
						)}
					</section>

					<section className="flex flex-col gap-3" aria-labelledby="breaking-history">
						<h2 id="breaking-history" className="m-0 text-medium font-bold">
							{COPY.historyTitle}
						</h2>
						{!past.length ? (
							<p className="m-0 text-small text-sub-text">{COPY.historyEmpty}</p>
						) : (
							<div className="table-wrap">
								<table style={{ minWidth: tableMinWidth(COLS) }}>
									<Cols widths={COLS} />
									<thead>
										<tr>
											<th scope="col">{COPY.col.detected}</th>
											<th scope="col">{COPY.col.status}</th>
											<th scope="col">{COPY.col.score}</th>
											<th scope="col">{COPY.col.headline}</th>
											<th scope="col">{COPY.col.articles}</th>
										</tr>
									</thead>
									<tbody>
										{past.map((alert) => {
											const [first, ...rest] = alert.articles;
											return (
												<tr key={alert.id}>
													<td className="nowrap num">{when(alert.detectedAt, today)}</td>
													<td className="nowrap">{pastLabel(alert)}</td>
													<td className="nowrap num">{alert.score}</td>
													<td className="content" title={alert.reason}>
														{alert.headline}
													</td>
													<td className="content">
														{first ? (
															<>
																<a href={first.link} target="_blank" rel="noreferrer">
																	{first.title}
																</a>
																{rest.length > 0 && <span className="text-sub-text"> {COPY.more(rest.length)}</span>}
															</>
														) : (
															'-'
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</section>
				</div>
			)}
		</AdminSubPage>
	);
}
