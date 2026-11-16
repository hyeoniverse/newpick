'use client';

import type { AiLogRow } from '@newpick/shared';
import LogEntry from './LogEntry';

/** 휴대폰 폭에서만 보이는 활동 목록 (표 대신): 묶음마다 구분선, 묶음 안은 상태 점을 세로선으로 잇는다 */
export default function AiLogCards({
	groups,
	today,
	isOpen,
	onToggle,
	onRerun,
}: {
	/** 이어진 같은 묶음 [마지막 시도, ...앞선 시도] (chainGroups) */
	groups: AiLogRow[][];
	today: string;
	isOpen: (id: number) => boolean;
	onToggle: (id: number) => void;
	onRerun: (log: AiLogRow) => void;
}) {
	return (
		<ul className="np-admin-ai-logs-list-card-list" aria-label="AI 기록">
			{groups.map((group) => (
				<li key={group[0].id}>
					<ol className="timeline">
						{group.map((log, i) => (
							<LogEntry
								key={log.id}
								log={log}
								today={today}
								earlier={i > 0}
								open={isOpen(log.id)}
								onToggle={() => onToggle(log.id)}
								onRerun={onRerun}
							/>
						))}
					</ol>
				</li>
			))}
		</ul>
	);
}
