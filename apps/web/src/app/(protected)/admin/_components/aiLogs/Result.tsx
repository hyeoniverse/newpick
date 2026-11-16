'use client';

import type { AiLogRow } from '@newpick/shared';
import { LuRotateCw } from 'react-icons/lu';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import { canRerun } from '../../_lib/aiLogs';

/** 결과 칸: 성공 · 실패 배지, 다시 시도 묶음이면 옆에 '시도 n/total' (묶음 결과는 붙어 있는 맨 위 줄에서 보인다) */
export default function Result({ log, onRerun }: { log: AiLogRow; onRerun: (log: AiLogRow) => void }) {
	const attempt = log.attempt;
	return (
		<span className="np-admin-ai-logs-list-badges">
			<StatusBadge tone={toneOf(log.status)}>{log.status === 'success' ? '성공' : '실패'}</StatusBadge>
			{attempt && attempt.total > 1 && (
				<span className="step">
					시도 {attempt.n}/{attempt.total}
				</span>
			)}
			{canRerun(log) && (
				<button type="button" className="rerun" onClick={() => onRerun(log)} aria-label={`${log.category} 다시 만들기`}>
					<LuRotateCw aria-hidden />
				</button>
			)}
		</span>
	);
}
